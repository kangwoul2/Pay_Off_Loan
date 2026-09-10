package dev.kangwoul.loanservice.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductImportRequest(
        @NotBlank String bankName,
        @NotBlank String productName,
        @NotNull @DecimalMin("0.0") BigDecimal baseRate
) {}
