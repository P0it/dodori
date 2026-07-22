import { nearestIndex } from '../albums';

describe('nearestIndex (앨범 캐러셀 초기 포커스)', () => {
  const TODAY = '2026-07-16';

  it('오늘에 가장 가까운 미래 앨범', () => {
    expect(nearestIndex(['2026-07-01', '2026-07-17', '2026-08-01'], TODAY)).toBe(1);
  });
  it('오늘 데이트가 있으면 그것', () => {
    expect(nearestIndex(['2026-07-10', '2026-07-16', '2026-07-20'], TODAY)).toBe(1);
  });
  it('과거만 있으면 가장 최근 과거', () => {
    expect(nearestIndex(['2026-07-01', '2026-07-14'], TODAY)).toBe(1);
  });
  it('미래만 있으면 가장 이른 미래', () => {
    expect(nearestIndex(['2026-07-20', '2026-09-01'], TODAY)).toBe(0);
  });
  it('과거·미래 거리가 같으면 미래 쪽', () => {
    expect(nearestIndex(['2026-07-15', '2026-07-17'], TODAY)).toBe(1);
  });
  it('빈 배열은 0', () => {
    expect(nearestIndex([], TODAY)).toBe(0);
  });
});
