import { addMonths, firstWeekday, monthCells, parseMonthKey } from '../calendar';

const NOW = new Date('2026-07-08T03:00:00Z'); // KST 2026-07-08

describe('monthCells — 2026년 7월 (목업 기준: 1일=수요일)', () => {
  const cells = monthCells('2026-07', NOW);

  it('1일은 수요일', () => {
    expect(firstWeekday(2026, 7)).toBe(3);
  });
  it('앞 리드 3칸 = 6/28~30, 마지막은 8/1 포함 5주', () => {
    expect(cells).toHaveLength(35);
    expect(cells[0]).toMatchObject({ date: '2026-06-28', inMonth: false });
    expect(cells[2]).toMatchObject({ date: '2026-06-30', inMonth: false });
    expect(cells[3]).toMatchObject({ date: '2026-07-01', inMonth: true, weekday: 3 });
    expect(cells[34]).toMatchObject({ date: '2026-08-01', inMonth: false });
  });
  it('오늘(7/8) 표시', () => {
    expect(cells.find((c) => c.date === '2026-07-08')?.isToday).toBe(true);
    expect(cells.filter((c) => c.isToday)).toHaveLength(1);
  });
});

describe('monthCells — 경계', () => {
  it('일요일 시작 달은 리드 0 (2026-02-01=일)', () => {
    const cells = monthCells('2026-02', NOW);
    expect(cells[0]).toMatchObject({ date: '2026-02-01', inMonth: true });
    expect(cells).toHaveLength(28); // 2026-02: 28일, 정확히 4주
  });
  it('6주 달 (2026-08: 1일=토, 31일)', () => {
    expect(monthCells('2026-08', NOW)).toHaveLength(42);
  });
  it('윤년 2월', () => {
    const cells = monthCells('2028-02', NOW);
    expect(cells.some((c) => c.date === '2028-02-29' && c.inMonth)).toBe(true);
  });
});

describe('addMonths', () => {
  it('연 경계', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
  it('parseMonthKey', () => {
    expect(parseMonthKey('2026-07')).toEqual({ year: 2026, month: 7 });
  });
});
