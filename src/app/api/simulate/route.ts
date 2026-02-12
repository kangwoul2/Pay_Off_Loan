/**
 * 대환대출 3전략 시뮬레이션 API
 * 
 * POST /api/simulate
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  CurrentDebtInfo,
  NewLoanProduct,
  simulateAllStrategies,
  findBestRefinancingOption,
} from "@/lib/services/simulation-service";

/**
 * 날짜로부터 경과 개월 수 계산
 */
function calculateElapsedMonths(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  return years * 12 + months;
}

/**
 * 안전한 숫자 변환 (NaN 방지)
 */
function safeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1️⃣ Supabase 초기화
    // ============================================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ============================================
    // 2️⃣ 요청 바디 파싱
    // ============================================
    const body = await request.json();
    const { currentDebts, hasSalaryTransfer } = body;

    if (!currentDebts || !Array.isArray(currentDebts) || currentDebts.length === 0) {
      return NextResponse.json(
        { success: false, error: "대출 정보를 입력해주세요." },
        { status: 400 }
      );
    }

    const debt = currentDebts[0]; // 첫 번째 대출 사용

    // ============================================
    // 3️⃣ 경과 개월 수 및 잔여 개월 수 계산
    // ============================================
    const elapsedMonths = calculateElapsedMonths(debt.startDate);
    const totalMonths = safeNumber(debt.totalMonths, 60);
    const remainingMonths = totalMonths - elapsedMonths;

    if (remainingMonths <= 0) {
      return NextResponse.json(
        { success: false, error: "이미 상환이 완료된 대출입니다." },
        { status: 400 }
      );
    }

    // ============================================
    // 4️⃣ CurrentDebtInfo 구성 (안전한 변환)
    // ============================================
    const currentDebt: CurrentDebtInfo = {
      principal: safeNumber(debt.principal, 50000000),
      interestRate: safeNumber(debt.interestRate, 5.5),
      remainingMonths,
      totalMonths,
      repaymentType: debt.repaymentType || "원리금균등",
      earlyRepayFeeRate: safeNumber(debt.earlyRepayFeeRate, 1.5),
      feeWaiverMonths: safeNumber(debt.feeWaiverMonths, 36),
    };

    // ============================================
    // 5️⃣ DB에서 대출 상품 조회
    // ============================================
    const { data: dbProducts, error: dbError } = await supabase
      .from("loan_products")
      .select("*")
      .order('base_rate', { ascending: true })
      .limit(20);

    if (dbError) {
      console.error("DB 조회 오류:", dbError);
      return NextResponse.json(
        { success: false, error: "데이터베이스 조회 실패" },
        { status: 500 }
      );
    }

    // DB에 데이터가 없으면 더미 데이터 사용
    let loanProducts: NewLoanProduct[] = [];

    if (!dbProducts || dbProducts.length === 0) {
      console.warn("DB에 상품이 없습니다. 더미 데이터 사용");
      loanProducts = [
        {
          bankName: "KB",
          productName: "KB직장인신용대출",
          baseRate: 3.5,
          additionalRate: 1.7,
          salaryTransferDiscount: 0.3,
          userOtherDiscount: 0,
        },
        {
          bankName: "신한",
          productName: "신한저금리대출",
          baseRate: 3.2,
          additionalRate: 1.8,
          salaryTransferDiscount: 0.3,
          userOtherDiscount: 0,
        },
      ];
    } else {
      // ============================================
      // 6️⃣ DB 상품 → NewLoanProduct 변환 (안전하게)
      // ============================================
      loanProducts = dbProducts.map((p) => ({
        bankName: p.bank_name || "알수없음",
        productName: p.product_name || "상품명없음",
        baseRate: safeNumber(p.base_rate, 3.5),
        additionalRate: safeNumber(p.additional_rate, 1.5),
        salaryTransferDiscount: safeNumber(p.salary_transfer_discount, 0.3),
        userOtherDiscount: 0,
      }));
    }

    // ============================================
    // 7️⃣ 최적 상품 찾기
    // ============================================
    const bestSimulation = findBestRefinancingOption(
      currentDebt,
      loanProducts,
      hasSalaryTransfer
    );

    if (!bestSimulation) {
      return NextResponse.json(
        { success: false, error: "적합한 대출 상품이 없습니다." },
        { status: 400 }
      );
    }

    // ============================================
    // 8️⃣ 최적 상품으로 3전략 시뮬레이션
    // ============================================
    const bestProduct: NewLoanProduct = {
      bankName: bestSimulation.recommendedProduct.bankName,
      productName: bestSimulation.recommendedProduct.productName,
      baseRate: bestSimulation.newRate,
      additionalRate: 0,
      salaryTransferDiscount: 0,
      userOtherDiscount: 0,
    };

    const strategyResult = simulateAllStrategies(
      currentDebt,
      bestProduct,
      hasSalaryTransfer
    );

    // ============================================
    // 9️⃣ 차트 데이터 생성 (3전략 라인)
    // ============================================
    const maxLength = Math.max(
      ...strategyResult.strategies.map((s) => s.monthlySchedule.length)
    );

    const chartData = Array.from({ length: maxLength }, (_, index) => {
      const row: any = { month: `${index + 1}개월` };

      strategyResult.strategies.forEach((strategy) => {
        const item = strategy.monthlySchedule[index];
        row[strategy.strategyType] = item ? item.cumulativePayment : null;
      });

      return row;
    });

    // ============================================
    // 🔟 응답 반환
    // ============================================
    return NextResponse.json({
      success: true,
      
      // 최적 전략 정보
      bestStrategy: strategyResult.bestStrategy.strategyType,
      
      // 3전략 비교 데이터
      strategies: strategyResult.strategies,
      
      // 차트 데이터
      chartData,
      
      // 추천 상품 정보
      recommendedProduct: bestSimulation.recommendedProduct,
      
      // 기타 정보
      currentRate: currentDebt.interestRate,
      newRate: bestSimulation.newRate,
      remainingMonths,
      totalDebtBefore: bestSimulation.totalDebtBefore,
      totalDebtAfter: bestSimulation.totalDebtAfter,
      netSavings: bestSimulation.netSavings,
      breakEvenMonths: bestSimulation.breakEvenMonths,
    });

  } catch (error) {
    console.error("시뮬레이션 API 오류:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "서버 오류가 발생했습니다." 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/simulate
 * API 사용 가이드
 */
export async function GET() {
  return NextResponse.json({
    message: "POST 요청으로 시뮬레이션을 실행하세요.",
    example: {
      currentDebts: [
        {
          principal: 50000000,
          interestRate: 5.5,
          totalMonths: 60,
          startDate: "2023-01-01",
          earlyRepayFeeRate: 1.5,
          feeWaiverMonths: 36,
          repaymentType: "원리금균등",
        },
      ],
      hasSalaryTransfer: true,
    },
  });
}