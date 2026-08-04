/**
 * 네이버 지역검색 분류 문자열 → 장소 종류 8종.
 * 원문은 `음식점>한식>육류,고기` / `카페,디저트>카페` 같은 `>` 구분 계층 문자열이고,
 * 값의 집합이 문서화돼 있지 않아 정확한 매칭 대신 키워드 포함으로 좁힌다.
 * 종류는 DB에 저장하지 않는다 — places.category 원문에서 매번 파생한다.
 */

export type PlaceKind = 'food' | 'cafe' | 'bar' | 'culture' | 'nature' | 'shopping' | 'stay' | 'etc';

/**
 * 위에서부터 먼저 맞는 종류로 확정한다 — 순서가 규칙의 일부다.
 * 술집(`음식점>술집>와인바`)·카페(`음식점>카페,디저트`)는 원문에 '음식점'이 같이 들어 있어
 * food보다 먼저 봐야 한다. food가 위로 가면 둘 다 '음식'으로 빨려 들어간다.
 */
const RULES: readonly (readonly [PlaceKind, readonly string[]])[] = [
  ['bar', ['술집', '주점', '와인', '칵테일', '이자카야', '호프', '펍', '맥주', '포장마차']],
  ['cafe', ['카페', '디저트', '커피', '베이커리', '제과', '빙수', '아이스크림', '브런치']],
  ['food', ['음식점', '한식', '양식', '일식', '중식', '분식', '뷔페', '치킨', '피자', '패스트푸드', '요리']],
  ['culture', ['문화', '예술', '미술관', '박물관', '전시', '영화', '공연', '극장', '도서관', '갤러리', '체험']],
  ['nature', ['공원', '수목원', '해수욕장', '계곡', '유원지', '관광', '명소', '자연', '동물원', '식물원', '전망대', '등산']],
  ['shopping', ['쇼핑', '백화점', '마트', '시장', '소품', '서점', '아울렛', '편집숍', '문구']],
  ['stay', ['숙박', '호텔', '펜션', '모텔', '리조트', '게스트하우스']],
];

export function placeKind(category: string | null | undefined): PlaceKind {
  if (!category) return 'etc';
  for (const [kind, keywords] of RULES) {
    if (keywords.some((k) => category.includes(k))) return kind;
  }
  return 'etc';
}

const LABEL: Record<PlaceKind, string> = {
  food: '음식',
  cafe: '카페',
  bar: '술',
  culture: '문화',
  nature: '자연',
  shopping: '쇼핑',
  stay: '숙박',
  etc: '장소',
};

export function placeKindLabel(kind: PlaceKind): string {
  return LABEL[kind];
}
