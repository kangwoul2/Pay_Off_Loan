'use client';

import { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

// 대출 데이터 타입 정의 (수수료 상세 정보 추가)
interface LoanInput {
  id: number;
  name: string;
  principal: number;
  interestRate: number;
  startDate: string; 
  totalMonths: number;
  repaymentType: '원리금균등' | '원금균등';
  earlyRepayFeeRate: number; // 중도상환수수료율
  feeWaiverMonths: number;   // 수수료 면제 기간
}

// 인지세 계산 로직 (FinanceConfig 연동용)
const calculateStampDuty = (amount: number) => {
  if (amount <= 50000000) return 0;
  if (amount <= 100000000) return 35000; // 7만원의 50%
  if (amount <= 1000000000) return 75000; // 15만원의 50%
  return 175000; // 35만원의 50%
};

export default function Home() {
  const [loans, setLoans] = useState<LoanInput[]>([
    { 
      id: Date.now(), 
      name: '기존 대출 1', 
      principal: 50000000, 
      interestRate: 5.5, 
      startDate: '2023-01-01', 
      totalMonths: 60, 
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addLoan = () => {
    setLoans([...loans, { 
      id: Date.now(), 
      name: `대출 ${loans.length + 1}`, 
      principal: 0, 
      interestRate: 0, 
      startDate: new Date().toISOString().split('T')[0], 
      totalMonths: 60, 
      repaymentType: '원리금균등',
      earlyRepayFeeRate: 1.5,
      feeWaiverMonths: 36
    }]);
  };

  const updateLoan = (id: number, field: keyof LoanInput, value: any) => {
    setLoans(loans.map(loan => loan.id === id ? { ...loan, [field]: value } : loan));
  };

  const removeLoan = (id: number) => {
    if (loans.length > 1) setLoans(loans.filter(loan => loan.id !== id));
  };

  const getPassedMonths = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  };

  const getRemainingMonths = (startDate: string, totalMonths: number) => {
    const diff = getPassedMonths(startDate);
    const remaining = totalMonths - diff;
    return remaining > 0 ? remaining : 1;
  };

  const handleTotalScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDebts: loans.map(loan => ({
            principal: Number(loan.principal) || 0,
            interestRate: Number(loan.interestRate) || 0,
            remainingMonths: Number(getRemainingMonths(loan.startDate, loan.totalMonths)) || 1,
            totalMonths: Number(loan.totalMonths) || 12,
            repaymentType: loan.repaymentType,
            earlyRepayFeeRate: loan.earlyRepayFeeRate,
            feeWaiverMonths: loan.feeWaiverMonths,
            name: loan.name || "대출"
          })),
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
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">대환대출 BEP 시뮬레이터 🚀</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">GIST 정밀 금융 엔진: 인지세 및 중도상환수수료 포함 분석</p>
        </header>

        <div className="space-y-6">
          {loans.map((loan, index) => (
            <div key={loan.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-indigo-600"># {index + 1} 보유 대출 설정</h3>
                <button onClick={() => removeLoan(loan.id)} className="text-slate-400 hover:text-red-500 transition">삭제</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">대출 실행일</label>
                  <input type="date" value={loan.startDate} onChange={(e) => updateLoan(loan.id, 'startDate', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">전체 대출 기간 (개월)</label>
                  <input type="number" value={loan.totalMonths} onChange={(e) => updateLoan(loan.id, 'totalMonths', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">대출 잔액 (원)</label>
                  <input type="number" value={loan.principal} onChange={(e) => updateLoan(loan.id, 'principal', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">현재 금리 (%)</label>
                  <input type="number" step="0.1" value={loan.interestRate} onChange={(e) => updateLoan(loan.id, 'interestRate', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">중도상환수수료율 (%)</label>
                  <input type="number" step="0.1" value={loan.earlyRepayFeeRate} onChange={(e) => updateLoan(loan.id, 'earlyRepayFeeRate', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">수수료 면제 기간 (개월)</label>
                  <input type="number" value={loan.feeWaiverMonths} onChange={(e) => updateLoan(loan.id, 'feeWaiverMonths', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm" />
                </div>
              </div>
            </div>
          ))}

          <button onClick={addLoan} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 font-bold hover:bg-white hover:text-indigo-400 transition text-sm">+ 새로운 대출 항목 추가</button>

          <button 
            onClick={handleTotalScan}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
          >
            {loading ? 'DB 상품 대조 및 시뮬레이션 중...' : '손익분기점 분석 실행 (Total Scan)'}
          </button>

          {results.length > 0 && results.map((res, i) => {
            const currentLoan = loans[i];
            const passedMonths = getPassedMonths(currentLoan.startDate);
            const remainingMonths = getRemainingMonths(currentLoan.startDate, currentLoan.totalMonths);
            const stampDuty = calculateStampDuty(currentLoan.principal);
            const totalInitialCost = res.earlyRepayFee + stampDuty;
            
            // 면제 시점 라인 계산
            const waiverPoint = Math.max(0, currentLoan.feeWaiverMonths - passedMonths);

            return (
              <div key={i} className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6">
                    <span className={`px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase ${res.netSavings > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {res.recommendedAction.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mb-10">
                    <h2 className="text-3xl font-black text-slate-900">{res.loanName} 전략 리포트</h2>
                    <p className="text-indigo-600 font-bold mt-1">최적 상품: {res.recommendedProduct.bankName} {res.recommendedProduct.productName}</p>
                  </div>

                  {/* 비용 및 혜택 요약 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">매몰 비용 (수수료+인지세)</p>
                      <p className="text-xl font-black text-red-500">{totalInitialCost.toLocaleString()}원</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">신규 금리</p>
                      <p className="text-xl font-black text-indigo-600">{res.newRate}%</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">월 이자 절감</p>
                      <p className="text-xl font-black text-emerald-600">+{Math.floor(res.monthlySavings).toLocaleString()}원</p>
                    </div>
                    <div className="bg-indigo-600 p-4 rounded-2xl text-center text-white">
                      <p className="text-[10px] font-bold opacity-70 uppercase">최종 순이익</p>
                      <p className="text-xl font-black">{Math.floor(res.netSavings).toLocaleString()}원</p>
                    </div>
                  </div>

                  {/* BEP 차트 섹션 */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
                    <h4 className="font-black text-slate-700 mb-6">누적 비용 시뮬레이션 (BEP 분석)</h4>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={res.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" fontSize={10} hide={false} />
                          <YAxis tickFormatter={(val) => `${(val/10000).toFixed(0)}만`} fontSize={10} />
                          <Tooltip formatter={(val: number) => val.toLocaleString() + '원'} />
                          <Legend verticalAlign="top" height={36}/>
                          <Area type="monotone" dataKey="기존유지" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.2} strokeWidth={2} />
                          <Area type="monotone" dataKey="전략실행" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} strokeWidth={3} />
                          {/* 수수료 면제 시점 표시 */}
                          {waiverPoint > 0 && waiverPoint < remainingMonths && (
                            <ReferenceLine x={`${waiverPoint}개월`} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '수수료 면제', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
                      * 빨간 점선(수수료 면제 시점) 이후에는 대환 비용이 극적으로 줄어듭니다. 파란 선이 회색 선 아래로 가는 지점이 BEP입니다.
                    </p>
                  </div>

                  <div className="mt-10 p-6 bg-indigo-600 rounded-3xl text-center">
                    <p className="text-indigo-100 text-sm font-medium">전략 실행 시 만기까지 총 상환액 변화</p>
                    <div className="flex justify-center items-center gap-4 mt-2">
                      <span className="text-white opacity-50 line-through text-lg font-bold">{(res.currentTotalInterest + res.principal).toLocaleString()}원</span>
                      <span className="text-white text-2xl font-black">{(res.newTotalInterest + res.principal + totalInitialCost).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}