"use client";
import { useState } from 'react';
import { simulateRefinance } from '../lib/calculator';

export default function SimulationPage() {
  const [balance, setBalance] = useState(30000000);
  const [currentRate, setCurrentRate] = useState(6.5);
  const [newRate, setNewRate] = useState(4.2);

  const result = simulateRefinance(balance, currentRate, newRate, 36);

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">대환대출 실질 손익 시뮬레이터</h1>
        <p className="text-gray-500">사회초년생의 현명한 대출 갈아타기를 돕습니다.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-10">
        <section className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold">정보 입력</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">대출 잔액 (원)</label>
            <input type="number" value={balance} onChange={e => setBalance(Number(e.target.value))} className="mt-1 w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">현재 금리 (%)</label>
              <input type="number" step="0.1" value={currentRate} onChange={e => setCurrentRate(Number(e.target.value))} className="mt-1 w-full p-3 bg-gray-50 border-none rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">갈아탈 금리 (%)</label>
              <input type="number" step="0.1" value={newRate} onChange={e => setNewRate(Number(e.target.value))} className="mt-1 w-full p-3 bg-gray-50 border-none rounded-xl" />
            </div>
          </div>
        </section>

        <section className={`p-8 rounded-2xl border-2 flex flex-col justify-center ${result.isRecommended ? 'border-blue-600 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
          <h2 className="text-2xl font-bold mb-4">{result.isRecommended ? "✅ 갈아타는 것을 추천합니다!" : "❌ 현재 대출을 유지하세요."}</h2>
          <div className="space-y-3">
            <p className="text-gray-600 text-lg">기대 절감액: <span className="text-blue-600 font-bold">{result.netBenefit.toLocaleString()}원</span></p>
            <p className="text-gray-600">중도상환 수수료: <span className="text-red-500 font-medium">{result.earlyRepayFee.toLocaleString()}원</span></p>
            {result.isRecommended && (
              <div className="mt-4 p-4 bg-white rounded-xl text-sm text-blue-800">
                💡 <b>{result.breakEvenMonth}개월</b>만 지나면 수수료보다 절감되는 이자가 더 커집니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}