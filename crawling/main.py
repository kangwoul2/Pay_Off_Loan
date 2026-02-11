"""
크롤링 파이프라인 메인 실행 파일
- 원본 데이터 백업(Raw Data Logging) 기능 추가
- 단계별 프로세스 가시성 확보
"""
import logging
import pandas as pd
import json
import os
import sys
from datetime import datetime

from .config import CrawlingConfig
from .cleansing import LoanDataCleaner
from .supabase_client import SupabaseManager
from .bank_crawlers.kb_crawler import KBCrawler

# 로깅 설정
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
    logger.info("🚀 대출 상품 실시간 수집 및 데이터 파트라인 시작")
    logger.info("=" * 60)
    
    # 0. 환경 준비: 원본 데이터 저장 폴더 생성
    raw_data_dir = "./crawling/raw_data"
    os.makedirs(raw_data_dir, exist_ok=True)
    
    # 1. Supabase 연결
    try:
        supabase = SupabaseManager()
        logger.info("✅ Supabase 연결 성공")
    except Exception as e:
        logger.error(f"❌ Supabase 연결 실패: {e}")
        return
    
    # 2. 크롤링 수행 (Extraction)
    crawlers = [KBCrawler()]
    all_raw_products = []
    
    for crawler in crawlers:
        try:
            logger.info(f"\n[STEP 1] {crawler.bank_name} 데이터 추출 시작")
            products = crawler.safe_crawl()
            
            if products:
                all_raw_products.extend(products)
                logger.info(f"✨ {crawler.bank_name} 추출 완료: {len(products)}건")
            else:
                logger.warning(f"⚠️ {crawler.bank_name} 추출된 데이터 없음")
        except Exception as e:
            logger.error(f"❌ {crawler.bank_name} 치명적 오류: {e}")

    if not all_raw_products:
        logger.error("❌ 수집된 데이터가 최종적으로 없습니다. 프로세스를 종료합니다.")
        return

    # 3. 원본 데이터 백업 (Raw Data Storage)
    # 정제 과정에서 손실되는 데이터를 추적하기 위한 백업입니다.
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_file_path = f"{raw_data_dir}/raw_kb_data_{timestamp}.json"
    with open(raw_file_path, 'w', encoding='utf-8') as f:
        json.dump(all_raw_products, f, ensure_ascii=False, indent=4)
    logger.info(f"\n[STEP 2] 원본 데이터 저장 완료: {raw_file_path}")

    # 4. 데이터 정제 (Transformation)
    logger.info(f"\n[STEP 3] 데이터 전처리 및 문제 진단 시작")
    df_raw = pd.DataFrame(all_raw_products)
    
    # 전처리 상세 로직 가동
    cleaned_df = LoanDataCleaner.validate_and_clean(df_raw)
    
    # 5. 최종 DB 적재 (Load)
    if not cleaned_df.empty:
        logger.info(f"\n[STEP 4] Supabase 데이터 적재 단계")
        products_to_insert = cleaned_df.to_dict('records')
        
        if supabase.insert_loan_products(products_to_insert):
            logger.info(f"✅ 최종 {len(products_to_insert)}개 상품 DB 반영 완료")
            # 크롤링 성공 로그 기록
            for crawler in crawlers:
                supabase.log_crawling_result(crawler.bank_name, 'success', len(cleaned_df[cleaned_df['bank_name'] == crawler.bank_name]))
        else:
            logger.error("❌ DB 적재 실패")
    else:
        logger.warning("⚠️ 정제 후 적재할 유효 데이터가 없습니다.")

    logger.info("\n" + "=" * 60)
    logger.info("🏁 파이프라인 프로세스 종료")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()