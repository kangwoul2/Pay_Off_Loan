"use client";

import { useState } from "react";
import Link from "next/link";
import SimulationChart from "@/components/SimulationChart";

export default function Home() {
  const [principal, setPrincipal] = useState<number>(50000000);
  const [interestRate, setInterestRate] = useState<number>(5.5);
  const [totalMonths, setTotalMonths] = useState<number>(60);
  const [startDate, setStartDate] = useState<string>("2023-01-01");
  const [earlyFeeRate, setEarlyFeeRate] = useState<number>(1.5);
  const [feeWaiverMonths, setFeeWaiverMonths] = useState<number>(36);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const format = (num: number) => num?.toLocaleString() || "0";

  const handleSimulate = async () => {
    setLoading(true);
    
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentDebts: [
            {
              principal,
              interestRate,
              totalMonths,
              startDate,
              earlyRepayFeeRate: earlyFeeRate,
              feeWaiverMonths,
              repaymentType: "원리금균등",
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "40px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32 }}>🏦 대환대출 시뮬레이터</h1>
        <Link href="/products" style={{ 
          padding: "10px 20px", 
          background: "#10b981", 
          color: "white", 
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 500
        }}>
          💳 대출 상품 목록 보기
        </Link>
      </div>

      <div style={{ background: "#f9fafb", padding: 30, borderRadius: 12, marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>📌 현재 대출 정보 입력</h2>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              대출 원금 (원)
            </label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              style={{ 
                width: "100%", 
                padding: 12, 
                borderRadius: 8, 
                border: "1px solid #d1d5db",
                fontSize: 16
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                현재 금리 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  padding: 12, 
                  borderRadius: 8, 
                  border: "1px solid #d1d5db",
                  fontSize: 16
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                총 대출 기간 (개월)
              </label>
              <input
                type="number"
                value={totalMonths}
                onChange={(e) => setTotalMonths(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  padding: 12, 
                  borderRadius: 8, 
                  border: "1px solid #d1d5db",
                  fontSize: 16
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              대출 시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ 
                width: "100%", 
                padding: 12, 
                borderRadius: 8, 
                border: "1px solid #d1d5db",
                fontSize: 16
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                중도상환 수수료율 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={earlyFeeRate}
                onChange={(e) => setEarlyFeeRate(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  padding: 12, 
                  borderRadius: 8, 
                  border: "1px solid #d1d5db",
                  fontSize: 16
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                수수료 면제 시점 (개월)
              </label>
              <input
                type="number"
                value={feeWaiverMonths}
                onChange={(e) => setFeeWaiverMonths(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  padding: 12, 
                  borderRadius: 8, 
                  border: "1px solid #d1d5db",
                  fontSize: 16
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          style={{
            marginTop: 30,
            padding: "14px 28px",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "white",
            borderRadius: 8,
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%"
          }}
        >
          {loading ? "계산 중..." : "🔍 최적 대환 전략 찾기"}
        </button>
      </div>

      {result && result.success && (
        <div>
          <div style={{ background: "#eff6ff", padding: 30, borderRadius: 12, marginBottom: 30 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>✅ 추천 상품</h2>
            <p style={{ fontSize: 18, marginBottom: 8 }}>
              <strong>{result.recommendedProduct?.bankName || "N/A"}</strong> - {result.recommendedProduct?.productName || "N/A"}
            </p>
            <p style={{ color: "#3b82f6", fontSize: 20, fontWeight: 600 }}>
              신규 금리: {result.newRate?.toFixed(2) || "N/A"}%
            </p>
            <p style={{ color: "#6b7280", marginTop: 8 }}>
              현재 금리: {result.currentRate?.toFixed(2) || "N/A"}% → 금리 절감: {((result.currentRate || 0) - (result.newRate || 0)).toFixed(2)}%
            </p>
          </div>

          <div style={{ background: "#f9fafb", padding: 30, borderRadius: 12, marginBottom: 30 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>📊 3가지 전략 비교</h2>
            <p style={{ marginBottom: 20, color: "#6b7280" }}>
              잔여 상환 기간: <strong>{result.remainingMonths}개월</strong>
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#e5e7eb" }}>
                    <th style={{ padding: 12, textAlign: "left", border: "1px solid #d1d5db" }}>전략</th>
                    <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>총 상환액</th>
                    <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>대환 비용</th>
                    <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>순이익</th>
                    <th style={{ padding: 12, textAlign: "center", border: "1px solid #d1d5db" }}>손익분기점</th>
                  </tr>
                </thead>
                <tbody>
                  {result.strategies?.map((strategy: any, index: number) => (
                    <tr 
                      key={index}
                      style={{ 
                        background: strategy.strategyType === result.bestStrategy ? "#dcfce7" : "white"
                      }}
                    >
                      <td style={{ padding: 12, border: "1px solid #d1d5db", fontWeight: strategy.strategyType === result.bestStrategy ? 600 : 400 }}>
                        {strategy.strategyType}
                        {strategy.strategyType === result.bestStrategy && " 🏆"}
                      </td>
                      <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right" }}>
                        {format(strategy.totalDebt)}원
                      </td>
                      <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right" }}>
                        {format(strategy.refinanceCost)}원
                      </td>
                      <td style={{ 
                        padding: 12, 
                        border: "1px solid #d1d5db", 
                        textAlign: "right",
                        color: strategy.netSavings > 0 ? "#059669" : "#dc2626",
                        fontWeight: 600
                      }}>
                        {strategy.netSavings > 0 ? "+" : ""}{format(strategy.netSavings)}원
                      </td>
                      <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "center" }}>
                        {strategy.breakEvenMonths > 0 ? `${strategy.breakEvenMonths}개월` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, padding: 16, background: "#fef3c7", borderRadius: 8 }}>
              <p style={{ fontWeight: 600, fontSize: 18 }}>
                💡 최적 전략: <span style={{ color: "#d97706" }}>{result.bestStrategy}</span>
              </p>
            </div>
          </div>

          {result.chartData && result.chartData.length > 0 && (
            <div style={{ background: "white", padding: 30, borderRadius: 12, border: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>📈 누적 상환 금액 비교</h2>
              <SimulationChart data={result.chartData} />
              <p style={{ marginTop: 20, color: "#6b7280", fontSize: 14 }}>
                * 시간이 지날수록 각 전략의 누적 상환 금액을 비교할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
