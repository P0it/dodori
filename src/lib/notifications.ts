/**
 * 알림 표기 규칙 — 순수 함수만 (React·Supabase 금지).
 *
 * 이 파일은 앱과 **Vercel 워커가 함께 쓴다** (api/notifications/deliver.ts).
 * 푸시 배너 문구와 앱 안 목록 문구가 갈라지지 않게 하려는 것이므로,
 * `@/` alias를 쓰지 않는다 — 워커 쪽 빌드에는 alias가 없다.
 *
 * kind = 무슨 일이 있었나, targetKind = 어디서 일어났나. 둘은 직교한다:
 * 댓글 알림은 스토리에도 게시물에도 달리므로 kind만으로는 갈 곳을 정할 수 없다.
 */

import { givenName } from './name';

export type NotificationKind = 'story' | 'post' | 'comment';
export type NotificationTargetKind = 'story' | 'post';

/** 문구·경로 계산에 필요한 최소 모양 — api 레이어와 워커가 둘 다 이걸 만족한다 */
export interface NotificationLike {
  kind: NotificationKind;
  targetKind: NotificationTargetKind;
  /** targetKind에 따라 story 또는 post의 id */
  targetId: string;
  /** 댓글 본문 앞 40자. kind가 'comment'가 아니면 null */
  preview: string | null;
}

/** 알림을 만든 사람 이름이 비어 있을 때 쓸 말 */
const UNKNOWN_ACTOR = '상대';

/**
 * 푸시 배너와 목록에 함께 쓰는 문구.
 * title은 사람 이름(성 뗀 이름), body는 무슨 일이 있었는지.
 */
export function notificationText(
  n: NotificationLike,
  actorName: string | null | undefined,
): { title: string; body: string } {
  const title = actorName?.trim() ? givenName(actorName.trim()) : UNKNOWN_ACTOR;
  switch (n.kind) {
    case 'story':
      return { title, body: '스토리를 올렸어요' };
    case 'post':
      return { title, body: '게시물을 올렸어요' };
    case 'comment': {
      const where = n.targetKind === 'story' ? '스토리' : '게시물';
      // 본문이 비어 있을 수는 없지만(DB not null), 공백만 남는 경우는 막는다
      return n.preview?.trim()
        ? { title, body: `${where} 댓글: ${n.preview.trim()}` }
        : { title, body: `${where}에 댓글을 남겼어요` };
    }
  }
}

/** 알림을 탭했을 때 갈 곳 */
export function notificationHref(n: NotificationLike): string {
  return n.targetKind === 'story' ? `/story/${n.targetId}` : `/feed/post/${n.targetId}`;
}

/**
 * 목록 왼쪽 아이콘 키 — 컴포넌트가 아이콘 라이브러리로 옮긴다.
 * 댓글은 스토리에 달렸든 게시물에 달렸든 같은 아이콘을 쓴다.
 */
export function notificationIcon(n: NotificationLike): 'image' | 'grid' | 'comment' {
  switch (n.kind) {
    case 'story':
      return 'image';
    case 'post':
      return 'grid';
    case 'comment':
      return 'comment';
  }
}
