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
  // 0. 입력값 사전 검증 (엣지 케이스 방어)
  // ============================================
  
  // 잔여 기간 검증
  if (currentDebt.remainingMonths <= 0) {
    throw new Error('잔여 상환 기간은 1개월 이상이어야 합니다.');
  }
  
  // 잔여 기간 > 전체 기간 검증
  if (currentDebt.remainingMonths > currentDebt.totalMonths) {
    throw new Error('잔여 기간이 전체 기간보다 클 수 없습니다.');
  }
  
  // 대출 원금 검증
  if (currentDebt.principal <= 0) {
    throw new Error('대출 원금은 0원보다 커야 합니다.');
  }
  
  // ============================================
  // 1. 전략 선택
  // ============================================
  const currentStrategy = RepaymentStrategyFactory.getStrategy(currentDebt.repaymentType);
  const newStrategy = RepaymentStrategyFactory.getStrategy(currentDebt.repaymentType);

  // ============================================
  // 2. Big 타입 변환 (정밀 계산을 위해)
  // ============================================
  const principal = Big(currentDebt.principal);
  const currentRate = Big(currentDebt.interestRate);
  
  // 신규 대출 금리 계산: 기본금리 + 가산금리 - 우대금리
  let newRate = Big(newLoan.baseRate).plus(newLoan.additionalRate);
  
  // 급여이체 우대 적용
  if (hasSalaryTransfer) {
    newRate = newRate.minus(newLoan.salaryTransferDiscount);
  }
  
  // 기타 우대금리 적용
  newRate = newRate.minus(newLoan.userOtherDiscount);
  
  // 금리는 0% 이상이어야 함
  if (newRate.lt(0)) {
    newRate = Big(0);
  }

  // ============================================
  // 3. 현재 대출 잔여 이자 계산
  // ============================================
  const currentTotalInterest = currentStrategy.calculateTotalInterest(
    principal,
    currentRate,
    currentDebt.remainingMonths
  );

  // ============================================
  // 4. 신규 대출 예상 이자 계산
  // ============================================
  const newTotalInterest = newStrategy.calculateTotalInterest(
    principal,
    newRate,
    currentDebt.remainingMonths
  );

  // ============================================
  // 5. 대환 실행 비용 계산
  // ============================================
  
  // 5-1. 중도상환 수수료
  const earlyRepayFee = currentStrategy.calculateEarlyRepayFee(
    principal,
    Big(currentDebt.earlyRepayFeeRate),
    currentDebt.remainingMonths,
    currentDebt.totalMonths,
    currentDebt.feeWaiverMonths
  );
  
  // 5-2. 인지세
  const stampDuty = FinanceConfig.calculateStampDuty(principal);
  
  // 5-3. 총 대환 비용
  const totalRefinanceCost = earlyRepayFee.plus(stampDuty);

  // ============================================
  // 6. 순이익 계산
  // ============================================
  const interestSavings = currentTotalInterest.minus(newTotalInterest);
  const netSavings = interestSavings.minus(totalRefinanceCost);

  // ============================================
  // 7. 월별 이자 절감액
  // ============================================
  const currentMonthlyPayment = currentStrategy.calculateMonthlyPayment(
    principal,
    currentRate,
    currentDebt.remainingMonths
  );
  const newMonthlyPayment = newStrategy.calculateMonthlyPayment(
    principal,
    newRate,
    currentDebt.remainingMonths
  );
  const monthlySavings = currentMonthlyPayment.minus(newMonthlyPayment);

  // ============================================
  // 8. 손익분기점 (BEP) 계산
  // 
  // 금융적 근거:
  // 손익분기점 = 대환 비용을 월별 절감액으로 회수하는 데 걸리는 시간
  // 
  // 계산:
  // BEP(개월) = 총 대환 비용 / 월별 절감액
  // 
  // 의미:
  // - BEP가 짧을수록 빨리 이득을 볼 수 있음
  // - BEP가 잔여 기간보다 길면 손해
  // ============================================
  let breakEvenMonths = -1;
  
  if (monthlySavings.gt(0)) {
    const bepMonths = totalRefinanceCost.div(monthlySavings);
    breakEvenMonths = Math.ceil(bepMonths.toNumber());
  }

  // ============================================
  // 9. 추천 액션 결정
  // 
  // 결정 로직:
  // 1. 순이익 > 0 && BEP가 잔여 기간 내 → "즉시_대환"
  // 2. 중도상환 수수료 > 0 && 수수료 면제까지 3개월 이하 → "수수료_면제_대기"
  // 3. 그 외 → "현재_유지"
  // ============================================
  let recommendedAction: '즉시_대환' | '수수료_면제_대기' | '현재_유지';
  
  const elapsedMonths = currentDebt.totalMonths - currentDebt.remainingMonths;
  const monthsUntilWaiver = currentDebt.feeWaiverMonths - elapsedMonths;
  
  if (netSavings.gt(0) && breakEvenMonths > 0 && breakEvenMonths <= currentDebt.remainingMonths) {
    recommendedAction = '즉시_대환';
  } else if (earlyRepayFee.gt(0) && monthsUntilWaiver > 0 && monthsUntilWaiver <= 3) {
    recommendedAction = '수수료_면제_대기';
  } else {
    recommendedAction = '현재_유지';
  }

  // ============================================
  // 10. 결과 반환
  // ============================================
  return {
    // 전략 실행 전
    totalDebtBefore: principal.plus(currentTotalInterest).toNumber(),
    monthlyPaymentBefore: currentMonthlyPayment.toNumber(),
    
    // 전략 실행 후
    totalDebtAfter: principal.plus(newTotalInterest).plus(totalRefinanceCost).toNumber(),
    monthlyPaymentAfter: newMonthlyPayment.toNumber(),
    
    // 비용 분석
    earlyRepayFee: earlyRepayFee.toNumber(),
    stampDuty: stampDuty.toNumber(),
    totalRefinanceCost: totalRefinanceCost.toNumber(),
    
    // 이득 분석
    interestSavings: interestSavings.toNumber(),
    netSavings: netSavings.toNumber(),
    monthlySavings: monthlySavings.toNumber(),
    
    // 손익분기점
    breakEvenMonths,
    
    // 추천
    recommendedAction,
    
    // 금리 정보
    currentRate: currentRate.toNumber(),
    newRate: newRate.toNumber(),
    
    // 신규 상품 정보
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
