import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  findBestRefinancingOption, 
  CurrentDebtInfo 
} from '@/lib/services/simulation-service';

export async function POST(request: NextRequest) {
  try {
    // 1. 환경 변수 확인 (안전장치)
    console.log('URL 존재여부:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('KEY 존재여부:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ 
      success: false, 
      error: '서버 설정 오류: 환경 변수를 찾을 수 없습니다.' 
    }, { status: 500 });
  }


    // 2. 함수 내부에서 클라이언트 생성 (로드 시점 문제 해결)
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { currentDebts, hasSalaryTransfer } = body;

    // DB에서 상품 정보 가져오기
    const { data: dbProducts, error } = await supabase
      .from('loan_products')
      .select('*');

    if (error) {
      console.error('DB Fetch Error:', error);
      return NextResponse.json({ success: false, error: 'DB 조회 실패' }, { status: 500 });
    }

    // 엔진 규격에 맞게 매핑
    const formattedProducts = dbProducts.map(p => ({
      bankName: p.bank_name,
      productName: p.product_name,
      baseRate: Number(p.base_rate),
      additionalRate: Number(p.additional_rate),
      salaryTransferDiscount: Number(p.salary_discount),
      userOtherDiscount: 0,
    }));

    // 최적 상품 분석
    const results = currentDebts.map((debt: CurrentDebtInfo) => {
      const bestOption = findBestRefinancingOption(
        debt, 
        formattedProducts, 
        hasSalaryTransfer
      );

      return {
        loanName: (debt as any).name || '보유 대출',
        ...bestOption
      };
    });

    return NextResponse.json({ success: true, data: results });

  } catch (error) {
    console.error('Simulation API Error:', error);
    return NextResponse.json({ success: false, error: '분석 중 오류 발생' }, { status: 500 });
  }
}