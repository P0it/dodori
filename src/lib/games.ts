/**
 * 커플 아케이드 도메인 규칙 — 순수 함수만. 종목 배정·승패·주간 전적.
 * 종목 UI는 여기 없다(components/game/). 여기는 규칙과 카탈로그다.
 */
import { addDays, fromEpochDay, toEpochDay, type ISODate } from './date';

export interface GameDef {
  key: string;
  name: string;
  blurb: string;
  unit: 'ms' | 'count' | 'level';
  /** 점수 방향: true면 높을수록 승, false면 낮을수록 승 */
  higherIsBetter: boolean;
  format: (score: number) => string;
}

/**
 * 카탈로그 순서가 곧 요일. idx 0 = 월요일.
 * 종목을 추가하면 이 배열과 GameHost 스위치만 늘리면 된다.
 */
export const GAME_CATALOG: GameDef[] = [
  {
    key: 'reaction',
    name: '반응속도',
    blurb: '초록으로 바뀌는 순간 탭 — 4번의 평균',
    unit: 'ms',
    higherIsBetter: false,
    format: (s) => `${Math.round(s)}ms`,
  },
  {
    key: 'whack',
    name: '두더지 잡기',
    blurb: '8초 동안 튀어나오는 칸을 탭',
    unit: 'count',
    higherIsBetter: true,
    format: (s) => `${s}마리`,
  },
  {
    key: 'oddcolor',
    name: '색 다른 칸 찾기',
    blurb: '딱 하나 다른 색을 탭 — 단계마다 어려워짐',
    unit: 'level',
    higherIsBetter: true,
    format: (s) => `${s}단계`,
  },
  {
    key: 'tensec',
    // 목표 시간을 바꾸면 TenSecGame의 TARGET_MS도 같이 고칠 것 (key는 DB에 남은 값이라 유지)
    name: '정확히 7초',
    blurb: '타이머를 숨긴 채 7.000초에 정지',
    unit: 'ms',
    higherIsBetter: false,
    format: (s) => `${(s / 1000).toFixed(2)}초 오차`,
  },
  {
    key: 'taprush',
    name: '탭 연타',
    blurb: '5초 동안 몇 번이나 누를 수 있나',
    unit: 'count',
    higherIsBetter: true,
    format: (s) => `${s}번`,
  },
  {
    key: 'stroop',
    name: '글자색 고르기',
    blurb: '글자의 뜻이 아니라 글자색을 고른다 — 15초',
    unit: 'count',
    higherIsBetter: true,
    format: (s) => `${s}개`,
  },
  {
    key: 'sequence',
    name: '숫자 순서 탭',
    blurb: '흩어진 1~16을 순서대로',
    unit: 'ms',
    higherIsBetter: false,
    format: (s) => `${(s / 1000).toFixed(1)}초`,
  },
];

/**
 * epochDay 0(1970-01-01)은 목요일이라 그대로 나누면 월요일이 idx 0에 오지 않는다.
 * +3으로 월=0에 맞춘다 (weekBounds도 같은 정렬을 쓴다).
 */
function mondayIndex(date: ISODate): number {
  return (((toEpochDay(date) + 3) % 7) + 7) % 7;
}

/** 오늘의 종목 — KST 날짜가 곧 요일 인덱스 (월=반응속도 … 일=숫자 순서) */
export function pickTodayGame(today: ISODate): GameDef {
  return GAME_CATALOG[mondayIndex(today)];
}

export type Outcome = 'win' | 'lose' | 'draw';

/** 내 최고점 vs 상대 최고점. 방향(higherIsBetter)으로 종목별 대소를 흡수 */
export function outcome(mine: number, theirs: number, higherIsBetter: boolean): Outcome {
  if (mine === theirs) return 'draw';
  const iAmBigger = mine > theirs;
  const iWin = higherIsBetter ? iAmBigger : !iAmBigger;
  return iWin ? 'win' : 'lose';
}

/** 이번 주 월~일 (KST) */
export function weekBounds(today: ISODate): { start: ISODate; end: ISODate } {
  const start = fromEpochDay(toEpochDay(today) - mondayIndex(today));
  return { start, end: addDays(start, 6) };
}

export interface DailyResult {
  date: ISODate;
  mine: number | null;
  theirs: number | null;
  higherIsBetter: boolean;
}

export interface WeekTally {
  win: number;
  draw: number;
  lose: number;
}

/** 이번 주 전적 — 양쪽 다 점수를 낸 날만 승/무/패에 넣는다 */
export function tally(rows: DailyResult[]): WeekTally {
  const t: WeekTally = { win: 0, draw: 0, lose: 0 };
  for (const r of rows) {
    if (r.mine === null || r.theirs === null) continue;
    t[outcome(r.mine, r.theirs, r.higherIsBetter)] += 1;
  }
  return t;
}
