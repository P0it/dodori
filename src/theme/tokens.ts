/**
 * 도도리 디자인 토큰 — 원본: design-mockup/_ds/.../tokens/*.css + app/shared.jsx `C` 팔레트.
 * 컴포넌트에서 hex 하드코딩 금지 — 반드시 이 토큰을 참조한다. (PRD §6.2)
 * M6 브랜드 리스킨은 이 파일 값 교체로 끝나야 한다.
 */

export const color = {
  /** 브랜드 강조 — 버튼·링크·활성 상태. 사람을 뜻하지 않는다 */
  accent: '#1ED760',
  /** 기념일 (amber) */
  anniv: '#E8B84B',
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
  /**
   * 데이트(트랙) — 아쿠아. 일정 팔레트의 purple과 hex가 똑같아 사용자가 고른 보라 일정과
   * 데이트 칩이 구분되지 않던 걸 끊는다. 남은 색환에서 accent(green 140°)·holiday(red 0°)·
   * anniv(amber 43°)·pink(340°)와 가장 멀리 떨어진 자리가 여기(187°)다.
   */
  date: '#22D3EE',
  /** 공휴일 — role.partner(핑크)와 혼동되지 않도록 채도 높은 적색으로 분리 */
  holiday: '#FF5C5C',
  /** 요일 표시 — 토요일 파랑 / 일요일 빨강 (일요일은 공휴일과 같은 적색 계열) */
  saturday: '#8FB4FF',
  sunday: '#FF5C5C',
} as const;

/** 칩·pill 반투명 배경 — 종류(기념일·데이트)를 뜻한다 */
export const tintBg = {
  accent: 'rgba(30,215,96,0.15)',
  anniv: 'rgba(232,184,75,0.16)',
  date: 'rgba(34,211,238,0.16)',
} as const;

/**
 * 일정 색 팔레트 — 사람이 아니라 **일정의 속성**. 등록할 때 직접 고른다.
 * DB(events.color)에는 이 키가 그대로 들어간다 (hex 저장 금지 — 리스킨이 이 파일 교체로 끝나야 한다).
 *
 * 아쿠아(청록) 자리는 비워둔다 — color.date가 쓴다. 데이트와 구분되지 않는 일정 색은
 * 캘린더에서 종류를 못 읽게 만든다. blue도 같은 이유로 #4FA8FF에서 살짝 남색 쪽으로 옮겼다.
 * 키를 추가하면 events.color CHECK 제약도 같이 넓혀야 한다 (마이그레이션).
 */
export const eventColor = {
  green: { fg: '#1ED760', bg: 'rgba(30,215,96,0.15)' },
  lime: { fg: '#A3E635', bg: 'rgba(163,230,53,0.16)' },
  blue: { fg: '#4F8CFF', bg: 'rgba(79,140,255,0.16)' },
  indigo: { fg: '#818CF8', bg: 'rgba(129,140,248,0.16)' },
  purple: { fg: '#A78BFA', bg: 'rgba(167,139,250,0.16)' },
  pink: { fg: '#E8688F', bg: 'rgba(232,104,143,0.15)' },
  coral: { fg: '#FF8A65', bg: 'rgba(255,138,101,0.16)' },
  amber: { fg: '#E8B84B', bg: 'rgba(232,184,75,0.16)' },
  red: { fg: '#FF5C5C', bg: 'rgba(255,92,92,0.16)' },
} as const;

export type EventColorKey = keyof typeof eventColor;
export const EVENT_COLOR_KEYS = Object.keys(eventColor) as EventColorKey[];
export const DEFAULT_EVENT_COLOR: EventColorKey = 'green';

/** DB에서 온 문자열을 팔레트 키로 좁힌다 (알 수 없는 값은 기본색) */
export function toEventColor(value: string | null | undefined): EventColorKey {
  return value && value in eventColor ? (value as EventColorKey) : DEFAULT_EVENT_COLOR;
}

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

/**
 * 생성 자켓(LP) 톤 — 팔레트 6색으로 고르면 앨범 3개만 만들어도 색이 겹친다.
 * seed 해시를 24단계 hue로 흩어 슬리브·라벨 색을 만든다 (같은 앨범 = 항상 같은 색).
 */
export const COVER_HUE_STEPS = 24;

export function coverTones(hueIndex: number) {
  const h = Math.round((hueIndex * 360) / COVER_HUE_STEPS);
  return {
    sleeveTop: `hsl(${h}, 40%, 17%)`,
    sleeveBottom: `hsl(${h}, 32%, 6%)`,
    /** LP 라벨 — 자켓에서 유일하게 밝은 면 */
    label: `hsl(${h}, 60%, 62%)`,
    vinyl: `hsl(${h}, 16%, 6%)`,
  };
}

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
