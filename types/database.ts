/**
 * Supabase Database 타입 정의
 *
 * 실제 프로젝트에서는 아래 명령으로 자동 생성:
 *   npx supabase gen types typescript --project-id <YOUR_ID> > types/database.ts
 *
 * 여기서는 migration SQL과 동기화된 수동 타입을 제공합니다.
 */

export type Ohaeng = '목' | '화' | '토' | '금' | '수'
export type PlaceType = '산' | '사찰' | '호텔' | '공원' | '문화재' | '해변' | '강' | '도심' | 'etc'
export type SnsType = '인스타' | '유튜브' | '블로그' | '스레드' | '뉴스'
export type Gender = 'male' | 'female'

// ─────────────────────────────────────────────
// Row 타입 (DB에서 읽어올 때)
// ─────────────────────────────────────────────
export interface PlaceRow {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  ohaeng: Ohaeng[]
  luck_types: string[]
  place_type: PlaceType
  description_short: string
  reason_text: string
  expert_verified: boolean
  trust_score: number
  image_urls: string[]
  kakaomap_url: string
  source_sns: string[]
  trending_score: number
  created_at: string
  updated_at: string
}

export interface PlaceContentRow {
  id: string
  place_id: string
  sns_type: SnsType
  sns_url: string
  sns_thumbnail: string | null
  sns_author: string | null
  snippet_text: string | null
  collected_at: string
}

export interface UserProfileRow {
  id: string
  kakao_id: string | null
  birth_year: number | null
  birth_month: number | null
  birth_day: number | null
  birth_hour: number | null
  gender: Gender | null
  // JSONB 컬럼 — Supabase GenericTable 호환을 위해 Record<string, ...> 사용
  ohaeng_analysis: Record<string, number>
  weak_ohaeng: string[]
  strong_ohaeng: string[]
  imbalance_score: number
  bookmarks: string[]
  visited: Array<{ place_id: string; visited_at: string }>
  // F단계 — 카카오 OAuth 연동
  kakao_nickname?: string | null
  avatar_url?: string | null
  last_login_at?: string  // DEFAULT NOW()
  visited_place_count?: number  // DEFAULT 0
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────
// F단계 신규 테이블 타입
// ─────────────────────────────────────────────

/** 일진(日辰) 계산 결과 캐시 */
export interface IlshinCacheRow {
  date: string                              // YYYY-MM-DD (PK)
  day_pillar: {
    cheongan: string
    jiji: string
    label: string
    cheonganOhaeng: Ohaeng
    jijiOhaeng: Ohaeng
  }
  today_ohaeng: Ohaeng[]
  created_at: string
}

/** 장소 방문 추적 */
export interface PlaceVisitRow {
  id: string
  place_id: string | null
  kakao_id: string | null
  visited_at: string
  source: 'map_click' | 'kakaomap_deeplink' | 'share' | null
}

// ─────────────────────────────────────────────
// Insert 타입 (삽입 시)
// ─────────────────────────────────────────────
export type PlaceInsert = Omit<PlaceRow, 'id' | 'created_at' | 'updated_at'>
export type UserProfileInsert = Omit<UserProfileRow, 'id' | 'created_at' | 'updated_at'>

// ─────────────────────────────────────────────
// 장소 + 콘텐츠 조인 타입 (API 응답용)
// ─────────────────────────────────────────────
export interface PlaceWithContents extends PlaceRow {
  place_contents: PlaceContentRow[]
  content_count?: number
}

// ─────────────────────────────────────────────
// Supabase Database 스키마 타입 (supabase-js용)
// ─────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      places: {
        Row: PlaceRow
        Insert: PlaceInsert
        Update: Partial<PlaceInsert>
      }
      place_contents: {
        Row: PlaceContentRow
        Insert: Omit<PlaceContentRow, 'id' | 'collected_at'>
        Update: Partial<Omit<PlaceContentRow, 'id' | 'collected_at'>>
      }
      user_profiles: {
        Row: UserProfileRow
        Insert: UserProfileInsert
        Update: Partial<UserProfileInsert>
      }
      ilshin_cache: {
        Row: IlshinCacheRow
        Insert: Omit<IlshinCacheRow, 'created_at'>
        Update: Partial<Omit<IlshinCacheRow, 'date'>>
      }
      place_visits: {
        Row: PlaceVisitRow
        Insert: Omit<PlaceVisitRow, 'id' | 'visited_at'>
        Update: never
      }
    }
    Views: {
      places_with_content_count: {
        Row: PlaceRow & { content_count: number }
      }
    }
    Functions: {
      update_trending_scores: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {}
  }
}
