'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeakOhaeng } from '@/store/user-store';
import { OHAENG_COLOR, OHAENG_EMOJI } from '@/lib/saju/types';
import type { IlshinResult, GeunGrade } from '@/lib/saju/ilshin';

// ─────────────────────────────────────────────
// 등급별 스타일
// ─────────────────────────────────────────────

const GRADE_STYLE: Record<GeunGrade, { bg: string; border: string; text: string }> = {
  대길: { bg: '#FFF7E6', border: '#F59E0B', text: '#92400E' },
  길: { bg: '#F0FDF4', border: '#22C55E', text: '#14532D' },
  평: { bg: '#F8FAFC', border: '#CBD5E1', text: '#475569' },
  주의: { bg: '#FFF1F2', border: '#FB7185', text: '#9F1239' },
  흉: { bg: '#F1F5F9', border: '#94A3B8', text: '#334155' },
};

// ─────────────────────────────────────────────
// 서브 컴포넌트: 점수 바
// ─────────────────────────────────────────────

function GeunScoreBar({ score, grade }: { score: number; grade: GeunGrade }) {
  const style = GRADE_STYLE[grade];
  const barColors: Record<GeunGrade, string> = {
    대길: '#F59E0B',
    길: '#22C55E',
    평: '#94A3B8',
    주의: '#FB7185',
    흉: '#64748B',
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="flex-1 h-1.5 rounded-full"
        style={{ backgroundColor: '#E2E8F0' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColors[grade] }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums"
        style={{ color: style.text }}
      >
        {score}점
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

interface IlshinBannerProps {
  /** 지도 오버레이 모드 (기본) vs 전체 카드 모드 */
  variant?: 'overlay' | 'card';
  /** 펼침/접힘 초기 상태 */
  defaultExpanded?: boolean;
}

export default function IlshinBanner({
  variant = 'overlay',
  defaultExpanded = false,
}: IlshinBannerProps) {
  const weakOhaeng = useWeakOhaeng();
  const [ilshin, setIlshin] = useState<IlshinResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIlshin = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = weakOhaeng.length > 0
        ? `?weak=${weakOhaeng.join(',')}`
        : '';
      const res = await fetch(`/api/ilshin${params}`);
      const json = await res.json();
      if (json.data) setIlshin(json.data);
    } catch (err) {
      console.error('[IlshinBanner]', err);
    } finally {
      setIsLoading(false);
    }
  }, [weakOhaeng]);

  useEffect(() => {
    fetchIlshin();
  }, [fetchIlshin]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-full shadow-sm">
        <div className="w-3 h-3 rounded-full bg-slate-200 animate-pulse" />
        <span className="text-xs text-slate-400">오늘의 일진 계산 중...</span>
      </div>
    );
  }

  if (!ilshin) return null;

  const grade = ilshin.geun?.grade ?? '평';
  const style = GRADE_STYLE[grade];
  const todayEmoji = ilshin.todayOhaeng
    .slice(0, 2)
    .map((o) => OHAENG_EMOJI[o])
    .join('');

  // ── 오버레이 모드 (지도 위 작은 배너) ────────────────────────
  if (variant === 'overlay') {
    return (
      <div className="relative">
        <motion.button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm cursor-pointer"
          style={{
            backgroundColor: style.bg + 'EE',
            border: `1.5px solid ${style.border}`,
          }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="text-sm">{ilshin.geun?.emoji ?? '🗓️'}</span>
          <span className="text-xs font-semibold" style={{ color: style.text }}>
            오늘의 일진 {ilshin.dayPillar.label}
          </span>
          {ilshin.geun && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: style.border + '33', color: style.text }}
            >
              {grade}
            </span>
          )}
          <span className="text-xs text-slate-400">{isExpanded ? '▲' : '▼'}</span>
        </motion.button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute top-full mt-2 left-0 w-72 rounded-2xl shadow-xl overflow-hidden"
              style={{
                backgroundColor: style.bg,
                border: `1.5px solid ${style.border}`,
              }}
            >
              <div className="p-4">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">
                      {ilshin.date} 일진 · {ilshin.dayPillar.cheonganKr}{ilshin.dayPillar.jijiKr}일
                    </p>
                    <p className="font-bold text-sm" style={{ color: style.text }}>
                      {ilshin.geun?.summary ?? `오늘의 오행: ${todayEmoji}`}
                    </p>
                  </div>
                  <span className="text-2xl">{ilshin.geun?.emoji ?? '🗓️'}</span>
                </div>

                {/* 개운 점수 바 */}
                {ilshin.geun && (
                  <GeunScoreBar score={ilshin.geun.score} grade={grade} />
                )}

                {/* 상세 설명 */}
                {ilshin.geun?.detail && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {ilshin.geun.detail}
                  </p>
                )}

                {/* 오행 칩 */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {ilshin.todayOhaeng.map((o, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: OHAENG_COLOR[o].bg,
                        color: OHAENG_COLOR[o].text,
                      }}
                    >
                      {OHAENG_EMOJI[o]} {o}
                    </span>
                  ))}
                </div>

                {/* 추천 운 */}
                {ilshin.geun?.recommendedLuck && ilshin.geun.recommendedLuck.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <p className="text-xs text-slate-500 mb-1">오늘 명당 방문 추천 운:</p>
                    <div className="flex gap-1 flex-wrap">
                      {ilshin.geun.recommendedLuck.slice(0, 3).map((luck) => (
                        <span
                          key={luck}
                          className="text-xs bg-white/80 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600"
                        >
                          {luck}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── 카드 모드 (결과 페이지 등에서 사용) ──────────────────────
  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: style.bg,
        border: `1.5px solid ${style.border}`,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{ilshin.geun?.emoji ?? '🗓️'}</span>
          <div>
            <p className="text-xs text-slate-500">오늘의 일진 — {ilshin.date}</p>
            <p className="font-bold text-sm" style={{ color: style.text }}>
              {ilshin.dayPillar.cheonganKr}{ilshin.dayPillar.jijiKr}일 ({ilshin.dayPillar.cheongan}{ilshin.dayPillar.jiji})
            </p>
          </div>
          {ilshin.geun && (
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: style.border + '33', color: style.text }}
            >
              {grade}
            </span>
          )}
        </div>

        {ilshin.geun && (
          <>
            <GeunScoreBar score={ilshin.geun.score} grade={grade} />
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {ilshin.geun.summary}
            </p>
          </>
        )}

        <div className="flex gap-1.5 mt-2">
          {ilshin.todayOhaeng.map((o, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: OHAENG_COLOR[o].bg,
                color: OHAENG_COLOR[o].text,
              }}
            >
              {OHAENG_EMOJI[o]} {o}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
