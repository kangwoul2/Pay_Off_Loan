"""
Supabase 데이터베이스 연동 관리 (수정본)
- 모든 대상 테이블을 crawled_loan_products로 통일
- 스키마 캐시 이슈 회피를 위해 crawled_at 자동 생성 기능 DB에 위임
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Dict, Optional
import logging
from datetime import datetime

load_dotenv()
logger = logging.getLogger(__name__)

class SupabaseManager:
    """Supabase 연동 관리 클래스"""
    
    def __init__(self):
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY')
        
        if not url or not key:
            raise ValueError("SUPABASE_URL과 SUPABASE_KEY 환경 변수가 필요합니다.")
        
        self.client: Client = create_client(url, key)
        logger.info("Supabase 클라이언트 초기화 완료")
    
    def insert_loan_products(self, products: List[Dict]) -> bool:
        """
        대출 상품 데이터 삽입 (UPSERT 방식)
        """
        try:
            if not products:
                logger.warning("삽입할 상품이 없습니다.")
                return False
            
            # [중요 수정] 
            # 파이썬에서 crawled_at을 추가하지 않습니다. 
            # DB 스키마의 DEFAULT NOW()가 작동하도록 내버려 둡니다.
            # for product in products:
            #     product['crawled_at'] = datetime.now().isoformat()
            
            # 대상 테이블을 새 테이블 이름으로 명시
            result = self.client.table('crawled_loan_products').upsert(
                products,
                on_conflict='bank_name,product_name'
            ).execute()
            
            logger.info(f"✅ {len(products)}개 상품 새 테이블(crawled_loan_products) 적재 성공")
            return True
            
        except Exception as e:
            logger.error(f"❌ 상품 적재 실패: {e}")
            return False
    
    def log_crawling_result(
        self, 
        bank_name: str, 
        status: str, 
        crawled_count: int = 0, 
        error_message: Optional[str] = None
    ) -> bool:
        """크롤링 로그 기록"""
        try:
            log_data = {
                'bank_name': bank_name,
                'status': status,
                'crawled_count': crawled_count,
                'error_message': error_message,
                'created_at': datetime.now().isoformat()
            }
            
            self.client.table('crawling_logs').insert(log_data).execute()
            logger.info(f"크롤링 로그 기록: {bank_name} - {status}")
            return True
        except Exception as e:
            logger.error(f"로그 기록 실패: {e}")
            return False
    
    def get_latest_products(self, bank_name: Optional[str] = None) -> List[Dict]:
        """새 테이블에서 최신 상품 조회"""
        try:
            # 테이블명 변경: crawled_loan_products
            query = self.client.table('crawled_loan_products').select('*')
            
            if bank_name:
                query = query.eq('bank_name', bank_name)
            
            result = query.order('crawled_at', desc=True).execute()
            return result.data
        except Exception as e:
            logger.error(f"상품 조회 실패: {e}")
            return []