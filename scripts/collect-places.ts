#!/usr/bin/env ts-node
/**
 * 명당지도 — 장소 자동 수집 파이프라인
 *
 * 실행:
 *   npx ts-node -P /tmp/tsconfig_test.json scripts/collect-places.ts
 *   npx ts-node -P /tmp/tsconfig_test.json scripts/collect-places.ts --dry-run
 *   npx ts-node -P /tmp/tsconfig_test.json scripts/collect-places.ts --keyword "풍수 명소"
 *
 * 파이프라인:
 *   1. 네이버 지역 검색 API → 장소 목록 수집
 *   2. Claude Haiku API → 오행 태깅 자동화
 *   3. Supabase upsert → 30개 → 300개 확장
 *
 * 필요 환경변수 (.env.local):
 *   NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  collectPlacesByKeywords,
  FENGSHUI_KEYWORDS,
} from './lib/naver-search';
import { batchTagPlaces } from './lib/ohaeng-tagger';

// .env.local 로드 (스크립트 실행 환경)
config({ path: '.env.local' });

// ─────────────────────────────────────────────
// CLI 파라미터 파싱
// ─────────────────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const customKeyword = args.find((a) => a.startsWith('--keyword='))?.replace('--keyword=', '');
const limitArg = args.find((a) => a.startsWith('--limit='))?.replace('--limit=', '');
const limitPerKeyword = limitArg ? Number(limitArg) : 5;

// ─────────────────────────────────────────────
// Supabase Admin 클라이언트 (RLS 우회)
// ─────────────────────────────────────────────

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수 없음'
    );
  }
  return createClient(url, key);
}

// ─────────────────────────────────────────────
// 기존 장소 이름 목록 조회 (중복 방지)
// ─────────────────────────────────────────────

async function getExistingPlaceNames(): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('places').select('name');
  return new Set((data ?? []).map((p) => p.name));
}

// ─────────────────────────────────────────────
// 장소 Upsert
// ─────────────────────────────────────────────

interface PlaceUpsertInput {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  description_short?: string;
  ohaeng: string[];
  luck_types: string[];
  trust_score: number;
  reason_text: string;
  expert_verified: boolean;
  source_sns?: string;
}

async function upsertPlaces(places: PlaceUpsertInput[]): Promise<{
  inserted: number;
  updated: number;
  errors: number;
}> {
  const supabase = getSupabaseAdmin();
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const place of places) {
    try {
      const { error } = await supabase.from('places').upsert(
        {
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          ohaeng: place.ohaeng,
          luck_types: place.luck_types,
          place_type: mapCategoryToType(place.category),
          description_short: place.description_short ?? place.reason_text.slice(0, 80),
          reason_text: place.reason_text,
          trust_score: place.trust_score,
          expert_verified: place.expert_verified,
          image_urls: [],
          source_sns: place.source_sns ?? null,
          trending_score: 0,
        },
        { onConflict: 'name', ignoreDuplicates: false }
      );

      if (error) {
        console.error(`  ❌ upsert 실패 [${place.name}]:`, error.message);
        errors++;
      } else {
        console.log(`  ✅ upsert 완료: ${place.name} (${place.ohaeng.join('/')})`);
        inserted++;
      }
    } catch (err) {
      console.error(`  ❌ 예외 [${place.name}]:`, err);
      errors++;
    }
  }

  return { inserted, updated, errors };
}

/** 네이버 카테고리 → 명당지도 place_type 매핑 */
function mapCategoryToType(category: string): string {
  if (category.includes('사찰') || category.includes('절')) return '사찰';
  if (category.includes('산') || category.includes('등산')) return '산';
  if (category.includes('공원') || category.includes('자연')) return '공원';
  if (category.includes('문화') || category.includes('유적') || category.includes('궁')) return '문화유적';
  if (category.includes('해변') || category.includes('바다')) return '해변';
  return '명소';
}

// ─────────────────────────────────────────────
// 메인 파이프라인
// ─────────────────────────────────────────────

async function main() {
  console.log('🗺️  명당지도 — 장소 수집 파이프라인 시작\n');
  console.log(`  모드: ${isDryRun ? '🔍 Dry Run (DB 저장 안 함)' : '💾 실제 저장'}`);
  console.log(`  키워드: ${customKeyword ?? `기본 ${FENGSHUI_KEYWORDS.length}개`}`);
  console.log(`  키워드당 수집: ${limitPerKeyword}개\n`);

  // ── 1단계: 기존 장소 목록 로드 ──────────────────────────────
  console.log('1️⃣  기존 장소 목록 로드...');
  const existingNames = isDryRun
    ? new Set<string>()
    : await getExistingPlaceNames();
  console.log(`  → 기존 ${existingNames.size}개 장소\n`);

  // ── 2단계: 네이버 검색 수집 ─────────────────────────────────
  console.log('2️⃣  네이버 지역 검색 수집...');
  const keywords = customKeyword
    ? [customKeyword]
    : [...FENGSHUI_KEYWORDS];

  const rawPlaces = await collectPlacesByKeywords(keywords, limitPerKeyword);

  // 중복 제거 (기존 + 이번 수집)
  const newPlaces = rawPlaces.filter((p) => !existingNames.has(p.cleanTitle));
  console.log(`  → 수집: ${rawPlaces.length}개 / 신규: ${newPlaces.length}개\n`);

  if (newPlaces.length === 0) {
    console.log('  ℹ️  신규 장소 없음 — 파이프라인 종료');
    return;
  }

  // ── 3단계: 오행 태깅 ────────────────────────────────────────
  console.log('3️⃣  Claude Haiku로 오행 태깅...\n');
  const taggedPlaces = await batchTagPlaces(
    newPlaces.map((p) => ({
      name: p.cleanTitle,
      address: p.roadAddress || p.address,
      category: p.category,
      description: p.description,
    })),
    2 // concurrency
  );

  // ── 4단계: 결과 미리보기 ─────────────────────────────────────
  console.log('\n4️⃣  태깅 결과:\n');
  const upsertData: PlaceUpsertInput[] = taggedPlaces.map((t, i) => {
    const raw = newPlaces[i];
    console.log(`  [${i + 1}] ${t.name}`);
    console.log(`       오행: ${t.ohaeng.join('/')}  운: ${t.luck_types.join('/')}`);
    console.log(`       신뢰도: ${t.trust_score}  주소: ${raw.roadAddress || raw.address}`);
    return {
      name: t.name,
      address: raw.roadAddress || raw.address,
      lat: raw.lat,
      lng: raw.lng,
      category: raw.category,
      ohaeng: t.ohaeng,
      luck_types: t.luck_types,
      trust_score: t.trust_score,
      reason_text: t.reason_text,
      expert_verified: t.expert_verified,
      source_sns: raw.link || undefined,
    };
  });

  // ── 5단계: DB 저장 ──────────────────────────────────────────
  if (isDryRun) {
    console.log('\n🔍 Dry Run — DB 저장 생략');
    console.log(`   저장될 장소: ${upsertData.length}개`);
    return;
  }

  console.log('\n5️⃣  Supabase upsert...');
  const { inserted, errors } = await upsertPlaces(upsertData);

  // ── 최종 요약 ────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`✅ 완료: ${inserted}개 저장  ❌ 오류: ${errors}개`);
  console.log(`📍 총 장소: ${existingNames.size + inserted}개`);
}

main().catch((err) => {
  console.error('❌ 파이프라인 오류:', err);
  process.exit(1);
});
