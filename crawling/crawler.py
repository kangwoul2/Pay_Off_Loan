"""
은행 크롤러 베이스 클래스
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import logging
from typing import List, Dict, Optional
from abc import ABC, abstractmethod

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
        if self.config.SELENIUM_OPTIONS['disable_gpu']:
            chrome_options.add_argument('--disable-gpu')
        if self.config.SELENIUM_OPTIONS['no_sandbox']:
            chrome_options.add_argument('--no-sandbox')
        if self.config.SELENIUM_OPTIONS['disable_dev_shm_usage']:
            chrome_options.add_argument('--disable-dev-shm-usage')
        
        chrome_options.add_argument(f'--window-size={self.config.SELENIUM_OPTIONS["window_size"]}')
        chrome_options.add_argument(f'user-agent={self.config.USER_AGENT}')
        
        # 수정 포인트: Service와 ChromeDriverManager를 사용하지 않고 직접 생성
        # 이렇게 하면 Selenium Manager가 맥(arm64)에 맞는 드라이버를 자동으로 찾습니다.
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
        """
        크롤링 메인 로직 (각 은행별 구현 필요)
        
        Returns:
            크롤링된 상품 리스트
        """
        pass
    
    def safe_crawl(self) -> List[Dict]:
        """
        안전한 크롤링 (예외 처리 포함)
        
        Returns:
            크롤링된 상품 리스트 (실패 시 빈 리스트)
        """
        products = []
        
        try:
            self.setup_driver()
            products = self.crawl()
            logger.info(f"✅ {self.bank_name}: {len(products)}개 상품 크롤링 성공")
            
        except Exception as e:
            logger.error(f"❌ {self.bank_name} 크롤링 실패: {e}")
            
        finally:
            self.teardown_driver()
        
        return products
