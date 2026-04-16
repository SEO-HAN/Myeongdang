/**
 * 네이버 지역 검색 API 클라이언트
 *
 * API: https://openapi.naver.com/v1/search/local
 * 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 *
 * 풍수/명당 관련 키워드로 장소 목록 수집
 */

export interface NaverPlaceItem {
  title: string;       // 장소명 (HTML 태그 포함 가능)
  link: string;        // 상세 URL
  category: string;    // 카테고리 (예: 관광,명소>국립공원)
  description: string; // 장소 설명
  telephone: string;
  address: string;     // 도로명 주소
  roadAddress: string;
  mapx: string;        // 경도 × 10^7 (WGS84 기준 변환 필요)
  mapy: string;        // 위도 × 10^7
}

export interface NaverSearchResult {
  items: NaverPlaceItem[];
  total: number;
  display: number;
  start: number;
}

/** WGS84 좌표 변환 (Naver mapx/mapy → 일반 lat/lng) */
function parseNaverCoords(mapx: string, mapy: string): { lat: number; lng: number } {
  return {
    lat: Number(mapy) / 1e7,
    lng: Number(mapx) / 1e7,
  };
}

/** HTML 태그 제거 */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * 네이버 지역 검색 (단일 키워드)
 */
export async function searchNaverPlaces(
  query: string,
  options: { display?: number; start?: number } = {}
): Promise<NaverSearchResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수 필요');
  }

  const params = new URLSearchParams({
    query,
    display: String(options.display ?? 5),
    start: String(options.start ?? 1),
    sort: 'random', // comment, random
  });

  const response = await fetch(
    `https://openapi.naver.com/v1/search/local?${params}`,
    {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Naver API 오류: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    display: data.display ?? 0,
    start: data.start ?? 1,
  };
}

/**
 * 풍수/명당 키워드 배열로 장소 목록 수집
 * 중복 제거 + 좌표 파싱 포함
 */
export async function collectPlacesByKeywords(
  keywords: string[],
  displayPerKeyword = 5
): Promise<Array<NaverPlaceItem & { lat: number; lng: number; cleanTitle: string }>> {
  const seen = new Set<string>(); // 중복 제거
  const results: Array<NaverPlaceItem & { lat: number; lng: number; cleanTitle: string }> = [];

  for (const keyword of keywords) {
    try {
      const result = await searchNaverPlaces(keyword, { display: displayPerKeyword });

      for (const item of result.items) {
        const cleanTitle = stripHtml(item.title);
        const key = `${cleanTitle}_${item.address}`;

        if (seen.has(key)) continue;
        seen.add(key);

        const { lat, lng } = parseNaverCoords(item.mapx, item.mapy);

        // 좌표 유효성 검사 (한국 범위: lat 33~38, lng 124~130)
        if (lat < 33 || lat > 38.5 || lng < 124 || lng > 130.5) continue;

        results.push({ ...item, lat, lng, cleanTitle });
      }

      // API rate limit 방지 (200ms 간격)
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`[naver-search] '${keyword}' 검색 실패:`, err);
    }
  }

  return results;
}

/** 풍수/명당 관련 기본 검색 키워드 */
export const FENGSHUI_KEYWORDS = [
  '풍수 명당',
  '오행 기운 명당',
  '기운 좋은 곳',
  '풍수 절터',
  '명당 기도처',
  '기운 좋은 산',
  '풍수지리 명소',
  '개운 여행지',
  '힐링 명소 절',
  '전통 명당 유적',
] as const;
