-- ============================================
-- 대환대출 시뮬레이터 - Supabase 데이터베이스 스키마
-- 작성일: 2026.02.11
-- ============================================

-- ============================================
-- 1. 대출 상품 정보 테이블 (크롤링 데이터)
-- ============================================
CREATE TABLE IF NOT EXISTS loan_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(50) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('신용대출', '마이너스통장')),
  
  -- 금리 정보 (DECIMAL(15,4) 정밀도)
  base_rate DECIMAL(15,4) NOT NULL CHECK (base_rate >= 0 AND base_rate <= 30),
  additional_rate DECIMAL(15,4) DEFAULT 0 CHECK (additional_rate >= 0 AND additional_rate <= 10),
  salary_transfer_discount DECIMAL(15,4) DEFAULT 0.3 CHECK (salary_transfer_discount >= 0 AND salary_transfer_discount <= 5),
  
  -- 한도 및 수수료
  max_limit BIGINT CHECK (max_limit > 0),
  early_repay_fee_rate DECIMAL(15,4) DEFAULT 1.5 CHECK (early_repay_fee_rate >= 0 AND early_repay_fee_rate <= 5),
  fee_waiver_months INT DEFAULT 36 CHECK (fee_waiver_months >= 0 AND fee_waiver_months <= 60),
  
  -- 메타 정보
  crawled_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 중복 방지 (은행명 + 상품명 조합 유니크)
  UNIQUE(bank_name, product_name)
);

-- 인덱스 생성 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_loan_products_bank ON loan_products(bank_name);
CREATE INDEX IF NOT EXISTS idx_loan_products_type ON loan_products(product_type);
CREATE INDEX IF NOT EXISTS idx_loan_products_crawled ON loan_products(crawled_at DESC);

COMMENT ON TABLE loan_products IS '은행별 대출 상품 정보 (크롤링 데이터)';
COMMENT ON COLUMN loan_products.base_rate IS '기본 금리 (%)';
COMMENT ON COLUMN loan_products.additional_rate IS '가산 금리 (%)';
COMMENT ON COLUMN loan_products.salary_transfer_discount IS '급여이체 우대 금리 (%)';

-- ============================================
-- 2. 사용자 보유 대출 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS user_debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) NOT NULL,
  
  -- 대출 기본 정보
  debt_name VARCHAR(100) NOT NULL,
  principal BIGINT NOT NULL CHECK (principal > 0),
  interest_rate DECIMAL(15,4) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 30),
  remaining_months INT NOT NULL CHECK (remaining_months > 0 AND remaining_months <= 600),
  repayment_type VARCHAR(20) NOT NULL CHECK (repayment_type IN ('원리금균등', '원금균등')),
  
  -- 추가 비용 정보
  early_repay_fee BIGINT DEFAULT 0 CHECK (early_repay_fee >= 0),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_debts_session ON user_debts(session_id);

COMMENT ON TABLE user_debts IS '사용자 보유 대출 정보';

-- ============================================
-- 3. 시뮬레이션 결과 테이블 (선택적)
-- ============================================
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) NOT NULL,
  
  -- 시뮬레이션 결과
  total_debt_before BIGINT NOT NULL CHECK (total_debt_before > 0),
  total_debt_after BIGINT NOT NULL CHECK (total_debt_after > 0),
  total_savings BIGINT NOT NULL,  -- 음수 가능 (손해인 경우)
  break_even_months INT CHECK (break_even_months >= 0),
  
  -- 추천 액션
  recommended_action VARCHAR(50) CHECK (recommended_action IN ('즉시_대환', '수수료_면제_대기', '현재_유지')),
  recommended_products JSONB,  -- [{bank, product, rate}] 형식
  
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE simulation_results IS '대환대출 시뮬레이션 결과 이력';

-- ============================================
-- 4. 크롤링 로그 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS crawling_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(50),
  status VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  crawled_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawling_logs_created ON crawling_logs(created_at DESC);

COMMENT ON TABLE crawling_logs IS '크롤링 실행 로그';

-- ============================================
-- 샘플 데이터 삽입 (테스트용, 선택적)
-- ============================================
-- INSERT INTO loan_products (bank_name, product_name, product_type, base_rate, additional_rate, max_limit)
-- VALUES 
--   ('KB', 'KB직장인신용대출', '신용대출', 3.5, 1.7, 100000000),
--   ('신한', '신한 쏠편한 직장인대출', '신용대출', 3.8, 1.5, 80000000);
