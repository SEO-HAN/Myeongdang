import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { calculateSaju } from '@/lib/saju';
import type { Ohaeng } from '@/lib/saju';

export const runtime = 'edge';

// OG 이미지 캐싱 — 같은 파라미터는 24시간 캐시
export const revalidate = 86400;

/**
 * 명당지도 동적 OG 이미지 API
 *
 * 사용:
 *   /api/og?y=1990&m=7&d=15&h=14          — 사주 결과 OG
 *   /api/og?place=관악산+연주대&ohaeng=목  — 장소 OG
 *   /api/og                                — 기본 OG
 *
 * 크기: 1200×630 (OG 표준)
 * 런타임: Edge (빠른 응답)
 */

const OHAENG_DATA: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  목: { emoji: '🌳', label: '목(木)', color: '#22c55e', bg: '#14532d' },
  화: { emoji: '🔥', label: '화(火)', color: '#ef4444', bg: '#7f1d1d' },
  토: { emoji: '🏔️', label: '토(土)', color: '#eab308', bg: '#713f12' },
  금: { emoji: '⚡', label: '금(金)', color: '#a855f7', bg: '#3b0764' },
  수: { emoji: '💧', label: '수(水)', color: '#3b82f6', bg: '#1e3a5f' },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const y = Number(searchParams.get('y'));
  const m = Number(searchParams.get('m'));
  const d = Number(searchParams.get('d'));
  const h = searchParams.get('h') ? Number(searchParams.get('h')) : undefined;
  const placeName = searchParams.get('place');
  const placeOhaeng = searchParams.get('ohaeng');

  // ── 장소 OG 이미지 ───────────────────────────────────────────────
  if (placeName) {
    const ohaeng = placeOhaeng || '목';
    const info = OHAENG_DATA[ohaeng] || OHAENG_DATA['목'];

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* 배경 그라데이션 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 30% 40%, ${info.bg}88 0%, transparent 60%), radial-gradient(circle at 80% 70%, #E8593C22 0%, transparent 50%)`,
            }}
          />

          {/* 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '40px 60px 0',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 32 }}>📍</span>
            <span style={{ color: '#E8593C', fontSize: 22, fontWeight: 700 }}>명당지도</span>
          </div>

          {/* 메인 콘텐츠 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 60px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  backgroundColor: info.color + '33',
                  border: `2px solid ${info.color}`,
                  borderRadius: 12,
                  padding: '6px 16px',
                  color: info.color,
                  fontSize: 18,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{info.emoji}</span>
                <span>{info.label} 기운 명당</span>
              </div>
            </div>

            <div
              style={{
                color: '#ffffff',
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: 20,
              }}
            >
              {placeName}
            </div>

            <div style={{ color: '#94a3b8', fontSize: 22 }}>
              풍수와 오행으로 찾은 나만의 명당
            </div>
          </div>

          {/* 푸터 */}
          <div
            style={{
              padding: '0 60px 40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#475569', fontSize: 18 }}>myeongdang.vercel.app</span>
            <div
              style={{
                backgroundColor: '#E8593C',
                color: '#ffffff',
                borderRadius: 24,
                padding: '10px 24px',
                fontSize: 18,
                fontWeight: 600,
                display: 'flex',
              }}
            >
              명당 확인하기 →
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // ── 사주 결과 OG 이미지 ─────────────────────────────────────────
  if (y && m && d) {
    let result;
    try {
      result = calculateSaju({ year: y, month: m, day: d, hour: h });
    } catch {
      // 계산 실패 시 기본 OG로 폴백
      return defaultOgImage();
    }

    const weakEmojis = result.weakOhaeng.map((o) => OHAENG_DATA[o]?.emoji ?? '').join(' ');
    const weakLabels = result.weakOhaeng.map((o) => OHAENG_DATA[o]?.label ?? o).join(', ');
    const strongLabels = result.strongOhaeng.map((o) => OHAENG_DATA[o]?.label ?? o).join(', ');

    // 부족 오행 색상 (첫 번째 기준)
    const primaryWeak = result.weakOhaeng[0];
    const primaryInfo = OHAENG_DATA[primaryWeak] || OHAENG_DATA['목'];

    // 오행 강도 바 데이터
    const ohaengOrder: Ohaeng[] = ['목', '화', '토', '금', '수'];
    const maxStrength = Math.max(...Object.values(result.ohaengStrength));

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            fontFamily: 'sans-serif',
          }}
        >
          {/* 배경 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 20% 50%, ${primaryInfo.bg}66 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, #E8593C1a 0%, transparent 45%)`,
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100%' }}>
            {/* 왼쪽 메인 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '48px 0 48px 60px',
                justifyContent: 'space-between',
              }}
            >
              {/* 브랜드 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 26 }}>📍</span>
                <span style={{ color: '#E8593C', fontSize: 20, fontWeight: 700 }}>명당지도</span>
                <span style={{ color: '#334155', fontSize: 16, marginLeft: 8 }}>사주 분석</span>
              </div>

              {/* 메인 카피 */}
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {result.weakOhaeng.map((o) => {
                    const info = OHAENG_DATA[o];
                    return (
                      <div
                        key={o}
                        style={{
                          backgroundColor: info?.color + '22',
                          border: `1.5px solid ${info?.color}`,
                          borderRadius: 8,
                          padding: '4px 12px',
                          color: info?.color,
                          fontSize: 15,
                          fontWeight: 600,
                          display: 'flex',
                          gap: 4,
                        }}
                      >
                        <span>{info?.emoji}</span>
                        <span>{info?.label}</span>
                      </div>
                    );
                  })}
                  <div
                    style={{
                      backgroundColor: '#1e293b',
                      borderRadius: 8,
                      padding: '4px 12px',
                      color: '#64748b',
                      fontSize: 15,
                      display: 'flex',
                    }}
                  >
                    부족 오행
                  </div>
                </div>

                <div
                  style={{
                    color: '#ffffff',
                    fontSize: 40,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    marginBottom: 12,
                  }}
                >
                  {weakEmojis} {weakLabels}이
                  <br />
                  부족한 사람
                </div>

                <div style={{ color: '#64748b', fontSize: 18 }}>
                  강한 기운: {strongLabels} · 불균형 {result.imbalanceScore.toFixed(0)}점
                </div>
              </div>

              {/* 사주 4기둥 */}
              <div style={{ display: 'flex', gap: 12 }}>
                {(['year', 'month', 'day', 'hour'] as const).map((key) => {
                  const pillar = result.pillars[key];
                  if (!pillar) return null;
                  const labelNames: Record<string, string> = { year: '년', month: '월', day: '일', hour: '시' };
                  return (
                    <div
                      key={key}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 12,
                        padding: '10px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        minWidth: 64,
                      }}
                    >
                      <span style={{ color: '#475569', fontSize: 12 }}>{labelNames[key]}주</span>
                      <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>
                        {pillar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 오른쪽 오행 강도 바 */}
            <div
              style={{
                width: 220,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px 40px 48px 20px',
                gap: 14,
              }}
            >
              <div style={{ color: '#475569', fontSize: 13, marginBottom: 4, display: 'flex' }}>
                오행 강도
              </div>
              {ohaengOrder.map((o) => {
                const info = OHAENG_DATA[o];
                const strength = result.ohaengStrength[o] ?? 0;
                const barWidth = maxStrength > 0 ? Math.round((strength / maxStrength) * 140) : 0;
                return (
                  <div
                    key={o}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 16, width: 20, display: 'flex' }}>{info?.emoji}</span>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <div
                        style={{
                          height: 8,
                          backgroundColor: '#1e293b',
                          borderRadius: 4,
                          display: 'flex',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: barWidth,
                            backgroundColor: info?.color ?? '#64748b',
                            borderRadius: 4,
                            display: 'flex',
                          }}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        color: info?.color ?? '#64748b',
                        fontSize: 13,
                        width: 28,
                        textAlign: 'right',
                        display: 'flex',
                      }}
                    >
                      {strength.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // ── 기본 OG 이미지 ────────────────────────────────────────────────
  return defaultOgImage();
}

function defaultOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          fontFamily: 'sans-serif',
          gap: 24,
          position: 'relative',
        }}
      >
        {/* 오행 배경 원들 */}
        {['#22c55e', '#ef4444', '#eab308', '#a855f7', '#3b82f6'].map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              backgroundColor: c + '08',
              left: `${15 + i * 18}%`,
              top: i % 2 === 0 ? '15%' : '55%',
              filter: 'blur(60px)',
            }}
          />
        ))}

        {/* 로고 */}
        <div style={{ fontSize: 80, display: 'flex' }}>📍</div>

        {/* 타이틀 */}
        <div
          style={{
            color: '#ffffff',
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: '-2px',
            display: 'flex',
          }}
        >
          명당지도
        </div>

        {/* 서브타이틀 */}
        <div
          style={{
            color: '#64748b',
            fontSize: 24,
            display: 'flex',
          }}
        >
          사주 오행으로 찾는 나만의 명당
        </div>

        {/* 오행 칩 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {Object.entries(OHAENG_DATA).map(([key, info]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: info.color + '22',
                border: `1.5px solid ${info.color}55`,
                borderRadius: 20,
                padding: '8px 18px',
                color: info.color,
                fontSize: 18,
              }}
            >
              <span>{info.emoji}</span>
              <span>{info.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
