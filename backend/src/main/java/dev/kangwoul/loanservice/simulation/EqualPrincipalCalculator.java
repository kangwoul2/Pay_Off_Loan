package dev.kangwoul.loanservice.simulation;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

@Component
public class EqualPrincipalCalculator implements RepaymentCalculator {
    private static final MathContext MC = new MathContext(24, RoundingMode.HALF_UP);
    private static final BigDecimal TWELVE = BigDecimal.valueOf(12);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    @Override
    public RepaymentType supports() {
        return RepaymentType.EQUAL_PRINCIPAL;
    }

    @Override
    public BigDecimal totalInterest(BigDecimal principal, BigDecimal annualRate, int months) {
        BigDecimal monthlyRate = annualRate.divide(HUNDRED, MC).divide(TWELVE, MC);
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(months), MC);
        BigDecimal balance = principal;
        BigDecimal interest = BigDecimal.ZERO;
        for (int month = 0; month < months; month++) {
            interest = interest.add(balance.multiply(monthlyRate, MC), MC);
            balance = balance.subtract(monthlyPrincipal, MC).max(BigDecimal.ZERO);
        }
        return interest.setScale(0, RoundingMode.HALF_UP);
    }
}
