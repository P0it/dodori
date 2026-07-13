import {
  addDays,
  dday,
  daysSince,
  diffDays,
  formatDday,
  formatRelative,
  isISODate,
  isReleased,
  monthKey,
  todayKST,
  toKSTDate,
} from '../date';

// KST 자정 경계: UTC 15:00 = KST 다음날 00:00
describe('todayKST / toKSTDate', () => {
  it('UTC 14:59는 KST 같은 날 23:59', () => {
    expect(toKSTDate(new Date('2026-07-08T14:59:00Z'))).toBe('2026-07-08');
  });
  it('UTC 15:00은 KST 다음날 00:00', () => {
    expect(toKSTDate(new Date('2026-07-08T15:00:00Z'))).toBe('2026-07-09');
  });
  it('연말 경계', () => {
    expect(toKSTDate(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01');
  });
});

describe('isReleased (PRD §7.2: date < today(KST))', () => {
  const now = new Date('2026-07-08T03:00:00Z'); // KST 07-08 12:00
  it('어제 트랙은 released', () => {
    expect(isReleased('2026-07-07', now)).toBe(true);
  });
  it('오늘 트랙은 아직 upcoming', () => {
    expect(isReleased('2026-07-08', now)).toBe(false);
  });
  it('내일 트랙은 upcoming', () => {
    expect(isReleased('2026-07-09', now)).toBe(false);
  });
  it('KST 자정 직후엔 전날이 released로 뒤집힘', () => {
    const justAfterMidnightKST = new Date('2026-07-08T15:00:30Z'); // KST 07-09 00:00:30
    expect(isReleased('2026-07-08', justAfterMidnightKST)).toBe(true);
  });
});

describe('dday / formatDday', () => {
  const now = new Date('2026-07-08T03:00:00Z'); // KST 2026-07-08
  it('D-3', () => {
    expect(dday('2026-07-11', now)).toBe(3);
    expect(formatDday('2026-07-11', now)).toBe('D-3');
  });
  it('D-Day', () => {
    expect(formatDday('2026-07-08', now)).toBe('D-Day');
  });
  it('D+5', () => {
    expect(formatDday('2026-07-03', now)).toBe('D+5');
  });
  it('목업 기준값: 200일(07.23)은 D-15', () => {
    expect(formatDday('2026-07-23', now)).toBe('D-15');
  });
});

describe('daysSince (시작일 = 1일째)', () => {
  it('목업 기준값: 2026.01.05 시작 → 07.08은 185일째', () => {
    const now = new Date('2026-07-08T03:00:00Z');
    expect(daysSince('2026-01-05', now)).toBe(185);
  });
  it('시작 당일은 1일째', () => {
    const now = new Date('2026-01-05T03:00:00Z');
    expect(daysSince('2026-01-05', now)).toBe(1);
  });
});

describe('formatRelative (게시물 타임스탬프, KST)', () => {
  const now = new Date('2026-07-08T03:00:00Z'); // KST 07-08 12:00

  it('1분 미만은 방금', () => {
    expect(formatRelative('2026-07-08T02:59:30Z', now)).toBe('방금');
  });
  it('당일 분/시간', () => {
    expect(formatRelative('2026-07-08T02:30:00Z', now)).toBe('30분 전');
    expect(formatRelative('2026-07-08T00:00:00Z', now)).toBe('3시간 전');
  });
  it('KST 자정을 넘겼으면 시간이 아니라 어제', () => {
    // UTC 07-07 14:30 = KST 07-07 23:30 → 12시간 30분 전이지만 KST로는 전날
    expect(formatRelative('2026-07-07T14:30:00Z', now)).toBe('어제');
  });
  it('그 이전은 날짜, 해가 다르면 연도까지', () => {
    expect(formatRelative('2026-07-04T03:00:00Z', now)).toBe('7.4');
    expect(formatRelative('2025-12-31T03:00:00Z', now)).toBe('2025.12.31');
  });
});

describe('date arithmetic', () => {
  it('addDays 월 경계', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });
  it('addDays 윤년', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
  it('diffDays', () => {
    expect(diffDays('2026-01-05', '2026-07-08')).toBe(184);
  });
  it('monthKey', () => {
    expect(monthKey('2026-07-08')).toBe('2026-07');
  });
  it('isISODate', () => {
    expect(isISODate('2026-07-08')).toBe(true);
    expect(isISODate('2026-2-8')).toBe(false);
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('2026-02-30')).toBe(false);
  });
});
