package dev.kangwoul.loanservice.product;

import java.math.BigDecimal;

public record ProductResponse(Long id, String bankName, String productName, BigDecimal baseRate, Long version) {
    static ProductResponse from(LoanProduct product) {
        return new ProductResponse(
                product.getId(), product.getBankName(), product.getProductName(), product.getBaseRate(), product.getVersion());
    }
}
