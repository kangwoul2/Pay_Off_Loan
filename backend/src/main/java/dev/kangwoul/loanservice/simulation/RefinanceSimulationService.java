package dev.kangwoul.loanservice.simulation;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class RefinanceSimulationService {
    private final Map<RepaymentType, RepaymentCalculator> calculators = new EnumMap<>(RepaymentType.class);

    public RefinanceSimulationService(List<RepaymentCalculator> calculators) {
        calculators.forEach(calculator -> this.calculators.put(calculator.supports(), calculator));
    }

    public SimulationResponse simulate(SimulationRequest request) {
        RepaymentCalculator calculator = calculators.get(request.repaymentType());
        if (calculator == null) {
            throw new IllegalArgumentException("unsupported repayment type: " + request.repaymentType());
        }

        BigDecimal currentInterest = calculator.totalInterest(
                request.principal(), request.currentAnnualRate(), request.remainingMonths());
        BigDecimal refinanceInterest = calculator.totalInterest(
                request.principal(), request.newAnnualRate(), request.remainingMonths());

        BigDecimal currentTotal = request.principal().add(currentInterest);
        BigDecimal refinanceTotal = request.principal()
                .add(refinanceInterest)
                .add(request.earlyRepaymentFee())
                .add(request.migrationCost());
        BigDecimal savings = currentTotal.subtract(refinanceTotal);
        String recommendation = savings.signum() > 0 ? "REFINANCE" : "KEEP_CURRENT";
        return new SimulationResponse(currentTotal, refinanceTotal, savings, recommendation);
    }
}
