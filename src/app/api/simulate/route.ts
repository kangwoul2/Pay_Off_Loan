import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  findBestRefinancingOption, 
} from '@/lib/services/simulation-service';
import { FinanceConfig } from '@/lib/config/finance-config';
import Big from 'big.js';

export async function POST(request: NextRequest) {
  try {
    // 1. 환경 변수 및 클라이언트 설정
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { currentDebts, hasSalaryTransfer } = body;

    // 2. DB에서 상품 정보 가져오기
    const { data: dbProducts, error } = await supabase
      .from('loan_products')
      .select('*');

    if (error) {
      console.error('DB Fetch Error:', error);
      return NextResponse.json({ success: false, error: 'DB 조회 실패' }, { status: 500 });
    }

    const formattedProducts = dbProducts?.map(p => ({
      bankName: p.bank_name,
      productName: p.product_name,
      baseRate: Number(p.base_rate) || 0,
      additionalRate: Number(p.additional_rate) || 0,
      salaryTransferDiscount: Number(p.salary_discount) || 0,
      userOtherDiscount: 0,
    })) || [];

    // 3. 최적 상품 분석 및 시계열 데이터 생성
    const results = currentDebts.map((debt: any) => {
      const bestOption = findBestRefinancingOption(
        debt, 
        formattedProducts, 
        hasSalaryTransfer
      );

      // 인지세 계산 (총액의 50% 고객 부담)
      const stampDuty = FinanceConfig.calculateStampDuty(new Big(debt.principal || 0))
        .div(2)
        .toNumber();
      
      const earlyRepayFee = Number(bestOption.earlyRepayFee) || 0;
      const totalInitialCost = earlyRepayFee + stampDuty;
      
      const chartData = [];
      const months = Number(debt.remainingMonths) || 1;
      
      // 월별 원리금 상환액 산출 (이해하기 쉽게 평균값 기반 모델링)
      // 실제 원리금균등 로직이 service에 있으나, 차트 시각화를 위해 월평균 지출액으로 정규화
      const currentMonthlyPayment = (Number(bestOption.currentTotalInterest) + Number(debt.principal)) / months;
      const newMonthlyPayment = (Number(bestOption.newTotalInterest) + Number(debt.principal)) / months;

      let cumulativeCurrent = 0;
      let cumulativeNew = totalInitialCost; 

      const simulationLimit = Math.min(months, 60);

      for (let m = 1; m <= simulationLimit; m++) {
        // 1. 누적 비용 합산 (이자 및 수수료)
        const currentMonthlyInterest = (Number(bestOption.currentTotalInterest) || 0) / months;
        const newMonthlyInterest = (Number(bestOption.newTotalInterest) || 0) / months;
        
        cumulativeCurrent += currentMonthlyInterest;
        cumulativeNew += newMonthlyInterest;
        
        // 2. 월별 실제 지출액 (원금 + 이자 + 초기비용)
        // 대환 후 1회차(m=1)에는 수수료와 인지세가 포함되어 지출이 튀는 것을 시각화
        const monthlyOutflowCurrent = currentMonthlyPayment;
        const monthlyOutflowNew = m === 1 
          ? newMonthlyPayment + totalInitialCost 
          : newMonthlyPayment;

        chartData.push({
          month: `${m}개월`,
          // BEP 분석용 누적 이자 데이터
          현재유지: Math.round(cumulativeCurrent),
          전략실행: Math.round(cumulativeNew),
          // 현금흐름 분석용 월별 지출 데이터
          기존월지출: Math.round(monthlyOutflowCurrent),
          전략월지출: Math.round(monthlyOutflowNew)
        });
      }

      return {
        loanName: debt.name || '보유 대출',
        principal: Number(debt.principal) || 0,
        currentRate: Number(debt.interestRate) || 0,
        newRate: Number(bestOption.newRate) || 0,
        monthlySavings: Number(bestOption.monthlySavings) || 0,
        netSavings: Number(bestOption.netSavings) - stampDuty,
        earlyRepayFee: earlyRepayFee,
        stampDuty: stampDuty,
        totalInitialCost: totalInitialCost,
        currentTotalInterest: Number(bestOption.currentTotalInterest) || 0,
        newTotalInterest: Number(bestOption.newTotalInterest) || 0,
        recommendedProduct: bestOption.recommendedProduct,
        recommendedAction: bestOption.recommendedAction,
        chartData: chartData // 이제 이 안에 월별 지출 데이터가 포함됨
      };
    });

    return NextResponse.json({ success: true, data: results });

  } catch (error) {
    console.error('Simulation API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}