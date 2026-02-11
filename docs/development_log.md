# 개발 일지 (Development Log)

## 프로젝트 개요
- **프로젝트명**: 대환대출 시뮬레이터
- **목적**: 사회초년생의 다중 채무 해결 및 대환대출 의사결정 지원
- **기간**: 2026.02.11 ~ 2026.02.13

---

## 2026.02.11 (수)

### 1단계: 문제 정의 및 페르소나 설정 ✅

#### 핵심 타겟 페르소나
- **메인 페르소나 'A'**: 20대 후반 1~3년차 사회초년생
  - 신용도 개선으로 대출 전환 기회 多
  - 평균 2~3개의 대출 보유 (학자금, 신용대출, 전세자금)
  
- **확장 페르소나**: 40대 이직자, 정년퇴직자

#### 핵심 페인포인트
> "중도상환 수수료를 내면서까지 대환대출을 받는 것이 정말 이득인가?"

#### 서비스 핵심 가치
1. 실질 이득 시뮬레이션 (중도상환 수수료 + 인지세 vs 이자 절감액)
2. 명확한 액션 가이드 (즉시 대환 / 수수료 면제 대기 / 현재 유지)
3. 시각적 비교 (전략 실행 전/후 차트)

---

### 2단계: 기술 스택 및 아키텍처 설계 ✅

#### 기술 스택 선정
- **Frontend**: Next.js 14 + Tailwind CSS + Recharts
- **Backend**: Next.js API Routes + Supabase
- **Crawling**: Python 3.10+ (BeautifulSoup/Selenium)
- **금융 계산**: big.js (정밀도 확보)

#### 핵심 아키텍처 결정사항

##### 1) 정밀도 확보
- **문제**: JavaScript number 타입의 부동소수점 오차
- **해결**: big.js 라이브러리로 모든 금융 계산 처리
- **근거**: 금융 데이터는 DECIMAL(15,4) 수준의 정밀도 필요

##### 2) 상환 방식 확장성
- **해결**: Strategy Pattern 적용
- **구현**: RepaymentStrategy 인터페이스 + 원리금균등/원금균등 클래스
- **근거**: 향후 만기일시, 거치식 등 추가 방식 확장 용이

##### 3) 중도상환 수수료 로직 구체화
- **로직**:
  - 기본 수수료 = 잔여원금 × 수수료율(%)
  - 시간 비례 감면 = (잔여개월 / 전체개월) × 기본 수수료
  - 수수료 면제 기간(보통 3년) 경과 시 수수료 0원

##### 4) 인지세 정책 상수화
- **정책** (2026년 기준):
  - 5천만원 이하: 면제
  - 5천만원 초과 ~ 1억원: 7만원
  - 1억원 초과 ~ 10억원: 15만원
  - 10억원 초과: 35만원
- **구현**: FinanceConfig 클래스로 중앙 관리

##### 5) 금리 정보 현실화
- **구조**: [기본 금리 + 가산 금리] + 급여이체 우대
- **근거**: 모든 우대 조건 크롤링 불가, 사용자 직접 입력 가능하게

##### 6) 데이터 정합성
- **해결**: CHECK 제약조건 (금리 0~30%, 한도 > 0 등)
- **근거**: DB 레벨에서 1차 검증으로 잘못된 데이터 유입 방지

---

### 3단계: 크롤링 파이프라인 설계 및 구현 ✅

#### 프로젝트 구조 생성
```
loan-refinance-simulator/
├── crawling/
│   ├── __init__.py
│   ├── config.py              # 크롤링 설정
│   ├── cleansing.py           # 데이터 전처리
│   ├── crawler.py             # 베이스 크롤러
│   ├── supabase_client.py     # DB 연동
│   ├── main.py                # 실행 파일
│   └── bank_crawlers/
│       ├── __init__.py
│       └── kb_crawler.py      # KB국민은행 (완료)
├── docs/
│   └── development_log.md     # 본 파일
├── .env.example
├── .gitignore
├── requirements.txt
├── database_schema.sql
└── README.md
```

#### 구현 완료 항목
- [x] BaseBankCrawler 추상 클래스 설계
- [x] LoanDataCleaner 전처리 클래스 구현
- [x] SupabaseManager DB 연동 클래스
- [x] KB 크롤러 구현 (더미 데이터 포함)
- [x] 크롤링 설정 및 상수 관리
- [x] Supabase 데이터베이스 스키마 작성

#### 데이터 전처리 파이프라인
1. **크롤링**: Selenium/BeautifulSoup로 HTML 파싱
2. **전처리 (Cleansing)**:
   - 결측치 처리
   - 텍스트 → 숫자 변환 (정규식)
   - 이상치 검증 (금리 범위 체크)
   - 중복 제거 (은행명 + 상품명)
3. **적재**: Supabase UPSERT (중복 시 업데이트)

#### 로깅 전략
- 크롤링 성공/실패 로그 DB 기록
- 파일 로그 생성 (crawling_YYYYMMDD_HHMMSS.log)
- 에러 핸들링 및 재시도 로직

---

## 다음 단계 (TODO)

### 4단계: 대출 계산 알고리즘 구현
- [ ] Strategy Pattern 기반 상환 계산 엔진
- [ ] 중도상환 수수료 계산 로직
- [ ] 손익분기점(BEP) 분석 알고리즘
- [ ] 시뮬레이션 API 엔드포인트

### 5단계: Next.js 프론트엔드 구축
- [ ] 사용자 대출 정보 입력 폼
- [ ] 시뮬레이션 결과 대시보드
- [ ] Recharts 기반 시각화
- [ ] 반응형 UI (Tailwind CSS)

### 6단계: Vercel 배포
- [ ] 환경 변수 설정
- [ ] 빌드 최적화
- [ ] Early Deploy 및 피드백
- [ ] 도메인 연결

### 7단계: 문서화 및 제출
- [ ] README 최종 업데이트
- [ ] 기획서 작성
- [ ] 과제 제출

---

## 기술적 도전 과제 및 해결 방법

### 도전 1: JavaScript 부동소수점 오차
- **문제**: 금융 계산에서 소수점 오차 발생
- **해결**: big.js 라이브러리 사용
- **결과**: DECIMAL(15,4) 수준 정밀도 확보

### 도전 2: 은행 사이트 크롤링 난이도
- **문제**: 각 은행마다 다른 HTML 구조, 동적 렌더링
- **해결**: 
  - Selenium으로 동적 페이지 처리
  - 은행별 크롤러 개별 구현
  - 실패 시 더미 데이터 사용 (테스트용)
- **향후 개선**: robots.txt 확인, 크롤링 빈도 제한

### 도전 3: 데이터 정합성 확보
- **문제**: 크롤링 데이터의 신뢰도 문제
- **해결**:
  - 전처리 단계에서 검증 (금리 범위, 한도 등)
  - DB CHECK 제약조건 설정
  - 크롤링 로그 기록으로 추적 가능

---

## 개발 메모

### 유용한 명령어
```bash
# 가상환경 활성화
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# 크롤링 실행
python -m crawling.main

# Supabase 테이블 확인
# Supabase Dashboard > Table Editor
```

### 참고 자료
- [Supabase 공식 문서](https://supabase.com/docs)
- [big.js GitHub](https://github.com/MikeMcl/big.js)
- [Selenium 문서](https://selenium-python.readthedocs.io/)

---

**최종 업데이트**: 2026.02.11
