/**
 * 시뮬레이션 테스트 예제
 * 
 * @description
 * 다양한 시나리오에 대한 시뮬레이션 결과를 테스트합니다.
 * 실제 프로덕션 환경에서는 Jest 등의 테스트 프레임워크를 사용하세요.
 */

import Big from 'big.js';
import {
  simulateRefinancing,
  findBestRefinancingOption,
  CurrentDebtInfo,
  NewLoanProduct,
} from '../services/simulation-service';
import { RepaymentStrategyFactory } from '../strategies/repayment-strategy';

// Big.js 설정
Big.DP = 4;
Big.RM = Big.roundHalfUp;

/**
 * 테스트 시나리오 1: 일반적인 대환대출 (즉시 이득)
 */
export function testScenario1_NormalRefinancing() {
  console.log('\n=== 테스트 시나리오 1: 일반적인 대환대출 ===\n');
  
  const currentDebt: CurrentDebtInfo = {
    principal: 50000000,          // 5천만원
    interestRate: 5.5,            // 연 5.5%
    remainingMonths: 36,          // 3년 남음
    totalMonths: 60,              // 전체 5년
    repaymentType: '원리금균등',
    earlyRepayFeeRate: 1.5,       // 중도상환 수수료 1.5%
    feeWaiverMonths: 36,          // 3년 후 면제
  };
  
  const newLoan: NewLoanProduct = {
    bankName: 'KB',
    productName: 'KB직장인신용대출',
    baseRate: 3.5,
    additionalRate: 1.7,
    salaryTransferDiscount: 0.3,
    userOtherDiscount: 0.0,
  };
  
  const result = simulateRefinancing(currentDebt, newLoan, true);
  
  console.log('현재 대출:', {
    금리: `${result.currentRate}%`,
    월상환액: `${result.monthlyPaymentBefore.toLocaleString()}원`,
    총상환액: `${result.totalDebtBefore.toLocaleString()}원`,
  });
  
  console.log('\n신규 대출:', {
    은행: result.recommendedProduct.bankName,
    상품: result.recommendedProduct.productName,
    금리: `${result.newRate}%`,
    월상환액: `${result.monthlyPaymentAfter.toLocaleString()}원`,
    총상환액: `${result.totalDebtAfter.toLocaleString()}원`,
  });
  
  console.log('\n비용 분석:', {
    중도상환수수료: `${result.earlyRepayFee.toLocaleString()}원`,
    인지세: `${result.stampDuty.toLocaleString()}원`,
    총대환비용: `${result.totalRefinanceCost.toLocaleString()}원`,
  });
  
  console.log('\n이득 분석:', {
    이자절감액: `${result.interestSavings.toLocaleString()}원`,
    순이익: `${result.netSavings.toLocaleString()}원`,
    월별절감액: `${result.monthlySavings.toLocaleString()}원`,
    손익분기점: `${result.breakEvenMonths}개월`,
  });
  
  console.log('\n추천 액션:', result.recommendedAction);
  
  return result;
}

/**
 * 테스트 시나리오 2: 손해 보는 경우 (금리 상승)
 */
export function testScenario2_HigherRate() {
  console.log('\n=== 테스트 시나리오 2: 금리가 더 높은 경우 ===\n');
  
  const currentDebt: CurrentDebtInfo = {
    principal: 30000000,
    interestRate: 3.0,            // 현재 3% (낮음)
    remainingMonths: 24,
    totalMonths: 36,
    repaymentType: '원리금균등',
    earlyRepayFeeRate: 1.5,
    feeWaiverMonths: 36,
  };
  
  const newLoan: NewLoanProduct = {
    bankName: '신한',
    productName: '신한 신용대출',
    baseRate: 4.5,                // 신규 금리가 더 높음
    additionalRate: 1.0,
    salaryTransferDiscount: 0.3,
    userOtherDiscount: 0.0,
  };
  
  const result = simulateRefinancing(currentDebt, newLoan, true);
  
  console.log('순이익:', `${result.netSavings.toLocaleString()}원`);
  console.log('추천 액션:', result.recommendedAction);
  console.log('=> 예상: "현재_유지" (손해이므로)\n');
  
  return result;
}

/**
 * 테스트 시나리오 3: 수수료 면제 대기 권장
 */
export function testScenario3_WaitForWaiver() {
  console.log('\n=== 테스트 시나리오 3: 수수료 면제 대기 ===\n');
  
  const currentDebt: CurrentDebtInfo = {
    principal: 40000000,
    interestRate: 5.0,
    remainingMonths: 24,
    totalMonths: 36,              // 3년 대출
    repaymentType: '원리금균등',
    earlyRepayFeeRate: 2.0,       // 높은 수수료
    feeWaiverMonths: 36,
  };
  
  // 경과 시간: 36 - 24 = 12개월
  // 면제까지: 36 - 12 = 24개월 남음 (3개월 초과이므로 즉시 대환 권장될 수 있음)
  
  const newLoan: NewLoanProduct = {
    bankName: '하나',
    productName: '하나 직장인대출',
    baseRate: 3.0,
    additionalRate: 1.0,
    salaryTransferDiscount: 0.3,
    userOtherDiscount: 0.0,
  };
  
  const result = simulateRefinancing(currentDebt, newLoan, true);
  
  console.log('중도상환 수수료:', `${result.earlyRepayFee.toLocaleString()}원`);
  console.log('순이익:', `${result.netSavings.toLocaleString()}원`);
  console.log('손익분기점:', `${result.breakEvenMonths}개월`);
  console.log('추천 액션:', result.recommendedAction);
  
  return result;
}

/**
 * 테스트 시나리오 4: 여러 상품 중 최적 선택
 */
export function testScenario4_FindBestOption() {
  console.log('\n=== 테스트 시나리오 4: 최적 상품 찾기 ===\n');
  
  const currentDebt: CurrentDebtInfo = {
    principal: 60000000,
    interestRate: 6.0,
    remainingMonths: 48,
    totalMonths: 60,
    repaymentType: '원리금균등',
    earlyRepayFeeRate: 1.5,
    feeWaiverMonths: 36,
  };
  
  const products: NewLoanProduct[] = [
    {
      bankName: 'KB',
      productName: 'KB직장인대출',
      baseRate: 3.5,
      additionalRate: 1.5,
      salaryTransferDiscount: 0.3,
      userOtherDiscount: 0.0,
    },
    {
      bankName: '신한',
      productName: '신한 저금리대출',
      baseRate: 3.2,
      additionalRate: 1.8,
      salaryTransferDiscount: 0.3,
      userOtherDiscount: 0.0,
    },
    {
      bankName: '하나',
      productName: '하나 우대대출',
      baseRate: 3.8,
      additionalRate: 1.2,
      salaryTransferDiscount: 0.4,
      userOtherDiscount: 0.0,
    },
  ];
  
  const bestResult = findBestRefinancingOption(currentDebt, products, true);
  
  if (bestResult) {
    console.log('최적 상품:', {
      은행: bestResult.recommendedProduct.bankName,
      상품: bestResult.recommendedProduct.productName,
      금리: `${bestResult.newRate}%`,
    });
    console.log('순이익:', `${bestResult.netSavings.toLocaleString()}원`);
    console.log('월별 절감액:', `${bestResult.monthlySavings.toLocaleString()}원`);
  }
  
  return bestResult;
}

/**
 * 테스트 시나리오 5: 엣지 케이스 - 무이자 대출
 */
export function testScenario5_ZeroInterest() {
  console.log('\n=== 테스트 시나리오 5: 무이자 대출 ===\n');
  
  const currentDebt: CurrentDebtInfo = {
    principal: 10000000,
    interestRate: 2.0,            // 현재 2%
    remainingMonths: 12,
    totalMonths: 24,
    repaymentType: '원리금균등',
    earlyRepayFeeRate: 1.5,
    feeWaiverMonths: 36,
  };
  
  const newLoan: NewLoanProduct = {
    bankName: '특별',
    productName: '무이자 특별대출',
    baseRate: 0.0,                // 무이자
    additionalRate: 0.0,
    salaryTransferDiscount: 0.0,
    userOtherDiscount: 0.0,
  };
  
  try {
    const result = simulateRefinancing(currentDebt, newLoan, false);
    console.log('무이자 시뮬레이션 성공');
    console.log('순이익:', `${result.netSavings.toLocaleString()}원`);
    console.log('추천 액션:', result.recommendedAction);
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

/**
 * 테스트 시나리오 6: 원금균등 vs 원리금균등 비교
 */
export function testScenario6_CompareRepaymentTypes() {
  console.log('\n=== 테스트 시나리오 6: 상환 방식 비교 ===\n');
  
  const principal = Big(50000000);
  const annualRate = Big(5.0);
  const months = 36;
  
  // 원리금균등
  const equalPI = RepaymentStrategyFactory.getStrategy('원리금균등');
  const totalInterestPI = equalPI.calculateTotalInterest(principal, annualRate, months);
  const monthlyPaymentPI = equalPI.calculateMonthlyPayment(principal, annualRate, months);
  
  // 원금균등
  const equalP = RepaymentStrategyFactory.getStrategy('원금균등');
  const totalInterestP = equalP.calculateTotalInterest(principal, annualRate, months);
  const monthlyPaymentP = equalP.calculateMonthlyPayment(principal, annualRate, months);
  
  console.log('원리금균등:', {
    총이자: `${totalInterestPI.toNumber().toLocaleString()}원`,
    월상환액: `${monthlyPaymentPI.toNumber().toLocaleString()}원 (고정)`,
  });
  
  console.log('\n원금균등:', {
    총이자: `${totalInterestP.toNumber().toLocaleString()}원`,
    월상환액: `${monthlyPaymentP.toNumber().toLocaleString()}원 (첫 달)`,
  });
  
  const interestDiff = totalInterestPI.minus(totalInterestP);
  console.log('\n이자 차이:', `${interestDiff.toNumber().toLocaleString()}원`);
  console.log('=> 원금균등이 총 이자 부담 적음\n');
}

/**
 * 모든 테스트 실행
 */
export function runAllTests() {
  console.log('\n'.repeat(2));
  console.log('='.repeat(60));
  console.log('대환대출 시뮬레이터 - 테스트 시나리오');
  console.log('='.repeat(60));
  
  try {
    testScenario1_NormalRefinancing();
    testScenario2_HigherRate();
    testScenario3_WaitForWaiver();
    testScenario4_FindBestOption();
    testScenario5_ZeroInterest();
    testScenario6_CompareRepaymentTypes();
    
    console.log('\n'.repeat(2));
    console.log('='.repeat(60));
    console.log('모든 테스트 완료!');
    console.log('='.repeat(60));
    console.log('\n');
    
  } catch (error) {
    console.error('\n테스트 실행 중 오류:', error);
  }
}

// Node.js 환경에서 직접 실행 가능
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests();
}
