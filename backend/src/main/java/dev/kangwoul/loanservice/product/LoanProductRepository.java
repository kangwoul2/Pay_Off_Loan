package dev.kangwoul.loanservice.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanProductRepository extends JpaRepository<LoanProduct, Long> {
    Optional<LoanProduct> findByBankNameAndProductName(String bankName, String productName);
}
