/**
 * 다음 데이트에 담을 만한 장소 추천 — 알고리즘이 아니라 필터 + 정렬이다.
 * 찜한 곳 중 "그 데이트에 아직 안 담겼고, 아직 안 가본 곳"을 최근 찜한 순으로 준다.
 */

export interface RecommendCandidate {
  placeId: string;
  /** ISO timestamp — 찜한 시각 */
  savedAt: string;
}

const DEFAULT_LIMIT = 10;

export function recommendPlaces<T extends RecommendCandidate>(
  candidates: T[],
  opts: { inCourse: string[]; visited: string[]; limit?: number },
): T[] {
  const exclude = new Set([...opts.inCourse, ...opts.visited]);
  return candidates
    .filter((c) => !exclude.has(c.placeId))
    .slice() // 원본 보존
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, opts.limit ?? DEFAULT_LIMIT);
}
