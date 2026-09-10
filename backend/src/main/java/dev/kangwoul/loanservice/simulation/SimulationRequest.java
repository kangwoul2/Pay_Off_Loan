package dev.kangwoul.loanservice.simulation;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SimulationRequest(
        @NotNull @DecimalMin("1") BigDecimal principal,
        @NotNull @DecimalMin("0.0") BigDecimal currentAnnualRate,
        @NotNull @DecimalMin("0.0") BigDecimal newAnnualRate,
        @Min(1) @Max(600) int remainingMonths,
        @NotNull @DecimalMin("0.0") BigDecimal earlyRepaymentFee,
        @NotNull @DecimalMin("0.0") BigDecimal migrationCost,
        @NotNull RepaymentType repaymentType
) {}
