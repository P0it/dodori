-- ============================================================
-- notifications — 상대가 스토리·게시물·댓글을 남기면 알림 행이 생기고, 워커가 푸시를 쏜다.
--
-- 설계: docs/superpowers/specs/2026-08-18-web-push-notifications-design.md
-- 행 생성은 트리거가 단일 진실이다. 클라이언트가 부르면 앱이 죽었을 때 알림이 유실되고,
-- 배지 숫자가 이 테이블에서 나오므로 유실은 곧 틀린 배지다.
--
-- pushed_at is null 이 곧 미발송 큐다. kicker(net.http_post)는 "지금 깨워달라" 신호일 뿐이라
-- 실패해도 되고, Supabase를 떠나면 cron 폴링으로 갈아끼우면 된다 — 이 스키마는 그대로 간다.
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('story', 'post', 'comment')),
  -- 탭했을 때 갈 대상. kind에 따라 stories 또는 posts를 가리키는 다형 참조라 FK를 걸 수 없다.
  -- 원본이 지워지면 목록에서 열지 못하고 읽음 처리만 된다 (클라이언트가 처리).
  target_id uuid not null,
  comment_id uuid,
  -- 댓글 본문 앞부분 — 푸시 문구에 쓴다 (워커가 본문을 다시 조회하지 않게)
  preview text,
  read_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 배지 카운트 — 안 읽은 행만 센다
create index notifications_unread_idx on public.notifications (recipient_id)
  where read_at is null;
-- 워커 큐 — 안 보낸 행만 오래된 순으로
create index notifications_unsent_idx on public.notifications (created_at)
  where pushed_at is null;
-- 목록 화면
create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

-- 내 알림만 보고, 내 알림만 읽음 처리한다.
-- insert 정책은 만들지 않는다 — 클라이언트가 알림을 위조할 수 없고, security definer 트리거만 넣는다.
create policy "notifications_select" on public.notifications for select
  using (recipient_id = auth.uid());
create policy "notifications_update" on public.notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ------------------------------------------------------------
-- push_subscriptions — 웹 푸시(RFC 8291) 구독. 기기마다 1행.
-- 네이티브는 기존 profiles.push_token(Expo Push)을 그대로 쓴다 — 워커가 둘 다 쏜다.
-- ------------------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  failed_at timestamptz
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_all" on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- kicker — Vercel 워커를 깨운다. Supabase 전용(pg_net + Vault) 조각이고, 유일한 락인이다.
-- 시크릿이 없으면 조용히 넘어간다 (invoke_daily_release와 같은 관용).
-- ------------------------------------------------------------

create or replace function public.kick_notification_worker()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'notify_worker_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'notify_worker_secret';
  if v_url is null or v_secret is null then
    raise notice 'notification kick skipped: vault secrets not set';
    return;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.kick_notification_worker() from anon, authenticated, public;

-- ------------------------------------------------------------
-- enqueue_notification — 4개 테이블이 공유하는 after-insert 트리거.
-- 하는 일은 둘뿐이다: 수신자를 찾고, 행을 넣는다.
-- 문구·아이콘·이동 경로 같은 판단은 src/lib/notifications.ts와 워커의 몫이다.
-- ------------------------------------------------------------

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
  v_target_id uuid;
  v_comment_id uuid;
  v_preview text;
  v_recipient_id uuid;
begin
  if TG_TABLE_NAME = 'stories' then
    v_couple_id := NEW.couple_id;
    v_actor_id := NEW.author_id;
    v_kind := 'story';
    v_target_id := NEW.id;
  elsif TG_TABLE_NAME = 'posts' then
    v_couple_id := NEW.couple_id;
    v_actor_id := NEW.author_id;
    v_kind := 'post';
    v_target_id := NEW.id;
  elsif TG_TABLE_NAME = 'story_comments' then
    select couple_id into v_couple_id from public.stories where id = NEW.story_id;
    v_actor_id := NEW.author_id;
    v_kind := 'comment';
    v_target_id := NEW.story_id;
    v_comment_id := NEW.id;
    v_preview := left(NEW.body, 40);
  elsif TG_TABLE_NAME = 'post_comments' then
    select couple_id into v_couple_id from public.posts where id = NEW.post_id;
    v_actor_id := NEW.author_id;
    v_kind := 'comment';
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
    (couple_id, recipient_id, actor_id, kind, target_id, comment_id, preview)
  values
    (v_couple_id, v_recipient_id, v_actor_id, v_kind, v_target_id, v_comment_id, v_preview);

  perform public.kick_notification_worker();

  return NEW;
end;
$$;

create trigger stories_enqueue_notification
  after insert on public.stories
  for each row execute function public.enqueue_notification();

create trigger posts_enqueue_notification
  after insert on public.posts
  for each row execute function public.enqueue_notification();

create trigger story_comments_enqueue_notification
  after insert on public.story_comments
  for each row execute function public.enqueue_notification();

create trigger post_comments_enqueue_notification
  after insert on public.post_comments
  for each row execute function public.enqueue_notification();

-- 종 아이콘 점이 상대 기기에서 새로고침 없이 켜지게
alter publication supabase_realtime add table public.notifications;
