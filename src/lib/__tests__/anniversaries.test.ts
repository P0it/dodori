import {
  buildAutoAnniversaries,
  nextOccurrence,
  nthDayAnniversary,
  occurrenceInMonth,
  yearlyAnniversary,
} from '../anniversaries';

// 목업·PRD 기준: 시작일 2026-01-05
const START = '2026-01-05';

describe('nthDayAnniversary (시작일 = 1일째)', () => {
  it('목업 기준값: 100일 = 2026-04-14', () => {
    expect(nthDayAnniversary(START, 100)).toBe('2026-04-14');
  });
  it('목업 기준값: 200일 = 2026-07-23', () => {
    expect(nthDayAnniversary(START, 200)).toBe('2026-07-23');
  });
  it('목업 기준값: 300일 = 2026-10-31', () => {
    expect(nthDayAnniversary(START, 300)).toBe('2026-10-31');
  });
});

describe('yearlyAnniversary', () => {
  it('목업 기준값: 1주년 = 2027-01-05', () => {
    expect(yearlyAnniversary(START, 1)).toBe('2027-01-05');
  });
  it('2/29 시작 → 평년엔 2/28로 보정', () => {
    expect(yearlyAnniversary('2028-02-29', 1)).toBe('2029-02-28');
  });
});

describe('buildAutoAnniversaries', () => {
  it('100/200/300 + 1주년 + 생일 2건', () => {
    const list = buildAutoAnniversaries(START, [
      { label: 'Hyunwoo 생일', date: '1997-03-22' },
      { label: 'Jihyun 생일', date: '1998-09-08' },
    ]);
    expect(list).toHaveLength(6);
    expect(list.filter((a) => a.repeatYearly)).toHaveLength(3);
    expect(list.find((a) => a.type === 'd200')?.date).toBe('2026-07-23');
  });
});

describe('occurrenceInMonth (캘린더 마커)', () => {
  it('1회성(d200)은 해당 월에만', () => {
    expect(occurrenceInMonth('2026-07-23', false, '2026-07')).toBe('2026-07-23');
    expect(occurrenceInMonth('2026-07-23', false, '2026-08')).toBeNull();
    expect(occurrenceInMonth('2026-07-23', false, '2027-07')).toBeNull();
  });
  it('매년 반복(생일)은 표시 연도로 투영', () => {
    expect(occurrenceInMonth('1998-09-08', true, '2026-09')).toBe('2026-09-08');
    expect(occurrenceInMonth('1998-09-08', true, '2026-08')).toBeNull();
  });
  it('2/29 앵커는 평년 2/28로 보정', () => {
    expect(occurrenceInMonth('2028-02-29', true, '2029-02')).toBe('2029-02-28');
  });
});

describe('nextOccurrence', () => {
  const now = new Date('2026-07-08T03:00:00Z'); // KST 2026-07-08
  it('이미 지난 생일(03-22)은 내년', () => {
    expect(nextOccurrence('1997-03-22', now)).toBe('2027-03-22');
  });
  it('다가오는 생일(09-08)은 올해', () => {
    expect(nextOccurrence('1998-09-08', now)).toBe('2026-09-08');
  });
  it('오늘이 발생일이면 오늘', () => {
    expect(nextOccurrence('2000-07-08', now)).toBe('2026-07-08');
  });
});
