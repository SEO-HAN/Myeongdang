/**
 * 오행 자동 태깅 — Claude API (Anthropic)
 *
 * 장소 정보(이름, 주소, 카테고리, 설명)를 입력으로
 * 오행 배열과 운 유형 배열을 자동으로 생성
 *
 * 환경변수: ANTHROPIC_API_KEY
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Ohaeng } from '../../lib/saju/types';

// scripts에서 lib/saju/types를 직접 임포트 (경로 주의)
const VALID_OHAENG: Ohaeng[] = ['목', '화', '토', '금', '수'];

const VALID_LUCK_TYPES = [
  '건강운', '창업운', '학업운', '성장운',
  '사업운', '승진운', '시험운', '명예운',
  '부동산운', '안정운', '가정운',
  '금전운', '재물운', '결혼운', '결실운',
  '연애운', '인간관계', '지혜운',
];

export interface OhaengTagResult {
  ohaeng: Ohaeng[];
  luck_types: string[];
  trust_score: number;    // 0~100 (AI 추정 신뢰도)
  reason_text: string;    // 풍수 근거 설명 (한국어, 100자 내외)
  expert_verified: boolean; // false (AI 태깅이므로)
}

/** 단일 장소 오행 태깅 */
export async function tagPlaceOhaeng(place: {
  name: string;
  address: string;
  category: string;
  description?: string;
}): Promise<OhaengTagResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `당신은 한국 풍수지리와 오행(五行) 전문가입니다.
아래 장소의 정보를 바탕으로 이 장소의 오행 기운과 추천 운 유형을 분석해주세요.

장소 정보:
- 이름: ${place.name}
- 주소: ${place.address}
- 카테고리: ${place.category}
- 설명: ${place.description ?? '없음'}

다음 JSON 형식으로만 답해주세요 (다른 텍스트 없이):
{
  "ohaeng": ["목", "화"],        // 이 장소의 오행 기운 1~3개 (목/화/토/금/수 중)
  "luck_types": ["사업운", "승진운"],  // 이 장소에 어울리는 운 유형 1~4개
  "trust_score": 65,              // AI 추정 신뢰도 0~100 (전문가 검증 없음이므로 최대 70)
  "reason_text": "이 장소는..."   // 풍수 근거 1~2문장 (100자 이내)
}

선택 가능한 오행: 목(나무/성장/건강), 화(불/열정/사업), 토(흙/안정/부동산), 금(금속/재물/결실), 수(물/지혜/연애)
선택 가능한 운 유형: ${VALID_LUCK_TYPES.join(', ')}`;

  let rawText = '';
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // 빠른 태깅을 위해 Haiku 사용
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON 추출 (마크다운 코드 블록 제거)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const parsed = JSON.parse(jsonMatch[0]);

    // 유효성 검증
    const ohaeng = (parsed.ohaeng ?? [])
      .filter((o: string) => VALID_OHAENG.includes(o as Ohaeng))
      .slice(0, 3) as Ohaeng[];

    const luck_types = (parsed.luck_types ?? [])
      .filter((l: string) => VALID_LUCK_TYPES.includes(l))
      .slice(0, 4) as string[];

    const trust_score = Math.min(
      70, // AI 태깅 최대 70점 (전문가 검증 없음)
      Math.max(0, Number(parsed.trust_score) || 50)
    );

    return {
      ohaeng: ohaeng.length > 0 ? ohaeng : ['토'],
      luck_types: luck_types.length > 0 ? luck_types : ['힐링', '안정운'],
      trust_score,
      reason_text: String(parsed.reason_text ?? '').slice(0, 150),
      expert_verified: false,
    };
  } catch (err) {
    console.error('[ohaeng-tagger] 태깅 실패:', err, '\nRaw:', rawText.slice(0, 200));
    // 폴백: 기본값 반환
    return {
      ohaeng: ['토'],
      luck_types: ['안정운'],
      trust_score: 30,
      reason_text: `${place.name}은(는) AI 자동 태깅으로 추가된 장소입니다. 전문가 검증 필요.`,
      expert_verified: false,
    };
  }
}

/**
 * 배치 태깅 (rate limit 준수)
 * @param places 장소 배열
 * @param concurrency 동시 요청 수 (기본 2)
 */
export async function batchTagPlaces<
  T extends { name: string; address: string; category: string; description?: string }
>(
  places: T[],
  concurrency = 2
): Promise<Array<T & OhaengTagResult>> {
  const results: Array<T & OhaengTagResult> = [];

  // concurrency 단위로 청크 처리
  for (let i = 0; i < places.length; i += concurrency) {
    const chunk = places.slice(i, i + concurrency);
    const tagged = await Promise.all(
      chunk.map(async (place) => {
        const tag = await tagPlaceOhaeng(place);
        return { ...place, ...tag };
      })
    );
    results.push(...tagged);

    // API rate limit: 1초 대기
    if (i + concurrency < places.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(
      `[ohaeng-tagger] ${Math.min(i + concurrency, places.length)}/${places.length} 완료`
    );
  }

  return results;
}
