"use client";

import { useState } from "react";
import LoanChart from "@/components/LoanChart";

type SimulationResult = {
  totalDebtBefore: number;
  totalDebtAfter: number;
  netSavings: number;
  breakEvenMonths: number;
  recommendedProduct: string;
  newRate: number;
  remainingMonths: number;
  chartData: {
    month: string;
    현재유지: number;
    전략실행: number;
  }[];
};


export default function Home() {
  const [principal, setPrincipal] = useState<number>(50000000);
  const [interestRate, setInterestRate] = useState<number>(5.5);
  const [totalMonths, setTotalMonths] = useState<number>(60);
  const [startDate, setStartDate] = useState<string>("2023-01-01");
  const [earlyFeeRate, setEarlyFeeRate] = useState<number>(1.5);
  const [feeWaiverMonths, setFeeWaiverMonths] = useState<number>(36);

  const [result, setResult] = useState<SimulationResult | null>(null);

  const format = (num: number) => num.toLocaleString();

  const handleSimulate = async () => {
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentDebts: [
            {
              name: "내 대출",
              principal,
              interestRate,
              totalMonths,
              startDate,
              earlyRepayFeeRate: earlyFeeRate,
              feeWaiverMonths,
            },
          ],
          hasSalaryTransfer: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        alert(data.error || "계산 실패");
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류");
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 800 }}>
      <h1>🔥 대환대출 시뮬레이터</h1>

      <h2>📌 현재 대출 정보</h2>

      <label>대출 원금 (원)</label>
      <input
        type="number"
        value={principal}
        onChange={(e) => setPrincipal(Number(e.target.value))}
      />
      <br />

      <label>현재 금리 (%)</label>
      <input
        type="number"
        value={interestRate}
        onChange={(e) => setInterestRate(Number(e.target.value))}
      />
      <br />

      <label>총 대출 기간 (개월)</label>
      <input
        type="number"
        value={totalMonths}
        onChange={(e) => setTotalMonths(Number(e.target.value))}
      />
      <br />

      <label>대출 시작일</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <br />

      <label>중도상환 수수료율 (%)</label>
      <input
        type="number"
        value={earlyFeeRate}
        onChange={(e) => setEarlyFeeRate(Number(e.target.value))}
      />
      <br />

      <label>수수료 면제 시점 (개월)</label>
      <input
        type="number"
        value={feeWaiverMonths}
        onChange={(e) => setFeeWaiverMonths(Number(e.target.value))}
      />
      <br />

      <button
        onClick={handleSimulate}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "#2563eb",
          color: "white",
          borderRadius: 8,
          border: "none",
        }}
      >
        시뮬레이션 실행
      </button>

      {result && (
        <div style={{ marginTop: 40 }}>
            <h2>📊 결과</h2>

            <p>추천 상품: {result.recommendedProduct}</p>
            <p>신규 금리: {result.newRate.toFixed(2)}%</p>
            <p>남은 상환 개월: {result.remainingMonths}개월</p>

            <p>총 상환액 (기존): {format(result.totalDebtBefore)}원</p>
            <p>총 상환액 (대환): {format(result.totalDebtAfter)}원</p>
            <p>순이익: {format(result.netSavings)}원</p>
            <p>손익분기점: {result.breakEvenMonths}개월</p>

            {result.netSavings > 0 ? (
            <h3 style={{ color: "green" }}>
                ✅ 지금 대환하면 이득입니다.
            </h3>
            ) : (
            <h3 style={{ color: "red" }}>
                ⚠️ 현재 조건에서는 대환이 불리합니다.
            </h3>
            )}

            {/* 👇 여기 추가 */}
            {result.chartData && (
            <>
                <h2 style={{ marginTop: 40 }}>📈 상환 누적 금액 비교</h2>
                <LoanChart data={result.chartData} />
            </>
            )}
        </div>
        )}

    </main>
  );
}
