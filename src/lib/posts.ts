/** 게시물 리액션 — 좋아요(하트) 하나 (커플 앱: 팔레트 불필요) */
export const REACTIONS = ['♥'] as const;

export type Reaction = (typeof REACTIONS)[number];

/** 피드 사진 프레임의 세로/가로 비율 범위 — 인스타 규격 (가로 16:9 ~ 세로 4:5) */
export const POST_FRAME_MIN_RATIO = 0.5625;
export const POST_FRAME_MAX_RATIO = 1.25;

/**
 * 사진 비율을 따르되 범위를 제한한 프레임 비율(세로/가로).
 * 업로드 크롭 프레임과 피드 표시가 같은 값을 써야 "올릴 때 본 그대로" 보인다.
 */
export function postFrameRatio(
  width: number | null | undefined,
  height: number | null | undefined,
): number {
  if (!width || !height || width <= 0 || height <= 0) return 1;
  const ratio = height / width;
  return Math.min(POST_FRAME_MAX_RATIO, Math.max(POST_FRAME_MIN_RATIO, ratio));
}
