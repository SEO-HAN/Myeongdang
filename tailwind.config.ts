import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── 오행 색상 시스템 (DESIGN.md §2) ──────────────────────
        mok:  { DEFAULT: '#4B7D1F', bg: '#EBF5E1', text: '#2D5A0E' },
        hwa:  { DEFAULT: '#D94F2A', bg: '#FDF0EB', text: '#8C2E10' },
        to:   { DEFAULT: '#C17D2A', bg: '#FBF3E3', text: '#7A4A0A' },
        geum: { DEFAULT: '#9E9A8E', bg: '#F3F1EC', text: '#4A4843' },
        su:   { DEFAULT: '#2563EB', bg: '#E8F1FA', text: '#1B4F85' },

        // ── 브랜드 / 어센트 ────────────────────────────────────────
        // Primary CTA: vermillion (화火 기운)
        brand: { DEFAULT: '#D94F2A', dark: '#B83720', light: '#F0705A' },
        // Brand accent: compass gold
        gold:  { DEFAULT: '#C9973A', bright: '#E8C060', muted: '#A87D2A' },

        // ── 다크 캔버스 팔레트 (DESIGN.md §2) ─────────────────────
        // 다크 히어로 섹션에 사용
        canvas: {
          black:  '#0D0D1A',   // 최심부
          navy:   '#131230',   // 중간
          teal:   '#0D1520',   // 테두리
          raised: '#1A1A2E',   // 다크 카드
          glass:  'rgba(255,255,255,0.06)', // 유리 효과
        },

        // ── 크림 서피스 팔레트 ──────────────────────────────────────
        parchment: {
          DEFAULT: '#FAF8F2',  // 지도 양피지 배경
          warm:    '#F5F1E8',  // 따뜻한 아이보리 (입력 필드)
          muted:   '#F0ECE3',  // 세컨더리 서피스
        },

        // ── 텍스트 시스템 ──────────────────────────────────────────
        ink: {
          dark:    '#1A1824',  // 라이트 서피스 주요 텍스트
          mid:     '#6E6A7A',  // 세컨더리 텍스트
          faint:   '#A09AA8',  // 캡션, 메타데이터
          cream:   '#F0EAD8',  // 다크 서피스 주요 텍스트
          dim:     '#A09895',  // 다크 서피스 세컨더리
        },
      },

      fontFamily: {
        // UI / 본문 — 현대적 한국어 가독성
        sans: ['Noto Sans KR', '-apple-system', 'Apple SD Gothic Neo', 'system-ui', 'sans-serif'],
        // 헤딩 — 전통적 권위, 감성적 무게감
        serif: ['Noto Serif KR', 'Georgia', 'serif'],
      },

      borderRadius: {
        card:  '20px',  // 표준 카드
        sheet: '32px',  // 바텀시트
        chip:  '9999px', // 필 칩
        input: '16px',  // 입력 필드
        btn:   '16px',  // 버튼
      },

      boxShadow: {
        // 세 겹 따뜻한 카드 섀도우 (Airbnb 스타일)
        card:   'rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 16px, rgba(0,0,0,0.10) 0px 8px 32px',
        // 인터랙티브 호버
        hover:  'rgba(0,0,0,0.04) 0px 0px 0px 1px, rgba(0,0,0,0.10) 0px 8px 24px',
        // 플로팅 배너 / 바텀시트
        float:  '0 -4px 40px rgba(0,0,0,0.15)',
        bottom: '0 4px 24px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)',
        // 골드 링 (포커스 / 선택 상태)
        gold:   '0px 0px 0px 2px rgba(201,151,58,0.35)',
        // 다크 서피스 유리 카드
        glass:  '0 4px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10)',
        // 버밀리언 CTA (프라이머리)
        cta:    '0px 0px 0px 1px #D94F2A, 0px 4px 16px rgba(217,79,42,0.30)',
      },

      backgroundImage: {
        // 다크 히어로 그라디언트
        'hero-dark': 'linear-gradient(160deg, #0D0D1A 0%, #131230 55%, #0D1520 100%)',
        // 골드 심머 (진행률 바)
        'gold-shimmer': 'linear-gradient(90deg, #C9973A, #E8C060, #C9973A)',
        // 오행별 라이트 그라디언트 — 필요 시 확장
      },

      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
