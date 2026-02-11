import { NextRequest, NextResponse } from 'next/server';
import {
  findBestRefinancingOption,
  CurrentDebtInfo,
  NewLoanProduct,
} from '@/lib/services/simulation-service';

// 1. 요청 바디 타입 확장 (단일 -> 배열)
interface SimulateRequestBody {
  currentDebts: CurrentDebtInfo[]; // 다중 대출 대응
  loanProducts: NewLoanProduct[]; // DB에서 가져온 상품들 + 커스텀 상품
  hasSalaryTransfer: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SimulateRequestBody = await request.json();
    const { currentDebts, loanProducts, hasSalaryTransfer } = body;

    // 2. 결과 배열 생성 (Total Scan)
    const totalResults = currentDebts.map((debt) => {
      // 각 대출별로 가장 유리한 상품 매칭
      const bestOption = findBestRefinancingOption(
        debt,
        loanProducts,
        hasSalaryTransfer
      );
      
      return {
        loanName: (debt as any).name || '알 수 없는 대출',
        ...bestOption
      };
    });

    return NextResponse.json({
      success: true,
      data: totalResults, // 배열로 반환
    });

  } catch (error) {
    console.error('시뮬레이션 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}