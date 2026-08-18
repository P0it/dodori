-- ============================================================
-- notifications.target_kind — target_id가 stories인지 posts인지 구분한다.
--
-- kind만으로는 부족하다: kind='comment'가 스토리 댓글일 수도 게시물 댓글일 수도 있어서
-- 탭했을 때 갈 경로(/story/… vs /feed/post/…)를 정할 수 없다.
-- kind = 무슨 일이 있었나, target_kind = 어디서 일어났나 — 둘은 직교한다.
-- ============================================================

alter table public.notifications
  add column target_kind text not null default 'post'
    check (target_kind in ('story', 'post'));

-- 앞선 마이그레이션 직후라 행이 없다. 기본값은 스키마 편의용이었으므로 걷어낸다.
alter table public.notifications alter column target_kind drop default;

create or replace function public.enqueue_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid;
  v_actor_id uuid;
  v_kind text;
  v_target_kind text;
  v_target_id uuid;
  v_comment_id uuid;
  v_preview text;
  v_recipient_id uuid;
begin
  if TG_TABLE_NAME = 'stories' then
    v_couple_id := NEW.couple_id;
    v_actor_id := NEW.author_id;
    v_kind := 'story';
    v_target_kind := 'story';
    v_target_id := NEW.id;
  elsif TG_TABLE_NAME = 'posts' then
    v_couple_id := NEW.couple_id;
    v_actor_id := NEW.author_id;
    v_kind := 'post';
    v_target_kind := 'post';
    v_target_id := NEW.id;
  elsif TG_TABLE_NAME = 'story_comments' then
    select couple_id into v_couple_id from public.stories where id = NEW.story_id;
    v_actor_id := NEW.author_id;
    v_kind := 'comment';
    v_target_kind := 'story';
    v_target_id := NEW.story_id;
    v_comment_id := NEW.id;
    v_preview := left(NEW.body, 40);
  elsif TG_TABLE_NAME = 'post_comments' then
    select couple_id into v_couple_id from public.posts where id = NEW.post_id;
    v_actor_id := NEW.author_id;
    v_kind := 'comment';
    v_target_kind := 'post';
    v_target_id := NEW.post_id;
    v_comment_id := NEW.id;
    v_preview := left(NEW.body, 40);
  else
    return NEW;
  end if;

  if v_couple_id is null then
    return NEW;
  end if;

  -- 커플의 다른 한 사람. 아직 혼자면 알림을 만들지 않는다.
  select user_id into v_recipient_id
  from public.couple_members
  where couple_id = v_couple_id and user_id <> v_actor_id
  limit 1;

  if v_recipient_id is null then
    return NEW;
  end if;

  insert into public.notifications
    (couple_id, recipient_id, actor_id, kind, target_kind, target_id, comment_id, preview)
  values
    (v_couple_id, v_recipient_id, v_actor_id, v_kind, v_target_kind, v_target_id, v_comment_id, v_preview);

  perform public.kick_notification_worker();

  return NEW;
end;
$$;
