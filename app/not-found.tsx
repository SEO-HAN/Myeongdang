'use client'

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      {/* 배경 오행 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm w-full">
        {/* 아이콘 */}
        <div className="text-7xl mb-6 animate-bounce-slow">🗺️</div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-white mb-2">
          명당을 찾지 못했어요
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          찾으시는 페이지가 존재하지 않거나,
          <br />
          이미 다른 곳으로 이동했을 수 있어요.
          <br />
          <span className="text-slate-500 text-xs mt-1 block">오류 코드: 404</span>
        </p>

        {/* 오행 힌트 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-8">
          <p className="text-slate-400 text-xs mb-3">혹시 이런 곳을 찾으셨나요?</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors"
            >
              <span className="text-lg">🗺️</span>
              <span className="text-white text-sm font-medium">명당 지도</span>
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2.5 transition-colors"
            >
              <span className="text-lg">✨</span>
              <span className="text-white text-sm font-medium">내 사주 보기</span>
            </Link>
          </div>
        </div>

        {/* 메인으로 */}
        <Link
          href="/"
          className="block w-full bg-brand text-white text-center font-semibold py-3.5 rounded-2xl hover:bg-brand/90 active:scale-95 transition-all"
        >
          지도로 돌아가기
        </Link>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
