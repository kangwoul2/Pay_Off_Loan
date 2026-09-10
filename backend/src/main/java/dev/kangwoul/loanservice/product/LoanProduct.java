package dev.kangwoul.loanservice.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

import java.math.BigDecimal;

@Entity
@Table(name = "loan_products", uniqueConstraints = @UniqueConstraint(
        name = "uk_loan_product_bank_name", columnNames = {"bank_name", "product_name"}))
public class LoanProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_name", nullable = false, length = 80)
    private String bankName;

    @Column(name = "product_name", nullable = false, length = 160)
    private String productName;

    @Column(name = "base_rate", nullable = false, precision = 8, scale = 4)
    private BigDecimal baseRate;

    @Version
    private Long version;

    protected LoanProduct() {}

    public LoanProduct(String bankName, String productName, BigDecimal baseRate) {
        this.bankName = bankName;
        this.productName = productName;
        this.baseRate = baseRate;
    }

    public void changeRate(BigDecimal baseRate) {
        this.baseRate = baseRate;
    }

    public Long getId() { return id; }
    public String getBankName() { return bankName; }
    public String getProductName() { return productName; }
    public BigDecimal getBaseRate() { return baseRate; }
    public Long getVersion() { return version; }
}
