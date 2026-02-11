# 🏦 대환대출 시뮬레이터

사회초년생의 다중 채무 해결 및 대환대출 의사결정을 돕는 웹 서비스

## 📋 프로젝트 개요

본 프로젝트는 사용자가 보유한 대출 정보를 입력하면, 시중 은행의 최신 대출 상품과 비교하여 
**중도상환 수수료 + 인지세를 고려한 실질적인 대환대출 손익분기점**을 계산하고 최적의 전략을 제안합니다.

### 핵심 기능
- ✅ 5대 은행 대출 상품 자동 크롤링
- ✅ 원리금균등/원금균등 상환 방식별 정밀 계산 (big.js 사용)
- ✅ 중도상환 수수료 + 인지세 반영
- ✅ 손익분기점(BEP) 분석
- ✅ 시각화된 시뮬레이션 결과 (Recharts)

---

## 🚀 빠른 시작 (Quick Start)

### 1️⃣ 사전 준비

**필수 설치 항목:**
- Python 3.10 이상
- Node.js 18 이상
- Git
- Chrome 브라우저 (크롤링용)

### 2️⃣ 프로젝트 클론 및 이동

```bash
# 이미 다운로드한 경우 압축 해제 후
cd loan-refinance-simulator

# 또는 Git clone (원격 저장소 생성 후)
git clone <your-repository-url>
cd loan-refinance-simulator
```

### 3️⃣ Python 가상환경 설정

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4️⃣ Python 패키지 설치

```bash
pip install -r requirements.txt
```

### 5️⃣ 환경 변수 설정

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 열어서 Supabase 정보 입력
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
```

**Supabase 설정 방법:**
1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Settings → API → URL 및 anon key 복사
4. SQL Editor에서 `database_schema.sql` 실행

### 6️⃣ 크롤링 테스트 실행

```bash
# Python 경로 확인
python --version

# 크롤링 실행 (현재는 KB만 활성화)
python -m crawling.main
```

---

## 📁 프로젝트 구조

```
loan-refinance-simulator/
├── crawling/                      # 크롤링 파이프라인
│   ├── __init__.py
│   ├── config.py                  # 크롤링 설정
│   ├── cleansing.py               # 데이터 전처리
│   ├── crawler.py                 # 베이스 크롤러
│   ├── supabase_client.py         # DB 연동
│   ├── main.py                    # 실행 파일
│   └── bank_crawlers/             # 은행별 크롤러
│       ├── __init__.py
│       ├── kb_crawler.py          # KB국민은행
│       ├── shinhan_crawler.py     # 신한은행 (TODO)
│       ├── hana_crawler.py        # 하나은행 (TODO)
│       ├── woori_crawler.py       # 우리은행 (TODO)
│       └── nh_crawler.py          # NH농협 (TODO)
├── docs/                          # 문서
│   └── development_log.md         # 개발 일지
├── .env.example                   # 환경 변수 템플릿
├── .gitignore                     # Git 제외 파일
├── requirements.txt               # Python 패키지
├── database_schema.sql            # DB 스키마
└── README.md                      # 본 파일
```

---

## 🗄️ 데이터베이스 설정

### Supabase 테이블 생성

1. Supabase 대시보드 접속
2. SQL Editor 열기
3. `database_schema.sql` 파일 내용 복사
4. 실행 (Run)

### 테이블 구조
- `loan_products`: 크롤링된 대출 상품 정보
- `user_debts`: 사용자 보유 대출 (선택적)
- `simulation_results`: 시뮬레이션 이력 (선택적)
- `crawling_logs`: 크롤링 실행 로그

---

## 🛠️ 개발 가이드

### 크롤링 파이프라인 수정

새로운 은행 크롤러 추가 시:

1. `crawling/bank_crawlers/` 에 새 파일 생성
2. `BaseBankCrawler` 상속
3. `crawl()` 메소드 구현
4. `main.py`에 크롤러 추가

```python
# 예시: shinhan_crawler.py
from ..crawler import BaseBankCrawler

class ShinhanCrawler(BaseBankCrawler):
    def __init__(self):
        super().__init__('신한')
        self.url = self.config.BANK_URLS['신한']
    
    def crawl(self):
        # 크롤링 로직 구현
        pass
```

### 데이터 전처리 커스터마이징

`crawling/cleansing.py`의 `LoanDataCleaner` 클래스 수정

---

## 📝 Git 커밋 가이드

### 커밋 메시지 컨벤션

```bash
# 기능 추가
git commit -m "feat: KB 크롤러 구현"

# 버그 수정
git commit -m "fix: 금리 파싱 오류 수정"

# 문서 업데이트
git commit -m "docs: README 설치 가이드 추가"

# 리팩토링
git commit -m "refactor: 데이터 전처리 로직 개선"

# 테스트
git commit -m "test: 크롤링 유닛 테스트 추가"
```

### 개발 과정 기록

`docs/development_log.md`에 개발 일지 작성

---

## ⚠️ 주의사항

### 크롤링 관련
1. **법적 준수**: 각 은행의 robots.txt 확인 및 이용약관 준수
2. **속도 제한**: 과도한 요청으로 서버 부하 방지
3. **선택자 업데이트**: 은행 사이트 개편 시 셀렉터 수정 필요

### 데이터 정확성
1. 크롤링 데이터는 참고용이며, 실제 대출 신청 전 은행 확인 필수
2. 금리는 개인 신용도에 따라 달라질 수 있음

---

## 🐛 문제 해결 (Troubleshooting)

### Chrome 드라이버 오류
```bash
# webdriver-manager가 자동으로 설치하지만, 실패 시:
pip install --upgrade webdriver-manager
```

### Supabase 연결 오류
```bash
# .env 파일 확인
# URL과 KEY가 정확한지 체크
cat .env
```

### Python 모듈 import 오류
```bash
# 가상환경 활성화 확인
which python  # Mac/Linux
where python  # Windows

# 재설치
pip install -r requirements.txt --force-reinstall
```

---

## 📚 다음 단계 (Roadmap)

- [ ] 3단계: 크롤링 파이프라인 완성 (현재)
- [ ] 4단계: 대출 계산 알고리즘 구현
- [ ] 5단계: Next.js 프론트엔드 구축
- [ ] 6단계: Vercel 배포
- [ ] 7단계: 문서화 및 제출

---

## 📧 문의

프로젝트 관련 문의: [info@noaats.com](mailto:info@noaats.com)

---

**노아에이티에스㈜ 2026년 신입사원 채용 사전과제**
