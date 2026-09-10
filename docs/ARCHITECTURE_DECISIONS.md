# Architecture Decisions

이 문서는 기능 목록보다 **왜 이 구조를 선택했는지**를 설명하기 위한 기록입니다.

## ADR-001. 금융 계산에 Big.js 사용

### Context
JavaScript `Number`는 IEEE-754 부동소수점 표현을 사용하므로 반복적인 금융 계산에서 오차가 누적될 수 있습니다.

### Alternatives
1. `Number` 그대로 사용
2. 모든 값을 최소 화폐 단위 정수로 변환
3. Decimal arithmetic library 사용

### Decision
`Big.js`를 사용해 금리·수수료·누적 상환액 계산을 수행합니다.

### Trade-off
- 장점: 계산 의도가 명확하고 decimal 연산 제어가 쉬움
- 단점: 외부 라이브러리 의존 및 변환 비용 발생

현재 서비스 규모에서는 정확성과 구현 단순성의 균형이 가장 좋다고 판단했습니다.

---

## ADR-002. 상환 방식별 Strategy Pattern

### Context
원리금균등과 원금균등은 월별 원금·이자 계산식이 다릅니다. 이를 하나의 서비스 함수에서 조건문으로 계속 분기하면 계산 정책이 증가할수록 핵심 서비스가 복잡해집니다.

### Alternatives
1. 하나의 함수 내부 `if/else`
2. 상환 방식별 독립 함수
3. Strategy interface + Factory

### Decision
상환 방식을 Strategy 객체로 분리하고 Factory에서 선택합니다.

### Reason
시뮬레이션 서비스는 `어떤 전략을 사용해야 하는지`만 결정하고 실제 계산 정책은 각 Strategy가 책임지도록 분리했습니다.

---

## ADR-003. 크롤링 파이프라인과 Web Runtime 분리

### Context
웹 요청은 짧은 응답 시간이 중요한 반면, 크롤링은 네트워크 지연·외부 사이트 장애·재시도가 발생할 수 있습니다.

### Alternatives
1. Next.js 요청 시 실시간 크롤링
2. 주기적 Python 수집 후 DB 적재
3. 별도 Queue + Worker 서비스

### Decision
현재는 Python 수집 파이프라인을 웹 런타임에서 분리하여 DB에 먼저 적재합니다.

### Why not Queue yet?
현재 규모에서 별도 메시지 브로커를 도입하면 운영 복잡도가 더 큽니다. 향후 수집 대상/빈도가 증가하고 재시도·스케줄링 요구가 커지면 Queue worker 구조로 전환할 예정입니다.

---

## ADR-004. DB Constraint를 애플리케이션 검증과 함께 사용

### Context
웹 입력에서는 검증했더라도 Python crawler나 관리자 SQL 등 다른 경로에서 잘못된 데이터가 들어올 수 있습니다.

### Decision
- 금리/기간 범위: `CHECK`
- 상품 중복: `UNIQUE(bank_name, product_name)`
- 조회 패턴: bank/type/crawled_at index

애플리케이션 검증과 DB 무결성 제약을 함께 사용합니다.

---

## ADR-005. 현재는 Monolith-first

서비스를 처음부터 MSA로 분리하지 않았습니다.

```text
Next.js Application
├─ UI
├─ Simulation Service
├─ Repayment Strategy
└─ DB Access

Python Data Pipeline
└─ Crawling / Cleansing / Load
```

웹과 배치성 수집 작업은 실행 특성이 달라 분리했지만, 계산 기능 자체는 하나의 애플리케이션 안에 유지합니다.

서비스 분리는 다음 조건이 실제로 관찰될 때 검토합니다.

- 계산 API와 UI의 독립 배포 필요
- 크롤링이 웹 서비스 성능에 영향을 줌
- 데이터 적재량 증가로 worker scale-out 필요
- 별도 서비스별 장애 격리 필요

---

## ADR-006. 향후 Idempotency

금융 상품 수집 작업이 retry될 경우 같은 상품이 중복 적재될 수 있습니다.

현재 DB의 `(bank_name, product_name)` UNIQUE constraint가 1차 안전장치입니다.

향후 HTTP ingestion API / Queue worker를 추가한다면 다음 구조를 검토합니다.

```text
request_id / source_event_id
          ↓
processed_requests 확인
          ↓
이미 처리 → 기존 결과
미처리   → 처리 + 기록
```

즉 `Retry 가능성 → 중복 가능성 → Idempotency 필요`의 순서로 접근합니다.

---

## ADR-007. Performance claims policy

README와 포트폴리오에는 측정하지 않은 성능 개선 수치를 적지 않습니다.

성능 개선을 진행할 경우 반드시 아래 순서를 사용합니다.

```text
Baseline
→ 동일 workload
→ Change
→ 동일 workload 재측정
→ p50 / p95 / throughput / error rate 비교
```

이를 통해 기술 도입이 실제 문제 해결에 기여했는지 검증합니다.
