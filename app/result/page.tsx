/**
 * /result?y=1990&m=7&d=15&h=14&g=female
 *
 * Vercel best practices 적용:
 *  1. Server Component에서 URL params로 calculateSaju 호출 (API 왕복 없음)
 *  2. generateMetadata() 로 유저별 동적 OG 이미지/타이틀 생성 (공유 카드 SEO)
 *  3. ResultClient로 인터랙티브 UI 분리
 */
import type { Metadata } from 'next'
import { calculateSaju } from '@/lib/saju/engine'
import { OHAENG_EMOJI } from '@/lib/saju/types'
import ResultClient from './ResultClient'

interface PageProps {
  searchParams: { y?: string; m?: string; d?: string; h?: string; g?: string; luck?: string }
}

// ─────────────────────────────────────────────
// 동적 메타데이터 (공유 시 OG 카드 개인화)
// ─────────────────────────────────────────────
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const y = Number(searchParams.y)
  const m = Number(searchParams.m)
  const d = Number(searchParams.d)

  if (!y || !m || !d) {
    return { title: '오행 분석 결과 | 명당지도' }
  }

  const result = calculateSaju({ year: y, month: m, day: d })
  const weakLabel = result.weakOhaeng.map((o) => `${OHAENG_EMOJI[o]}${o}`).join(', ')
  const title = `나는 ${weakLabel}가 부족한 사람 | 명당지도`
  const description = result.summary

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://myeongdang.vercel.app'}/api/og?y=${y}&m=${m}&d=${d}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

// ─────────────────────────────────────────────
// Server Component
// ─────────────────────────────────────────────
export default function ResultPage({ searchParams }: PageProps) {
  const y = Number(searchParams.y)
  const m = Number(searchParams.m)
  const d = Number(searchParams.d)
  const h = searchParams.h !== undefined ? Number(searchParams.h) : undefined
  const g    = (searchParams.g as 'male' | 'female') || undefined
  const luck = searchParams.luck || undefined

  // 파라미터 누락 시 온보딩으로
  if (!y || !m || !d) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-2xl">🔮</p>
        <p className="text-lg font-semibold text-gray-900">생년월일을 먼저 입력해주세요</p>
        <a
          href="/onboarding"
          className="px-6 py-3 bg-brand text-white rounded-2xl font-semibold"
        >
          사주 분석 시작하기
        </a>
      </div>
    )
  }

  // 서버에서 직접 계산 (API 없이!)
  const result = calculateSaju({ year: y, month: m, day: d, hour: h, gender: g })

  return <ResultClient result={result} luckPreference={luck} />
}
