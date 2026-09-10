package dev.kangwoul.loanservice.simulation;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RefinanceSimulationServiceTest {
    private final RefinanceSimulationService service = new RefinanceSimulationService(
            List.of(new EqualPrincipalCalculator(), new EqualPaymentCalculator()));

    @Test
    void lowerRateCanBeatMigrationCost() {
        SimulationRequest request = new SimulationRequest(
                BigDecimal.valueOf(200_000_000),
                BigDecimal.valueOf(5.5),
                BigDecimal.valueOf(3.5),
                240,
                BigDecimal.valueOf(500_000),
                BigDecimal.valueOf(150_000),
                RepaymentType.EQUAL_PAYMENT
        );
        SimulationResponse response = service.simulate(request);
        assertThat(response.netSavings()).isPositive();
        assertThat(response.recommendation()).isEqualTo("REFINANCE");
    }
}
