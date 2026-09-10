package dev.kangwoul.loanservice.simulation;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

@Component
public class EqualPaymentCalculator implements RepaymentCalculator {
    private static final MathContext MC = new MathContext(24, RoundingMode.HALF_UP);
    private static final BigDecimal TWELVE = BigDecimal.valueOf(12);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    @Override
    public RepaymentType supports() {
        return RepaymentType.EQUAL_PAYMENT;
    }

    @Override
    public BigDecimal totalInterest(BigDecimal principal, BigDecimal annualRate, int months) {
        BigDecimal monthlyRate = annualRate.divide(HUNDRED, MC).divide(TWELVE, MC);
        if (monthlyRate.signum() == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal factor = BigDecimal.ONE.add(monthlyRate, MC).pow(months, MC);
        BigDecimal payment = principal
                .multiply(monthlyRate, MC)
                .multiply(factor, MC)
                .divide(factor.subtract(BigDecimal.ONE, MC), MC);
        BigDecimal totalPaid = payment.multiply(BigDecimal.valueOf(months), MC);
        return totalPaid.subtract(principal, MC).setScale(0, RoundingMode.HALF_UP);
    }
}
