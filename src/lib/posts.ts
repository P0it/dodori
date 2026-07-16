/** 게시물 리액션 — 좋아요(하트) 하나 (커플 앱: 팔레트 불필요) */
export const REACTIONS = ['♥'] as const;

export type Reaction = (typeof REACTIONS)[number];
