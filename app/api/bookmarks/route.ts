/**
 * /api/bookmarks — 북마크 DB 동기화 API
 *
 * GET  ?kakao_id=xxx         — 북마크 목록 조회
 * POST { kakao_id, place_id, action: 'add'|'remove' }
 *
 * 로그인 사용자만 사용. 비로그인은 로컬스토리지(Zustand)만 사용.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

// ── 북마크 조회 ────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const kakaoId = searchParams.get('kakao_id');

  if (!kakaoId) {
    return NextResponse.json({ error: 'kakao_id 필수' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient<any>( // JSONB 컬럼 supabase-js generic 우회
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  // RLS: 본인 프로필만 조회 가능
  const { data, error } = await supabase
    .from('user_profiles')
    .select('bookmarks')
    .eq('kakao_id', kakaoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 프로필 없음 → 빈 배열 반환
      return NextResponse.json({ data: { bookmarks: [] } });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { bookmarks: data.bookmarks ?? [] } });
}

// ── 북마크 추가/제거 ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { kakao_id?: string; place_id?: string; action?: 'add' | 'remove' };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { kakao_id, place_id, action } = body;

  if (!kakao_id || !place_id || !action) {
    return NextResponse.json(
      { error: 'kakao_id, place_id, action 모두 필수' },
      { status: 400 }
    );
  }

  if (action !== 'add' && action !== 'remove') {
    return NextResponse.json(
      { error: 'action은 add 또는 remove' },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient<any>( // JSONB 컬럼 supabase-js generic 우회
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  // 현재 북마크 목록 조회
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('bookmarks')
    .eq('kakao_id', kakao_id)
    .single();

  const current: string[] = profile?.bookmarks ?? [];

  let updated: string[];
  if (action === 'add') {
    updated = current.includes(place_id) ? current : [...current, place_id];
  } else {
    updated = current.filter((id) => id !== place_id);
  }

  // 북마크 목록 업데이트 (RLS: 본인만 가능)
  const { error: updateError } = await supabase
    .from('user_profiles')
    .upsert(
      { kakao_id, bookmarks: updated },
      { onConflict: 'kakao_id' }
    );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: { bookmarks: updated, action, place_id },
  });
}
