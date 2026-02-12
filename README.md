cat << 'EOF' > README.md
# 💰 대환대출 비용 분석 및 BEP 시뮬레이터 (Loan Refinance Simulator)

> **"금융 소비자 중심의 합리적인 대출 갈아타기 의사결정 지원 도구"**
> 본 프로젝트는 사용자가 현재 이용 중인 대출과 갈아탈 대출의 조건을 입력하면, **중도상환수수료, 인지세 등 부대비용을 반영한 실질적인 손익분기점(BEP)**을 계산하고 시각화해주는 웹 애플리케이션입니다.

---

## 🔗 Project Link
* **Live Demo**: https://pay-off-loan.vercel.app/

---

## 🛠 Tech Stack (기술 스택)

### **Frontend & Backend**
* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript (Big.js를 활용한 고정밀 금융 연산)
* **Styling**: Tailwind CSS, Lucide React
* **Visualization**: Recharts (대출 상환 시나리오 및 비용 역전 지점 시각화)

### **Data & Infrastructure**
* **Database**: Supabase (PostgreSQL)
* **Deployment**: Vercel (CI/CD 최적화)
* **Crawling**: Python, Selenium (은행별 최신 금리 데이터 수집 및 정제)

---

## 🌟 Key Features (핵심 기능)

1. **정밀한 비용 시뮬레이션**: 금리 차이 외에 대출 실행 시 발생하는 **인지세(인지세법 시행령 제3조 기준)**와 기존 대출 해지 시의 **중도상환수수료**를 산식에 포함하여 실질 이익을 계산합니다.
2. **3대 상환 전략 비교**: '기존 대출 유지', '즉시 대환', '중도상환수수료 면제 후 대환'의 3가지 시나리오를 시뮬레이션하여 최적의 시점을 제안합니다.
3. **상환 방식 최적화**: 원리금균등, 원금균등, 만기일시 상환 방식을 모두 지원하여 실제 금융 상품과 동일한 환경을 제공합니다.
4. **BEP(손익분기점) 시각화**: 누적 비용이 역전되는 지점을 차트로 제공하여 사용자가 갈아타기 적정 시점을 한눈에 파악할 수 있게 합니다.

---

## 🚀 Getting Started (실행 방법)

### **1. 환경 변수 설정 (.env.local)**
프로젝트 루트에 `.env.local` 파일을 생성하고 Supabase API 정보를 입력합니다.
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### **2. 의존성 설치**
\`\`\`bash
# 패키지 설치
npm install
\`\`\`

### **3. 로컬 서버 실행**
\`\`\`bash
# 개발 모드로 실행
npm run dev
\`\`\`
브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 확인

---

## 🏗 Project Architecture (구조)

\`\`\`text
.
├── src/                # Next.js 프론트엔드 및 API 로직
│   ├── app/            # App Router 기반 페이지 구성
│   ├── components/     # 시뮬레이션 폼 및 결과 차트 컴포넌트
│   └── lib/            # FinanceConfig(인지세법 반영), 고정밀 연산 로직
├── crawling/           # [Data Engine] 은행 데이터 수집 파이프라인
│   ├── bank_crawlers/  # 은행별 크롤링 스크립트 (Selenium)
│   └── main.py         # 데이터 정제 및 DB 업로드 프로세스
└── .vercelignore       # 배포 환경 최적화 설정 파일
\`\`\`

---

## 💡 Developer Notes (개발자 노트)

### **1. 배포 환경 최적화 (CI/CD)**
* **문제**: Vercel 빌드 시 루트 디렉토리의 Python 의존성(Pandas, Numpy)을 인식하여 불필요한 런타임 빌드 시도로 인한 타임아웃 발생.
* **해결**: `.vercelignore` 도입 및 `requirements.txt` 경로 수정을 통해 웹 런타임과 데이터 수집 엔진을 분리, 빌드 성공률 및 속도를 개선했습니다.

### **2. 금융 데이터 정밀도 확보**
* JavaScript의 부동 소수점 오차 문제를 해결하기 위해 **Big.js** 라이브러리를 도입하였습니다.
* 인지세법 시행령 제3조(2026년 기준)에 의거하여 5천만 원 초과 시 금액 구간별 인지세를 정확히 반영하도록 설계했습니다.

### **3. 상환 시나리오 알고리즘**
* 사용자가 입력한 현재 대출의 남은 기간과 중도상환수수료 면제 시점을 계산하여, '가장 비용이 적게 드는 최적의 상품(Best Simulation)'을 추천하는 알고리즘을 구현했습니다.
EOF