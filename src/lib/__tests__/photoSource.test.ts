import { photoCacheKey, photoSource } from '../photoSource';

const OBJ = 'https://x.supabase.co/storage/v1/object/sign/photos/c1/abc_360.jpg';
const RENDER = 'https://x.supabase.co/render/image/sign/photos/c1/abc.jpg';

describe('photoCacheKey', () => {
  it('토큰이 달라도 같은 키 — 재서명해도 캐시가 맞는다', () => {
    expect(photoCacheKey(`${OBJ}?token=aaa`)).toBe(photoCacheKey(`${OBJ}?token=bbb`));
  });

  it('렌디션이 다르면 다른 키', () => {
    const feed = photoCacheKey('https://x/photos/c1/abc.jpg?token=a');
    expect(photoCacheKey(`${OBJ}?token=a`)).not.toBe(feed);
  });

  it('옛 사진(서버 변환)은 width로 갈린다 — 경로가 같아도 1080과 360이 섞이지 않는다', () => {
    expect(photoCacheKey(`${RENDER}?token=a&width=1080&quality=72`)).not.toBe(
      photoCacheKey(`${RENDER}?token=a&width=360&quality=72`),
    );
  });

  it('쿼리가 없어도 동작', () => {
    expect(photoCacheKey(OBJ)).toBe(OBJ);
  });
});

describe('photoSource', () => {
  it('uri는 서명 URL 그대로, 캐시 키만 고정', () => {
    expect(photoSource(`${OBJ}?token=aaa`)).toEqual({ uri: `${OBJ}?token=aaa`, cacheKey: OBJ });
  });
});
