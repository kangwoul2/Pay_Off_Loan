<div align="center">

# 💳 Loan Refinance Simulator

### 대환대출 비용·손익분기점(BEP) 시뮬레이션 서비스

금리만 비교하는 계산기가 아니라 **대환 과정에서 실제 의사결정에 영향을 주는 비용과 상환 시점을 함께 모델링**한 금융 시뮬레이션 프로젝트입니다.

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-Data%20Pipeline-3776AB?style=flat-square&logo=python&logoColor=white)
![Big.js](https://img.shields.io/badge/Big.js-Decimal%20Arithmetic-222222?style=flat-square)

**Live Demo** · https://pay-off-loan.vercel.app/

</div>

---

## 1. Why this project?

대환대출은 단순히 `현재 금리 > 신규 금리`만으로 결정하기 어렵습니다.

실제 의사결정에는 다음 항목이 함께 영향을 줍니다.

- 기존 대출의 남은 원금과 잔여 기간
- 중도상환수수료
- 신규 대출 금리와 우대금리
- 인지세 등 대환 비용
- 원리금균등 / 원금균등 상환 방식
- 지금 갈아탈지, 수수료 면제 시점까지 기다릴지

이 프로젝트는 위 변수를 **월별 현금흐름으로 계산하여 여러 전략의 총비용과 손익분기점을 비교**하도록 설계했습니다.

---

## 2. Core Features

### 2.1 세 가지 대환 전략 비교

```text
현재 대출 유지
       │
       ├──────────────┐
       │              │
       ▼              ▼
   즉시 대환      수수료 면제 후 대환
       │              │
       └──────┬───────┘
              ▼
        총 상환 비용 비교
              ▼
         최적 전략 선택
```

서비스는 다음 전략을 동일한 기준으로 비교합니다.

- `현재_유지`
- `즉시_대환`
- `수수료_면제_대기`

각 전략에 대해 월별 상환 스케줄과 누적 비용을 계산한 뒤 순절감액이 가장 큰 전략을 선택합니다.

### 2.2 금융 계산 정밀도 관리

JavaScript의 `Number`만으로 금융 계산을 수행할 때 발생할 수 있는 부동소수점 오차를 줄이기 위해 **Big.js**를 사용했습니다.

```text
대출 원금
  + 이자
  + 중도상환수수료
  + 인지세
  - 이자 절감액
        ↓
     순절감액
```

계산 로직은 UI 컴포넌트에서 분리하여 `simulation-service`와 상환 전략 계층에서 관리합니다.

### 2.3 상환 방식 Strategy Pattern

상환 방식별 계산 로직을 하나의 조건문에 몰아넣지 않고 **Strategy + Factory 구조**로 분리했습니다.

```text
RepaymentStrategy
       ▲
       │
 ┌─────┴─────┐
 │           │
원리금균등   원금균등
```

이를 통해 상환 방식 추가 시 시뮬레이션 서비스의 핵심 흐름을 수정하지 않고 계산 정책을 확장할 수 있도록 구성했습니다.

### 2.4 상품 데이터 수집 파이프라인

웹 런타임과 데이터 수집 작업을 분리했습니다.

```text
Bank / Product Source
        │
        ▼
Python Crawling
        │
        ▼
Data Cleansing
        │
        ▼
Supabase Client
        │
        ▼
PostgreSQL
        │
        ▼
Next.js Application
```

`crawling/` 디렉터리는 크롤러, 정제 로직, Supabase 적재 로직을 별도로 관리합니다.

---

## 3. Architecture

```text
┌──────────────────────────────────────────────┐
│                 Next.js 14                   │
│                                              │
│  UI / Input                                  │
│      │                                       │
│      ▼                                       │
│  Simulation Service                          │
│      │                                       │
│      ├── Finance Config                      │
│      ├── Repayment Strategy                  │
│      └── Best Option Selection               │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
              Supabase / PostgreSQL
                       ▲
                       │
             Python Data Pipeline
```

### Storage Model

```text
loan_products
├─ bank / product
├─ rate / discount
├─ limit / fee policy
└─ crawled_at

user_debts
├─ session_id
├─ principal
├─ interest_rate
├─ remaining_months
└─ repayment_type

simulation_results
├─ before / after total cost
├─ savings
├─ break_even_months
└─ recommended_action

crawling_logs
├─ bank
├─ status
├─ crawled_count
└─ error_message
```

DB 수준에서는 금리·기간 범위에 `CHECK` 제약을 적용하고, 상품은 `(bank_name, product_name)` 조합을 `UNIQUE`로 두어 중복 적재를 방지하도록 설계했습니다.

---

## 4. Engineering Decisions

### Why Big.js instead of native Number?

**대안**

1. JavaScript `Number`
2. 정수 단위로 환산 후 직접 계산
3. Decimal arithmetic library

**선택: Big.js**

금융 계산은 반복되는 이자 계산과 비용 합산 과정에서 작은 오차가 누적될 수 있습니다. 프로젝트 규모에서 별도의 계산 서버를 분리하는 것보다 Decimal 연산 라이브러리를 적용하는 것이 단순하면서도 계산 의도를 명확히 유지할 수 있다고 판단했습니다.

### Why separate crawling from the web runtime?

크롤링은 웹 요청과 실행 특성이 다릅니다.

- 웹 요청: 짧고 빠른 응답이 중요
- 데이터 수집: 외부 페이지 지연과 실패 가능성이 존재

따라서 크롤링 코드를 Next.js 요청 처리 경로에 포함하지 않고 Python 파이프라인으로 분리했습니다. 이 구조는 향후 Scheduler / Queue 기반 데이터 적재 작업으로 확장하기도 쉽습니다.

### Why PostgreSQL schema constraints?

애플리케이션 검증만 사용하면 다른 적재 경로에서 잘못된 데이터가 들어갈 수 있습니다. 그래서 `CHECK`, `UNIQUE`, index를 DB 계층에도 두어 데이터 무결성을 이중으로 보호하도록 설계했습니다.

---

## 5. Testability

`src/tests/`에 금융 계산을 검증하기 위한 테스트 케이스와 validator, test runner가 분리되어 있습니다.

검증 대상은 단순 UI 동작이 아니라 다음과 같은 **도메인 계산 결과**입니다.

- 상환 방식별 계산
- 수수료/비용 반영
- BEP 계산
- 비정상 입력 처리
- 전략별 비교 결과

> 향후 CI에서 금융 계산 회귀 테스트를 자동 실행하도록 확장할 예정입니다.

---

## 6. Project Structure

```text
.
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/           # UI / visualization
│   ├── lib/
│   │   ├── config/           # finance policies
│   │   ├── services/         # simulation orchestration
│   │   ├── strategies/       # repayment strategies
│   │   └── utils/
│   └── tests/                # domain validation
│
├── crawling/
│   ├── bank_crawlers/
│   ├── cleansing.py
│   ├── crawler.py
│   ├── main.py
│   └── supabase_client.py
│
├── database_schema.sql
├── QUICKSTART.md
└── docs/
```

---

## 7. Tech Stack

| Area | Stack | Purpose |
|---|---|---|
| Web | Next.js 14, React, TypeScript | UI 및 서비스 로직 |
| Finance Engine | Big.js | Decimal 기반 금융 연산 |
| Visualization | Recharts | 전략별 비용/현금흐름 시각화 |
| Database | Supabase, PostgreSQL | 상품·대출·시뮬레이션 데이터 |
| Data Pipeline | Python, Selenium | 금융 상품 데이터 수집/정제 |
| Deployment | Vercel | Web deployment |

---

## 8. Getting Started

### Web

```bash
npm install
npm run dev
```

### Type Check

```bash
npm run type-check
```

### Data Pipeline

Python 의존성은 웹 애플리케이션과 분리되어 있습니다.

```bash
pip install -r crawling/requirements.txt
python -m crawling.main
```

환경 변수와 상세 실행 순서는 [`QUICKSTART.md`](./QUICKSTART.md)를 참고합니다.

---

## 9. Backend-oriented Roadmap

현재 구현을 기반으로 다음 개선을 진행할 수 있습니다. 아래 항목은 **구현 완료 기능과 구분된 확장 계획**입니다.

- [ ] 계산 API와 UI 계층을 명확하게 분리
- [ ] 금융 상품 적재 API에 idempotency 적용
- [ ] 크롤링 작업을 Queue 기반 background worker로 분리
- [ ] 데이터 갱신 실패에 Retry / Backoff 적용
- [ ] PostgreSQL transaction 및 동시 업데이트 테스트
- [ ] API integration test와 CI 구축
- [ ] 부하 테스트를 통해 p95 latency / error rate 측정

---

## 10. What this project demonstrates

이 프로젝트에서 보여주고 싶은 것은 금융 도메인 지식 자체보다 다음의 개발 역량입니다.

- 복잡한 계산 정책을 **서비스와 전략 객체로 분리하는 설계**
- 금융 연산에서 **정확성과 데이터 무결성을 우선하는 구현**
- Web Runtime과 Data Pipeline의 **책임 분리**
- DB constraint를 포함한 **다층 검증**
- 기능을 추가하기 전에 대안과 trade-off를 고려하는 개발 방식

---

<div align="center">

**Built as a decision-support system, not just a calculator.**

</div>
