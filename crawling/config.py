"""
크롤링 설정 및 은행별 URL 관리
"""

from typing import Dict, List

class CrawlingConfig:
    """크롤링 설정 및 은행별 URL"""
    
    # 크롤링 대상 은행
    TARGET_BANKS = ['KB', '신한', '하나', '우리', 'NH']
    
    # 은행별 대출 상품 페이지 URL (2026년 기준 예시)
    # 실제 구현 시 최신 URL로 업데이트 필요
    BANK_URLS = {
        'KB': 'https://www.kbstar.com/quics?page=C025256',
        '신한': 'https://www.shinhan.com/personal/loan/credit.jsp',
        '하나': 'https://www.kebhana.com/cont/loan/loan01/loan0101.jsp',
        '우리': 'https://www.wooribank.com/personal/loan/credit-loan.jsp',
        'NH': 'https://banking.nonghyup.com/nhbank.html#!/loan'
    }
    
    # 크롤링 대상 상품 타입
    PRODUCT_TYPES = ['신용대출', '마이너스통장']
    
    # Selenium 옵션
    SELENIUM_OPTIONS = {
        'headless': True,
        'disable_gpu': True,
        'no_sandbox': True,
        'disable_dev_shm_usage': True,
        'window_size': '1920,1080'
    }
    
    # 크롤링 딜레이 (초)
    CRAWL_DELAY = 2
    
    # 타임아웃 (초)
    PAGE_LOAD_TIMEOUT = 30
    
    # 재시도 횟수
    MAX_RETRIES = 3

    # User Agent
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
