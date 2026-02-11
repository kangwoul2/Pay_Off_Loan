/**
 * 대출 상환 전략 (Strategy Pattern)
 * 
 * @description
 * 원리금균등, 원금균등 등 다양한 상환 방식을 전략 패턴으로 구현합니다.
 * 새로운 상환 방식(만기일시, 거치식 등)을 추가할 때는 이 인터페이스를 구현하면 됩니다.
 */

import Big from 'big.js';

// Big.js 설정
Big.DP = 4;
Big.RM = Big.roundHalfUp;

/**
 * 월별 상환 스케줄 타입
 */
export interface MonthlyScheduleItem {
  month: number;                // 회차 (1, 2, 3, ...)
  principal: Big;               // 원금 상환액
  interest: Big;                // 이자
  totalPayment: Big;            // 총 상환액 (원금 + 이자)
  remainingPrincipal: Big;      // 잔여 원금
}

/**
 * 상환 전략 인터페이스
 */
export interface RepaymentStrategy {
  /**
   * 월 상환액 계산
   * 
   * @param principal - 대출 원금
   * @param annualRate - 연 이자율 (%)
   * @param months - 상환 개월 수
   * @returns 월 상환액 (원리금균등은 고정, 원금균등은 첫 달 기준)
   */
  calculateMonthlyPayment(
    principal: Big,
    annualRate: Big,
    months: number
  ): Big;
  
  /**
   * 총 이자 계산
   * 
   * @param principal - 대출 원금
   * @param annualRate - 연 이자율 (%)
   * @param months - 상환 개월 수
   * @returns 총 이자액
   */
  calculateTotalInterest(
    principal: Big,
    annualRate: Big,
    months: number
  ): Big;
  
  /**
   * 월별 상환 스케줄 생성
   * 
   * @param principal - 대출 원금
   * @param annualRate - 연 이자율 (%)
   * @param months - 상환 개월 수
   * @returns 월별 상환 내역 배열
   */
  getMonthlySchedule(
    principal: Big,
    annualRate: Big,
    months: number
  ): MonthlyScheduleItem[];
  
  /**
   * 중도상환 수수료 계산
   * 
   * 금융적 근거:
   * - 은행은 대출 시 향후 이자 수익을 기대합니다
   * - 중도상환 시 예상 수익이 감소하므로 수수료를 부과합니다
   * - 시간이 지날수록 이미 회수한 이자가 증가하므로 수수료를 감면합니다
   * 
   * 계산 로직:
   * 1. 기본 수수료 = 잔여원금 × 수수료율(%)
   * 2. 시간 비례 감면 = 기본 수수료 × (잔여개월 / 전체개월)
   * 3. 수수료 면제 기간 경과 시 0원
   * 
   * @param remainingPrincipal - 잔여 원금
   * @param feeRate - 중도상환 수수료율 (%)
   * @param remainingMonths - 남은 상환 개월 수
   * @param totalMonths - 전체 상환 개월 수
   * @param feeWaiverMonths - 수수료 면제 기간 (개월)
   * @returns 중도상환 수수료
   */
  calculateEarlyRepayFee(
    remainingPrincipal: Big,
    feeRate: Big,
    remainingMonths: number,
    totalMonths: number,
    feeWaiverMonths: number
  ): Big;
}

/**
 * 원리금균등 상환 전략
 * 
 * 금융적 근거:
 * - 매월 동일한 금액을 상환하는 방식입니다
 * - 초반에는 이자 비중이 크고, 후반에는 원금 비중이 큽니다
 * - 차입자 입장에서 매월 지출이 일정하여 관리가 쉽습니다
 * - 은행 입장에서는 초반 이자 회수가 많아 선호하는 방식입니다
 * 
 * 수식 근거:
 * 월 상환액 = P × [r × (1+r)^n] / [(1+r)^n - 1]
 * 
 * 여기서:
 * - P: 원금 (Principal)
 * - r: 월 이자율 (연 이자율 / 12)
 * - n: 상환 개월 수
 * 
 * 이 수식은 "현재 가치의 합 = 미래 가치의 합" 등식에서 유도됩니다.
 */
export class EqualPrincipalInterestStrategy implements RepaymentStrategy {
  calculateMonthlyPayment(principal: Big, annualRate: Big, months: number): Big {
    const monthlyRate = annualRate.div(100).div(12);
    
    // 금리가 0%인 경우 (무이자)
    if (monthlyRate.eq(0)) {
      return principal.div(months);
    }
    
    // 원리금균등 상환 공식
    const onePlusR = monthlyRate.plus(1);  // (1 + r)
    const numerator = principal.times(monthlyRate).times(onePlusR.pow(months));  // P × r × (1+r)^n
    const denominator = onePlusR.pow(months).minus(1);  // (1+r)^n - 1
    
    return numerator.div(denominator);
  }
  
  calculateTotalInterest(principal: Big, annualRate: Big, months: number): Big {
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, months);
    const totalPayment = monthlyPayment.times(months);  // 총 상환액
    return totalPayment.minus(principal);  // 총 이자 = 총 상환액 - 원금
  }
  
  getMonthlySchedule(principal: Big, annualRate: Big, months: number): MonthlyScheduleItem[] {
    const monthlyRate = annualRate.div(100).div(12);
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, months);
    const schedule: MonthlyScheduleItem[] = [];
    
    let remainingPrincipal = principal;
    
    for (let month = 1; month <= months; month++) {
      // 이자 = 잔여원금 × 월 이자율
      const interest = remainingPrincipal.times(monthlyRate);
      
      // 원금 상환액 = 월 상환액 - 이자
      const principalPayment = monthlyPayment.minus(interest);
      
      // 잔여 원금 감소
      remainingPrincipal = remainingPrincipal.minus(principalPayment);
      
      schedule.push({
        month,
        principal: principalPayment,
        interest,
        totalPayment: monthlyPayment,
        remainingPrincipal: remainingPrincipal.lt(0) ? Big(0) : remainingPrincipal,
      });
    }
    
    return schedule;
  }
  
  calculateEarlyRepayFee(
    remainingPrincipal: Big,
    feeRate: Big,
    remainingMonths: number,
    totalMonths: number,
    feeWaiverMonths: number
  ): Big {
    // 경과 기간 계산
    const elapsedMonths = totalMonths - remainingMonths;
    
    // 수수료 면제 기간 경과 시 수수료 없음
    if (elapsedMonths >= feeWaiverMonths) {
      return Big(0);
    }
    
    // 기본 수수료 = 잔여원금 × 수수료율(%)
    const baseFee = remainingPrincipal.times(feeRate).div(100);
    
    // 시간 비례 감면: (잔여개월 / 전체개월) 비율로 수수료 적용
    const timeRatio = Big(remainingMonths).div(totalMonths);
    const adjustedFee = baseFee.times(timeRatio);
    
    return adjustedFee;
  }
}

/**
 * 원금균등 상환 전략
 * 
 * 금융적 근거:
 * - 매월 동일한 원금을 상환하는 방식입니다
 * - 초반 상환액이 크고 시간이 지날수록 감소합니다
 * - 총 이자 부담이 원리금균등보다 적습니다
 * - 초반 상환 부담이 커서 소득이 안정적인 사람에게 유리합니다
 * 
 * 수식 근거:
 * 월 원금 상환액 = P / n
 * 매월 이자 = 잔여원금 × 월 이자율
 * 
 * 여기서:
 * - P: 원금
 * - n: 상환 개월 수
 */
export class EqualPrincipalStrategy implements RepaymentStrategy {
  calculateMonthlyPayment(principal: Big, annualRate: Big, months: number): Big {
    // 원금균등은 매월 상환액이 변하므로 첫 달 상환액 반환
    const monthlyPrincipal = principal.div(months);
    const monthlyRate = annualRate.div(100).div(12);
    const firstInterest = principal.times(monthlyRate);
    return monthlyPrincipal.plus(firstInterest);
  }
  
  calculateTotalInterest(principal: Big, annualRate: Big, months: number): Big {
    const monthlyRate = annualRate.div(100).div(12);
    const monthlyPrincipal = principal.div(months);
    
    let totalInterest = Big(0);
    let remainingPrincipal = principal;
    
    for (let month = 1; month <= months; month++) {
      // 이자 = 잔여원금 × 월 이자율
      const interest = remainingPrincipal.times(monthlyRate);
      totalInterest = totalInterest.plus(interest);
      
      // 원금 감소
      remainingPrincipal = remainingPrincipal.minus(monthlyPrincipal);
    }
    
    return totalInterest;
  }
  
  getMonthlySchedule(principal: Big, annualRate: Big, months: number): MonthlyScheduleItem[] {
    const monthlyRate = annualRate.div(100).div(12);
    const monthlyPrincipal = principal.div(months);
    const schedule: MonthlyScheduleItem[] = [];
    
    let remainingPrincipal = principal;
    
    for (let month = 1; month <= months; month++) {
      // 이자 = 잔여원금 × 월 이자율
      const interest = remainingPrincipal.times(monthlyRate);
      
      // 총 상환액 = 월 원금 + 이자
      const totalPayment = monthlyPrincipal.plus(interest);
      
      // 잔여 원금 감소
      remainingPrincipal = remainingPrincipal.minus(monthlyPrincipal);
      
      schedule.push({
        month,
        principal: monthlyPrincipal,
        interest,
        totalPayment,
        remainingPrincipal: remainingPrincipal.lt(0) ? Big(0) : remainingPrincipal,
      });
    }
    
    return schedule;
  }
  
  calculateEarlyRepayFee(
    remainingPrincipal: Big,
    feeRate: Big,
    remainingMonths: number,
    totalMonths: number,
    feeWaiverMonths: number
  ): Big {
    // 원금균등도 동일한 중도상환 수수료 로직 적용
    const elapsedMonths = totalMonths - remainingMonths;
    
    if (elapsedMonths >= feeWaiverMonths) {
      return Big(0);
    }
    
    const baseFee = remainingPrincipal.times(feeRate).div(100);
    const timeRatio = Big(remainingMonths).div(totalMonths);
    const adjustedFee = baseFee.times(timeRatio);
    
    return adjustedFee;
  }
}

/**
 * 상환 전략 팩토리
 * 
 * 상환 방식 문자열을 받아 적절한 전략 객체를 반환합니다.
 */
export class RepaymentStrategyFactory {
  static getStrategy(repaymentType: string): RepaymentStrategy {
    switch (repaymentType) {
      case '원리금균등':
        return new EqualPrincipalInterestStrategy();
      case '원금균등':
        return new EqualPrincipalStrategy();
      default:
        throw new Error(`지원하지 않는 상환 방식: ${repaymentType}`);
    }
  }
}
