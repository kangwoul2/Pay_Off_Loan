/**
 * 대출 상품 조회 API
 * 
 * GET /api/products
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: products, error } = await supabase
      .from("loan_products")
      .select("*")
      .order('base_rate', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: "상품 조회 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: products || [],
      count: products?.length || 0,
    });

  } catch (error) {
    console.error("상품 조회 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류" },
      { status: 500 }
    );
  }
}
