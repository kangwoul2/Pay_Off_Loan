"""
은행 크롤러 베이스 클래스 (수정본)
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from abc import ABC, abstractmethod
import logging
from typing import List, Dict
from .config import CrawlingConfig

logger = logging.getLogger(__name__)

class BaseBankCrawler(ABC):
    """은행 크롤러 베이스 클래스"""
    
    def __init__(self, bank_name: str):
        self.bank_name = bank_name
        self.driver = None
        self.config = CrawlingConfig()
    
    def setup_driver(self):
        """Selenium 드라이버 설정"""
        chrome_options = Options()
        if self.config.SELENIUM_OPTIONS['headless']:
            chrome_options.add_argument('--headless')
        # ... (기존 옵션 설정 생략) ...
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.set_page_load_timeout(self.config.PAGE_LOAD_TIMEOUT)
        logger.info(f"{self.bank_name} 드라이버 설정 완료")
    
    def teardown_driver(self):
        """드라이버 종료"""
        if self.driver:
            self.driver.quit()
            logger.info(f"{self.bank_name} 드라이버 종료")
    
    @abstractmethod
    def crawl(self) -> List[Dict]:
        """하위 클래스(KBCrawler 등)에서 구체적으로 구현할 로직"""
        pass
    
    def safe_crawl(self) -> List[Dict]:
        """
        [중요] main.py가 호출하는 실제 메서드
        에러 핸들링과 드라이버 생명주기를 관리합니다.
        """
        products = []
        try:
            self.setup_driver()
            products = self.crawl()  # 여기서 자식 클래스의 crawl()이 실행됨
            logger.info(f"✅ {self.bank_name}: {len(products)}개 상품 크림링 성공")
        except Exception as e:
            logger.error(f"❌ {self.bank_name} 크롤링 실패: {e}")
        finally:
            self.teardown_driver()
        return products