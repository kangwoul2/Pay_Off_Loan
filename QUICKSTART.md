# 🚀 빠른 시작 가이드

## 1️⃣ ZIP 파일 다운로드 및 압축 해제

다운로드한 `loan-refinance-simulator.zip` 파일을 압축 해제하세요.

---

## 2️⃣ Python 가상환경 설정

### Windows:
```bash
cd loan-refinance-simulator
python -m venv venv
venv\Scripts\activate
```

### Mac/Linux:
```bash
cd loan-refinance-simulator
python3 -m venv venv
source venv/bin/activate
```

---

## 3️⃣ 패키지 설치

```bash
pip install -r requirements.txt
```

설치 완료까지 약 2-3분 소요됩니다.

---

## 4️⃣ Supabase 설정

### 4-1. Supabase 프로젝트 생성
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름 및 비밀번호 설정

### 4-2. 데이터베이스 스키마 생성
1. Supabase 대시보드에서 "SQL Editor" 클릭
2. `database_schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기 후 "Run" 클릭

### 4-3. 환경 변수 설정
```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일을 편집기로 열기
code .env   # VSCode
# 또는
nano .env   # 터미널 에디터
```

`.env` 파일에 다음 정보 입력:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

**URL과 KEY 찾는 방법:**
- Supabase 대시보드 → Settings → API
- "Project URL" 복사 → SUPABASE_URL에 붙여넣기
- "anon public" 키 복사 → SUPABASE_KEY에 붙여넣기

---

## 5️⃣ 크롤링 테스트 실행

```bash
python -m crawling.main
```

**예상 출력:**
```
============================================================
대출 상품 크롤링 시작
실행 시각: 2026-02-11 14:30:00
============================================================

============================================================
KB 크롤링 시작
============================================================
KB 드라이버 설정 완료
KB 페이지 접속: https://www.kbstar.com/...
KB: 테스트 더미 데이터 생성
더미 데이터 생성: 2개 상품
✅ KB: 2개 상품 크롤링 성공

============================================================
전체 크롤링 결과: 2개 상품
============================================================
전처리 시작: 2개 레코드
필수 필드 검증 후: 2개 레코드
금리 범위 검증 후: 2개 레코드
중복 제거 후: 2개 레코드
전처리 완료: 2개 레코드
✅ 2개 상품 적재 성공

✅ 크롤링 완료: 총 2개 상품 적재
  - KB: KB직장인신용대출 (금리 3.5~5.2%)
  - KB: KB저금리신용대출 (금리 3.2~5.2%)

============================================================
크롤링 프로세스 종료
종료 시각: 2026-02-11 14:30:15
============================================================
```

---

## 6️⃣ Supabase 데이터 확인

1. Supabase 대시보드 → Table Editor
2. `loan_products` 테이블 클릭
3. 크롤링된 데이터 확인

---

## 7️⃣ Git 사용하기

### 현재 상태 확인
```bash
git status
git log --oneline
```

### 파일 수정 후 커밋
```bash
# 예시: KB 크롤러 수정
git add crawling/bank_crawlers/kb_crawler.py
git commit -m "feat: KB 크롤러 실제 셀렉터로 업데이트"
```

### Git 커밋 메시지 컨벤션
```bash
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 업데이트
refactor: 코드 리팩토링
test: 테스트 추가
```

---

## 🐛 문제 해결

### 문제 1: Chrome 드라이버 오류
```bash
pip install --upgrade webdriver-manager
```

### 문제 2: Supabase 연결 오류
- `.env` 파일의 URL과 KEY가 정확한지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 문제 3: 패키지 설치 오류
```bash
# 가상환경 재생성
rm -rf venv
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

---

## 📚 다음 단계

1. **실제 크롤링 구현**: `kb_crawler.py`의 셀렉터를 실제 사이트에 맞게 수정
2. **다른 은행 추가**: 신한, 하나, 우리, NH 크롤러 구현
3. **4단계 진행**: 대출 계산 알고리즘 구현

자세한 내용은 `README.md` 및 `docs/development_log.md`를 참고하세요!

---

**문의**: [info@noaats.com](mailto:info@noaats.com)
