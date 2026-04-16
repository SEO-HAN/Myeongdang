/**
 * /auth/callback — Supabase OAuth 코드 교환 핸들러
 *
 * 카카오 로그인 플로우:
 *  1. KakaoLoginButton → supabase.auth.signInWithOAuth({ provider: 'kakao' })
 *  2. Kakao 인증 완료 → 이 URL로 ?code= 리다이렉트
 *  3. 여기서 code를 session으로 교환
 *  4. user_profiles에 최초 로그인 upsert
 *  5. next 파라미터 URL로 최종 리다이렉트
 *
 * Supabase 대시보드 설정:
 *  Authentication → URL Configuration → Redirect URLs
 *  → https://your-domain/auth/callback 추가 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  // 로그인 후 돌아갈 URL (기본: 메인 지도)
  const next = searchParams.get('next') ?? '/';
  // 에러 처리
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // OAuth 에러 처리
  if (error) {
    console.error('[auth/callback] OAuth 오류:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/onboarding?error=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

  if (!code) {
    console.error('[auth/callback] code 파라미터 없음');
    return NextResponse.redirect(`${origin}/onboarding?error=no_code`);
  }

  const cookieStore = cookies();
  const supabase = createServerClient<any>( // JSONB 컬럼 supabase-js generic 우회
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string) => {
          cookieStore.set(name, value);
        },
        remove: (name: string) => {
          cookieStore.set(name, '');
        },
      },
    }
  );

  // ── 코드 → 세션 교환 ──────────────────────────────────────
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[auth/callback] 세션 교환 실패:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/onboarding?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  const user = data.user;
  if (!user) {
    return NextResponse.redirect(`${origin}/onboarding?error=no_user`);
  }

  // ── user_profiles 초기화 (최초 로그인 시) ──────────────────
  // kakao_id = Kakao sub claim 또는 user.id
  const kakaoId = (user.user_metadata?.provider_id as string) ?? user.id;

  try {
    await supabase.from('user_profiles').upsert(
      {
        kakao_id: kakaoId,
        // 카카오 프로필 정보 (있는 경우)
        // nickname: user.user_metadata?.full_name ?? null,
        // avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      {
        onConflict: 'kakao_id',
        ignoreDuplicates: true, // 이미 존재하면 업데이트 안 함
      }
    );
  } catch (profileError) {
    // 프로필 생성 실패는 로그인 자체를 막지 않음
    console.error('[auth/callback] user_profiles upsert 실패:', profileError);
  }

  // ── 최종 리다이렉트 ─────────────────────────────────────────
  // 외부 URL 주입 방지: origin과 같은 도메인만 허용
  const redirectTo = next.startsWith('/') ? `${origin}${next}` : origin;
  return NextResponse.redirect(redirectTo);
}
