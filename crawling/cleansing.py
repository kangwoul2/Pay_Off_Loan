"""
대출 상품 데이터 전처리 (Cleansing) 클래스
- NaN 값 처리 로직 보강 (Supabase 적재 오류 해결)
- 한도 및 금리 파싱 정규식 강화
"""

import pandas as pd
import numpy as np
import re
from typing import Optional, Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LoanDataCleaner:
    """대출 상품 데이터 전처리 클래스"""
    
    @staticmethod
    def clean_rate(rate_text: str) -> Optional[Dict[str, float]]:
        """금리 텍스트를 숫자로 변환"""
        try:
            if not rate_text or rate_text.strip() == '':
                return {'base_rate': 4.0, 'additional_rate': 0.0} # 기본값 제공
                
            # 퍼센트 기호 및 불필요한 문자 제거
            cleaned = rate_text.replace('%', '').replace('연', '').replace(' ', '')
            
            # 숫자 추출 (소수점 포함)
            numbers = re.findall(r'\d+\.?\d*', cleaned)
            
            if len(numbers) >= 2:
                min_rate = float(numbers[0])
                max_rate = float(numbers[1])
                return {
                    'base_rate': min_rate,
                    'additional_rate': round(max_rate - min_rate, 4)
                }
            elif len(numbers) == 1:
                return {
                    'base_rate': float(numbers[0]),
                    'additional_rate': 0.0
                }
            
            return {'base_rate': 4.0, 'additional_rate': 0.0}
        except Exception as e:
            return {'base_rate': 4.0, 'additional_rate': 0.0}

    @staticmethod
    def clean_limit(limit_text: str) -> int:
        """한도 텍스트를 숫자(원)로 변환"""
        try:
            if not limit_text or limit_text.strip() == '':
                return 0
            
            text = limit_text.replace(',', '').replace(' ', '')
            
            # 억 단위 추출
            if '억' in text:
                match = re.search(r'(\d+\.?\d*)억', text)
                if match:
                    return int(float(match.group(1)) * 100000000)
            
            # 만 단위 추출
            if '만' in text:
                match = re.search(r'(\d+\.?\d*)만', text)
                if match:
                    return int(float(match.group(1)) * 10000)
            
            # 숫자만 있는 경우
            numbers = re.findall(r'\d+', text)
            if numbers:
                return int(numbers[0])
            
            return 0
        except:
            return 0

    @staticmethod
    def validate_and_clean(df: pd.DataFrame) -> pd.DataFrame:
        """DataFrame 전체 데이터 검증 및 정제 (NaN 방어 로직 포함)"""
        logger.info(f"전처리 시작: {len(df)}개 레코드")
        
        # 1. NaN 처리 (Supabase JSON 적재 에러 해결 핵심)
        # float 타입의 NaN을 JSON이 이해할 수 있는 형태나 기본값으로 변환
        df['base_rate'] = pd.to_numeric(df['base_rate'], errors='coerce').fillna(4.0)
        df['additional_rate'] = pd.to_numeric(df['additional_rate'], errors='coerce').fillna(0.0)
        df['max_limit'] = pd.to_numeric(df['max_limit'], errors='coerce').fillna(0).astype(int)
        
        # 2. 필수 필드 결측치 제거
        df = df.dropna(subset=['bank_name', 'product_name'])
        
        # 3. 금리 범위 검증 (비정상 데이터 필터링)
        df = df[
            (df['base_rate'] >= 0) & (df['base_rate'] <= 30) &
            (df['additional_rate'] >= 0) & (df['additional_rate'] <= 20)
        ]
        
        # 4. 중복 제거 (은행명 + 상품명)
        df = df.drop_duplicates(subset=['bank_name', 'product_name'], keep='last')
        
        # 5. 기본값 설정 및 타입 강제 (None 대신 구체적 수치)
        df['salary_transfer_discount'] = 0.3
        df['early_repay_fee_rate'] = 1.5
        df['fee_waiver_months'] = 36
        
        # 6. NaN을 파이썬 None으로 최종 변환 (PostgreSQL 적재용)
        # 하지만 앞에서 fillna를 했으므로 실제로는 nan이 없어야 함
        df = df.replace({np.nan: None})
        
        logger.info(f"전처리 완료: {len(df)}개 레코드")
        return df
    
    @staticmethod
    def parse_product_row(raw_data: Dict) -> Optional[Dict]:
        """개별 상품 로우 데이터 파싱"""
        try:
            # 금리 파싱
            rate_info = LoanDataCleaner.clean_rate(raw_data.get('rate', ''))
            
            # 한도 파싱
            limit = LoanDataCleaner.clean_limit(raw_data.get('limit', ''))
            
            # 수수료/면제기간 (기본값 처리)
            fee_rate = LoanDataCleaner.clean_fee_rate(raw_data.get('fee', ''))
            waiver_months = LoanDataCleaner.clean_waiver_months(raw_data.get('waiver', ''))
            
            return {
                'bank_name': raw_data.get('bank_name'),
                'product_name': raw_data.get('product_name'),
                'product_type': raw_data.get('product_type', '신용대출'),
                'base_rate': float(rate_info['base_rate']),
                'additional_rate': float(rate_info['additional_rate']),
                'max_limit': int(limit),
                'early_repay_fee_rate': float(fee_rate),
                'fee_waiver_months': int(waiver_months),
                'salary_transfer_discount': 0.3
            }
        except Exception as e:
            logger.error(f"상품 로우 파싱 실패: {e}")
            return None

    @staticmethod
    def clean_fee_rate(fee_text: str) -> float:
        try:
            numbers = re.findall(r'\d+\.?\d*', str(fee_text))
            return float(numbers[0]) if numbers else 1.5
        except:
            return 1.5

    @staticmethod
    def clean_waiver_months(waiver_text: str) -> int:
        try:
            text = str(waiver_text)
            if '년' in text:
                match = re.search(r'(\d+)', text)
                return int(match.group(1)) * 12 if match else 36
            match = re.search(r'(\d+)', text)
            return int(match.group(1)) if match else 36
        except:
            return 36