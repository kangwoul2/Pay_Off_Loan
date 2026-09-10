CREATE TABLE IF NOT EXISTS loan_products (
    id BIGSERIAL PRIMARY KEY,
    bank_name VARCHAR(80) NOT NULL,
    product_name VARCHAR(160) NOT NULL,
    base_rate NUMERIC(8,4) NOT NULL CHECK (base_rate >= 0 AND base_rate <= 100),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_loan_product_bank_name UNIQUE (bank_name, product_name)
);

CREATE TABLE IF NOT EXISTS idempotency_records (
    idempotency_key VARCHAR(120) PRIMARY KEY,
    resource_id BIGINT NOT NULL REFERENCES loan_products(id)
);

CREATE INDEX IF NOT EXISTS idx_loan_products_bank_name ON loan_products(bank_name);
