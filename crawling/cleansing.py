"""
대출 상품 데이터 전처리 (Cleansing) 클래스
"""

import pandas as pd
import re
from typing import Optional, Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LoanDataCleaner:
    """대출 상품 데이터 전처리 클래스"""
    
    @staticmethod
    def clean_rate(rate_text: str) -> Optional[Dict[str, float]]:
        """
        금리 텍스트를 숫자로 변환
        
        Args:
            rate_text: 금리 텍스트 (예: "연 3.5% ~ 5.2%")
            
        Returns:
            {'base_rate': 3.5, 'additional_rate': 1.7} 또는 None
        """
        try:
            if not rate_text or rate_text.strip() == '':
                return None
                
            # 퍼센트 기호 및 불필요한 문자 제거
            cleaned = rate_text.replace('%', '').replace('연', '').replace(' ', '')
            
            # 숫자 추출 (소수점 포함)
            numbers = re.findall(r'\d+\.?\d*', cleaned)
            
            if len(numbers) >= 2:
                min_rate = float(numbers[0])
                max_rate = float(numbers[1])
                
                # 유효성 검증
                if 0 <= min_rate <= 30 and 0 <= max_rate <= 30 and min_rate <= max_rate:
                    return {
                        'base_rate': min_rate,
                        'additional_rate': round(max_rate - min_rate, 4)
                    }
            elif len(numbers) == 1:
                rate = float(numbers[0])
                if 0 <= rate <= 30:
                    return {
                        'base_rate': rate,
                        'additional_rate': 0
                    }
            
            return None
        except Exception as e:
            logger.warning(f"금리 파싱 실패: {rate_text}, 오류: {e}")
            return None
    
    @staticmethod
    def clean_limit(limit_text: str) -> Optional[int]:
        """
        한도 텍스트를 숫자(원)로 변환
        
        Args:
            limit_text: 한도 텍스트 (예: "최대 1억원", "5천만원")
            
        Returns:
            숫자(원 단위) 또는 None
        """
        try:
            if not limit_text or limit_text.strip() == '':
                return None
            
            # 쉼표 및 공백 제거
            text = limit_text.replace(',', '').replace(' ', '')
            
            # 억 단위
            if '억' in text:
                match = re.search(r'(\d+\.?\d*)억', text)
                if match:
                    amount = float(match.group(1))
                    return int(amount * 100000000)
            
            # 만 단위
            if '만' in text:
                match = re.search(r'(\d+\.?\d*)만', text)
                if match:
                    amount = float(match.group(1))
                    return int(amount * 10000)
            
            # 천 단위
            if '천' in text:
                match = re.search(r'(\d+\.?\d*)천', text)
                if match:
                    amount = float(match.group(1))
                    return int(amount * 1000)
            
            # 숫자만 있는 경우
            match = re.search(r'\d+', text)
            if match:
                return int(match.group())
            
            return None
        except Exception as e:
            logger.warning(f"한도 파싱 실패: {limit_text}, 오류: {e}")
            return None
    
    @staticmethod
    def clean_fee_rate(fee_text: str) -> Optional[float]:
        """
        수수료율 텍스트를 숫자로 변환
        
        Args:
            fee_text: 수수료율 텍스트 (예: "1.5%")
            
        Returns:
            수수료율 (기본값 1.5)
        """
        try:
            if not fee_text or fee_text.strip() == '':
                return 1.5  # 기본값
            
            numbers = re.findall(r'\d+\.?\d*', fee_text)
            if numbers:
                rate = float(numbers[0])
                if 0 <= rate <= 5:
                    return rate
            
            return 1.5  # 기본값
        except:
            return 1.5
    
    @staticmethod
    def clean_waiver_months(waiver_text: str) -> Optional[int]:
        """
        수수료 면제 기간 텍스트를 개월 수로 변환
        
        Args:
            waiver_text: 면제 기간 텍스트 (예: "3년", "24개월")
            
        Returns:
            개월 수 (기본값 36)
        """
        try:
            if not waiver_text or waiver_text.strip() == '':
                return 36  # 기본값
            
            # 년 단위
            if '년' in waiver_text:
                match = re.search(r'(\d+)년', waiver_text)
                if match:
                    return int(match.group(1)) * 12
            
            # 개월 단위
            if '개월' in waiver_text or '월' in waiver_text:
                match = re.search(r'(\d+)', waiver_text)
                if match:
                    return int(match.group(1))
            
            return 36  # 기본값
        except:
            return 36
    
    @staticmethod
    def validate_and_clean(df: pd.DataFrame) -> pd.DataFrame:
        """
        DataFrame 전체 데이터 검증 및 정제
        
        Args:
            df: 원본 DataFrame
            
        Returns:
            정제된 DataFrame
        """
        logger.info(f"전처리 시작: {len(df)}개 레코드")
        
        # 1. 필수 필드 결측치 제거
        required_fields = ['bank_name', 'product_name', 'base_rate']
        df = df.dropna(subset=required_fields)
        logger.info(f"필수 필드 검증 후: {len(df)}개 레코드")
        
        # 2. 금리 범위 검증
        df = df[
            (df['base_rate'] >= 0) & (df['base_rate'] <= 30) &
            (df['additional_rate'] >= 0) & (df['additional_rate'] <= 10)
        ]
        logger.info(f"금리 범위 검증 후: {len(df)}개 레코드")
        
        # 3. 한도 검증 (100만원 이상)
        if 'max_limit' in df.columns:
            df = df[(df['max_limit'].isna()) | (df['max_limit'] >= 1000000)]
        
        # 4. 중복 제거 (은행명 + 상품명)
        df = df.drop_duplicates(subset=['bank_name', 'product_name'], keep='last')
        logger.info(f"중복 제거 후: {len(df)}개 레코드")
        
        # 5. 기본값 설정
        df['salary_transfer_discount'] = df.get('salary_transfer_discount', 0.3)
        df['early_repay_fee_rate'] = df.get('early_repay_fee_rate', 1.5)
        df['fee_waiver_months'] = df.get('fee_waiver_months', 36)
        
        # 6. 상품 타입 정규화
        df['product_type'] = df['product_type'].replace({
            '신용': '신용대출',
            '마통': '마이너스통장',
            '마이너스': '마이너스통장'
        })
        
        # 7. NaN을 None으로 변환 (PostgreSQL 호환)
        df = df.where(pd.notnull(df), None)
        
        logger.info(f"전처리 완료: {len(df)}개 레코드")
        return df
    
    @staticmethod
    def parse_product_row(raw_data: Dict) -> Optional[Dict]:
        """
        개별 상품 로우 데이터 파싱
        
        Args:
            raw_data: 원본 데이터 딕셔너리
            
        Returns:
            정제된 데이터 딕셔너리 또는 None
        """
        cleaner = LoanDataCleaner()
        
        try:
            # 금리 파싱
            rate_info = cleaner.clean_rate(raw_data.get('rate', ''))
            if not rate_info:
                return None
            
            # 한도 파싱
            limit = cleaner.clean_limit(raw_data.get('limit', ''))
            
            # 수수료 정보 파싱
            fee_rate = cleaner.clean_fee_rate(raw_data.get('fee', ''))
            waiver_months = cleaner.clean_waiver_months(raw_data.get('waiver', ''))
            
            return {
                'bank_name': raw_data.get('bank_name'),
                'product_name': raw_data.get('product_name'),
                'product_type': raw_data.get('product_type'),
                'base_rate': rate_info['base_rate'],
                'additional_rate': rate_info['additional_rate'],
                'max_limit': limit,
                'early_repay_fee_rate': fee_rate,
                'fee_waiver_months': waiver_months,
                'salary_transfer_discount': 0.3  # 기본값
            }
        except Exception as e:
            logger.error(f"상품 파싱 실패: {raw_data}, 오류: {e}")
            return None
