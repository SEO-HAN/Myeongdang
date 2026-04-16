import { NextRequest, NextResponse } from 'next/server';
import { getTodayIlshin, getIlshinByDateString } from '@/lib/saju/ilshin';
import type { Ohaeng } from '@/lib/saju/types';

export const dynamic = 'force-dynamic';
// 일진은 하루 단위로 캐싱 (자정 기준 갱신)
export const revalidate = 3600; // 1시간 (절기 경계 오차 보정용)

/**
 * GET /api/ilshin
 *
 * Query params:
 *   ?weak=화,목     — 사용자의 부족 오행 (개운 분석용)
 *   ?date=2024-07-15 — 특정 날짜 조회 (기본: 오늘)
 *
 * Response:
 *   { data: IlshinResult, generatedAt: ISO string }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // 부족 오행 파싱
    const validOhaeng: Ohaeng[] = ['목', '화', '토', '금', '수'];
    const weakParam = searchParams.get('weak');
    const weakOhaeng = weakParam
      ? weakParam
          .split(',')
          .map((o) => o.trim() as Ohaeng)
          .filter((o) => validOhaeng.includes(o))
      : undefined;

    // 날짜 파싱 (기본값: 오늘)
    const dateParam = searchParams.get('date');
    let result;

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      result = getIlshinByDateString(dateParam, weakOhaeng);
    } else {
      result = getTodayIlshin(weakOhaeng);
    }

    return NextResponse.json(
      {
        data: result,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          // 일진은 오늘 자정까지 캐싱 가능
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('[/api/ilshin] 오류:', error);
    return NextResponse.json(
      { error: '일진 계산 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
