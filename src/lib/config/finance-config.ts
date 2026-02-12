/**
 * 금융 계산 관련 상수 및 정책 설정
 * 
 * @description
 * 금융 계산에 필요한 모든 상수를 중앙에서 관리합니다.
 * 정책 변경 시 이 파일만 수정하면 전체 시스템에 반영됩니다.
 */

import Big from 'big.js';

// Big.js 전역 설정
Big.DP = 4;  // 소수점 4자리까지
Big.RM = Big.roundHalfUp;  // 반올림

export class FinanceConfig {
  // ============================================
  // 인지세 (Stamp Duty) 정책
  // ============================================
  
  /**
   * 대출 금액에 따른 인지세 계산
   * 
   * 법적 근거: 인지세법 시행령 제3조 (2026년 기준)
   * 
   * 기준:
   * - 5천만원 이하: 면제
   * - 5천만원 초과 ~ 1억원 이하: 7만원
   * - 1억원 초과 ~ 10억원 이하: 15만원
   * - 10억원 초과: 35만원
   * 
   * @param loanAmount - 대출 금액 (원)
   * @returns 인지세 (원)
   */
  static calculateStampDuty(loanAmount: Big): Big {
    const amount = loanAmount.toNumber();
    
    if (amount <= 50000000) {
      return Big(0);
    } else if (amount <= 100000000) {
      return Big(70000);
    } else if (amount <= 1000000000) {
      return Big(150000);
    } else {
      return Big(350000);
    }
  }

  // ============================================
  // 중도상환 수수료 정책
  // ============================================
  
  /**
   * 기본 중도상환 수수료율 (%)
   * 
   * 일반적으로 은행권에서 적용하는 표준 수수료율입니다.
   * 실제 수수료율은 대출 상품마다 다를 수 있습니다.
   */
  static readonly DEFAULT_EARLY_REPAY_FEE_RATE = 1.5;

  /**
   * 기본 수수료 면제 기간 (개월)
   * 
   * 대부분의 은행에서 3년(36개월) 경과 시 중도상환 수수료를 면제합니다.
   */
  static readonly DEFAULT_FEE_WAIVER_MONTHS = 36;

  // ============================================
  // 금리 정책
  // ============================================
  
  /**
   * 최소 허용 금리 (%)
   */
  static readonly MIN_INTEREST_RATE = 0;

  /**
   * 최대 허용 금리 (%)
   * 
   * 법정 최고 금리: 연 20% (대부업법 기준)
   * 은행권 신용대출은 일반적으로 30% 미만
   */
  static readonly MAX_INTEREST_RATE = 30;

  /**
   * 급여이체 우대 금리 (일반적 범위)
   */
  static readonly TYPICAL_SALARY_DISCOUNT = 0.3;

  // ============================================
  // 계산 정밀도
  // ============================================
  
  /**
   * 금융 계산 소수점 자리수
   */
  static readonly DECIMAL_PLACES = 4;

  /**
   * 통화 표시 소수점 자리수 (원 단위는 0)
   */
  static readonly CURRENCY_DECIMAL_PLACES = 0;

  // ============================================
  // 대출 한도
  // ============================================
  
  /**
   * 최소 대출 금액 (원)
   */
  static readonly MIN_LOAN_AMOUNT = 1000000;  // 100만원

  /**
   * 최대 대출 금액 (원)
   */
  static readonly MAX_LOAN_AMOUNT = 500000000;  // 5억원

  // ============================================
  // 상환 기간
  // ============================================
  
  /**
   * 최소 상환 기간 (개월)
   */
  static readonly MIN_REPAYMENT_MONTHS = 6;

  /**
   * 최대 상환 기간 (개월)
   */
  static readonly MAX_REPAYMENT_MONTHS = 600;  // 50년
}

/**
 * 금액을 원화 형식으로 포맷팅
 * 
 * @param amount - 금액 (Big 또는 number)
 * @returns 포맷된 문자열 (예: "1,000,000원")
 */
export function formatCurrency(amount: Big | number): string {
  const num = amount instanceof Big ? amount.toNumber() : amount;
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * 금리를 퍼센트 형식으로 포맷팅
 * 
 * @param rate - 금리 (Big 또는 number)
 * @returns 포맷된 문자열 (예: "3.50%")
 */
export function formatRate(rate: Big | number): string {
  const num = rate instanceof Big ? rate.toNumber() : rate;
  return `${num.toFixed(2)}%`;
}

/**
 * 유효성 검증 헬퍼 함수들
 */
export const Validators = {
  /**
   * 대출 금액 유효성 검증
   */
  isValidLoanAmount(amount: number): boolean {
    return amount >= FinanceConfig.MIN_LOAN_AMOUNT && 
           amount <= FinanceConfig.MAX_LOAN_AMOUNT;
  },

  /**
   * 금리 유효성 검증
   */
  isValidInterestRate(rate: number): boolean {
    return rate >= FinanceConfig.MIN_INTEREST_RATE && 
           rate <= FinanceConfig.MAX_INTEREST_RATE;
  },

  /**
   * 상환 기간 유효성 검증
   */
  isValidRepaymentMonths(months: number): boolean {
    return months >= FinanceConfig.MIN_REPAYMENT_MONTHS && 
           months <= FinanceConfig.MAX_REPAYMENT_MONTHS;
  },
};
