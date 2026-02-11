/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 환경 변수
  env: {
    NEXT_PUBLIC_APP_NAME: 'Loan Refinance Simulator',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },
  
  // Supabase 이미지 최적화 (필요 시)
  images: {
    domains: ['supabase.co'],
  },
}

module.exports = nextConfig
