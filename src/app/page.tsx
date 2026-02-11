'use client';

import { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
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
}

export default function Home() {
  const [loans, setLoans] = useState<LoanInput[]>([
    { id: Date.now(), name: '기존 대출 1', principal: 50000000, interestRate: 5.5, startDate: '2023-01-01', totalMonths: 60, repaymentType: '원리금균등' }
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addLoan = () => {
    setLoans([...loans, { id: Date.now(), name: `대출 ${loans.length + 1}`, principal: 0, interestRate: 0, startDate: new Date().toISOString().split('T')[0], totalMonths: 60, repaymentType: '원리금균등' }]);
  };

  const updateLoan = (id: number, field: keyof LoanInput, value: any) => {
    setLoans(loans.map(loan => loan.id === id ? { ...loan, [field]: value } : loan));
  };

  const removeLoan = (id: number) => {
    if (loans.length > 1) setLoans(loans.filter(loan => loan.id !== id));
  };

  const getRemainingMonths = (startDate: string, totalMonths: number) => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
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
            earlyRepayFeeRate: 1.5,
            feeWaiverMonths: 36,
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
          <p className="text-slate-500 mt-3 font-medium text-lg">GIST 정밀 금융 엔진: 중도상환수수료 대비 실질 이득 분석</p>
        </header>

        {/* 입력 섹션 */}
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
                  <input type="date" value={loan.startDate} onChange={(e) => updateLoan(loan.id, 'startDate', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">전체 대출 기간 (개월)</label>
                  <input type="number" value={loan.totalMonths} onChange={(e) => updateLoan(loan.id, 'totalMonths', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">대출 잔액 (원)</label>
                  <input type="number" value={loan.principal} onChange={(e) => updateLoan(loan.id, 'principal', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">현재 금리 (%)</label>
                  <input type="number" step="0.1" value={loan.interestRate} onChange={(e) => updateLoan(loan.id, 'interestRate', Number(e.target.value))} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">상환 방식</label>
                  <select value={loan.repaymentType} onChange={(e) => updateLoan(loan.id, 'repaymentType', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-indigo-500">
                    <option value="원리금균등">원리금균등상환</option>
                    <option value="원금균등">원금균등상환</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addLoan} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 font-bold hover:bg-white hover:border-indigo-300 hover:text-indigo-400 transition text-sm">+ 새로운 대출 항목 추가</button>

          <button 
            onClick={handleTotalScan}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all transform hover:-translate-y-1"
          >
            {loading ? 'DB 상품 대조 및 시뮬레이션 중...' : '손익분기점 분석 실행 (Total Scan)'}
          </button>

          {/* 분석 리포트 섹션 */}
          {results.length > 0 && results.map((res, i) => {
            // 차트 데이터 생성 (시간 경과에 따른 누적 지불 비용)
            const remainingMonths = getRemainingMonths(loans[i].startDate, loans[i].totalMonths);
            const chartData = Array.from({ length: Math.min(remainingMonths, 24) }, (_, month) => {
              const currentMonthly = res.currentTotalInterest / remainingMonths;
              const newMonthly = res.newTotalInterest / remainingMonths;
              return {
                name: `${month + 1}개월`,
                현재유지: Math.floor(currentMonthly * (month + 1)),
                대환실행: Math.floor((newMonthly * (month + 1)) + res.earlyRepayFee)
              };
            });

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

                  {/* 3단계 가이드라인 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">단기 (1년 이득)</p>
                      <p className="text-xl font-bold text-slate-800">{Math.floor(res.monthlySavings * 12 - res.earlyRepayFee).toLocaleString()}원</p>
                      <p className="text-xs text-slate-500 mt-2 font-medium">초기 비용 회수 여부 판단</p>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">수수료 면제 시점</p>
                      <p className="text-xl font-bold text-indigo-700">36개월 차</p>
                      <p className="text-xs text-indigo-500 mt-2 font-medium">수수료 0원 시 실질 이득 극대화</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">최종 순이익</p>
                      <p className="text-xl font-bold text-emerald-700">{Math.floor(res.netSavings).toLocaleString()}원</p>
                      <p className="text-xs text-emerald-500 mt-2 font-medium">만기까지 총 상환액 절감분</p>
                    </div>
                  </div>

                  {/* 핵심 지표 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="text-center p-4">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">신규 금리</p>
                      <p className="text-2xl font-black text-indigo-600">{res.newRate}%</p>
                    </div>
                    <div className="text-center p-4">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">발생 수수료</p>
                      <p className="text-2xl font-black text-rose-500">{Math.floor(res.earlyRepayFee).toLocaleString()}원</p>
                    </div>
                    <div className="text-center p-4">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">월 절감액</p>
                      <p className="text-2xl font-black text-emerald-500">{Math.floor(res.monthlySavings).toLocaleString()}원</p>
                    </div>
                    <div className="text-center p-4 border-l">
                      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">실질 순이익</p>
                      <p className="text-2xl font-black text-slate-900">{Math.floor(res.netSavings).toLocaleString()}원</p>
                    </div>
                  </div>

                  {/* 차트 섹션 */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-slate-700">누적 비용 시뮬레이션 (BEP 분석)</h4>
                      <div className="flex gap-4 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-slate-300"></div> 기존 유지</span>
                        <span className="flex items-center gap-1 text-indigo-600"><div className="w-2 h-2 rounded-full bg-indigo-600"></div> 대환 실행</span>
                      </div>
                    </div>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: number) => val.toLocaleString() + '원'}
                          />
                          <Area type="monotone" dataKey="현재유지" stroke="#cbd5e1" strokeWidth={3} fillOpacity={1} fill="url(#colorPrev)" />
                          <Area type="monotone" dataKey="대환실행" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-center text-[11px] text-slate-400 mt-4 font-medium">
                      * 두 선이 교차하는 지점이 손익분기점(BEP)입니다. 파란색 선이 아래에 있을수록 이득입니다.
                    </p>
                  </div>

                  {/* 최종 요약 */}
                  <div className="mt-10 p-6 bg-indigo-600 rounded-3xl text-center">
                    <p className="text-indigo-100 text-sm font-medium">전략 실행 시 만기까지 총 상환액 변화</p>
                    <div className="flex justify-center items-center gap-4 mt-2">
                      <span className="text-white opacity-50 line-through text-lg font-bold">{(res.currentTotalInterest + res.principal).toLocaleString()}원</span>
                      <span className="text-white text-2xl font-black">{(res.newTotalInterest + res.principal + res.earlyRepayFee).toLocaleString()}원</span>
                    </div>
                    <p className="text-indigo-200 text-xs mt-2 font-bold italic">"당신의 자산 가치를 {(res.netSavings / 10000).toFixed(1)}만 원 더 확보했습니다."</p>
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