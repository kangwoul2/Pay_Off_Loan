/**
 * 대환대출 시뮬레이션 API 엔드포인트
 * 
 * POST /api/simulate
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  simulateRefinancing,
  findBestRefinancingOption,
  CurrentDebtInfo,
  NewLoanProduct,
  SimulationResult,
} from '@/lib/services/simulation-service';
import {
  validateSimulationInputs,
  ValidationError,
} from '@/lib/utils/validation';

/**
 * API 요청 바디 타입
 */
interface SimulateRequestBody {
  currentDebt: CurrentDebtInfo;
  loanProducts: NewLoanProduct[];
  hasSalaryTransfer: boolean;
  mode?: 'single' | 'best';  // single: 첫 번째 상품만, best: 최적 상품
}

/**
 * API 응답 타입
 */
interface SimulateResponse {
  success: boolean;
  data?: SimulationResult;
  error?: string;
  validationErrors?: string[];
}

/**
 * POST /api/simulate
 * 
 * @description
 * 대환대출 시뮬레이션을 실행합니다.
 * 
 * @example
 * ```json
 * {
 *   "currentDebt": {
 *     "principal": 50000000,
 *     "interestRate": 5.5,
 *     "remainingMonths": 36,
 *     "totalMonths": 60,
 *     "repaymentType": "원리금균등",
 *     "earlyRepayFeeRate": 1.5,
 *     "feeWaiverMonths": 36
 *   },
 *   "loanProducts": [
 *     {
 *       "bankName": "KB",
 *       "productName": "KB직장인신용대출",
 *       "baseRate": 3.5,
 *       "additionalRate": 1.7,
 *       "salaryTransferDiscount": 0.3,
 *       "userOtherDiscount": 0.0
 *     }
 *   ],
 *   "hasSalaryTransfer": true,
 *   "mode": "best"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱
    const body: SimulateRequestBody = await request.json();
    
    const {
      currentDebt,
      loanProducts,
      hasSalaryTransfer,
      mode = 'best',
    } = body;
    
    // 2. 입력값 검증
    try {
      validateSimulationInputs(currentDebt, loanProducts);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          } as SimulateResponse,
          { status: 400 }
        );
      }
      throw error;
    }
    
    // 3. 시뮬레이션 실행
    let result: SimulationResult | null = null;
    
    if (mode === 'single') {
      // 첫 번째 상품만 시뮬레이션
      result = simulateRefinancing(
        currentDebt,
        loanProducts[0],
        hasSalaryTransfer
      );
    } else {
      // 최적 상품 찾기
      result = findBestRefinancingOption(
        currentDebt,
        loanProducts,
        hasSalaryTransfer
      );
    }
    
    // 4. 결과 반환
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: '시뮬레이션 결과를 생성할 수 없습니다.',
        } as SimulateResponse,
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        data: result,
      } as SimulateResponse,
      { status: 200 }
    );
    
  } catch (error) {
    console.error('시뮬레이션 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      } as SimulateResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/simulate
 * 
 * API 사용 가이드 반환
 */
export async function GET() {
  return NextResponse.json({
    message: 'POST 메소드를 사용하여 시뮬레이션을 요청하세요.',
    endpoints: {
      POST: '/api/simulate',
    },
    example: {
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
          productName: 'KB직장인신용대출',
          baseRate: 3.5,
          additionalRate: 1.7,
          salaryTransferDiscount: 0.3,
          userOtherDiscount: 0.0,
        },
      ],
      hasSalaryTransfer: true,
      mode: 'best',
    },
  });
}
