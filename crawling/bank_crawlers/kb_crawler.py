"""
KB국민은행 크롤러 (실제 HTML 구조 반영 버전)
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import logging
from typing import List, Dict

from ..crawler import BaseBankCrawler
from ..cleansing import LoanDataCleaner

logger = logging.getLogger(__name__)

class KBCrawler(BaseBankCrawler):
    def __init__(self):
        super().__init__('KB')
        self.url = self.config.BANK_URLS['KB']
    
    def crawl(self) -> List[Dict]:
        products = []
        logger.info(f"{self.bank_name} 페이지 접속: {self.url}")
        self.driver.get(self.url)
        
        # 1. 실제 데이터(area1)가 로드될 때까지 충분히 대기
        try:
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CLASS_NAME, "area1"))
            )
            logger.info("🎉 실제 상품 리스트 로드 확인!")
        except:
            logger.warning("❌ 상품 목록(area1) 로드 실패. 팝업창을 확인하거나 더미를 사용합니다.")
            return self._create_dummy_data()
        
        # 2. HTML 파싱
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        
        # 3. 보내주신 구조(.area1)를 기준으로 상품 추출
        product_items = soup.select('.area1')
        logger.info(f"파싱된 아이템 수: {len(product_items)}개")

        for item in product_items:
            try:
                # 상품명: a.title 내의 strong 태그
                name_tag = item.select_one('a.title strong')
                # 요약정보: span.msg
                msg_tag = item.select_one('span.msg')
                # 한도 정보: div.info-data2
                limit_tag = item.select_one('.info-data2')
                
                if not name_tag:
                    continue

                # 텍스트 정리
                product_name = name_tag.get_text(strip=True)
                product_limit = limit_tag.get_text(strip=True) if limit_tag else "상세문의"
                
                logger.info(f"🔎 상품 발견: {product_name} | {product_limit}")

        
                # kb_crawler.py 내의 raw_data 부분
                raw_data = {
                    'bank_name': self.bank_name,
                    'product_name': product_name,
                    'product_type': '신용대출',
                    'rate': '4.2',  # 수집이 어려우면 일단 고정 숫자 문자열로 전달
                    'limit': product_limit.replace('최고', '').replace('억원', '00000000').strip(),
                    'fee': '1.5',
                    'waiver': '36'
                }
                
                # 전처리 (LoanDataCleaner에서 숫자로 변환 등 수행)
                cleaned_data = LoanDataCleaner.parse_product_row(raw_data)
                if cleaned_data:
                    products.append(cleaned_data)
                
            except Exception as e:
                logger.warning(f"개별 상품 파싱 중 오류: {e}")
                continue
        
        return products if products else self._create_dummy_data()

    def _create_dummy_data(self) -> List[Dict]:
        return [
            {
                'bank_name': 'KB',
                'product_name': 'KB스타 신용대출(가짜)',
                'product_type': '신용대출',
                'base_rate': 4.5,
                'additional_rate': 1.0,
                'max_limit': 100000000,
                'early_repay_fee_rate': 1.5,
                'fee_waiver_months': 36,
                'salary_transfer_discount': 0.3
            }
        ]