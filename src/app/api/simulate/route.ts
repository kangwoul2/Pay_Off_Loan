import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findBestRefinancingOption, CurrentDebtInfo } from '@/lib/services/simulation-service';
import { FinanceConfig } from '@/lib/config/finance-config';
import Big from 'big.js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { currentDebts, hasSalaryTransfer } = await request.json();

    const { data: dbProducts } = await supabase.from('loan_products').select('*');
    const formattedProducts = dbProducts?.map(p => ({
      bankName: p.bank_name,
      productName: p.product_name,
      baseRate: Number(p.base_rate),
      additionalRate: Number(p.additional_rate),
      salaryTransferDiscount: Number(p.salary_discount),
      userOtherDiscount: 0,
    })) || [];

    const results = currentDebts.map((debt: any) => {
      const bestOption = findBestRefinancingOption(debt, formattedProducts, hasSalaryTransfer);
      
      // --- 인지세 및 실질 비용 계산 추가 ---
      const stampDuty = FinanceConfig.calculateStampDuty(debt.principal).div(2).toNumber(); // 고객 50% 부담
      const initialCost = bestOption.earlyRepayFee + stampDuty;
      
      // 차트용 시계열 데이터 생성 (전체 잔여 기간 시뮬레이션)
      const chartData = [];
      let cumulativeCurrent = 0;
      let cumulativeNew = initialCost; // 대환은 초기 비용(수수료+인지세)에서 시작
      
      const months = debt.remainingMonths;
      const currentMonthly = bestOption.currentTotalInterest / months;
      const newMonthly = bestOption.newTotalInterest / months;

      for (let m = 1; m <= months; m++) {
        cumulativeCurrent += currentMonthly;
        cumulativeNew += newMonthly;
        // 차트 가독성을 위해 12개월 단위 혹은 주요 지점만 추출 가능
        chartData.push({
          month: `${m}개월`,
          기존유지: Math.floor(cumulativeCurrent),
          전략실행: Math.floor(cumulativeNew),
        });
      }

      return {
        loanName: debt.name || '보유 대출',
        ...bestOption,
        stampDuty,
        totalInitialCost: initialCost,
        chartData // 이제 프론트에서 이 데이터를 바로 사용합니다.
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: '분석 중 오류 발생' }, { status: 500 });
  }
}