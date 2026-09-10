package dev.kangwoul.loanservice.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ProductRateUpdateRequest(
        @NotNull @DecimalMin("0.0") BigDecimal value,
        @NotNull @PositiveOrZero Long expectedVersion
) {}
