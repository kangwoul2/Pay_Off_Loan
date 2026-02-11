"""
Supabase 데이터베이스 연동 관리
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
        
        Args:
            products: 상품 데이터 리스트
            
        Returns:
            성공 여부
        """
        try:
            if not products:
                logger.warning("삽입할 상품이 없습니다.")
                return False
            
            # 크롤링 시각 추가
            for product in products:
                product['crawled_at'] = datetime.now().isoformat()
            
            # UPSERT: 중복 시 업데이트
            result = self.client.table('loan_products').upsert(
                products,
                on_conflict='bank_name,product_name'
            ).execute()
            
            logger.info(f"✅ {len(products)}개 상품 적재 성공")
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
        """
        크롤링 로그 기록
        
        Args:
            bank_name: 은행명
            status: 상태 (success, failed, partial)
            crawled_count: 크롤링된 상품 수
            error_message: 에러 메시지 (실패 시)
            
        Returns:
            성공 여부
        """
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
        """
        최신 상품 조회
        
        Args:
            bank_name: 은행명 (선택적, None이면 전체 조회)
            
        Returns:
            상품 데이터 리스트
        """
        try:
            query = self.client.table('loan_products').select('*')
            
            if bank_name:
                query = query.eq('bank_name', bank_name)
            
            result = query.order('crawled_at', desc=True).execute()
            return result.data
            
        except Exception as e:
            logger.error(f"상품 조회 실패: {e}")
            return []
    
    def delete_old_products(self, days: int = 7) -> bool:
        """
        오래된 상품 삭제 (선택적)
        
        Args:
            days: 삭제 기준 일수
            
        Returns:
            성공 여부
        """
        try:
            cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
            
            self.client.table('loan_products').delete().lt(
                'crawled_at', 
                datetime.fromtimestamp(cutoff_date).isoformat()
            ).execute()
            
            logger.info(f"{days}일 이전 상품 데이터 삭제 완료")
            return True
            
        except Exception as e:
            logger.error(f"데이터 삭제 실패: {e}")
            return False
