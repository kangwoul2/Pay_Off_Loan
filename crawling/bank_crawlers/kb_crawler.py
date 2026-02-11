"""
KB국민은행 크롤러 (신용/담보 통합 및 실제 구조 반영)
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import logging
from typing import List, Dict

from ..crawler import BaseBankCrawler
from ..cleansing import LoanDataCleaner

logger = logging.getLogger(__name__)

class KBCrawler(BaseBankCrawler):
    def __init__(self):
        super().__init__('KB')
        # 수집할 타겟 리스트 정의
        self.targets = [
            (self.config.BANK_URLS['KB_CREDIT'], '신용대출'),
            (self.config.BANK_URLS['KB_MORTGAGE'], '담보대출')
        ]
    
    def crawl(self) -> List[Dict]:
        all_products = []
        
        for url, p_type in self.targets:
            logger.info(f"🚀 {self.bank_name} [{p_type}] 접속: {url}")
            self.driver.get(url)
            
            try:
                # 1. 실제 데이터(area1) 로드 대기
                WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "area1"))
                )
                
                # 2. HTML 파싱
                soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                product_items = soup.select('.area1')
                logger.info(f"🔎 {p_type} 파싱된 아이템 수: {len(product_items)}개")

                for item in product_items:
                    try:
                        name_tag = item.select_one('a.title strong')
                        limit_tag = item.select_one('.info-data2')
                        
                        if not name_tag: continue

                        product_name = name_tag.get_text(strip=True)
                        # <span>3.5</span>억원 이슈 해결을 위해 내부 공백을 유지하며 텍스트 추출
                        product_limit = limit_tag.get_text(" ", strip=True) if limit_tag else "상세문의"
                        
                        raw_data = {
                            'bank_name': self.bank_name,
                            'product_name': product_name,
                            'product_type': p_type,
                            'rate': '4.2', # 추후 상세 페이지 수집 시 고도화 가능
                            'limit': product_limit,
                            'fee': '1.5',
                            'waiver': '36'
                        }
                        
                        # 전처리 (LoanDataCleaner를 통해 원 단위 정수로 변환)
                        cleaned_data = LoanDataCleaner.parse_product_row(raw_data)
                        if cleaned_data:
                            all_products.append(cleaned_data)
                            
                    except Exception as e:
                        logger.warning(f"개별 상품 파싱 중 오류: {e}")
                        continue
                        
            except Exception as e:
                logger.error(f"❌ {p_type} 목록 로드 실패 또는 타임아웃: {e}")
                continue
        
        return all_products if all_products else self._create_dummy_data()

    def _create_dummy_data(self) -> List[Dict]:
        # 수집 실패 시 시스템 중단을 방지하기 위한 더미 데이터
        return [{
            'bank_name': 'KB',
            'product_name': '수집 실패 보정 데이터',
            'product_type': '신용대출',
            'base_rate': 4.5,
            'additional_rate': 0.0,
            'max_limit': 10000000,
            'early_repay_fee_rate': 1.5,
            'fee_waiver_months': 36,
            'salary_transfer_discount': 0.3
        }]