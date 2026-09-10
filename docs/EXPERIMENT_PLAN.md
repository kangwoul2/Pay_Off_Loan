# Experiment Plan

## Experiment 1. Optimistic concurrency

### Question
동일 상품 금리를 여러 요청이 같은 version으로 수정하면 stale update를 어떻게 감지할 것인가?

### Baseline failure model
read → modify → write를 version 검증 없이 수행하면 마지막 write가 이전 update를 덮어쓸 수 있습니다.

### V2 mechanism
- DB row에 JPA `@Version`
- API 요청이 `expectedVersion`을 함께 전송
- application-level stale version 검증
- flush/commit 시 JPA optimistic locking을 추가 방어선으로 사용
- stale request는 HTTP 409로 반환

### Reproduction
`python experiments/optimistic_lock_probe.py --product-id <id> --version <version>`

### Metrics
- HTTP 200 count
- HTTP 409 count
- final row version
- final base_rate

## Experiment 2. Cache boundary

### Question
반복 조회가 많은 상품 목록에서 cache가 유효한가?

### Protocol
1. 동일 데이터셋과 동일 JVM 환경 준비
2. cache warm-up 횟수 고정
3. default/simple cache와 redis profile을 각각 반복 측정
4. p50/p95 latency와 DB query count를 함께 비교

### Important interpretation
Redis는 network hop이 있으므로 단일 프로세스의 in-memory cache보다 항상 빠르지 않습니다. 이 실험의 목적은 Redis를 '더 빠른 캐시'라고 증명하는 것이 아니라 **다중 인스턴스에서 공유 가능한 cache가 필요한 시점의 비용을 수치로 이해하는 것**입니다.

## Experiment 3. Idempotent import

동일한 `Idempotency-Key`로 product import를 재시도하여 동일 resource response가 반환되는지 확인합니다. 별도로 동시 중복 요청을 발생시켜 DB unique constraint가 최종 무결성 경계로 동작하는지도 관찰합니다.
