import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * 명당지도 Middleware
 *
 * 역할:
 * 1. Supabase Auth 세션 쿠키 자동 갱신 (만료 방지)
 * 2. 보안 헤더 삽입 (XSS, Clickjacking, HTTPS 강제)
 * 3. 보호된 라우트 접근 제어 (향후 /profile, /bookmarks 등)
 *
 * 참고: @supabase/ssr updateSession 패턴 사용
 *       https://supabase.com/docs/guides/auth/server-side/nextjs
 */

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── Supabase Auth 세션 갱신 ──────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof supabaseResponse.cookies.set>[2] }[]) {
          // 요청 쿠키 갱신
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 응답 쿠키 갱신
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() 호출은 세션 갱신을 트리거함
  // auth.getSession()은 사용하지 말 것 (보안 취약 — server side에서 검증 불가)
  // Mock 모드(MOCK_KEY 환경) 에서는 네트워크 오류 방어
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Mock URL 또는 네트워크 오류 — 비로그인 상태로 진행
  };

  // ── 보호된 라우트 접근 제어 ──────────────────────────────────────
  const { pathname } = request.nextUrl;

  // /profile, /bookmarks 등 로그인 필요 페이지 (현재 미구현, 향후 확장용)
  const protectedPaths = ['/profile', '/bookmarks'];
  const isProtectedPath = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtectedPath && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/onboarding';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 보안 헤더 삽입 ────────────────────────────────────────────────
  const headers = supabaseResponse.headers;

  // XSS 방지
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');

  // HTTPS 강제 (Vercel 환경)
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Referrer 정책
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (불필요한 브라우저 API 차단)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  );

  // CSP 기본값 (Kakao Maps CDN 허용)
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://dapi.kakao.com https://t1.kakaocdn.net https://developers.kakao.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://dapi.kakao.com https://map.kakao.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - public 폴더의 정적 파일 (icons, manifest 등)
     * - api/og (OG 이미지 API — 별도 캐싱 전략 사용)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|screenshots|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
