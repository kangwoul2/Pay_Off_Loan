// src/app/layout.tsx
import './globals.css';

export const metadata = {
  title: '대환대출 시뮬레이터 v2',
  description: '프로젝트',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}