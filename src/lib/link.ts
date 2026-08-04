/**
 * places.link는 네이버가 준 **업체 홈페이지** 주소다 — 인스타 계정일 때가 많지만 블로그·자체
 * 홈페이지일 수도 있다. 도메인으로 어디인지 좁히고, 모르면 '홈페이지'로 둔다.
 */
export type LinkKind = 'instagram' | 'blog' | 'youtube' | 'web';

export function linkKind(url: string | null | undefined): LinkKind {
  if (!url) return 'web';
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('blog.naver.com') || u.includes('tistory.com') || u.includes('brunch.co.kr')) {
    return 'blog';
  }
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  return 'web';
}

const LABEL: Record<LinkKind, string> = {
  instagram: '인스타그램',
  blog: '블로그',
  youtube: '유튜브',
  web: '홈페이지',
};

export function linkLabel(url: string | null | undefined): string {
  return LABEL[linkKind(url)];
}
