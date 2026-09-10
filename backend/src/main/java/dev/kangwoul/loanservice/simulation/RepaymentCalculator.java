package dev.kangwoul.loanservice.simulation;

import java.math.BigDecimal;

public interface RepaymentCalculator {
    RepaymentType supports();
    BigDecimal totalInterest(BigDecimal principal, BigDecimal annualRate, int months);
}
