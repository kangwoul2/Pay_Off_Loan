/**
 * 대환대출 시뮬레이션 서비스
 * 
 * @description
 * 사용자의 현재 대출 정보와 신규 대출 상품을 비교하여
 * 최적의 대환대출 전략을 제안합니다.
 */

import Big from 'big.js';
import { RepaymentStrategyFactory } from '../strategies/repayment-strategy';
import { FinanceConfig } from '../config/finance-config';

// Big.js 설정
Big.DP = 4;
Big.RM = Big.roundHalfUp;

/**
 * 현재 대출 정보 타입
 */
export interface CurrentDebtInfo {
  principal: number;              // 대출 원금 (원)
  interestRate: number;           // 현재 금리 (%)
  remainingMonths: number;        // 잔여 상환 개월 수
  totalMonths: number;            // 전체 상환 개월 수
  repaymentType: '원리금균등' | '원금균등';
  earlyRepayFeeRate: number;      // 중도상환 수수료율 (%)
  feeWaiverMonths: number;        // 수수료 면제 기간 (개월)
}

/**
 * 신규 대출 상품 정보 타입
 */
export interface NewLoanProduct {
  bankName: string;               // 은행명
  productName: string;            // 상품명
  baseRate: number;               // 기본 금리 (%)
  additionalRate: number;         // 가산 금리 (%)
  salaryTransferDiscount: number; // 급여이체 우대 금리 (%)
  userOtherDiscount: number;      // 기타 우대 금리 (사용자 입력) (%)
}

/**
 * 시뮬레이션 결과 타입
 */
export interface SimulationResult {
  // 전략 실행 전 (현재 대출 유지)
  totalDebtBefore: number;        // 총 상환액 (원)
  monthlyPaymentBefore: number;   // 월 상환액 (원)
  
  // 전략 실행 후 (대환대출)
  totalDebtAfter: number;         // 총 상환액 (원금 + 이자 + 비용)
  monthlyPaymentAfter: number;    // 월 상환액 (원)
  
  // 비용 분석
  earlyRepayFee: number;          // 중도상환 수수료 (원)
  stampDuty: number;              // 인지세 (원)
  totalRefinanceCost: number;     // 총 대환 비용 (원)
  
  // 이득 분석
  interestSavings: number;        // 이자 절감액 (원)
  netSavings: number;             // 순이익 (원)
  monthlySavings: number;         // 월별 절감액 (원)
  
  // 손익분기점
  breakEvenMonths: number;        // 손익분기점 (개월)
  
  // 추천
  recommendedAction: '즉시_대환' | '수수료_면제_대기' | '현재_유지';
  
  // 금리 정보
  currentRate: number;            // 현재 금리 (%)
  newRate: number;                // 신규 금리 (%)
  
  // 신규 상품 정보
  recommendedProduct: {
    bankName: string;
    productName: string;
    rate: number;
  };
}

/**
 * 대환대출 시뮬레이션 실행
 * 
 * @param currentDebt - 현재 대출 정보
 * @param newLoan - 신규 대출 상품 정보
 * @param hasSalaryTransfer - 급여이체 여부
 * @returns 시뮬레이션 결과
 * 
 * @throws Error - 입력값이 유효하지 않은 경우
 */
export function simulateRefinancing(
  currentDebt: CurrentDebtInfo,
  newLoan: NewLoanProduct,
  hasSalaryTransfer: boolean
): SimulationResult {
  
  // ============================================
  // 0. 입력값 사전 검증 및 안전한 숫자 변환 (중요!)
  // ============================================
  
  // 안전한 숫자 변환 함수
  const safeNum = (val: any, defaultVal: number = 0): number => {
    if (val === null || val === undefined) return defaultVal;
    const num = Number(val);
    return isNaN(num) ? defaultVal : num;
  };

  const safePrincipal = safeNum(currentDebt.principal, 50000000);
  const safeCurrentRate = safeNum(currentDebt.interestRate, 5.5);
  const safeRemainingMonths = safeNum(currentDebt.remainingMonths, 36);
  const safeTotalMonths = safeNum(currentDebt.totalMonths, 60);
  const safeFeeRate = safeNum(currentDebt.earlyRepayFeeRate, 1.5);
  const safeWaiverMonths = safeNum(currentDebt.feeWaiverMonths, 36);

  // 신규 대출 금리 안전 변환
  const safeBaseRate = safeNum(newLoan.baseRate, 3.5);
  const safeAdditionalRate = safeNum(newLoan.additionalRate, 1.5);
  const safeSalaryDiscount = safeNum(newLoan.salaryTransferDiscount, 0.3);
  const safeUserDiscount = safeNum(newLoan.userOtherDiscount, 0);

  // 잔여 기간 검증
  if (safeRemainingMonths <= 0) {
    throw new Error('잔여 상환 기간은 1개월 이상이어야 합니다.');
  }
  
  // 대출 원금 검증
  if (safePrincipal <= 0) {
    throw new Error('대출 원금은 0원보다 커야 합니다.');
  }
  
  // ============================================
  // 1. 전략 선택
  // ============================================
  const currentStrategy = RepaymentStrategyFactory.getStrategy(currentDebt.repaymentType);
  const newStrategy = RepaymentStrategyFactory.getStrategy(currentDebt.repaymentType);

  // ============================================
  // 2. Big 타입 변환 (안전하게 변환된 값 사용)
  // ============================================
  const principal = Big(safePrincipal);
  const currentRate = Big(safeCurrentRate);
  
  // 신규 금리 계산 시에도 안전하게 변환
  let newRate = Big(safeBaseRate).plus(safeAdditionalRate);
  
  if (hasSalaryTransfer) {
    newRate = newRate.minus(safeSalaryDiscount);
  }
  newRate = newRate.minus(safeUserDiscount);
  
  if (newRate.lt(0)) newRate = Big(0);

  // ============================================
  // 3~5. 이자 및 비용 계산
  // ============================================
  const currentTotalInterest = currentStrategy.calculateTotalInterest(
    principal,
    currentRate,
    safeRemainingMonths
  );

  const newTotalInterest = newStrategy.calculateTotalInterest(
    principal,
    newRate,
    safeRemainingMonths
  );

  const earlyRepayFee = currentStrategy.calculateEarlyRepayFee(
    principal,
    Big(safeFeeRate),
    safeRemainingMonths,
    safeTotalMonths,
    safeWaiverMonths
  );
  
  const stampDuty = FinanceConfig.calculateStampDuty(principal);
  const totalRefinanceCost = earlyRepayFee.plus(stampDuty);

  // ============================================
  // 6~7. 이득 및 월 상환액 계산
  // ============================================
  const interestSavings = currentTotalInterest.minus(newTotalInterest);
  const netSavings = interestSavings.minus(totalRefinanceCost);

  const currentMonthlyPayment = currentStrategy.calculateMonthlyPayment(
    principal,
    currentRate,
    safeRemainingMonths
  );
  const newMonthlyPayment = newStrategy.calculateMonthlyPayment(
    principal,
    newRate,
    safeRemainingMonths
  );
  const monthlySavings = currentMonthlyPayment.minus(newMonthlyPayment);

  // ============================================
  // 8. 손익분기점 (BEP) 계산 (0으로 나누기 방지)
  // ============================================
  let breakEvenMonths = -1;
  if (monthlySavings.gt(0)) {
    const bepMonths = totalRefinanceCost.div(monthlySavings);
    breakEvenMonths = Math.ceil(bepMonths.toNumber());
  }

  // ============================================
  // 9. 추천 액션 결정
  // ============================================
  let recommendedAction: '즉시_대환' | '수수료_면제_대기' | '현재_유지';
  
  const elapsedMonths = safeTotalMonths - safeRemainingMonths;
  const monthsUntilWaiver = safeWaiverMonths - elapsedMonths;
  
  if (netSavings.gt(0) && breakEvenMonths > 0 && breakEvenMonths <= safeRemainingMonths) {
    recommendedAction = '즉시_대환';
  } else if (earlyRepayFee.gt(0) && monthsUntilWaiver > 0 && monthsUntilWaiver <= 3) {
    recommendedAction = '수수료_면제_대기';
  } else {
    recommendedAction = '현재_유지';
  }

  // ============================================
  // 10. 결과 반환 (최종적으로 number로 변환)
  // ============================================
  return {
    totalDebtBefore: principal.plus(currentTotalInterest).toNumber(),
    monthlyPaymentBefore: currentMonthlyPayment.toNumber(),
    totalDebtAfter: principal.plus(newTotalInterest).plus(totalRefinanceCost).toNumber(),
    monthlyPaymentAfter: newMonthlyPayment.toNumber(),
    earlyRepayFee: earlyRepayFee.toNumber(),
    stampDuty: stampDuty.toNumber(),
    totalRefinanceCost: totalRefinanceCost.toNumber(),
    interestSavings: interestSavings.toNumber(),
    netSavings: netSavings.toNumber(),
    monthlySavings: monthlySavings.toNumber(),
    breakEvenMonths,
    recommendedAction,
    currentRate: currentRate.toNumber(),
    newRate: newRate.toNumber(),
    recommendedProduct: {
      bankName: newLoan.bankName,
      productName: newLoan.productName,
      rate: newRate.toNumber(),
    },
  };
}

/**
 * 여러 대출 상품과 비교하여 최적의 상품 선택
 * 
 * @param currentDebt - 현재 대출 정보
 * @param loanProducts - 비교할 대출 상품 배열
 * @param hasSalaryTransfer - 급여이체 여부
 * @returns 최적 시뮬레이션 결과 (순이익 기준)
 */
export function findBestRefinancingOption(
  currentDebt: CurrentDebtInfo,
  loanProducts: NewLoanProduct[],
  hasSalaryTransfer: boolean
): SimulationResult | null {
  
  if (loanProducts.length === 0) {
    return null;
  }
  
  let bestResult: SimulationResult | null = null;
  let maxSavings = Big(-Infinity);
  
  for (const product of loanProducts) {
    const result = simulateRefinancing(currentDebt, product, hasSalaryTransfer);
    const savings = Big(result.netSavings);
    
    if (savings.gt(maxSavings)) {
      maxSavings = savings;
      bestResult = result;
    }
  }
  
  return bestResult;
}
