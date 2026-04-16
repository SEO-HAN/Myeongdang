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
        // 오행 색상 시스템
        mok:  { DEFAULT: '#3B6D11', bg: '#EAF3DE', text: '#3B6D11' },
        hwa:  { DEFAULT: '#E8593C', bg: '#FAECE7', text: '#993C1D' },
        to:   { DEFAULT: '#BA7517', bg: '#FAEEDA', text: '#854F0B' },
        geum: { DEFAULT: '#888780', bg: '#F1EFE8', text: '#444441' },
        su:   { DEFAULT: '#2563EB', bg: '#E6F1FB', text: '#185FA5' },
        // 브랜드
        brand: { DEFAULT: '#E8593C', dark: '#C0321A' },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        chip: '10px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        bottom: '0 -4px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
export default config
