package dev.kangwoul.loanservice.product;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
            @Valid @RequestBody ProductRateUpdateRequest request) {
        return service.changeRate(id, request);
    }
}
