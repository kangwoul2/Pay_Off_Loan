'use client';

import { useState } from 'react';

// 대출 데이터 타입 정의
interface LoanInput {
  id: number;
  name: string;
  principal: number;
  interestRate: number;
  startDate: string; 
  totalMonths: number;
  repaymentType: '원리금균등' | '원금균등';
}

export default function Home() {
  const [loans, setLoans] = useState<LoanInput[]>([
    { id: Date.now(), name: '기존 대출 1', principal: 50000000, interestRate: 5.5, startDate: '2023-01-01', totalMonths: 60, repaymentType: '원리금균등' }
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // 대출 항목 조작 함수들
  const addLoan = () => {
    setLoans([...loans, { id: Date.now(), name: `대출 ${loans.length + 1}`, principal: 0, interestRate: 0, startDate: new Date().toISOString().split('T')[0], totalMonths: 60, repaymentType: '원리금균등' }]);
  };

  const updateLoan = (id: number, field: keyof LoanInput, value: any) => {
    setLoans(loans.map(loan => loan.id === id ? { ...loan, [field]: value } : loan));
  };

  const removeLoan = (id: number) => {
    if (loans.length > 1) setLoans(loans.filter(loan => loan.id !== id));
  };

  // 핵심: 실행일 기준으로 남은 기간 계산 유틸
  const getRemainingMonths = (startDate: string, totalMonths: number) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const remaining = totalMonths - diff;
    return remaining > 0 ? remaining : 1; // 최소 1개월 유지
  };

  // 분석 실행 (Total Scan)
  const handleTotalScan = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentDebts: loans.map(loan => ({
          // 숫자가 확실히 들어가도록 Number() 처리 및 기본값 설정
          principal: Number(loan.principal) || 0,
          interestRate: Number(loan.interestRate) || 0,
          remainingMonths: Number(getRemainingMonths(loan.startDate, loan.totalMonths)) || 1,
          totalMonths: Number(loan.totalMonths) || 12,
          repaymentType: loan.repaymentType,
          earlyRepayFeeRate: 1.5,
          feeWaiverMonths: 36,
          name: loan.name || "대출"
        })),
        loanProducts: [
          { bankName: '1금융권', productName: '우대 금리 대환대출', baseRate: 3.5, additionalRate: 1.2, salaryTransferDiscount: 0.3, userOtherDiscount: 0 }
        ],
        hasSalaryTransfer: true
      }),
    });
  

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        alert("분석 오류: " + data.error);
      }
    } catch (err) {
      alert("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">금융공기업 합격 기원 시뮬레이터 🚀</h1>
          <p className="text-gray-600 mt-2 text-sm">GIST 컴퓨터공학 전공자의 정밀 금융 분석 엔진 가동 중</p>
        </header>

        <div className="space-y-6">
          {loans.map((loan, index) => (
            <div key={loan.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-blue-600"># {index + 1} 대출 정보</h3>
                <button onClick={() => removeLoan(loan.id)} className="text-red-500 text-sm hover:underline">삭제</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">대출 실행일</label>
                  <input type="date" value={loan.startDate} onChange={(e) => updateLoan(loan.id, 'startDate', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">대출 잔액 (원)</label>
                  <input type="number" value={loan.principal} onChange={(e) => updateLoan(loan.id, 'principal', Number(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">현재 금리 (%)</label>
                  <input type="number" step="0.1" value={loan.interestRate} onChange={(e) => updateLoan(loan.id, 'interestRate', Number(e.target.value))} className="mt-1 block w-full border-gray-300 rounded-md p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">상환 방식</label>
                  <select value={loan.repaymentType} onChange={(e) => updateLoan(loan.id, 'repaymentType', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md p-2 text-sm">
                    <option value="원리금균등">원리금균등</option>
                    <option value="원금균등">원금균등</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addLoan} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:bg-gray-100 transition text-sm">+ 대출 항목 추가</button>

          <button 
            onClick={handleTotalScan}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? '모든 상품과 비교 분석 중...' : '최적 대환 전략 분석하기 (Total Scan)'}
          </button>

          {/* 결과 창 */}
          {results.length > 0 && (
            <div className="mt-10 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">📊 대환 분석 리포트</h2>
              {results.map((res, i) => (
                <div key={i} className={`p-6 rounded-xl border-2 ${res.netSavings > 0 ? 'border-green-500 bg-green-50' : 'border-red-200 bg-white'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">{res.loanName}</h4>
                      <p className="text-sm text-gray-500">추천 상품: {res.recommendedProduct.bankName} {res.recommendedProduct.productName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${res.recommendedAction === '즉시_대환' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                      {res.recommendedAction.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-2 rounded border"><p className="text-[10px] text-gray-400">신규 금리</p><p className="font-bold text-blue-600">{res.newRate}%</p></div>
                    <div className="bg-white p-2 rounded border"><p className="text-[10px] text-gray-400">중도상환수수료</p><p className="font-bold text-red-500">{res.earlyRepayFee.toLocaleString()}원</p></div>
                    <div className="bg-white p-2 rounded border"><p className="text-[10px] text-gray-400">월 절감액</p><p className="font-bold text-green-600">{res.monthlySavings.toLocaleString()}원</p></div>
                    <div className="bg-white p-2 rounded border"><p className="text-[10px] text-gray-400">최종 순이익</p><p className="font-bold text-gray-900">{res.netSavings.toLocaleString()}원</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}