/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── 기본 최적화 ───────────────────────────────────────────────────
  poweredByHeader: false,
  compress: true,

  // ── 이미지 최적화 ────────────────────────────────────────────────
  images: {
    remotePatterns: [
      // Supabase Storage
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      // 카카오 CDN
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: 't1.kakaocdn.net' },
      // 인스타그램 CDN
      { protocol: 'https', hostname: '*.cdninstagram.com' },
      // 네이버 블로그
      { protocol: 'https', hostname: '*.pstatic.net' },
      // 유튜브 썸네일
      { protocol: 'https', hostname: 'i.ytimg.com' },
      // Unsplash (개발용)
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 428, 768, 1024, 1280],
    imageSizes: [16, 32, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
  },

  // ── 보안 헤더 ─────────────────────────────────────────────────────
  async headers() {
    return [
      // 전역 보안 헤더
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      // OG 이미지 API — CORS + 캐싱
      {
        source: '/api/og',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
      // PWA 매니페스트
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
      // 서비스워커
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  // ── 실험적 기능 ───────────────────────────────────────────────────
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') ?? '',
      ].filter(Boolean),
    },
  },

  // ── 번들 최적화 ───────────────────────────────────────────────────
  webpack: (config, { isServer }) => {
    // 서버 사이드에서 canvas 미사용 — 번들 제외
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas'];
    }
    return config;
  },

  // ── 빌드 설정 ─────────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  staticPageGenerationTimeout: 60,
};

module.exports = nextConfig;
