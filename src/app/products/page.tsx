"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LoanProduct {
  id: string;
  bank_name: string;
  product_name: string;
  base_rate: number;
  additional_rate: number;
  salary_transfer_discount: number;
  max_limit: number;
  crawled_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        alert("상품 조회 실패");
      }
    } catch (error) {
      console.error(error);
      alert("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.bank_name.toLowerCase().includes(filter.toLowerCase()) ||
    p.product_name.toLowerCase().includes(filter.toLowerCase())
  );

  const calculateFinalRate = (product: LoanProduct, withSalary: boolean) => {
    const baseTotal = product.base_rate + product.additional_rate;
    const discount = withSalary ? product.salary_transfer_discount : 0;
    return Math.max(0, baseTotal - discount);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>상품 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <main style={{ padding: "40px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h1 style={{ fontSize: 32 }}>💳 대출 상품 목록</h1>
        <Link href="/" style={{ 
          padding: "10px 20px", 
          background: "#2563eb", 
          color: "white", 
          borderRadius: 8,
          textDecoration: "none"
        }}>
          ← 시뮬레이터로 돌아가기
        </Link>
      </div>

      <div style={{ background: "#f9fafb", padding: 20, borderRadius: 12, marginBottom: 30 }}>
        <input
          type="text"
          placeholder="은행명 또는 상품명 검색..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 16
          }}
        />
      </div>

      <p style={{ marginBottom: 20, color: "#6b7280" }}>
        총 <strong>{filteredProducts.length}개</strong>의 상품이 있습니다.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead>
            <tr style={{ background: "#e5e7eb" }}>
              <th style={{ padding: 12, textAlign: "left", border: "1px solid #d1d5db" }}>은행</th>
              <th style={{ padding: 12, textAlign: "left", border: "1px solid #d1d5db" }}>상품명</th>
              <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>기본 금리</th>
              <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>가산 금리</th>
              <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>급여이체 우대</th>
              <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>최종 금리 (우대 전)</th>
              <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>최종 금리 (급여이체)</th>
              <th style={{ padding: 12, textAlign: "right", border: "1px solid #d1d5db" }}>한도</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: 12, border: "1px solid #d1d5db", fontWeight: 600 }}>
                  {product.bank_name}
                </td>
                <td style={{ padding: 12, border: "1px solid #d1d5db" }}>
                  {product.product_name}
                </td>
                <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right" }}>
                  {product.base_rate?.toFixed(2)}%
                </td>
                <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right" }}>
                  +{product.additional_rate?.toFixed(2)}%
                </td>
                <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right", color: "#059669" }}>
                  -{product.salary_transfer_discount?.toFixed(2)}%
                </td>
                <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right", fontWeight: 600 }}>
                  {calculateFinalRate(product, false).toFixed(2)}%
                </td>
                <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right", fontWeight: 600, color: "#2563eb" }}>
                  {calculateFinalRate(product, true).toFixed(2)}%
                </td>
                <td style={{ padding: 12, border: "1px solid #d1d5db", textAlign: "right" }}>
                  {product.max_limit ? `${(product.max_limit / 100000000).toFixed(1)}억` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </main>
  );
}
