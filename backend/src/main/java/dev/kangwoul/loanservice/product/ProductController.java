package dev.kangwoul.loanservice.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductResponse> findAll() {
        return service.findAll();
    }

    @PostMapping("/imports")
    public ResponseEntity<ProductResponse> importProduct(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody ProductImportRequest request) {
        return ResponseEntity.ok(service.importProduct(idempotencyKey, request));
    }

    @PatchMapping("/{id}/rate")
    public ProductResponse changeRate(
            @PathVariable Long id,
            @RequestParam @DecimalMin("0.0") BigDecimal value) {
        return service.changeRate(id, value);
    }
}
