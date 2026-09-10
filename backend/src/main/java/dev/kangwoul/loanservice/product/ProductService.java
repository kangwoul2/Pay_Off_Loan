package dev.kangwoul.loanservice.product;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {
    private final LoanProductRepository products;
    private final IdempotencyRecordRepository idempotencyRecords;

    public ProductService(LoanProductRepository products, IdempotencyRecordRepository idempotencyRecords) {
        this.products = products;
        this.idempotencyRecords = idempotencyRecords;
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "loan-product-list")
    public List<ProductResponse> findAll() {
        return products.findAll().stream().map(ProductResponse::from).toList();
    }

    @Transactional
    @CacheEvict(cacheNames = "loan-product-list", allEntries = true)
    public ProductResponse importProduct(String idempotencyKey, ProductImportRequest request) {
        return idempotencyRecords.findById(idempotencyKey)
                .flatMap(record -> products.findById(record.getResourceId()))
                .map(ProductResponse::from)
                .orElseGet(() -> persistNewImport(idempotencyKey, request));
    }

    private ProductResponse persistNewImport(String idempotencyKey, ProductImportRequest request) {
        LoanProduct product = products.findByBankNameAndProductName(request.bankName(), request.productName())
                .orElseGet(() -> new LoanProduct(request.bankName(), request.productName(), request.baseRate()));
        product.changeRate(request.baseRate());
        LoanProduct saved = products.save(product);
        idempotencyRecords.save(new IdempotencyRecord(idempotencyKey, saved.getId()));
        return ProductResponse.from(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = "loan-product-list", allEntries = true)
    public ProductResponse changeRate(Long id, BigDecimal newRate) {
        LoanProduct product = products.findById(id).orElseThrow(EntityNotFoundException::new);
        product.changeRate(newRate);
        return ProductResponse.from(product);
    }
}
