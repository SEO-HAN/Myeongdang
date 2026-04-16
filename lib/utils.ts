/**
 * 공통 유틸리티
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Ohaeng } from '@/lib/saju/types'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'

// ── Tailwind 클래스 병합 ──────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── 오행 → 마커 색상 HEX ─────────────────────
export function getOhaengHex(ohaeng: Ohaeng): string {
  return OHAENG_COLOR[ohaeng].hex
}

// ── 오행 → 칩 CSS 클래스 ─────────────────────
const OHAENG_CSS: Record<Ohaeng, string> = {
  목: 'ohaeng-mok',
  화: 'ohaeng-hwa',
  토: 'ohaeng-to',
  금: 'ohaeng-geum',
  수: 'ohaeng-su',
}
export function getOhaengClass(ohaeng: Ohaeng): string {
  return OHAENG_CSS[ohaeng]
}

// ── 오행 라벨 (이모지 포함) ──────────────────
export function getOhaengLabel(ohaeng: Ohaeng): string {
  return `${OHAENG_EMOJI[ohaeng]} ${ohaeng}(${getOhaengHanja(ohaeng)})`
}

const OHAENG_HANJA: Record<Ohaeng, string> = {
  목: '木', 화: '火', 토: '土', 금: '金', 수: '水',
}
export function getOhaengHanja(ohaeng: Ohaeng): string {
  return OHAENG_HANJA[ohaeng]
}

// ── trust_score → 마커 크기 ──────────────────
export function getTrustMarkerSize(score: number): 'lg' | 'md' | 'sm' {
  if (score >= 90) return 'lg'
  if (score >= 70) return 'md'
  return 'sm'
}

// ── 신뢰도 점수 → 텍스트 라벨 ───────────────
export function getTrustLabel(score: number): string {
  if (score >= 90) return '최고 명당'
  if (score >= 80) return '검증 명당'
  if (score >= 70) return '추천 명당'
  return '제보 명당'
}

// ── 거리 계산 (Haversine, km 반환) ──────────
export function calcDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── 날짜 포매팅 ──────────────────────────────
export function formatKoreanDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

// ── SNS 타입 → 이모지 ────────────────────────
export const SNS_EMOJI: Record<string, string> = {
  인스타: '📷', 유튜브: '📺', 블로그: '📝', 스레드: '🧵', 뉴스: '📰',
}
