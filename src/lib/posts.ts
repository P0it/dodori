/** 게시물에 달 수 있는 리액션 (고정 세트) */
export const REACTIONS = ['♥', '😆', '😮', '🥺', '🔥'] as const;

export type Reaction = (typeof REACTIONS)[number];
