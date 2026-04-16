/**
 * Root Layout — Next.js App Router
 * Vercel 배포 최적화: 메타데이터 API, PWA, SEO
 */
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '명당지도 | 내 사주에 맞는 풍수 명당 찾기',
    template: '%s | 명당지도',
  },
  description:
    '사주(四柱)로 분석한 내 오행(五行)에 맞는 풍수 명당을 지도로 찾아보세요. 관악산, 계룡산, 해동용궁사 등 전국 명당 30곳+.',
  keywords: ['풍수지리', '명당', '사주', '오행', '개운', '기운', '풍수 명당', '사주 장소'],
  authors: [{ name: '명당지도' }],
  creator: '명당지도',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://myeongdang.vercel.app',
    siteName: '명당지도',
    title: '명당지도 | 내 사주에 맞는 풍수 명당 찾기',
    description: '오행 분석으로 내게 맞는 기운의 장소를 찾아드립니다.',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://myeongdang.vercel.app'}/api/og`,
        width: 1200,
        height: 630,
        alt: '명당지도 — 사주 오행으로 찾는 풍수 명당',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '명당지도',
    description: '사주로 찾는 나만의 풍수 명당',
    images: [`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://myeongdang.vercel.app'}/api/og`],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 지도 UX를 위해 확대 비활성화
  themeColor: '#E8593C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 카카오맵 SDK — next/script 대신 head에서 직접 로드 (지도 초기화 순서 보장) */}
        <script
          type="text/javascript"
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
          async
        />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
