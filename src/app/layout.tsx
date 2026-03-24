import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Typing Lab — 레오와 함께하는 타자 연습',
  description: '초등학교 4학년을 위한 국어·과학 융합 타자 학습 서비스',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  )
}
