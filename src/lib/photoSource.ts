/**
 * expo-image의 캐시 키를 서명 토큰에서 떼어낸다.
 *
 * 사진 URL은 1시간짜리 서명이라 재서명할 때마다 문자열이 달라진다. expo-image는 URL을
 * 그대로 캐시 키로 쓰므로, 그대로 넘기면 같은 사진을 화면 열 때마다 다시 내려받는다
 * (앱을 다시 켠 뒤 첫 재조회에서도 마찬가지). 키를 경로로 고정하면 토큰이 바뀌어도 캐시가 맞는다.
 *
 * 옛 사진(renditions=false)은 본체 경로 하나로 서버 변환을 태우므로 경로만으로는
 * feed(1080)와 grid(360)가 충돌한다 — width 파라미터를 키에 함께 넣는다.
 */
export function photoCacheKey(url: string): string {
  const [path, query = ''] = url.split('?');
  const width = /(?:^|&)width=(\d+)/.exec(query)?.[1];
  return width ? `${path}@${width}` : path;
}

/** expo-image `source` — 서명 URL로 받아오되 캐시는 경로로 맞춘다 */
export function photoSource(url: string): { uri: string; cacheKey: string } {
  return { uri: url, cacheKey: photoCacheKey(url) };
}
