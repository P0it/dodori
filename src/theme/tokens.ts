/**
 * 도돌이 디자인 토큰 — 원본: design-mockup/_ds/.../tokens/*.css + app/shared.jsx `C` 팔레트.
 * 컴포넌트에서 hex 하드코딩 금지 — 반드시 이 토큰을 참조한다. (PRD §6.2)
 * M6 브랜드 리스킨은 이 파일 값 교체로 끝나야 한다.
 */

/** 데이터 인코딩 3역할 규약 (PRD §6.2) — 값은 바뀌어도 역할 구분은 유지 */
export const role = {
  me: '#1ED760', // 나 (brand green)
  partner: '#E8688F', // 상대 (pink)
  anniv: '#E8B84B', // 기념일 / Single (amber)
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
} as const;

/** 역할별 반투명 배경 (D-day pill 등) */
export const roleBg = {
  me: 'rgba(30,215,96,0.15)',
  partner: 'rgba(232,104,143,0.15)',
  anniv: 'rgba(232,184,75,0.16)',
} as const;

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
