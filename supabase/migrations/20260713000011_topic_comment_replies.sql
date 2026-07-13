-- 답글 1단계 — 긴 토론에서 상대 글의 특정 대목에 답할 때 인용 역할.
-- 참여자가 둘뿐이라 깊은 트리는 만들지 않는다 (parent_id가 있는 댓글엔 다시 답글을 달지 않는다 = 클라이언트 규칙).
alter table public.topic_comments
  add column parent_id uuid references public.topic_comments (id) on delete cascade;

create index topic_comments_parent_idx on public.topic_comments (parent_id);
