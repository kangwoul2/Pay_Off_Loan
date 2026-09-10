package dev.kangwoul.loanservice.simulation;

import java.math.BigDecimal;

public record SimulationResponse(
        BigDecimal currentTotalCost,
        BigDecimal refinanceTotalCost,
        BigDecimal netSavings,
        String recommendation
) {}
