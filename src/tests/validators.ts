/**
 * 테스트 결과 검증 로직
 */

import { TestCase } from './test-cases';
import Big from 'big.js';

export interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  actualResults: any;
  expectedResults: any;
  executionTime: number;
}

/**
 * 테스트 결과 검증
 */
export function validateTestResult(
  testCase: TestCase,
  actualResult: any,
  executionTime: number
): TestResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { expectedResults } = testCase;

  // ============================================
  // 1. 성공/실패 여부 검증
  // ============================================
  if (expectedResults.shouldSucceed) {
    if (!actualResult.success) {
      errors.push(`❌ 테스트가 실패했어야 하지 않는데 실패함: ${actualResult.error}`);
    }
  } else {
    if (actualResult.success) {
      errors.push(`❌ 테스트가 성공했어야 하지 않는데 성공함`);
    }
    if (expectedResults.errorMessage && !actualResult.error?.includes(expectedResults.errorMessage)) {
      errors.push(`❌ 예상 에러 메시지와 다름. 예상: "${expectedResults.errorMessage}", 실제: "${actualResult.error}"`);
    }
  }

  // 이하 검증은 성공한 경우에만
  if (!actualResult.success) {
    return {
      testId: testCase.id,
      testName: testCase.name,
      passed: errors.length === 0,
      errors,
      warnings,
      actualResults: actualResult,
      expectedResults,
      executionTime,
    };
  }

  // ============================================
  // 2. 최적 전략 검증
  // ============================================
  if (expectedResults.bestStrategy) {
    if (actualResult.bestStrategy !== expectedResults.bestStrategy) {
      errors.push(
        `❌ 최적 전략 불일치. 예상: "${expectedResults.bestStrategy}", 실제: "${actualResult.bestStrategy}"`
      );
    }
  }

  // ============================================
  // 3. 전략 개수 검증
  // ============================================
  if (expectedResults.strategyCount !== undefined) {
    if (actualResult.strategies.length !== expectedResults.strategyCount) {
      errors.push(
        `❌ 전략 개수 불일치. 예상: ${expectedResults.strategyCount}개, 실제: ${actualResult.strategies.length}개`
      );
    }
  }

  // ============================================
  // 4. 순이익 범위 검증
  // ============================================
  const bestNetSavings = actualResult.strategies?.reduce(
    (max: number, s: any) => Math.max(max, s.netSavings),
    -Infinity
  );

  if (expectedResults.minNetSavings !== undefined) {
    if (bestNetSavings < expectedResults.minNetSavings) {
      errors.push(
        `❌ 순이익이 최소값보다 작음. 예상 최소: ${expectedResults.minNetSavings}원, 실제: ${bestNetSavings}원`
      );
    }
  }

  if (expectedResults.maxNetSavings !== undefined) {
    if (bestNetSavings > expectedResults.maxNetSavings) {
      errors.push(
        `❌ 순이익이 최대값보다 큼. 예상 최대: ${expectedResults.maxNetSavings}원, 실제: ${bestNetSavings}원`
      );
    }
  }

  // ============================================
  // 5. 인지세 검증
  // ============================================
  if (expectedResults.stampDuty !== undefined) {
    const immediateStrategy = actualResult.strategies?.find(
      (s: any) => s.strategyType === '즉시_대환'
    );
    if (immediateStrategy) {
      const actualStampDuty = immediateStrategy.refinanceCost; // 인지세 + 중도상환 수수료
      
      // 중도상환 수수료 계산
      const earlyFee = calculateEarlyRepayFee(testCase.currentDebt);
      const actualStampDutyOnly = actualStampDuty - earlyFee;

      const tolerance = 1; // 1원 오차 허용
      if (Math.abs(actualStampDutyOnly - expectedResults.stampDuty) > tolerance) {
        errors.push(
          `❌ 인지세 불일치. 예상: ${expectedResults.stampDuty}원, 실제: ${actualStampDutyOnly}원`
        );
      }
    }
  }

  // ============================================
  // 6. 중도상환 수수료 검증
  // ============================================
  if (expectedResults.earlyRepayFee !== undefined) {
    const calculatedFee = calculateEarlyRepayFee(testCase.currentDebt);
    const tolerance = 1; // 1원 오차 허용

    if (Math.abs(calculatedFee - expectedResults.earlyRepayFee) > tolerance) {
      errors.push(
        `❌ 중도상환 수수료 불일치. 예상: ${expectedResults.earlyRepayFee}원, 실제: ${calculatedFee}원`
      );
    }
  }

  // ============================================
  // 7. 손익분기점 검증
  // ============================================
  if (expectedResults.breakEvenMonths !== undefined) {
    const immediateStrategy = actualResult.strategies?.find(
      (s: any) => s.strategyType === '즉시_대환'
    );
    if (immediateStrategy) {
      if (immediateStrategy.breakEvenMonths !== expectedResults.breakEvenMonths) {
        warnings.push(
          `⚠️ 손익분기점 불일치. 예상: ${expectedResults.breakEvenMonths}개월, 실제: ${immediateStrategy.breakEvenMonths}개월`
        );
      }
    }
  }

  return {
    testId: testCase.id,
    testName: testCase.name,
    passed: errors.length === 0,
    errors,
    warnings,
    actualResults: actualResult,
    expectedResults,
    executionTime,
  };
}

/**
 * 중도상환 수수료 계산 (검증용)
 */
function calculateEarlyRepayFee(debt: any): number {
  const elapsedMonths = debt.totalMonths - debt.remainingMonths;
  
  if (elapsedMonths >= debt.feeWaiverMonths) {
    return 0;
  }

  const baseFee = debt.principal * (debt.earlyRepayFeeRate / 100);
  const timeRatio = debt.remainingMonths / debt.totalMonths;
  const adjustedFee = baseFee * timeRatio;

  return Math.round(adjustedFee);
}