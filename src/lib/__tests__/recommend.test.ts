import { recommendPlaces } from '../recommend';

describe('recommendPlaces (다음 데이트 장소 추천)', () => {
  const saved = [
    { placeId: 'a', savedAt: '2026-07-01T00:00:00Z' },
    { placeId: 'b', savedAt: '2026-07-10T00:00:00Z' },
    { placeId: 'c', savedAt: '2026-07-05T00:00:00Z' },
  ];

  it('최근 찜한 순으로 정렬한다', () => {
    const r = recommendPlaces(saved, { inCourse: [], visited: [] });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'c', 'a']);
  });

  it('이미 코스에 담긴 장소는 뺀다', () => {
    const r = recommendPlaces(saved, { inCourse: ['b'], visited: [] });
    expect(r.map((p) => p.placeId)).toEqual(['c', 'a']);
  });

  it('이미 다녀온 장소는 뺀다', () => {
    const r = recommendPlaces(saved, { inCourse: [], visited: ['c'] });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'a']);
  });

  it('코스·방문 양쪽에 걸린 장소도 한 번만 빠진다', () => {
    const r = recommendPlaces(saved, { inCourse: ['a'], visited: ['a'] });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'c']);
  });

  it('limit으로 개수를 자른다', () => {
    const r = recommendPlaces(saved, { inCourse: [], visited: [], limit: 2 });
    expect(r.map((p) => p.placeId)).toEqual(['b', 'c']);
  });

  it('기본 상한은 10곳', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      placeId: `p${i}`,
      savedAt: `2026-07-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }));
    expect(recommendPlaces(many, { inCourse: [], visited: [] })).toHaveLength(10);
  });

  it('후보가 없으면 빈 배열', () => {
    expect(recommendPlaces([], { inCourse: [], visited: [] })).toEqual([]);
  });

  it('원본 배열을 변형하지 않는다', () => {
    const copy = [...saved];
    recommendPlaces(saved, { inCourse: [], visited: [] });
    expect(saved).toEqual(copy);
  });
});
