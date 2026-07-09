import { pickNextUp, nextUpProgress } from '../nextup';

const NOW = new Date('2026-07-08T03:00:00Z'); // KST 2026-07-08

describe('pickNextUp (§7.6)', () => {
  const annivs = [{ id: 'a1', label: '200일', nextDate: '2026-07-23' }];

  it('upcoming track이 있으면 최근접 트랙', () => {
    const tracks = [
      { id: 't2', title: '먼 데이트', date: '2026-08-01' },
      { id: 't1', title: '성수 데이트', date: '2026-07-11' },
      { id: 't0', title: '지난 데이트', date: '2026-07-04' },
    ];
    expect(pickNextUp(tracks, annivs, NOW)).toMatchObject({ kind: 'track', id: 't1' });
  });
  it('당일 트랙도 다음 일정 (아직 upcoming)', () => {
    expect(pickNextUp([{ id: 't', title: '오늘', date: '2026-07-08' }], [], NOW)).toMatchObject({
      kind: 'track',
      id: 't',
    });
  });
  it('트랙 없으면 다음 기념일', () => {
    expect(pickNextUp([], annivs, NOW)).toMatchObject({ kind: 'anniv', label: '200일' });
  });
  it('둘 다 없으면 null (절대 빈 값 UI 없음 전제는 화면에서 처리)', () => {
    expect(pickNextUp([], [], NOW)).toBeNull();
  });
});

describe('nextUpProgress', () => {
  it('D-3 → 0.9', () => {
    expect(nextUpProgress('2026-07-11', NOW)).toBeCloseTo(0.9);
  });
  it('당일 → 1', () => {
    expect(nextUpProgress('2026-07-08', NOW)).toBe(1);
  });
  it('D-30 이상 → 0', () => {
    expect(nextUpProgress('2026-09-01', NOW)).toBe(0);
  });
});
