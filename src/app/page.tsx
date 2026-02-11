'use client';

import { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, BarChart, Bar
} from 'recharts';

// 대출 데이터 타입 정의
interface LoanInput {
  id: number;
  name: string;
  principal: number;
  interestRate: number;
  startDate: string; 
  totalMonths: number;
  repaymentType: '원리금균등' | '원금균등';
  earlyRepayFeeRate: number;
  feeWaiverMonths: number;
}

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
            earlyRepayFeeRate: Number(loan.earlyRepayFeeRate) || 0,
            feeWaiverMonths: Number(loan.feeWaiverMonths) || 0,
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
          <p className="text-slate-500 mt-3 font-medium text-lg">GIST 정밀 금융 엔진 (v4: 현금흐름 분석 포함)</p>
        </header>

        <div className="space-y-6">
          {/* 입력 섹션 */}
          {loans.map((loan, index) => (
            <div key={loan.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-indigo-600"># {index + 1} 보유 대출 설정</h3>
                <button onClick={() => removeLoan(loan.id)} className="text-slate-400 hover:text-red-500 transition">삭제</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">대출 실행일</label>
                  <input type="date" value={loan.startDate} onChange={(e) => updateLoan(loan.id, 'startDate', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">전체 기간 (개월)</label>
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
            {loading ? '데이터 엔진 가동 중...' : '손익분기점 및 현금흐름 분석 실행'}
          </button>

          {/* 결과 섹션 */}
          {results.length > 0 && results.map((res, i) => {
            const currentLoan = loans[i];
            const passedMonths = getPassedMonths(currentLoan.startDate);
            const remainingMonths = getRemainingMonths(currentLoan.startDate, currentLoan.totalMonths);
            const waiverPoint = Math.max(0, currentLoan.feeWaiverMonths - passedMonths);

            return (
              <div key={i} className="mt-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6">
                    <span className={`px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase ${res.netSavings > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {res.recommendedAction ? res.recommendedAction.replace('_', ' ') : '분석 완료'}
                    </span>
                  </div>

                  <div className="mb-10">
                    <h2 className="text-3xl font-black text-slate-900">{res.loanName} 전략 리포트</h2>
                    <p className="text-indigo-600 font-bold mt-1">최적 상품: {res.recommendedProduct?.bankName} {res.recommendedProduct?.productName}</p>
                  </div>

                  {/* 지표 요약 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">매몰 비용</p>
                      <p className="text-xl font-black text-red-500">{(Number(res.totalInitialCost) || 0).toLocaleString()}원</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">신규 금리</p>
                      <p className="text-xl font-black text-indigo-600">{res.newRate || 0}%</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">월 이자 절감</p>
                      <p className="text-xl font-black text-emerald-600">+{Math.floor(res.monthlySavings || 0).toLocaleString()}원</p>
                    </div>
                    <div className="bg-indigo-600 p-4 rounded-2xl text-center text-white">
                      <p className="text-[10px] font-bold opacity-70 uppercase">최종 순이익</p>
                      <p className="text-xl font-black">{Math.floor(res.netSavings || 0).toLocaleString()}원</p>
                    </div>
                  </div>

                  {/* 차트 1: 누적 비용 (BEP) */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
                    <h4 className="font-black text-slate-700 mb-2">누적 이자 지불액 비교 (BEP)</h4>
                    <p className="text-xs text-slate-400 mb-6">파란 선이 회색 선 아래로 내려가는 시점이 손익분기점입니다.</p>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={res.chartData || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" fontSize={10} hide />
                          <YAxis tickFormatter={(val) => `${(val/10000).toFixed(0)}만`} fontSize={10} />
                          <Tooltip formatter={(val: number) => val.toLocaleString() + '원'} />
                          <Legend verticalAlign="top" height={36}/>
                          <Area name="기존 유지" type="monotone" dataKey="현재유지" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.2} strokeWidth={2} />
                          <Area name="전략 실행" type="monotone" dataKey="전략실행" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} strokeWidth={3} />
                          {waiverPoint > 0 && waiverPoint < remainingMonths && (
                            <ReferenceLine x={`${waiverPoint}개월`} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '수수료 면제', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 차트 2: 월별 지출액 (Cash Flow) */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
                    <h4 className="font-black text-slate-700 mb-2">매월 상환액 변화 (현금 흐름)</h4>
                    <p className="text-xs text-slate-400 mb-6">대환 직후 1회차 비용 발생 후, 매달 나가는 고정비가 얼마나 줄어드는지 확인하세요.</p>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={res.chartData || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" fontSize={10} hide />
                          <YAxis tickFormatter={(val) => `${(val/10000).toFixed(0)}만`} fontSize={10} />
                          <Tooltip formatter={(val: number) => val.toLocaleString() + '원'} />
                          <Legend verticalAlign="top" height={36}/>
                          <Bar name="기존 월 상환액" dataKey="기존월지출" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                          <Bar name="신규 월 상환액" dataKey="전략월지출" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-2xl border border-indigo-100 text-center">
                      <p className="text-sm font-bold text-indigo-600">
                        다음 달부터 매월 약 {Math.floor(res.monthlySavings).toLocaleString()}원의 여유 자금이 생깁니다!
                      </p>
                    </div>
                  </div>

                  {/* 하단 총합 비교 */}
                  <div className="mt-10 p-6 bg-indigo-600 rounded-3xl text-center shadow-lg">
                    <p className="text-indigo-100 text-sm font-medium">만기까지 총 지출액(원금+이자+비용)</p>
                    <div className="flex justify-center items-center gap-6 mt-2">
                      <div className="text-left">
                        <p className="text-[10px] text-indigo-200 uppercase font-bold">기존 유지 시</p>
                        <p className="text-white opacity-60 line-through text-lg font-bold">{(Number(res.currentTotalInterest || 0) + Number(res.principal || 0)).toLocaleString()}원</p>
                      </div>
                      <div className="text-2xl text-indigo-300 font-light">→</div>
                      <div className="text-left">
                        <p className="text-[10px] text-indigo-200 uppercase font-bold">전략 실행 시</p>
                        <p className="text-white text-3xl font-black">{(Number(res.newTotalInterest || 0) + Number(res.principal || 0) + Number(res.totalInitialCost || 0)).toLocaleString()}원</p>
                      </div>
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