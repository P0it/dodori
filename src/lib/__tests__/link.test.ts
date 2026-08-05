import { linkKind, linkLabel } from '../link';

describe('linkLabel (업체 링크 → 버튼 이름)', () => {
  it('인스타그램', () => {
    expect(linkLabel('https://www.instagram.com/albert_coffee/')).toBe('인스타그램');
  });
  it('블로그', () => {
    expect(linkLabel('https://blog.naver.com/albert')).toBe('블로그');
    expect(linkLabel('https://albert.tistory.com')).toBe('블로그');
  });
  it('유튜브', () => {
    expect(linkLabel('https://youtu.be/abc')).toBe('유튜브');
  });
  it('예약·웨이팅 플랫폼은 그 이름으로', () => {
    // 캐치테이블은 매장 페이지가 app 서브도메인에 있다
    expect(linkLabel('https://app.catchtable.co.kr/ct/shop/albert')).toBe('캐치테이블');
    expect(linkLabel('https://www.catchtable.co.kr/')).toBe('캐치테이블');
    expect(linkLabel('https://www.tabling.co.kr/store/1234')).toBe('테이블링');
    expect(linkLabel('https://tabling.co.kr')).toBe('테이블링');
  });
  it('그 외는 홈페이지', () => {
    expect(linkLabel('https://mmca.go.kr')).toBe('홈페이지');
    expect(linkLabel(null)).toBe('홈페이지');
  });
  it('대소문자를 가리지 않는다', () => {
    expect(linkLabel('HTTPS://WWW.INSTAGRAM.COM/x')).toBe('인스타그램');
  });
});

describe('linkKind (아이콘 판정)', () => {
  it('라벨과 같은 판정을 쓴다', () => {
    expect(linkKind('https://instagram.com/x')).toBe('instagram');
    expect(linkKind('https://blog.naver.com/x')).toBe('blog');
    expect(linkKind('https://app.catchtable.co.kr/ct/shop/x')).toBe('catchtable');
    expect(linkKind('https://www.tabling.co.kr/store/1')).toBe('tabling');
    expect(linkKind('https://mmca.go.kr')).toBe('web');
    expect(linkKind(null)).toBe('web');
  });
});
