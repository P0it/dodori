/**
 * 도도리 디자인 토큰 — 원본: design-mockup/_ds/.../tokens/*.css + app/shared.jsx `C` 팔레트.
 * 컴포넌트에서 hex 하드코딩 금지 — 반드시 이 토큰을 참조한다. (PRD §6.2)
 * M6 브랜드 리스킨은 이 파일 값 교체로 끝나야 한다.
 */

/** 데이터 인코딩 3역할 규약 (PRD §6.2) — 값은 바뀌어도 역할 구분은 유지 */
export const role = {
  me: '#1ED760', // 나 (brand green)
  partner: '#E8688F', // 상대 (pink)
  anniv: '#E8B84B', // 기념일 (amber)
} as const;

export type OwnerRole = keyof typeof role;

export const color = {
  ...role,
  greenBright: '#1ED760',
  greenCore: '#1DB954', // play button
  greenPress: '#17B54E',
  bg: '#121212',
  surface1: '#181818',
  surface2: '#282828',
  surface3: '#333333',
  surface4: '#3E3F3F',
  hairline: '#47464B',
  white: '#FFFFFF',
  sub: '#B3B3B3',
  muted: '#777777',
  onPrimary: '#191414',
  kakao: '#FEE500',
  kakaoText: '#191600',
  danger: '#E8567A',
  /** 데이트(트랙) — 3역할(나=green·상대=pink·기념일=amber)과 겹치지 않는 보라 */
  date: '#A78BFA',
  /** 공휴일 — role.partner(핑크)와 혼동되지 않도록 채도 높은 적색으로 분리 */
  holiday: '#FF5C5C',
  /** 요일 표시 — 토요일 파랑 / 일요일 빨강 (일요일은 공휴일과 같은 적색 계열) */
  saturday: '#8FB4FF',
  sunday: '#FF5C5C',
} as const;

/** 칩·pill 반투명 배경 (3역할 + 데이트) */
export const roleBg = {
  me: 'rgba(30,215,96,0.15)',
  partner: 'rgba(232,104,143,0.15)',
  anniv: 'rgba(232,184,75,0.16)',
  date: 'rgba(167,139,250,0.16)',
} as const;

/**
 * 생성 커버(자켓) 팔레트 — 사진 없는 앨범에 트랙 id로 결정적 배정 (§6.4 placeholder 대체).
 * 각 항목은 대각 그라디언트 [밝은 쪽, 어두운 쪽]. 같은 앨범은 항상 같은 자켓.
 */
export const coverPalette: readonly (readonly [string, string])[] = [
  ['#1DB954', '#0B3B1E'],
  ['#A78BFA', '#2E2154'],
  ['#E8688F', '#4A1C2C'],
  ['#E8B84B', '#4A3611'],
  ['#4FA8FF', '#12314F'],
  ['#FF7A45', '#4A2013'],
] as const;

export const radius = {
  mini: 3,
  card: 4,
  coverSm: 5,
  field: 6,
  cover: 7,
  sheet: 20,
  pill: 999,
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16, // 기본 화면 gutter
  5: 20,
  6: 24,
  8: 32,
} as const;

/** 앱 전역 서체 (expo-font 플러그인이 Android XML family·iOS 번들로 등록) — fontWeight와 조합해 사용 */
export const typeface = 'Pretendard';

export const font = {
  screenTitle: 34,
  h1: 28,
  section: 24,
  albumTitle: 22,
  titleMd: 16,
  body: 15,
  bodySm: 14,
  meta: 13,
  caption: 12,
  micro: 11,
  tab: 10,
} as const;

export const layout = {
  tabbarHeight: 56,
  nextUpHeight: 56,
} as const;
