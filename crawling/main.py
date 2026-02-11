"""
크롤링 파이프라인 메인 실행 파일
"""
import logging
import pandas as pd
from datetime import datetime
import sys

from .config import CrawlingConfig
from .cleansing import LoanDataCleaner
from .supabase_client import SupabaseManager
from .bank_crawlers.kb_crawler import KBCrawler

# 로깅 설정 최적화
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler(f'crawling_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    logger.info("=" * 60)
    logger.info("🚀 대출 상품 실시간 수집 프로세스 시작")
    logger.info("=" * 60)
    
    # 1. DB 연결
    try:
        supabase = SupabaseManager()
        logger.info("✅ Supabase 클라이언트 연결 성공")
    except Exception as e:
        logger.error(f"❌ Supabase 연결 실패: {e}")
        return
    
    # 2. 크롤러 목록 (KB만 우선 실행)
    crawlers = [KBCrawler()]
    all_products = []
    
    # 3. 크롤링 수행
    for crawler in crawlers:
        try:
            logger.info(f"\n👉 {crawler.bank_name} 크롤링 작업을 시작합니다.")
            products = crawler.safe_crawl()
            
            if products:
                all_products.extend(products)
                logger.info(f"✨ {crawler.bank_name} 수집 완료: {len(products)}건")
                supabase.log_crawling_result(crawler.bank_name, 'success', len(products))
            else:
                logger.warning(f"⚠️ {crawler.bank_name} 수집된 데이터가 없습니다.")
                supabase.log_crawling_result(crawler.bank_name, 'failed', 0, 'No data')
        
        except Exception as e:
            logger.error(f"❌ {crawler.bank_name} 작업 중 치명적 오류: {e}")
            supabase.log_crawling_result(crawler.bank_name, 'failed', 0, str(e))
    
    # 4. 데이터 정제 및 최종 DB 적재
    if all_products:
        logger.info(f"\n{'='*20} 데이터 적재 단계 {'='*20}")
        df = pd.DataFrame(all_products)
        cleaned_df = LoanDataCleaner.validate_and_clean(df)
        
        if not cleaned_df.empty:
            products_to_insert = cleaned_df.to_dict('records')
            if supabase.insert_loan_products(products_to_insert):
                logger.info(f"✅ 총 {len(products_to_insert)}개 상품이 DB에 최종 반영되었습니다.")
            else:
                logger.error("❌ DB 적재 실패")
    
    logger.info("\n" + "=" * 60)
    logger.info("🏁 모든 크롤링 프로세스가 종료되었습니다.")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()