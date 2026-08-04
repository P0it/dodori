/**
 * places.link는 네이버가 준 **업체 홈페이지** 주소다 — 요즘 가게는 그 자리에 인스타 계정이나
 * 블로그를 걸어둔다. 어디로 나가는지 버튼에 그대로 적어준다.
 */
export function linkLabel(url: string | null | undefined): string {
  if (!url) return '홈페이지';
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return '인스타그램';
  if (u.includes('blog.naver.com') || u.includes('tistory.com') || u.includes('brunch.co.kr')) {
    return '블로그';
  }
  if (u.includes('youtube.com') || u.includes('youtu.be')) return '유튜브';
  return '홈페이지';
}
