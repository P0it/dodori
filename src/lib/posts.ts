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

/** 비율 계산에 필요한 최소 모양 — 고른 사진(PickedPhoto)도 올라간 사진(PostPhoto)도 만족한다 */
export interface PhotoSize {
  width: number | null | undefined;
  height: number | null | undefined;
}

/**
 * 게시물 하나가 쓰는 프레임 비율 — **첫 사진이 정하고 나머지도 이 비율을 따른다** (인스타 규칙).
 *
 * 사진마다 제 비율로 자르면, 첫 장이 정한 캐러셀 프레임에 들어갈 때 표시 시점에
 * 두 번째 크롭이 몰래 일어난다 (가로 첫 장 + 세로 둘째 장이면 둘째가 절반 넘게 잘렸다).
 * 그래서 크롭·표시가 전부 이 함수 하나를 봐야 한다.
 */
export function postFrameRatioOf(photos: PhotoSize[]): number {
  return postFrameRatio(photos[0]?.width, photos[0]?.height);
}

/** 이미 프레임 비율로 잘려 있는가 — 크롭이 픽셀 단위로 반올림되므로 여유를 둔다 */
export function isFramed(photo: PhotoSize, frameRatio: number): boolean {
  if (!photo.width || !photo.height) return false;
  return Math.abs(photo.height / photo.width - frameRatio) < 0.01;
}

/**
 * 이 사진을 프레임에 어떻게 놓을지 — 옛 게시물 대비.
 *
 * 게시물 비율 규칙 이전에 올라간 사진은 비율이 제각각이라 cover로 그리면 표시 시점에
 * 크롭이 한 번 더 일어난다. 다만 **클램프에 걸려 잘리는 것은 원래 의도된 크롭**이다
 * (3:4 폰 사진 → 4:5 프레임). 그래서 원본 비율이 아니라 **클램프까지 적용한 비율**을 본다.
 *
 * 같으면 cover(설계대로 꽉 채워 자름), 다르면 contain(전체를 보여줌) —
 * 가로 첫 장 + 세로 둘째 장처럼 프레임 자체가 어긋난 경우만 여백이 생긴다.
 */
export function postContentFit(photo: PhotoSize, frameRatio: number): 'cover' | 'contain' {
  const clamped = postFrameRatio(photo.width, photo.height);
  return Math.abs(clamped - frameRatio) < 0.01 ? 'cover' : 'contain';
}
