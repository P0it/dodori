import { pinnablePlaces, boundsOf, naverMapUrl, type Pinnable } from '../map';

const place = (over: Partial<Pinnable> & { sortOrder: number }): Pinnable => ({
  lat: 37.5,
  lng: 127.0,
  ...over,
});

describe('pinnablePlaces', () => {
  it('좌표 없는(lat 또는 lng null) 장소는 제외한다', () => {
    const out = pinnablePlaces([
      place({ sortOrder: 0, lat: null }),
      place({ sortOrder: 1, lat: 37.55, lng: 126.98 }),
      place({ sortOrder: 2, lng: null }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].sortOrder).toBe(1);
  });

  it('sortOrder 오름차순으로 정렬한다', () => {
    const out = pinnablePlaces([
      place({ sortOrder: 2, lat: 37.3 }),
      place({ sortOrder: 0, lat: 37.1 }),
      place({ sortOrder: 1, lat: 37.2 }),
    ]);
    expect(out.map((p) => p.sortOrder)).toEqual([0, 1, 2]);
  });

  it('좌표가 다 없으면 빈 배열', () => {
    expect(pinnablePlaces([place({ sortOrder: 0, lat: null, lng: null })])).toEqual([]);
  });
});

describe('boundsOf', () => {
  it('빈 배열이면 null', () => {
    expect(boundsOf([])).toBeNull();
  });

  it('한 점이면 그 점을 중심으로, 최소 범위 이상', () => {
    const r = boundsOf([{ lat: 37.5, lng: 127.0 }])!;
    // 중심 = SW + delta/2
    expect(r.latitude + r.latitudeDelta / 2).toBeCloseTo(37.5, 6);
    expect(r.longitude + r.longitudeDelta / 2).toBeCloseTo(127.0, 6);
    expect(r.latitudeDelta).toBeGreaterThan(0);
    expect(r.longitudeDelta).toBeGreaterThan(0);
  });

  it('두 점이면 중심은 중점, 범위는 간격을 패딩만큼 감싼다', () => {
    const r = boundsOf([
      { lat: 37.4, lng: 127.0 },
      { lat: 37.6, lng: 127.2 },
    ])!;
    expect(r.latitude + r.latitudeDelta / 2).toBeCloseTo(37.5, 6);
    expect(r.longitude + r.longitudeDelta / 2).toBeCloseTo(127.1, 6);
    // 간격(0.2)보다 넓게 감싼다
    expect(r.latitudeDelta).toBeGreaterThan(0.2);
    expect(r.longitudeDelta).toBeGreaterThan(0.2);
  });
});

describe('naverMapUrl (장소 → 네이버 지도)', () => {
  it('좌표가 있으면 그 지점으로 지도를 옮긴다', () => {
    expect(naverMapUrl({ name: '알베르', lat: 37.5, lng: 127.03 })).toBe(
      'https://map.naver.com/p/search/%EC%95%8C%EB%B2%A0%EB%A5%B4?c=127.03,37.5,16,0,0,0,dh',
    );
  });

  it('좌표가 없으면 이름 검색만', () => {
    expect(naverMapUrl({ name: '알베르', lat: null, lng: null })).toBe(
      'https://map.naver.com/p/search/%EC%95%8C%EB%B2%A0%EB%A5%B4',
    );
  });

  it('이름의 공백·특수문자는 인코딩한다', () => {
    expect(naverMapUrl({ name: ' 서울 숲 & 카페 ', lat: null, lng: null })).toBe(
      'https://map.naver.com/p/search/%EC%84%9C%EC%9A%B8%20%EC%88%B2%20%26%20%EC%B9%B4%ED%8E%98',
    );
  });
});
