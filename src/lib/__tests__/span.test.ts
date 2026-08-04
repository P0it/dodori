import { monthCells } from '../calendar';
import { assignLanes, daySpan, eventDayRange, laneCounts, spanDays, spanSegments } from '../span';

// 2026-08은 1일(토)로 시작 → 그리드 첫 칸은 7/26(일)
const CELLS = monthCells('2026-08', new Date('2026-08-04T00:00:00Z')).map((c) => c.date);

describe('daySpan / spanDays', () => {
  it('양끝을 포함해 센다', () => {
    expect(daySpan('2026-08-10', '2026-08-10')).toBe(1);
    expect(daySpan('2026-08-10', '2026-08-13')).toBe(4);
  });
  it('뒤집힌 구간은 빈 배열', () => {
    expect(spanDays('2026-08-13', '2026-08-10')).toEqual([]);
  });
  it('날짜를 늘어놓는다', () => {
    expect(spanDays('2026-07-31', '2026-08-02')).toEqual(['2026-07-31', '2026-08-01', '2026-08-02']);
  });
});

describe('eventDayRange', () => {
  it('ends_at이 없으면 하루짜리', () => {
    expect(eventDayRange('2026-08-10T10:00:00+09:00', null)).toEqual({
      from: '2026-08-10',
      to: '2026-08-10',
    });
  });
  it('종일 여러 날 — 마지막 날 23:59까지 포함', () => {
    expect(eventDayRange('2026-08-10T00:00:00+09:00', '2026-08-13T23:59:59+09:00')).toEqual({
      from: '2026-08-10',
      to: '2026-08-13',
    });
  });
  it('KST 경계 — UTC로는 전날이어도 KST 날짜로 잡는다', () => {
    expect(eventDayRange('2026-08-09T15:00:00Z', null)).toEqual({
      from: '2026-08-10',
      to: '2026-08-10',
    });
  });
  it('뒤집힌 데이터는 하루짜리로 접는다', () => {
    expect(eventDayRange('2026-08-13T00:00:00+09:00', '2026-08-10T00:00:00+09:00')).toEqual({
      from: '2026-08-13',
      to: '2026-08-13',
    });
  });
});

describe('spanSegments', () => {
  it('한 주 안이면 토막 하나', () => {
    // 8/10(월)~8/13(목)
    expect(spanSegments(CELLS, '2026-08-10', '2026-08-13')).toEqual([
      { week: 2, startCol: 1, endCol: 4, continuesLeft: false, continuesRight: false },
    ]);
  });

  it('주 경계를 넘으면 주마다 끊기고 이어짐이 표시된다', () => {
    // 8/14(금)~8/17(월) → 2주차 금·토 / 3주차 일·월
    expect(spanSegments(CELLS, '2026-08-14', '2026-08-17')).toEqual([
      { week: 2, startCol: 5, endCol: 6, continuesLeft: false, continuesRight: true },
      { week: 3, startCol: 0, endCol: 1, continuesLeft: true, continuesRight: false },
    ]);
  });

  it('그리드 밖에서 시작하면 잘리고 왼쪽이 열린다', () => {
    const segs = spanSegments(CELLS, '2026-07-20', '2026-07-28');
    expect(segs[0]).toEqual({
      week: 0,
      startCol: 0,
      endCol: 2,
      continuesLeft: true,
      continuesRight: false,
    });
  });

  it('그리드와 겹치지 않으면 빈 배열', () => {
    expect(spanSegments(CELLS, '2026-05-01', '2026-05-03')).toEqual([]);
    expect(spanSegments(CELLS, '2026-12-01', '2026-12-03')).toEqual([]);
  });

  it('하루짜리도 길이 1의 토막', () => {
    expect(spanSegments(CELLS, '2026-08-04', '2026-08-04')).toEqual([
      { week: 1, startCol: 2, endCol: 2, continuesLeft: false, continuesRight: false },
    ]);
  });
});

describe('assignLanes', () => {
  const seg = (week: number, startCol: number, endCol: number) => ({
    week,
    startCol,
    endCol,
    continuesLeft: false,
    continuesRight: false,
  });

  it('겹치지 않으면 같은 칸을 쓴다', () => {
    const placed = assignLanes([
      { key: 'a', segments: [seg(0, 0, 1)], value: 1 },
      { key: 'b', segments: [seg(0, 3, 4)], value: 2 },
    ]);
    expect(placed.map((p) => p.lane)).toEqual([0, 0]);
  });

  it('겹치면 아래 칸으로 내린다', () => {
    const placed = assignLanes([
      { key: 'a', segments: [seg(0, 0, 3)], value: 1 },
      { key: 'b', segments: [seg(0, 2, 5)], value: 2 },
      { key: 'c', segments: [seg(0, 3, 4)], value: 3 },
    ]);
    expect(placed.map((p) => p.lane)).toEqual([0, 1, 2]);
  });

  it('주가 다르면 서로 간섭하지 않는다', () => {
    const placed = assignLanes([
      { key: 'a', segments: [seg(0, 0, 6)], value: 1 },
      { key: 'b', segments: [seg(1, 0, 6)], value: 2 },
    ]);
    expect(placed.map((p) => p.lane)).toEqual([0, 0]);
  });

  it('빈 칸이 생기면 다시 채운다', () => {
    const placed = assignLanes([
      { key: 'a', segments: [seg(0, 0, 1)], value: 1 },
      { key: 'b', segments: [seg(0, 0, 1)], value: 2 },
      { key: 'c', segments: [seg(0, 4, 5)], value: 3 },
    ]);
    expect(placed.map((p) => p.lane)).toEqual([0, 1, 0]);
  });
});

describe('laneCounts', () => {
  it('주마다 가장 깊은 칸 + 1', () => {
    const placed = [
      { segment: { week: 0, startCol: 0, endCol: 1, continuesLeft: false, continuesRight: false }, lane: 0 },
      { segment: { week: 0, startCol: 2, endCol: 3, continuesLeft: false, continuesRight: false }, lane: 2 },
      { segment: { week: 2, startCol: 0, endCol: 1, continuesLeft: false, continuesRight: false }, lane: 0 },
    ];
    expect(laneCounts(placed, 4)).toEqual([3, 0, 1, 0]);
  });
});
