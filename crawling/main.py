"""
크롤링 파이프라인 메인 실행 파일
"""

import logging
import pandas as pd
from datetime import datetime

from .config import CrawlingConfig
from .cleansing import LoanDataCleaner
from .supabase_client import SupabaseManager
from .bank_crawlers.kb_crawler import KBCrawler
# TODO: 다른 은행 크롤러 추가
# from .bank_crawlers.shinhan_crawler import ShinhanCrawler
# from .bank_crawlers.hana_crawler import HanaCrawler
# from .bank_crawlers.woori_crawler import WooriCrawler
# from .bank_crawlers.nh_crawler import NHCrawler

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'crawling_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    """크롤링 메인 실행 함수"""
    
    logger.info("=" * 60)
    logger.info("대출 상품 크롤링 시작")
    logger.info(f"실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)
    
    # 1. Supabase 클라이언트 초기화
    try:
        supabase = SupabaseManager()
    except Exception as e:
        logger.error(f"Supabase 연결 실패: {e}")
        logger.error("환경 변수(.env) 파일을 확인하세요.")
        return
    
    # 2. 크롤러 목록
    crawlers = [
        KBCrawler(),
        # TODO: 다른 은행 크롤러 추가
        # ShinhanCrawler(),
        # HanaCrawler(),
        # WooriCrawler(),
        # NHCrawler(),
    ]
    
    # 3. 전체 크롤링 결과 저장
    all_products = []
    
    # 4. 각 은행별 크롤링 실행
    for crawler in crawlers:
        logger.info(f"\n{'='*60}")
        logger.info(f"{crawler.bank_name} 크롤링 시작")
        logger.info(f"{'='*60}")
        
        try:
            # 크롤링 실행
            products = crawler.safe_crawl()
            
            if products:
                all_products.extend(products)
                
                # 성공 로그 기록
                supabase.log_crawling_result(
                    bank_name=crawler.bank_name,
                    status='success',
                    crawled_count=len(products)
                )
            else:
                # 실패 로그
                supabase.log_crawling_result(
                    bank_name=crawler.bank_name,
                    status='failed',
                    crawled_count=0,
                    error_message='크롤링 결과 없음'
                )
        
        except Exception as e:
            logger.error(f"{crawler.bank_name} 크롤링 중 오류: {e}")
            supabase.log_crawling_result(
                bank_name=crawler.bank_name,
                status='failed',
                crawled_count=0,
                error_message=str(e)
            )
    
    # 5. 전체 데이터 전처리
    if all_products:
        logger.info(f"\n{'='*60}")
        logger.info(f"전체 크롤링 결과: {len(all_products)}개 상품")
        logger.info(f"{'='*60}")
        
        df = pd.DataFrame(all_products)
        cleaned_df = LoanDataCleaner.validate_and_clean(df)
        
        # 6. Supabase 적재
        if len(cleaned_df) > 0:
            products_to_insert = cleaned_df.to_dict('records')
            success = supabase.insert_loan_products(products_to_insert)
            
            if success:
                logger.info(f"\n✅ 크롤링 완료: 총 {len(products_to_insert)}개 상품 적재")
                
                # 적재된 상품 목록 출력
                for product in products_to_insert:
                    logger.info(
                        f"  - {product['bank_name']}: {product['product_name']} "
                        f"(금리 {product['base_rate']}~{product['base_rate']+product['additional_rate']}%)"
                    )
            else:
                logger.error("\n❌ 데이터 적재 실패")
        else:
            logger.warning("\n⚠️  전처리 후 유효한 데이터 없음")
    
    else:
        logger.warning("\n⚠️  크롤링된 데이터 없음")
    
    logger.info(f"\n{'='*60}")
    logger.info("크롤링 프로세스 종료")
    logger.info(f"종료 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"{'='*60}")

if __name__ == "__main__":
    main()
