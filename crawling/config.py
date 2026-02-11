"""
크롤링 설정 및 은행별 URL 관리 (2026-02-11 업데이트)
"""
from typing import Dict, List

class CrawlingConfig:
    # 1. 대상 은행 설정
    TARGET_BANKS = ['KB']
    
    # 2. 실측된 obank 주소 반영
    BANK_URLS = {
        'KB_CREDIT': 'https://obank.kbstar.com/quics?page=C103429', # 신용대출
        'KB_MORTGAGE': 'https://obank.kbstar.com/quics?page=C103557'
    }
    
    PRODUCT_TYPES = ['신용대출', '담보대출']
    
    # 3. 디버깅을 위해 headless는 False로 설정 (화면이 떠야 확인 가능)
    SELENIUM_OPTIONS = {
        'headless': False, 
        'disable_gpu': True,
        'no_sandbox': True,
        'disable_dev_shm_usage': True,
        'window_size': '1920,1080'
    }
    
    CRAWL_DELAY = 4  # 은행 사이트 로딩 속도 고려
    PAGE_LOAD_TIMEOUT = 30
    MAX_RETRIES = 3
    USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'