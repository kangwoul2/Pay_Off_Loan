/**
 * 입력값 검증 유틸리티
 * 
 * @description
 * 사용자 입력 및 크롤링 데이터의 유효성을 검증합니다.
 * High Priority 엣지 케이스 (#1, #2, #3) 처리를 포함합니다.
 */

import { FinanceConfig } from '../config/finance-config';
import { CurrentDebtInfo, NewLoanProduct } from '../services/simulation-service';

/**
 * 검증 오류 클래스
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 현재 대출 정보 검증
 * 
 * @param debt - 검증할 대출 정보
 * @throws ValidationError - 검증 실패 시
 */
export function validateCurrentDebt(debt: CurrentDebtInfo): void {
  // 1. 대출 원금 검증
  if (debt.principal <= 0) {
    throw new ValidationError('대출 원금은 0원보다 커야 합니다.');
  }
  
  if (debt.principal < FinanceConfig.MIN_LOAN_AMOUNT) {
    throw new ValidationError(
      `대출 원금은 최소 ${FinanceConfig.MIN_LOAN_AMOUNT.toLocaleString()}원 이상이어야 합니다.`
    );
  }
  
  if (debt.principal > FinanceConfig.MAX_LOAN_AMOUNT) {
    throw new ValidationError(
      `대출 원금은 최대 ${FinanceConfig.MAX_LOAN_AMOUNT.toLocaleString()}원 이하여야 합니다.`
    );
  }
  
  // 2. 금리 검증 (엣지 케이스 #2 처리)
  if (debt.interestRate < FinanceConfig.MIN_INTEREST_RATE) {
    throw new ValidationError(
      `금리는 ${FinanceConfig.MIN_INTEREST_RATE}% 이상이어야 합니다.`
    );
  }
  
  if (debt.interestRate > FinanceConfig.MAX_INTEREST_RATE) {
    throw new ValidationError(
      `금리는 ${FinanceConfig.MAX_INTEREST_RATE}% 이하여야 합니다. ` +
      `입력하신 ${debt.interestRate}%는 법정 최고 금리를 초과합니다.`
    );
  }
  
  // 3. 상환 기간 검증 (엣지 케이스 #1, #3 처리)
  if (debt.remainingMonths <= 0) {
    throw new ValidationError('잔여 상환 기간은 1개월 이상이어야 합니다.');
  }
  
  if (debt.totalMonths <= 0) {
    throw new ValidationError('전체 상환 기간은 1개월 이상이어야 합니다.');
  }
  
  if (debt.remainingMonths > debt.totalMonths) {
    throw new ValidationError(
      `잔여 기간(${debt.remainingMonths}개월)이 전체 기간(${debt.totalMonths}개월)보다 클 수 없습니다.`
    );
  }
  
  if (debt.remainingMonths < FinanceConfig.MIN_REPAYMENT_MONTHS) {
    throw new ValidationError(
      `잔여 기간은 최소 ${FinanceConfig.MIN_REPAYMENT_MONTHS}개월 이상이어야 합니다.`
    );
  }
  
  if (debt.totalMonths > FinanceConfig.MAX_REPAYMENT_MONTHS) {
    throw new ValidationError(
      `전체 기간은 최대 ${FinanceConfig.MAX_REPAYMENT_MONTHS}개월 이하여야 합니다.`
    );
  }
  
  // 4. 상환 방식 검증
  const validRepaymentTypes = ['원리금균등', '원금균등'];
  if (!validRepaymentTypes.includes(debt.repaymentType)) {
    throw new ValidationError(
      `상환 방식은 '원리금균등' 또는 '원금균등'이어야 합니다. (입력값: ${debt.repaymentType})`
    );
  }
  
  // 5. 중도상환 수수료율 검증
  if (debt.earlyRepayFeeRate < 0 || debt.earlyRepayFeeRate > 5) {
    throw new ValidationError(
      `중도상환 수수료율은 0%~5% 사이여야 합니다. (입력값: ${debt.earlyRepayFeeRate}%)`
    );
  }
  
  // 6. 수수료 면제 기간 검증
  if (debt.feeWaiverMonths < 0 || debt.feeWaiverMonths > debt.totalMonths) {
    throw new ValidationError(
      `수수료 면제 기간은 0~${debt.totalMonths}개월 사이여야 합니다.`
    );
  }
}

/**
 * 신규 대출 상품 검증
 * 
 * @param product - 검증할 대출 상품
 * @throws ValidationError - 검증 실패 시
 */
export function validateNewLoanProduct(product: NewLoanProduct): void {
  // 1. 은행명 검증
  if (!product.bankName || product.bankName.trim() === '') {
    throw new ValidationError('은행명을 입력해주세요.');
  }
  
  // 2. 상품명 검증
  if (!product.productName || product.productName.trim() === '') {
    throw new ValidationError('상품명을 입력해주세요.');
  }
  
  // 3. 기본 금리 검증
  if (product.baseRate < 0 || product.baseRate > 30) {
    throw new ValidationError(
      `기본 금리는 0%~30% 사이여야 합니다. (입력값: ${product.baseRate}%)`
    );
  }
  
  // 4. 가산 금리 검증
  if (product.additionalRate < 0 || product.additionalRate > 10) {
    throw new ValidationError(
      `가산 금리는 0%~10% 사이여야 합니다. (입력값: ${product.additionalRate}%)`
    );
  }
  
  // 5. 우대 금리 검증
  if (product.salaryTransferDiscount < 0 || product.salaryTransferDiscount > 5) {
    throw new ValidationError(
      `급여이체 우대 금리는 0%~5% 사이여야 합니다. (입력값: ${product.salaryTransferDiscount}%)`
    );
  }
  
  if (product.userOtherDiscount < 0 || product.userOtherDiscount > 5) {
    throw new ValidationError(
      `기타 우대 금리는 0%~5% 사이여야 합니다. (입력값: ${product.userOtherDiscount}%)`
    );
  }
  
  // 6. 총 우대 금리 검증 (기본금리 + 가산금리를 초과할 수 없음)
  const totalRate = product.baseRate + product.additionalRate;
  const totalDiscount = product.salaryTransferDiscount + product.userOtherDiscount;
  
  if (totalDiscount > totalRate) {
    throw new ValidationError(
      `총 우대 금리(${totalDiscount.toFixed(2)}%)가 ` +
      `적용 금리(${totalRate.toFixed(2)}%)를 초과할 수 없습니다.`
    );
  }
}

/**
 * 여러 입력값을 한 번에 검증
 * 
 * @param debt - 현재 대출 정보
 * @param products - 신규 대출 상품 목록
 * @throws ValidationError - 검증 실패 시
 */
export function validateSimulationInputs(
  debt: CurrentDebtInfo,
  products: NewLoanProduct[]
): void {
  // 현재 대출 검증
  validateCurrentDebt(debt);
  
  // 상품 목록 검증
  if (!products || products.length === 0) {
    throw new ValidationError('비교할 대출 상품이 없습니다.');
  }
  
  if (products.length > 50) {
    throw new ValidationError('한 번에 비교할 수 있는 상품은 최대 50개입니다.');
  }
  
  // 각 상품 검증
  products.forEach((product, index) => {
    try {
      validateNewLoanProduct(product);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `상품 #${index + 1} (${product.productName}): ${error.message}`
        );
      }
      throw error;
    }
  });
}

/**
 * 숫자 범위 검증 헬퍼
 * 
 * @param value - 검증할 값
 * @param min - 최소값
 * @param max - 최대값
 * @param fieldName - 필드명 (오류 메시지용)
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName}은(는) ${min}~${max} 사이여야 합니다. (입력값: ${value})`
    );
  }
}

/**
 * 필수 필드 검증 헬퍼
 * 
 * @param value - 검증할 값
 * @param fieldName - 필드명
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName}은(는) 필수 입력 항목입니다.`);
  }
}

/**
 * 안전한 검증 래퍼
 * 
 * 검증 실패 시 에러를 던지지 않고 객체로 반환합니다.
 * 
 * @param validationFn - 검증 함수
 * @returns { valid: boolean, error?: string }
 */
export function safeValidate(
  validationFn: () => void
): { valid: boolean; error?: string } {
  try {
    validationFn();
    return { valid: true };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: '알 수 없는 검증 오류가 발생했습니다.' };
  }
}
