'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 에러 로깅 (Sentry 등 연동 시 여기에 추가)
    console.error('[명당지도 Error]', error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-red-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm w-full">
        {/* 아이콘 */}
        <div className="text-7xl mb-6">⚡</div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-white mb-2">
          기운이 흐트러졌어요
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          일시적인 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>

        {/* 에러 상세 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 mb-6 text-left">
            <p className="text-red-400 text-xs font-mono break-all">{error.message}</p>
            {error.digest && (
              <p className="text-red-600 text-xs mt-1">digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-brand text-white font-semibold py-3.5 rounded-2xl hover:bg-brand/90 active:scale-95 transition-all"
          >
            다시 시도하기
          </button>
          <a
            href="/"
            className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 rounded-2xl transition-colors"
          >
            지도로 돌아가기
          </a>
        </div>

        {/* 지원 안내 */}
        <p className="text-slate-600 text-xs mt-6">
          문제가 계속된다면 페이지를 새로고침 해보세요
        </p>
      </div>
    </div>
  );
}
