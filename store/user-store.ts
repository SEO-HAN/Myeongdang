/**
 * Zustand 전역 스토어 — 사용자 사주 프로필 + UI 상태
 *
 * 설계 원칙:
 *  1. 사주 프로필은 localStorage에 persist → 재방문 시 유지
 *  2. 지도 필터 상태는 사주 결과와 자동 연동
 *  3. 선택된 장소 상태는 바텀시트 제어에 사용
 */
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { calculateSaju } from '@/lib/saju/engine'
import type { SajuInput, SajuResult, Ohaeng } from '@/lib/saju/types'
import type { PlaceRow } from '@/types/database'

// ─────────────────────────────────────────────
// 상태 타입 정의
// ─────────────────────────────────────────────

interface SajuProfile {
  input: SajuInput
  result: SajuResult
  savedAt: string
}

interface UserState {
  // 사주 프로필
  profile: SajuProfile | null
  isProfileComplete: boolean

  // 사용자 개인 정보
  userName: string | null
  userGender: 'male' | 'female' | null

  // 지도 필터
  activeOhaengFilter: Ohaeng[]    // 현재 활성 오행 필터 (빈 배열 = 전체)
  isPersonalizedMode: boolean     // 내 사주 기반 필터링 ON/OFF

  // 선택된 장소 (바텀시트)
  selectedPlace: PlaceRow | null
  isBottomSheetOpen: boolean

  // 북마크 (로컬 캐시)
  bookmarkedIds: string[]
}

interface UserActions {
  // 사주 계산 & 저장
  setSaju: (input: SajuInput, meta?: { name?: string; gender?: 'male' | 'female' }) => SajuResult
  clearSaju: () => void

  // 필터 제어
  setOhaengFilter: (ohaeng: Ohaeng[]) => void
  togglePersonalizedMode: () => void
  resetFilter: () => void

  // 바텀시트 제어
  openPlace: (place: PlaceRow) => void
  closePlace: () => void

  // 북마크
  toggleBookmark: (placeId: string) => void
  isBookmarked: (placeId: string) => boolean
}

// ─────────────────────────────────────────────
// 스토어 생성
// ─────────────────────────────────────────────

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      // ── 초기 상태 ──
      profile: null,
      isProfileComplete: false,
      userName: null,
      userGender: null,
      activeOhaengFilter: [],
      isPersonalizedMode: false,
      selectedPlace: null,
      isBottomSheetOpen: false,
      bookmarkedIds: [],

      // ── 사주 계산 ──
      setSaju: (input: SajuInput, meta?: { name?: string; gender?: 'male' | 'female' }) => {
        const result = calculateSaju(input)
        const profile: SajuProfile = {
          input,
          result,
          savedAt: new Date().toISOString(),
        }
        set({
          profile,
          isProfileComplete: true,
          // 사주 설정 시 자동으로 개인화 모드 ON + 부족 오행 필터 적용
          isPersonalizedMode: true,
          activeOhaengFilter: result.weakOhaeng,
          userName: meta?.name ?? null,
          userGender: meta?.gender ?? null,
        })
        return result
      },

      clearSaju: () =>
        set({
          profile: null,
          isProfileComplete: false,
          isPersonalizedMode: false,
          activeOhaengFilter: [],
        }),

      // ── 필터 제어 ──
      setOhaengFilter: (ohaeng) => set({ activeOhaengFilter: ohaeng }),

      togglePersonalizedMode: () => {
        const { isPersonalizedMode, profile } = get()
        if (!isPersonalizedMode && profile) {
          // 개인화 ON → 부족 오행 필터 적용
          set({
            isPersonalizedMode: true,
            activeOhaengFilter: profile.result.weakOhaeng,
          })
        } else {
          // 개인화 OFF → 필터 초기화
          set({ isPersonalizedMode: false, activeOhaengFilter: [] })
        }
      },

      resetFilter: () =>
        set({ activeOhaengFilter: [], isPersonalizedMode: false }),

      // ── 바텀시트 ──
      openPlace: (place) =>
        set({ selectedPlace: place, isBottomSheetOpen: true }),

      closePlace: () =>
        set({ isBottomSheetOpen: false }),

      // ── 북마크 ──
      toggleBookmark: (placeId) => {
        const { bookmarkedIds } = get()
        const isBookmarked = bookmarkedIds.includes(placeId)
        set({
          bookmarkedIds: isBookmarked
            ? bookmarkedIds.filter((id) => id !== placeId)
            : [...bookmarkedIds, placeId],
        })
      },

      isBookmarked: (placeId) => get().bookmarkedIds.includes(placeId),
    }),

    {
      name: 'myeongdang-user',
      storage: createJSONStorage(() => localStorage),
      // 서버사이드에서는 localStorage 없으므로 클라이언트만 persist
      skipHydration: true,
      // 영구 저장 항목 (UI 상태는 저장 안 함)
      partialize: (state) => ({
        profile: state.profile,
        isProfileComplete: state.isProfileComplete,
        bookmarkedIds: state.bookmarkedIds,
        userName: state.userName,
        userGender: state.userGender,
      }),
    },
  ),
)

// ─────────────────────────────────────────────
// 편의 셀렉터 (리렌더 최소화용)
// ─────────────────────────────────────────────

export const useProfile = () => useUserStore((s) => s.profile)
export const useWeakOhaeng = () =>
  useUserStore((s) => s.profile?.result.weakOhaeng ?? [])
export const useActiveFilter = () =>
  useUserStore((s) => s.activeOhaengFilter)
export const useSelectedPlace = () =>
  useUserStore((s) => ({ place: s.selectedPlace, isOpen: s.isBottomSheetOpen }))
export const useBookmarks = () =>
  useUserStore((s) => s.bookmarkedIds)
