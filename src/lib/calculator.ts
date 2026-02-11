// src/lib/calculator.ts 업데이트 내용 예시

export interface Loan {
  id: string;
  name: string;
  balance: number;
  rate: number;
  startDate: string; // "2024-01-01" 형식 -> 수수료 계산용
  period: number;    // 총 기간(개월)
}

// 개별 대출에 대한 대환 분석
export const analyzeMultipleLoans = (userLoans: Loan[], marketProducts: any[]) => {
  return userLoans.map(loan => {
    // 1. 해당 대출의 현재 수수료 계산 (실행일로부터 경과일수 계산)
    const monthsPassed = getMonthsBetween(new Date(loan.startDate), new Date());
    const feeRate = monthsPassed < 36 ? 1.5 * (1 - monthsPassed / 36) : 0; // 슬라이딩 수수료 적용
    
    // 2. 시장 상품 중 금리가 더 낮은 최적 상품 찾기
    const bestNewProduct = marketProducts
      .filter(p => p.rate < loan.rate)
      .sort((a, b) => a.rate - b.rate)[0];

    return {
      loanId: loan.id,
      currentLoanName: loan.name,
      bestAlternative: bestNewProduct,
      canRefinance: bestNewProduct ? true : false,
      estimatedSaving: calculateSaving(loan, bestNewProduct, feeRate)
    };
  });
};