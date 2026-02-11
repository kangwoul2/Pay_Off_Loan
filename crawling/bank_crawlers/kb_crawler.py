"""
KB국민은행 크롤러
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
    """KB국민은행 크롤러"""
    
    def __init__(self):
        super().__init__('KB')
        self.url = self.config.BANK_URLS['KB']
    
    def crawl(self) -> List[Dict]:
        """
        KB 신용대출 상품 크롤링
        
        Returns:
            크롤링된 상품 데이터 리스트
        """
        products = []
        
        # 1. 페이지 로드
        logger.info(f"{self.bank_name} 페이지 접속: {self.url}")
        self.driver.get(self.url)
        time.sleep(self.config.CRAWL_DELAY)
        
        # 2. 페이지 파싱 대기 (실제 셀렉터에 맞게 수정 필요)
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "product-list"))
            )
        except:
            logger.warning(f"{self.bank_name}: 상품 목록 로드 실패")
            
            # TODO: 실제 구현 시에는 페이지 구조에 맞게 수정
            # 현재는 테스트용 더미 데이터 반환
            logger.info(f"{self.bank_name}: 테스트 더미 데이터 생성")
            return self._create_dummy_data()
        
        # 3. HTML 파싱
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        
        # 4. 상품 정보 추출
        # NOTE: 실제 구현 시 은행 사이트의 실제 HTML 구조에 맞게 셀렉터 수정 필요
        product_items = soup.select('.product-item')
        
        for item in product_items:
            try:
                raw_data = {
                    'bank_name': self.bank_name,
                    'product_name': item.select_one('.product-name').text.strip(),
                    'product_type': '신용대출',
                    'rate': item.select_one('.interest-rate').text.strip(),
                    'limit': item.select_one('.loan-limit').text.strip(),
                    'fee': item.select_one('.repay-fee').text.strip() if item.select_one('.repay-fee') else '',
                    'waiver': '3년'
                }
                
                # 5. 데이터 전처리
                cleaned_data = LoanDataCleaner.parse_product_row(raw_data)
                
                if cleaned_data:
                    products.append(cleaned_data)
                    logger.debug(f"상품 추가: {cleaned_data['product_name']}")
                
            except Exception as e:
                logger.warning(f"상품 파싱 오류: {e}")
                continue
        
        return products
    
    def _create_dummy_data(self) -> List[Dict]:
        """
        테스트용 더미 데이터 생성
        (실제 크롤링이 불가능할 때 사용)
        
        Returns:
            더미 상품 데이터 리스트
        """
        dummy_products = [
            {
                'bank_name': 'KB',
                'product_name': 'KB직장인신용대출',
                'product_type': '신용대출',
                'base_rate': 3.5,
                'additional_rate': 1.7,
                'max_limit': 100000000,
                'early_repay_fee_rate': 1.5,
                'fee_waiver_months': 36,
                'salary_transfer_discount': 0.3
            },
            {
                'bank_name': 'KB',
                'product_name': 'KB저금리신용대출',
                'product_type': '신용대출',
                'base_rate': 3.2,
                'additional_rate': 2.0,
                'max_limit': 80000000,
                'early_repay_fee_rate': 1.5,
                'fee_waiver_months': 36,
                'salary_transfer_discount': 0.3
            }
        ]
        
        logger.info(f"더미 데이터 생성: {len(dummy_products)}개 상품")
        return dummy_products


# ============================================
# 실제 구현 시 주의사항
# ============================================
"""
위 코드는 예시이며, 실제 은행 웹사이트 구조에 맞게 셀렉터를 수정해야 합니다.

크롤링 시 고려사항:
1. 각 은행 사이트마다 HTML 구조가 다르므로 개별 구현 필요
2. JavaScript로 동적 렌더링되는 경우 Selenium 대기 로직 필수
3. 페이지네이션이 있는 경우 반복 크롤링
4. 로그인이 필요한 경우 인증 로직 추가
5. 크롤링 빈도 제한 준수 (robots.txt 확인)

실제 구현 방법:
1. Chrome 개발자 도구(F12)로 페이지 구조 분석
2. 상품 리스트 컨테이너의 실제 클래스명 확인
3. 각 필드(상품명, 금리, 한도 등)의 실제 셀렉터 확인
4. 위 코드의 셀렉터를 실제 값으로 교체

예시 셀렉터 패턴:
- 상품명: .product-name, .loan-title, h3.title
- 금리: .interest-rate, .rate-info, span.rate
- 한도: .loan-limit, .max-amount, .limit-info
"""
