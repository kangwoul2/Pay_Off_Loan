import './globals.css'

export const metadata = {
  title: '사회초년생 대환대출 시뮬레이터',
  description: '금융 IT 대출&빚 상환 솔루션',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}