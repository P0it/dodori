import { placeKind, placeKindLabel } from '../placeKind';

describe('placeKind (네이버 분류 원문 → 장소 종류)', () => {
  it('음식점', () => {
    expect(placeKind('음식점>한식>육류,고기')).toBe('food');
    expect(placeKind('음식점>일식>초밥,롤')).toBe('food');
  });

  it('카페는 원문에 "음식점"이 같이 있어도 카페', () => {
    expect(placeKind('음식점>카페,디저트')).toBe('cafe');
    expect(placeKind('카페,디저트>카페')).toBe('cafe');
    expect(placeKind('음식점>베이커리')).toBe('cafe');
  });

  it('술집은 원문에 "음식점"이 같이 있어도 술', () => {
    expect(placeKind('음식점>술집>와인바')).toBe('bar');
    expect(placeKind('음식점>일식>이자카야')).toBe('bar');
  });

  it('문화·전시', () => {
    expect(placeKind('문화,예술>미술관')).toBe('culture');
    expect(placeKind('생활,편의>영화관')).toBe('culture');
  });

  it('자연·명소', () => {
    expect(placeKind('여행,명소>공원')).toBe('nature');
    expect(placeKind('여행,명소>전망대')).toBe('nature');
  });

  it('쇼핑', () => {
    expect(placeKind('쇼핑,유통>백화점')).toBe('shopping');
    expect(placeKind('생활,편의>서점')).toBe('shopping');
  });

  it('숙박', () => {
    expect(placeKind('숙박>호텔')).toBe('stay');
    expect(placeKind('숙박>펜션')).toBe('stay');
  });

  it('모르는 값·빈 값은 기타', () => {
    expect(placeKind('생활,편의>부동산')).toBe('etc');
    expect(placeKind('')).toBe('etc');
    expect(placeKind(null)).toBe('etc');
    expect(placeKind(undefined)).toBe('etc');
  });

  it('라벨', () => {
    expect(placeKindLabel(placeKind('음식점>한식'))).toBe('음식');
    expect(placeKindLabel(placeKind(null))).toBe('장소');
  });
});
