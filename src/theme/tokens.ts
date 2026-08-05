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
 *
 * 세 변주 — fg: 원색(피커 점·얇은 레일), bg: 반투명 틴트(사진 위 등),
 * solid: 흰 글자가 읽히게 명도를 낮춘 꽉 찬 배경(캘린더 칩·막대). 셋 다 같은 색이어야 한다.
 */
export const eventColor = {
  green: { fg: '#1ED760', bg: 'rgba(30,215,96,0.15)', solid: '#17924A' },
  lime: { fg: '#A3E635', bg: 'rgba(163,230,53,0.16)', solid: '#4E7A16' },
  blue: { fg: '#4F8CFF', bg: 'rgba(79,140,255,0.16)', solid: '#2E6BE6' },
  indigo: { fg: '#818CF8', bg: 'rgba(129,140,248,0.16)', solid: '#4B54E0' },
  purple: { fg: '#A78BFA', bg: 'rgba(167,139,250,0.16)', solid: '#7B45E0' },
  pink: { fg: '#E8688F', bg: 'rgba(232,104,143,0.15)', solid: '#CE3E68' },
  coral: { fg: '#FF8A65', bg: 'rgba(255,138,101,0.16)', solid: '#D64D18' },
  amber: { fg: '#E8B84B', bg: 'rgba(232,184,75,0.16)', solid: '#A66A12' },
  red: { fg: '#FF5C5C', bg: 'rgba(255,92,92,0.16)', solid: '#D93B3B' },
} as const;

export type EventColorKey = keyof typeof eventColor;
export const EVENT_COLOR_KEYS = Object.keys(eventColor) as EventColorKey[];
export const DEFAULT_EVENT_COLOR: EventColorKey = 'green';

/** DB에서 온 문자열을 팔레트 키로 좁힌다 (알 수 없는 값은 기본색) */
export function toEventColor(value: string | null | undefined): EventColorKey {
  return value && value in eventColor ? (value as EventColorKey) : DEFAULT_EVENT_COLOR;
}

/**
 * 스토리 링 — 24시간 내 새 스토리가 있을 때만.
 * accent(그린)를 쓰면 화면의 다른 강조와 섞여 "새 게 있다"가 안 읽힌다.
 * 노랑→주황→빨강→분홍→보라로 도는 난색 스윕. #121212 배경에서 튀지 않게 한 톤씩 낮춰 잡았다.
 * 링에서만 쓴다.
 */
export const storyRing = ['#F7C948', '#F58529', '#E4443C', '#DD2A7B', '#9B3EAF'] as const;

/**
 * 스토리 텍스트 스티커 색 — DB(stories.overlays[].color)에는 이 **키**가 들어간다 (hex 저장 금지).
 * 사진 위에 얹히므로 흰색·검정이 기본이고, 나머지는 링·데이트·브랜드 색을 그대로 빌려 쓴다.
 */
export const storyTextColor = {
  white: color.white,
  black: color.bg,
  yellow: storyRing[0],
  orange: storyRing[1],
  red: storyRing[2],
  pink: storyRing[3],
  purple: storyRing[4],
  aqua: color.date,
  green: color.accent,
} as const;

export type StoryTextColorKey = keyof typeof storyTextColor;
export const STORY_TEXT_COLOR_KEYS = Object.keys(storyTextColor) as StoryTextColorKey[];
export const DEFAULT_STORY_TEXT_COLOR: StoryTextColorKey = 'white';

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
 * 생성 자켓 톤 — 팔레트 6색으로 고르면 앨범 3개만 만들어도 색이 겹친다.
 * seed 해시를 24단계 hue로 흩어 대각 3색 그라디언트를 만든다 (같은 앨범 = 항상 같은 색).
 * 세 정거장이 hue를 조금씩 밀고 가서 2색 사선보다 면에 빛이 돈다.
 */
export const COVER_HUE_STEPS = 24;

export function coverTones(hueIndex: number) {
  const h = Math.round((hueIndex * 360) / COVER_HUE_STEPS);
  return {
    from: `hsl(${h}, 68%, 52%)`,
    mid: `hsl(${(h + 42) % 360}, 58%, 32%)`,
    to: `hsl(${(h + 84) % 360}, 46%, 13%)`,
  };
}

/**
 * 히어로 커버 위 스크림 — 위는 상단바 아이콘이 읽히게, 아래는 본문 배경(color.bg)에 잠기게.
 * 값은 color.bg(#121212)의 알파 변주다 — bg를 바꾸면 여기도 같이 바꾼다.
 */
export const heroScrim = [
  'rgba(18,18,18,0.55)',
  'rgba(18,18,18,0)',
  'rgba(18,18,18,0.72)',
  '#121212',
] as const;
export const HERO_SCRIM_STOPS = [0, 0.3, 0.78, 1] as const;

/**
 * 사진 위 pill 배경 — 색을 꽉 채우고 글자를 검게 뒤집는 대신, 어두운 판을 깔고 글자는 종류 색 그대로 둔다.
 * 커버 사진 위에서도 읽히면서 밝은 덩어리가 화면을 때리지 않는다. 값은 heroScrim과 같은 color.bg 알파 변주.
 */
export const onPhotoBg = 'rgba(18,18,18,0.78)';

/** 칩·pill 테두리 — tintBg와 짝. 배경만으로는 경계가 흐릿한 자리에 얹는다 */
export const tintBorder = {
  accent: 'rgba(30,215,96,0.42)',
  anniv: 'rgba(232,184,75,0.42)',
  date: 'rgba(34,211,238,0.42)',
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
