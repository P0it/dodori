import { GAME_CATALOG, outcome, pickTodayGame, tally, weekBounds, type DailyResult } from '../games';

describe('GAME_CATALOG', () => {
  it('7종목, key 중복 없음', () => {
    expect(GAME_CATALOG).toHaveLength(7);
    expect(new Set(GAME_CATALOG.map((g) => g.key)).size).toBe(7);
  });

  it('idx 0 = reaction (월요일 자리)', () => {
    expect(GAME_CATALOG[0].key).toBe('reaction');
    expect(GAME_CATALOG[6].key).toBe('sequence');
  });
});

describe('pickTodayGame', () => {
  it('같은 날은 항상 같은 종목', () => {
    expect(pickTodayGame('2026-07-27')).toBe(pickTodayGame('2026-07-27'));
  });

  it('하루 지나면 다음 idx', () => {
    const i = GAME_CATALOG.indexOf(pickTodayGame('2026-07-27'));
    const j = GAME_CATALOG.indexOf(pickTodayGame('2026-07-28'));
    expect(j).toBe((i + 1) % 7);
  });

  it('7일 주기로 순환', () => {
    expect(pickTodayGame('2026-07-27')).toBe(pickTodayGame('2026-08-03'));
  });

  it('2026-07-27은 월요일 → reaction', () => {
    // epochDay % 7 이 요일에 고정됨을 못박는다 (2026-07-27 = 월요일)
    expect(pickTodayGame('2026-07-27').key).toBe('reaction');
  });
});

describe('outcome', () => {
  it('높을수록 승: 큰 쪽이 win', () => {
    expect(outcome(12, 8, true)).toBe('win');
    expect(outcome(8, 12, true)).toBe('lose');
  });
  it('낮을수록 승: 작은 쪽이 win', () => {
    expect(outcome(210, 300, false)).toBe('win');
    expect(outcome(300, 210, false)).toBe('lose');
  });
  it('동점은 무승부', () => {
    expect(outcome(10, 10, true)).toBe('draw');
    expect(outcome(10, 10, false)).toBe('draw');
  });
});

describe('weekBounds', () => {
  it('월요일~일요일 (KST). 2026-07-29(수)이 낀 주', () => {
    expect(weekBounds('2026-07-29')).toEqual({ start: '2026-07-27', end: '2026-08-02' });
  });
  it('월요일 자신은 그 주의 시작', () => {
    expect(weekBounds('2026-07-27').start).toBe('2026-07-27');
  });
  it('일요일은 그 주의 끝', () => {
    expect(weekBounds('2026-08-02').start).toBe('2026-07-27');
  });
});

describe('tally', () => {
  const row = (mine: number | null, theirs: number | null, hib: boolean): DailyResult => ({
    date: '2026-07-27',
    mine,
    theirs,
    higherIsBetter: hib,
  });

  it('양쪽 다 낸 날만 집계', () => {
    const rows = [row(12, 8, true), row(5, null, true), row(null, 9, true)];
    expect(tally(rows)).toEqual({ win: 1, draw: 0, lose: 0 });
  });
  it('승/무/패 합산', () => {
    const rows = [row(12, 8, true), row(8, 8, true), row(200, 300, false), row(300, 200, false)];
    expect(tally(rows)).toEqual({ win: 2, draw: 1, lose: 1 });
  });
});
