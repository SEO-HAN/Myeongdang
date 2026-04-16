'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface KakaoLoginButtonProps {
  /** 로그인 후 돌아갈 경로 (기본: /) */
  redirectTo?: string;
  /** 버튼 스타일 변형 */
  variant?: 'full' | 'compact' | 'icon';
  /** 커스텀 className */
  className?: string;
  /** 로그인 완료 콜백 */
  onSuccess?: () => void;
}

/**
 * 카카오 로그인 버튼
 *
 * 사용:
 *  <KakaoLoginButton redirectTo="/result?y=1990&m=7&d=15" />
 *
 * Supabase Auth 설정 필요:
 *  - Authentication → Providers → Kakao 활성화
 *  - Kakao Developers: Redirect URI = /auth/callback 등록
 */
export default function KakaoLoginButton({
  redirectTo = '/',
  variant = 'full',
  className = '',
  onSuccess,
}: KakaoLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const supabase = createClient();

  // 현재 로그인 상태 확인
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    });

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        onSuccess?.();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── 카카오 로그인 ────────────────────────────────────────────
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          // 카카오 추가 스코프 (필요 시 활성화)
          // scopes: 'account_email profile_image',
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('[KakaoLoginButton] 로그인 실패:', err);
      setIsLoading(false);
    }
    // 성공 시 페이지 이동 → setIsLoading 불필요
  };

  // ── 로그아웃 ────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  };

  // ── 이미 로그인된 상태 ───────────────────────────────────────
  if (user) {
    if (variant === 'icon') {
      return (
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center text-sm ${className}`}
          title="로그아웃"
        >
          {isLoading ? '...' : '👤'}
        </button>
      );
    }
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm text-slate-700 font-medium ${className}`}
      >
        <span>👤</span>
        <span>{isLoading ? '로그아웃 중...' : '로그아웃'}</span>
      </button>
    );
  }

  // ── 미로그인 상태 ─────────────────────────────────────────────
  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center text-sm shadow-sm active:scale-95 transition-transform ${className}`}
        title="카카오 로그인"
      >
        {isLoading ? (
          <span className="animate-spin text-xs">⟳</span>
        ) : (
          <KakaoIcon size={16} />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FEE500] hover:bg-[#FDD900] active:scale-95 transition-all text-xs font-semibold text-[#3A1D1D] shadow-sm ${className}`}
      >
        <KakaoIcon size={14} />
        <span>{isLoading ? '연결 중...' : '카카오 로그인'}</span>
      </button>
    );
  }

  // full variant
  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-[#FEE500] hover:bg-[#FDD900] active:scale-[0.98] transition-all font-semibold text-[#3A1D1D] shadow-sm ${className}`}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⟳</span>
          <span>카카오 연결 중...</span>
        </>
      ) : (
        <>
          <KakaoIcon size={20} />
          <span>카카오로 계속하기</span>
        </>
      )}
    </button>
  );
}

// ── 카카오 아이콘 SVG ──────────────────────────────────────────

function KakaoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M256 32C123.5 32 16 116.5 16 222C16 285.5 56 342 118 376L96 470L200 412C218 416 237 418 256 418C388.5 418 496 333.5 496 228C496 122.5 388.5 32 256 32Z"
        fill="#3A1D1D"
      />
    </svg>
  );
}
