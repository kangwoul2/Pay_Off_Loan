"""
대출 상품 데이터 전처리 (Cleansing) 클래스
- 데이터 진단 기능 및 NaN 처리 보강
"""
import pandas as pd
import numpy as np
import re
from typing import Optional, Dict, List
import logging

logger = logging.getLogger(__name__)

class LoanDataCleaner:
    """대출 상품 데이터 전처리 클래스"""
    
    @staticmethod
    def validate_and_clean(df: pd.DataFrame) -> pd.DataFrame:
        logger.info("--- 전처리 및 데이터 품질 검사 시작 ---")
        
        # 데이터 복사 (원본 보존)
        working_df = df.copy()
        initial_count = len(working_df)
        
        # 1. 타입 변환 및 NaN 방어 (Supabase JSON 에러 방지)
        # float 타입에서 NaN은 JSON 직렬화가 안 되므로 미리 처리합니다.
        working_df['base_rate'] = pd.to_numeric(working_df['base_rate'], errors='coerce').fillna(4.0)
        working_df['additional_rate'] = pd.to_numeric(working_df['additional_rate'], errors='coerce').fillna(0.0)
        working_df['max_limit'] = pd.to_numeric(working_df['max_limit'], errors='coerce').fillna(0).astype(int)
        
        # 2. DB 제약 조건 검증 (Check Constraint: max_limit > 0)
        # 한도가 '국가보훈부 추천금액'처럼 텍스트로 수집되어 0이 된 데이터들 제외
        working_df = working_df[working_df['max_limit'] > 0]
        limit_filtered = initial_count - len(working_df)
        if limit_filtered > 0:
            logger.info(f"   ⚠️ [필터링] 한도 정보 미비(0원) 상품 {limit_filtered}건 제외")

        # 3. 중복 데이터 제거
        before_dedup = len(working_df)
        working_df = working_df.drop_duplicates(subset=['bank_name', 'product_name'], keep='last')
        dedup_count = before_dedup - len(working_df)
        if dedup_count > 0:
            logger.info(f"   ⚠️ [필터링] 중복 수집 상품 {dedup_count}건 제거")

        # 4. 필수 필드 검증 (상품명, 은행명)
        working_df = working_df.dropna(subset=['bank_name', 'product_name'])
        
        # 5. 최종 데이터 요약 출력
        logger.info(f"📊 전처리 분석 결과:")
        logger.info(f"   - 원본 수치: {initial_count}건")
        logger.info(f"   - 유효 수치: {len(working_df)}건")
        logger.info(f"   - 탈락 수치: {initial_count - len(working_df)}건")

        # PostgreSQL/Supabase 호환성을 위한 최종 변환
        return working_df.replace({np.nan: None})

    @staticmethod
    def clean_rate(rate_text: str) -> Optional[Dict[str, float]]:
        try:
            if not rate_text or rate_text.strip() == '':
                return {'base_rate': 4.0, 'additional_rate': 0.0}
            cleaned = rate_text.replace('%', '').replace('연', '').replace(' ', '')
            numbers = re.findall(r'\d+\.?\d*', cleaned)
            if len(numbers) >= 2:
                min_rate = float(numbers[0])
                max_rate = float(numbers[1])
                return {'base_rate': min_rate, 'additional_rate': round(max_rate - min_rate, 4)}
            elif len(numbers) == 1:
                return {'base_rate': float(numbers[0]), 'additional_rate': 0.0}
            return {'base_rate': 4.2, 'additional_rate': 0.0} # KB 기본 평균값
        except:
            return {'base_rate': 4.0, 'additional_rate': 0.0}

    @staticmethod
    def clean_limit(limit_text: str) -> int:
        try:
            if not limit_text: return 0
            
            # 1. 텍스트 전처리
            text = str(limit_text).replace(',', '').replace(' ', '')
            
            # 2. 숫자(소수점 포함) 추출 로직 강화
            # (\d+\.?\d*) -> 3.5 같은 형태를 통째로 잡음
            match_num = re.search(r'(\d+\.?\d*)', text)
            if not match_num: return 0
            
            value = float(match_num.group(1))
            
            # 3. 단위 판별 (가장 중요)
            if '억' in text:
                return int(value * 100_000_000)
            elif '천만' in text:
                return int(value * 10_000_000)
            elif '백만' in text:
                return int(value * 1_000_000)
            elif '만' in text:
                return int(value * 10_000)
                
            # 단위를 아예 못 가져왔는데 숫자가 너무 작다면(예: 3.5) 억 단위로 추측하는 보정 로직 (선택사항)
            if value < 1000 and '억' not in text: # 3.5 같은 수치인데 단위가 없다면 억일 확률이 높음
                # logger.warning(f"단위 미비로 인한 보정 발생: {limit_text}")
                return int(value * 100_000_000)

            return int(value)
        except:
            return 0

    @staticmethod
    def parse_product_row(raw_data: Dict) -> Optional[Dict]:
        try:
            rate_info = LoanDataCleaner.clean_rate(raw_data.get('rate', ''))
            limit = LoanDataCleaner.clean_limit(raw_data.get('limit', ''))
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
            logger.error(f"로우 파싱 실패: {e}")
            return None

    @staticmethod
    def clean_fee_rate(fee_text: str) -> float:
        try:
            numbers = re.findall(r'\d+\.?\d*', str(fee_text))
            return float(numbers[0]) if numbers else 1.5
        except: return 1.5

    @staticmethod
    def clean_waiver_months(waiver_text: str) -> int:
        try:
            text = str(waiver_text)
            if '년' in text:
                match = re.search(r'(\d+)', text)
                return int(match.group(1)) * 12 if match else 36
            match = re.search(r'(\d+)', text)
            return int(match.group(1)) if match else 36
        except: return 36