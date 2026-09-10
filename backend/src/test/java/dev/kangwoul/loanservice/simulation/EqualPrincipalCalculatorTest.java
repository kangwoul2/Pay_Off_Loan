package dev.kangwoul.loanservice.simulation;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class EqualPrincipalCalculatorTest {
    private final EqualPrincipalCalculator calculator = new EqualPrincipalCalculator();

    @Test
    void zeroRateProducesZeroInterest() {
        BigDecimal interest = calculator.totalInterest(
                BigDecimal.valueOf(100_000_000), BigDecimal.ZERO, 120);
        assertThat(interest).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void positiveRateProducesPositiveInterest() {
        BigDecimal interest = calculator.totalInterest(
                BigDecimal.valueOf(100_000_000), BigDecimal.valueOf(4.5), 120);
        assertThat(interest).isPositive();
    }
}
