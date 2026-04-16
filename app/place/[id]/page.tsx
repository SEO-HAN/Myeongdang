/**
 * /place/[id] — 장소 상세 SEO 페이지
 *
 * 목적:
 *  - 각 명당 장소가 구글에서 독립 URL로 인덱싱되도록
 *  - JSON-LD 구조화 데이터로 리치 스니펫 확보
 *  - 카카오톡 공유 시 OG 카드로 장소 이름/이미지 표시
 *  - 모바일 딥링크 지원 (카카오맵 앱 연동)
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import { getTrustLabel } from '@/lib/utils'
import { MOCK_PLACES, isMockMode } from '@/lib/mock-data'
import type { Database, PlaceRow, Ohaeng } from '@/types/database'
import ImageGallery from '@/components/place/ImageGallery'
import NearbyPlaces from '@/components/place/NearbyPlaces'

interface PageProps {
  params: { id: string }
}

async function getPlace(id: string): Promise<PlaceRow | null> {
  // Mock 모드: 로컬 데이터에서 조회
  if (isMockMode()) {
    return MOCK_PLACES.find((p) => p.id === id) ?? null
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
    )
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  } catch { return null }
}

async function getNearbyPlaces(ohaeng: string): Promise<PlaceRow[]> {
  if (isMockMode()) {
    return MOCK_PLACES.filter((p) => (p.ohaeng as string[]).includes(ohaeng)).slice(0, 4)
  }
  try {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
    )
    const { data } = await supabase
      .from('places')
      .select('id, name, ohaeng, trust_score, image_urls, address, lat, lng, luck_types, description_short, reason_text, source_sns, kakaomap_url, expert_verified')
      .contains('ohaeng', [ohaeng as Ohaeng])
      .limit(4)
    return data ?? []
  } catch { return [] }
}

// ─────────────────────────────────────────────
// 동적 메타데이터
// ─────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const place = await getPlace(params.id)
  if (!place) return { title: '장소를 찾을 수 없습니다 | 명당지도' }

  const ohaengLabel = place.ohaeng.map((o) => `${OHAENG_EMOJI[o as Ohaeng]}${o}`).join(' ')
  const title = `${place.name} — ${ohaengLabel} 기운 명당 | 명당지도`
  const description = place.description_short + ' ' + place.reason_text.slice(0, 80)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        // OG API 이미지 우선 (항상 존재)
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://myeongdang.vercel.app'}/api/og?place=${encodeURIComponent(place.name)}&ohaeng=${place.ohaeng[0] ?? '목'}`,
          width: 1200,
          height: 630,
          alt: title,
        },
        // 실제 장소 이미지 (있으면 추가)
        ...(place.image_urls[0]
          ? [{ url: place.image_urls[0], width: 800, height: 600, alt: place.name }]
          : []),
      ],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description },
    keywords: [
      place.name, '명당', '풍수지리',
      ...place.ohaeng.map((o) => `${o} 기운`),
      ...place.luck_types,
      place.address.split(' ').slice(0, 2).join(' '),
    ],
  }
}

// ─────────────────────────────────────────────
// JSON-LD 구조화 데이터
// ─────────────────────────────────────────────
function JsonLd({ place }: { place: PlaceRow }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name,
    description: place.description_short,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address,
      addressCountry: 'KR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.lat,
      longitude: place.lng,
    },
    image: place.image_urls[0] ?? '',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/place/${place.id}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (place.trust_score / 20).toFixed(1),
      bestRating: '5',
      ratingCount: Math.floor(place.trust_score * 2.5),
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─────────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────────
export default async function PlacePage({ params }: PageProps) {
  const place = await getPlace(params.id)
  if (!place) notFound()

  const primaryOhaeng = place.ohaeng[0] as Ohaeng
  const ohaengColor   = OHAENG_COLOR[primaryOhaeng]
  const nearbyPlaces  = await getNearbyPlaces(place.ohaeng[0])

  return (
    <>
      <JsonLd place={place} />

      <div className="min-h-screen bg-white max-w-lg mx-auto">
        {/* 이미지 갤러리 (Client Component) */}
        <div className="relative">
          <ImageGallery
            imageUrls={place.image_urls}
            altText={place.name}
            ohaengHex={ohaengColor.hex}
          />

          {/* 뒤로 버튼 */}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
              aria-label="뒤로"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* 오행 뱃지 */}
          <div className="absolute bottom-4 left-4 z-10 flex gap-2">
            {place.ohaeng.map((o) => {
              const hex = OHAENG_COLOR[o as Ohaeng]?.hex ?? '#888'
              return (
                <span
                  key={o}
                  className="text-xs px-2.5 py-1 rounded-full font-semibold text-white backdrop-blur-sm"
                  style={{ backgroundColor: `${hex}CC` }}
                >
                  {OHAENG_EMOJI[o as Ohaeng]} {o} 기운
                </span>
              )
            })}
            {place.expert_verified && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-white bg-black/50 backdrop-blur-sm">
                ⭐ 전문가 검증
              </span>
            )}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="px-4 pt-5 pb-8">
          {/* 제목 */}
          <h1 className="text-xl font-bold text-gray-900 mb-1">{place.name}</h1>
          <p className="text-xs text-gray-500 mb-4">📍 {place.address}</p>

          {/* 오행 + 운 칩 */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {place.ohaeng.map((o) => {
              const c = OHAENG_COLOR[o as Ohaeng]
              return (
                <span key={o} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: c.bg, color: c.text }}>
                  {OHAENG_EMOJI[o as Ohaeng]} {o}
                </span>
              )
            })}
            {place.luck_types.map((l) => (
              <span key={l} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                {l}
              </span>
            ))}
          </div>

          {/* 신뢰도 */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${place.trust_score}%`,
                  background: `linear-gradient(90deg, ${ohaengColor.hex}, ${ohaengColor.hex}99)`,
                }}
              />
            </div>
            <span className="text-xs font-semibold" style={{ color: ohaengColor.hex }}>
              {place.trust_score}점 · {getTrustLabel(place.trust_score)}
            </span>
          </div>

          {/* 풍수 근거 */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              🗺️ 풍수지리 근거
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{place.reason_text}</p>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            <a
              href={place.kakaomap_url || `https://map.kakao.com/link/search/${encodeURIComponent(place.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-md"
            >
              🗺️ 카카오맵으로 길찾기
            </a>
            <Link
              href={`/onboarding`}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm"
            >
              ✨ 내 사주에 맞는 명당 더 찾기
            </Link>
          </div>

          {/* 근처 명당 추천 */}
          <NearbyPlaces places={nearbyPlaces} currentId={params.id} />
        </div>
      </div>
    </>
  )
}
