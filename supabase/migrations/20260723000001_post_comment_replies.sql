-- 게시물 댓글 답글 1단계 — topic_comments와 동일 규약.
-- 참여자가 둘뿐이라 깊은 트리는 만들지 않는다 (parent_id가 있는 댓글엔 다시 답글을 달지 않는다 = 클라이언트 규칙).
alter table public.post_comments
  add column parent_id uuid references public.post_comments (id) on delete cascade;

create index post_comments_parent_idx on public.post_comments (parent_id);
