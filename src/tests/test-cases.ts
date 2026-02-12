/**
 * 테스트 케이스 정의
 * 
 * 각 케이스는 특정 엣지 케이스나 비즈니스 로직을 검증합니다.
 */

import { CurrentDebtInfo, NewLoanProduct } from '../lib/services/simulation-service';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'edge_case' | 'business_logic' | 'formula_validation' | 'boundary_test';
  currentDebt: CurrentDebtInfo;
  loanProducts: NewLoanProduct[];
  hasSalaryTransfer: boolean;
  expectedResults: {
    shouldSucceed: boolean;
    bestStrategy?: '현재_유지' | '즉시_대환' | '수수료_면제_대기';
    strategyCount?: number; // 생성되어야 할 전략 수
    minNetSavings?: number;
    maxNetSavings?: number;
    breakEvenMonths?: number | null;
    stampDuty?: number;
    earlyRepayFee?: number;
    errorMessage?: string;
  };
}

export const testCases: TestCase[] = [
  // ============================================
  // 1. 엣지 케이스: 잔여 기간 < 수수료 면제까지 남은 기간
  // ============================================
  {
    id: 'EDGE_001',
    name: '잔여 기간이 수수료 면제 기간보다 짧음',
    description: '대출 잔여 10개월, 수수료 면제까지 24개월 → 면제 대기 전략 불가능',
    category: 'edge_case',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 10,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      strategyCount: 2, // 현재_유지, 즉시_대환만 (수수료_면제_대기 제외)
    },
  },

  // ============================================
  // 2. 경계값 테스트: 인지세 5천만원 경계
  // ============================================
  {
    id: 'BOUNDARY_001',
    name: '인지세 5천만원 경계 (정확히 5천만원)',
    description: '대출 금액이 정확히 5천만원 → 인지세 0원',
    category: 'boundary_test',
    currentDebt: {
      principal: 50000000, // 정확히 5천만원
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      stampDuty: 0, // 5천만원 이하 → 인지세 0원
    },
  },

  {
    id: 'BOUNDARY_002',
    name: '인지세 5천만원 경계 (5천만 1원)',
    description: '대출 금액이 5천만 1원 → 인지세 70,000원',
    category: 'boundary_test',
    currentDebt: {
      principal: 50000001, // 5천만 1원
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      stampDuty: 70000, // 5천만원 초과 ~ 1억 이하 → 7만원
    },
  },

  {
    id: 'BOUNDARY_003',
    name: '인지세 1억원 경계',
    description: '대출 금액이 1억원 → 인지세 70,000원',
    category: 'boundary_test',
    currentDebt: {
      principal: 100000000,
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      stampDuty: 70000, // 1억 이하 → 7만원
    },
  },

  {
    id: 'BOUNDARY_004',
    name: '인지세 1억 1원 경계',
    description: '대출 금액이 1억 1원 → 인지세 150,000원',
    category: 'boundary_test',
    currentDebt: {
      principal: 100000001,
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      stampDuty: 150000, // 1억 초과 ~ 10억 이하 → 15만원
    },
  },

  // ============================================
  // 3. 비즈니스 로직: 금리 역전 (신규 > 기존)
  // ============================================
  {
    id: 'BUSINESS_001',
    name: '금리 역전 현상 (신규 금리가 더 높음)',
    description: '현재 3% → 신규 5.2% → 모든 전략이 "현재_유지"로 수렴',
    category: 'business_logic',
    currentDebt: {
      principal: 50000000,
      interestRate: 3.0, // 낮은 금리
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: '신한',
        productName: '신한고금리대출',
        baseRate: 4.5, // 높은 금리
        additionalRate: 1.0,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '현재_유지',
      maxNetSavings: 0, // 손해이므로 0 이하
    },
  },

  // ============================================
  // 4. 수식 검증: 중도상환 수수료
  // ============================================
  {
    id: 'FORMULA_001',
    name: '중도상환 수수료 계산 검증',
    description: '5천만원 × 1.5% × (36개월 / 60개월) = 450,000원',
    category: 'formula_validation',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      earlyRepayFee: 450000, // 50,000,000 × 0.015 × (36/60)
    },
  },

  {
    id: 'FORMULA_002',
    name: '수수료 면제 기간 경과 시 수수료 0원',
    description: '경과 개월(36개월) >= 면제 기간(36개월) → 수수료 0원',
    category: 'formula_validation',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 24, // 60 - 24 = 36개월 경과
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      earlyRepayFee: 0, // 면제 기간 경과
    },
  },

  // ============================================
  // 5. 정상 케이스: 즉시 대환 유리
  // ============================================
  {
    id: 'NORMAL_001',
    name: '정상 케이스: 즉시 대환이 유리한 경우',
    description: '현재 5.5% → 신규 4.9% → 이자 절감',
    category: 'business_logic',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.7,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '즉시_대환',
      minNetSavings: 0, // 양수여야 함
    },
  },

  // ============================================
  // 6. 정상 케이스: 수수료 면제 대기가 최적
  // ============================================
  {
    id: 'NORMAL_002',
    name: '정상 케이스: 수수료 면제 대기가 최적',
    description: '면제까지 2개월 → 대기 후 대환이 유리',
    category: 'business_logic',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 26, // 60 - 26 = 34개월 경과, 면제까지 2개월
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '수수료_면제_대기',
      strategyCount: 3, // 3전략 모두 생성
    },
  },

  // ============================================
  // 7. 엣지 케이스: 무이자 대출
  // ============================================
  {
    id: 'EDGE_002',
    name: '무이자 대출 (0% 금리)',
    description: '현재 2% → 신규 0% (무이자 특별 대출)',
    category: 'edge_case',
    currentDebt: {
      principal: 10000000,
      interestRate: 2.0,
      remainingMonths: 12,
      totalMonths: 24,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: '특별',
        productName: '무이자특별대출',
        baseRate: 0.0,
        additionalRate: 0.0,
        salaryTransferDiscount: 0.0,
        userOtherDiscount: 0.0,
      },
    ],
    hasSalaryTransfer: false,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '즉시_대환', // 무이자이므로 무조건 유리
    },
  },

  // ============================================
  // 8. 엣지 케이스: 잔여 기간 1개월
  // ============================================
  {
    id: 'EDGE_003',
    name: '잔여 기간이 매우 짧음 (1개월)',
    description: '잔여 1개월 → 대환 비용이 이득보다 큼 → 현재 유지',
    category: 'edge_case',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 1,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '현재_유지', // 1개월 남았으면 대환 의미 없음
    },
  },

  // ============================================
  // 9. 원금균등 vs 원리금균등 비교
  // ============================================
  {
    id: 'NORMAL_003',
    name: '원금균등 상환 방식',
    description: '원금균등은 총 이자가 원리금균등보다 적음',
    category: 'business_logic',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원금균등', // 원금균등
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
    },
  },
  // ============================================
  // 10. 엣지 케이스: 잔여 기간 0개월 (상환 완료)
  // ============================================
  {
    id: 'EDGE_004',
    name: '잔여 기간이 0개월 (이미 상환 완료)',
    description: '잔여 0개월 → 대환 불가능, 에러 발생',
    category: 'edge_case',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 0, // ❌ 0개월
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: false,
      errorMessage: '잔여 상환 기간은 1개월 이상이어야 합니다',
    },
  },

  // ============================================
  // 11. 엣지 케이스: 중도상환 수수료가 비정상적으로 높음
  // ============================================
  {
    id: 'EDGE_005',
    name: '중도상환 수수료율이 매우 높음 (10%)',
    description: '수수료율 10% → 대환 비용이 너무 커서 현재 유지가 최적',
    category: 'edge_case',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 10.0, // ❌ 10% (비정상적으로 높음)
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '현재_유지', // 수수료가 너무 비싸서 대환 불리
    },
  },

  // ============================================
  // 12. 비즈니스 로직: 신규 금리가 현재 금리보다 높음 (재검증)
  // ============================================
  {
    id: 'BUSINESS_002',
    name: '신규 금리가 현재보다 훨씬 높음 (역전 극단)',
    description: '현재 2% → 신규 8% → 절대 대환 불리',
    category: 'business_logic',
    currentDebt: {
      principal: 50000000,
      interestRate: 2.0, // 매우 낮은 금리
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: '고금리은행',
        productName: '고금리대출',
        baseRate: 7.0,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '현재_유지',
      maxNetSavings: 0, // 손해
    },
  },

  // ============================================
  // 13. 엣지 케이스: 원금이 매우 적음 (100만원)
  // ============================================
  {
    id: 'EDGE_006',
    name: '원금이 매우 적음 (100만원)',
    description: '원금 100만원 → 인지세 0원, 대환 효과 미미',
    category: 'edge_case',
    currentDebt: {
      principal: 1000000, // 100만원
      interestRate: 5.5,
      remainingMonths: 12,
      totalMonths: 24,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      stampDuty: 0, // 5천만원 이하 → 인지세 0원
    },
  },

  // ============================================
  // 14. 엣지 케이스: 원금이 매우 큼 (3억원)
  // ============================================
  {
    id: 'EDGE_007',
    name: '원금이 매우 큼 (3억원)',
    description: '원금 3억원 → 인지세 150,000원',
    category: 'edge_case',
    currentDebt: {
      principal: 300000000, // 3억원
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      stampDuty: 150000, // 1억 초과 ~ 10억 이하 → 15만원
    },
  },

  // ============================================
  // 15. 엣지 케이스: 수수료 면제 기간이 이미 경과
  // ============================================
  {
    id: 'EDGE_008',
    name: '수수료 면제 기간 이미 경과',
    description: '경과 40개월, 면제 기간 36개월 → 수수료 0원',
    category: 'edge_case',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 20, // 60 - 20 = 40개월 경과
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36, // 면제 기간 이미 경과
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 3.5,
        additionalRate: 1.5,
        salaryTransferDiscount: 0.3,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      earlyRepayFee: 0, // 면제 기간 경과 → 수수료 0원
      strategyCount: 2, // 수수료_면제_대기 전략 없음 (이미 면제됨)
    },
  },

  // ============================================
  // 16. 비즈니스 로직: 손익분기점이 잔여 기간을 초과
  // ============================================
  {
    id: 'BUSINESS_003',
    name: '손익분기점이 잔여 기간보다 긺',
    description: 'BEP 50개월 > 잔여 36개월 → 현재 유지 추천',
    category: 'business_logic',
    currentDebt: {
      principal: 50000000,
      interestRate: 5.5,
      remainingMonths: 36,
      totalMonths: 60,
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 5.0, // 높은 수수료율 → BEP 증가
      feeWaiverMonths: 36,
    },
    loanProducts: [
      {
        bankName: 'KB',
        productName: 'KB신용대출',
        baseRate: 5.0, // 금리 차이가 적음 → BEP 증가
        additionalRate: 0.5,
        salaryTransferDiscount: 0.1,
        userOtherDiscount: 0,
      },
    ],
    hasSalaryTransfer: true,
    expectedResults: {
      shouldSucceed: true,
      bestStrategy: '현재_유지', // BEP가 너무 길어서 불리
    },
  },
];