import { resolveCover } from '../cover';

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
