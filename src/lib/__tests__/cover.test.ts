import { resolveCover, coverSeedIndex } from '../cover';

describe('resolveCover (§6.4 fallback)', () => {
  it('지정 커버 우선', () => {
    expect(resolveCover('a.jpg', ['b.jpg', 'c.jpg'])).toEqual({ kind: 'photo', path: 'a.jpg' });
  });
  it('커버 없고 2장+ → 콜라주 (최대 4장)', () => {
    const r = resolveCover(null, ['a', 'b', 'c', 'd', 'e']);
    expect(r).toEqual({ kind: 'collage', paths: ['a', 'b', 'c', 'd'] });
  });
  it('1장 → 그 사진', () => {
    expect(resolveCover(null, ['only.jpg'])).toEqual({ kind: 'photo', path: 'only.jpg' });
  });
  it('0장 → 플레이스홀더', () => {
    expect(resolveCover(null, [])).toEqual({ kind: 'placeholder' });
  });
});

describe('coverSeedIndex (생성 자켓 색 배정)', () => {
  it('같은 seed는 항상 같은 색 — 앨범 자켓이 흔들리지 않는다', () => {
    expect(coverSeedIndex('track-abc', 6)).toBe(coverSeedIndex('track-abc', 6));
  });
  it('항상 0 이상 buckets 미만', () => {
    for (const s of ['', 'a', 'track-xyz', '9f8e7d6c-1234-4321-abcd-000000000000']) {
      const i = coverSeedIndex(s, 6);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(6);
    }
  });
  it('seed가 다르면 색이 흩어진다 (한 색에 몰리지 않음)', () => {
    const seen = new Set(Array.from({ length: 24 }, (_, i) => coverSeedIndex(`track-${i}`, 6)));
    expect(seen.size).toBeGreaterThan(2);
  });
});
