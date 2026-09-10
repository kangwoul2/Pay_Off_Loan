package dev.kangwoul.loanservice.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "idempotency_records")
public class IdempotencyRecord {
    @Id
    @Column(name = "idempotency_key", length = 120)
    private String key;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    protected IdempotencyRecord() {}

    public IdempotencyRecord(String key, Long resourceId) {
        this.key = key;
        this.resourceId = resourceId;
    }

    public String getKey() { return key; }
    public Long getResourceId() { return resourceId; }
}
