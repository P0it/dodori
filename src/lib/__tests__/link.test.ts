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
    expect(linkKind('https://mmca.go.kr')).toBe('web');
    expect(linkKind(null)).toBe('web');
  });
});
