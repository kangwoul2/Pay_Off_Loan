import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Big from "big.js";

function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
) {
  if (annualRate === 0) return principal / months;

  const monthlyRate = annualRate / 100 / 12;

  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

// ✅ 경과 개월 계산
function calculateElapsedMonths(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();

  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();

  return years * 12 + months;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    const { currentDebts, hasSalaryTransfer } = body;

    if (!currentDebts || !Array.isArray(currentDebts)) {
      return NextResponse.json(
        { success: false, error: "currentDebts 형식 오류" },
        { status: 400 }
      );
    }

    const { data: dbProducts, error } = await supabase
      .from("loan_products")
      .select("*");

    if (error || !dbProducts) {
      return NextResponse.json(
        { success: false, error: "DB 조회 실패" },
        { status: 500 }
      );
    }

    const debt = currentDebts[0];

    const principal = Number(debt.principal);
    const totalMonths = Number(debt.totalMonths);
    const currentRate = Number(debt.interestRate);

    const elapsedMonths = calculateElapsedMonths(debt.startDate);
    const remainingMonths = totalMonths - elapsedMonths;

    if (remainingMonths <= 0) {
      return NextResponse.json(
        { success: false, error: "이미 상환 완료된 대출입니다." },
        { status: 400 }
      );
    }

    // ✅ 조건 맞는 상품 필터
    const eligibleProducts = dbProducts.filter((p) => {
      return (
        principal <= Number(p.max_loan_limit) &&
        remainingMonths >= Number(p.min_term_months) &&
        remainingMonths <= Number(p.max_term_months)
      );
    });

    if (eligibleProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: "조건에 맞는 상품 없음" },
        { status: 400 }
      );
    }

    // ✅ 최종 금리 계산
    const productsWithRate = eligibleProducts.map((p) => {
      const rate =
        Number(p.base_rate) +
        Number(p.additional_rate) -
        (hasSalaryTransfer ? Number(p.salary_discount) : 0);

      return { ...p, finalRate: rate };
    });

    const bestProduct = productsWithRate.sort(
      (a, b) => a.finalRate - b.finalRate
    )[0];

    const newRate = bestProduct.finalRate;

    const currentMonthly = calculateMonthlyPayment(
      principal,
      currentRate,
      remainingMonths
    );

    const newMonthly = calculateMonthlyPayment(
      principal,
      newRate,
      remainingMonths
    );

    // ✅ 초기 비용 계산
    let earlyRepayFee = 0;

    if (elapsedMonths < debt.feeWaiverMonths) {
      earlyRepayFee =
        (principal * debt.earlyRepayFeeRate) / 100;
    }

    const stampDuty = new Big(principal)
      .times(0.0002)
      .div(2)
      .toNumber();

    const totalInitialCost = earlyRepayFee + stampDuty;

    const totalDebtBefore = Math.round(currentMonthly * remainingMonths);
    const totalDebtAfter = Math.round(
      newMonthly * remainingMonths + totalInitialCost
    );

    const netSavings = totalDebtBefore - totalDebtAfter;

    // ✅ 손익분기 계산
    let cumulativeDiff = -totalInitialCost;
    let breakEvenMonths = 0;

    for (let i = 1; i <= remainingMonths; i++) {
      cumulativeDiff += currentMonthly - newMonthly;
      if (cumulativeDiff >= 0) {
        breakEvenMonths = i;
        break;
      }
    }

    // ✅ 📈 그래프 데이터 생성
    const chartData = [];
    let cumulativeBefore = 0;
    let cumulativeAfter = totalInitialCost;

    for (let i = 1; i <= remainingMonths; i++) {
      cumulativeBefore += currentMonthly;
      cumulativeAfter += newMonthly;

      chartData.push({
        month: `${i}개월`,
        현재유지: Math.round(cumulativeBefore),
        전략실행: Math.round(cumulativeAfter),
      });
    }

    return NextResponse.json({
      success: true,
      totalDebtBefore,
      totalDebtAfter,
      netSavings,
      breakEvenMonths,
      recommendedProduct: `${bestProduct.bank_name} ${bestProduct.product_name}`,
      newRate,
      remainingMonths,
      chartData, // 👈 추가됨
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    );
  }
}
