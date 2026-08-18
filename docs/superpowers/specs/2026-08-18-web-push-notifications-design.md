# 웹 푸시 알림 + 아이콘 배지

작성일: 2026-08-18

## Context

지금 도돌이에서 상대가 스토리를 올리거나 댓글을 달아도 **상대는 앱을 직접 열어봐야 안다.**
둘 다 PWA를 홈 화면에 설치해 쓰고 있으므로, 아이콘에 빨간 배지가 뜨면 들어올 이유가 생긴다.

기존 푸시 자산은 네이티브 전용이다:

- `src/api/notifications.ts`의 `usePushRegistration()`은 `Platform.OS === 'web'`이면 즉시 return —
  **웹은 토큰 등록조차 하지 않는다.** Expo Push 토큰은 `profiles.push_token`에 저장된다
- `supabase/functions/notify-game`이 그 토큰으로 Expo Push를 1건 쏜다. "부가물이라 실패해도 됨"이 전제였다

웹은 Expo Push를 못 쓰므로 **표준 Web Push(RFC 8291 / VAPID)**를 별도로 붙인다.
배지 숫자가 데이터의 진실이 되는 순간 `notify-game`식 "실패해도 됨"은 통하지 않는다.

### 플랫폼 제약 (확인된 사실)

- iOS Safari 16.4+ 는 **홈 화면에 추가된 PWA에서만** 웹 푸시가 된다. 브라우저 탭 상태로는 불가
- 권한 요청(`Notification.requestPermission()`)은 **반드시 사용자 제스처 안에서** 호출해야 한다 → 자동 요청 불가, 버튼 필요
- 서비스워커는 DB를 읽을 수 없다 → **배지 숫자는 서버가 계산해 푸시 payload에 실어 보낸다**
- Vercel 프로젝트는 Next.js가 아니라 `expo export -p web`의 **정적 배포**다(`vercel.json`).
  Vercel은 `api/` 디렉터리의 TS 파일을 프레임워크와 무관하게 서버리스 함수로 띄우므로, 새 배포 대상 없이 워커를 둘 수 있다

## 확정된 결정

| # | 결정 |
|---|---|
| 1 | 배지 = **안 읽은 알림 수**. `notifications` 테이블의 `read_at is null` 카운트 |
| 2 | 알림 대상 이벤트 = **스토리 올림 / 게시물 올림 / 댓글(게시물·스토리)**. 하트(리액션)는 제외 |
| 3 | 피드 탭에 **종 아이콘 + 알림 목록 화면**. 항목을 탭하면 대상으로 이동하며 그 행만 읽음 처리 |
| 4 | 알림 행 생성은 **Postgres 트리거**가 단일 진실 (클라이언트 호출 아님) |
| 5 | 발송 워커는 **Vercel Function**(`api/notifications/deliver.ts`). Edge Function을 새로 만들지 않는다 |
| 6 | 연속 알림 **묶지 않는다** — 1 이벤트 = 푸시 1건. 시끄러우면 나중에 워커에서 집계 |
| 7 | 웹은 표준 Web Push, 네이티브는 기존 Expo Push — **워커가 둘 다 쏜다** |

### 벤더 종속을 격리한다

"나중에 다른 백엔드로 이사할 수 있어야 한다"는 제약에 맞춰 조각별 이식성을 의도적으로 나눴다.

| 조각 | 종속 | 비고 |
|---|---|---|
| `notifications` · `push_subscriptions` 테이블 | **없음** | 순수 Postgres |
| insert 트리거 | **없음** | 표준 plpgsql |
| 발송 워커 | **낮음** | Vercel Function. Supabase 클라이언트 한 줄 외엔 표준 TS |
| Web Push 프로토콜 | **없음** | RFC 8291. 어디서 쏘든 동일 |
| **kicker (`net.http_post`)** | **높음** | pg_net + Vault. **유일한 락인이고, 버려도 무방하다** |

`notifications.pushed_at`이 곧 미발송 큐다. kicker는 "지금 깨워달라"는 신호일 뿐이라,
Supabase를 떠나거나 부하가 커지면 kicker를 끄고 워커를 cron으로 폴링시키면 된다 — **설계를 바꾸지 않는다.**

## 데이터 모델

```sql
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id     uuid not null references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('story','post','comment')),
  target_id    uuid not null,   -- 탭했을 때 갈 대상. 댓글도 부모 글의 id
  comment_id   uuid,            -- kind='comment'일 때만
  preview      text,            -- 댓글 본문 앞 40자 (푸시 본문용)
  read_at      timestamptz,
  pushed_at    timestamptz,     -- 미발송 큐 겸 멱등 도장
  created_at   timestamptz not null default now()
);

create index notifications_unread on public.notifications (recipient_id)
  where read_at is null;
create index notifications_unsent on public.notifications (created_at)
  where pushed_at is null;
```

`target_id`는 의도적으로 FK를 걸지 않는다 — `kind`에 따라 `stories` 또는 `posts`를 가리키는 다형 참조다.
원본이 삭제되면 워커·목록 화면이 대상을 못 찾고 조용히 건너뛴다(아래 "에러 처리" 참조).

```sql
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,   -- 기기마다 1행
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  failed_at  timestamptz
);
```

기존 `profiles.push_token`(Expo 네이티브)은 **그대로 둔다.** 두 경로가 공존한다.

### RLS

```sql
-- notifications: 내 알림만 읽고, 내 알림만 읽음 처리
create policy "notifications_select" on public.notifications for select
  using (recipient_id = auth.uid());
create policy "notifications_update" on public.notifications for update
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
-- insert 정책 없음 → 클라이언트는 알림을 위조할 수 없다. security definer 트리거만 넣는다

-- push_subscriptions: 본인 것만 전부
create policy "push_subscriptions_all" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

`notifications_update`는 `read_at` 외의 컬럼도 바꿀 수 있게 열려 있다.
둘뿐인 앱이고 남의 행은 못 건드리므로 컬럼 단위 제약은 두지 않는다.

## 알림 행 생성 — 트리거

`stories` / `posts` / `post_comments` / `story_comments` 네 테이블에 after-insert 트리거를 걸고
공통 함수 `public.enqueue_notification()`가 처리한다. `TG_TABLE_NAME`으로 분기한다.

함수가 하는 일은 둘뿐이다.

1. **수신자 결정** — `couple_members`에서 작성자와 같은 커플의 다른 사람. 없으면(솔로) 아무것도 안 한다
2. **행 insert**

문구·아이콘·이동 경로·묶음 같은 **판단은 SQL에 넣지 않는다.** 전부 `src/lib/notifications.ts`와 워커의 몫이다.

댓글 트리거는 부모 글(`posts`/`stories`)의 `couple_id`와 id를 조회해 `target_id`에 넣고,
본문 앞 40자를 `preview`에 넣는다.

**자기 자신에게는 알림을 만들지 않는다** — 수신자가 작성자와 같으면 skip(현재 구조상 발생하지 않지만 방어).

### kicker

트리거 마지막에 `public.kick_notification_worker()`를 `perform`한다.
`invoke_daily_release()`와 동일한 패턴: Vault에서 URL·시크릿을 읽어 `net.http_post`.

- Vault 키: `notify_worker_url`, `notify_worker_secret`
- 시크릿이 없으면 `raise notice` 후 조용히 return (기존 cron 함수와 동일한 관용)
- **실패는 무시한다.** 행은 이미 커밋되므로 다음 이벤트의 kicker나 수동 호출 때 함께 나간다

## 발송 워커 — `api/notifications/deliver.ts`

Vercel Function. `POST`만 받고, `Authorization: Bearer <NOTIFY_WORKER_SECRET>`를 검사한다.

```
1. pushed_at is null 인 행을 created_at 순 최대 50개 조회
2. 행별로:
   - recipient의 push_subscriptions(전 기기) + profiles.push_token 조회
   - recipient의 안 읽은 수를 세어 payload.badge에 싣는다
   - 구독이 하나도 없으면 pushed_at만 찍고 넘어간다 (영원히 남지 않게)
   - web-push(VAPID)로 각 구독에 발송 / push_token이 있으면 Expo Push에도 발송
3. pushed_at = now() 도장
4. 404·410 응답 → 죽은 구독이므로 해당 push_subscriptions 행 삭제
   그 외 실패 → failed_at 기록, pushed_at은 찍는다 (무한 재시도 방지)
```

`service_role` 키로 붙으므로 **RLS가 적용되지 않는다.** 이 파일 안에서는 스코프를 직접 챙긴다.

`web-push` 패키지를 dependencies에 추가한다. `api/`에서만 import하므로 Metro 번들(앱)에는 들어가지 않는다.
워커가 `src/lib/notifications.ts`를 import하려면 상대 경로(`../../src/lib/notifications`)를 쓴다 — 앱의 `@/` alias는 Vercel 빌드에 적용되지 않는다.

### 푸시 payload

```json
{
  "title": "지수",
  "body": "스토리를 올렸어요",
  "url": "/story/<id>",
  "badge": 3,
  "tag": "<notification id>"
}
```

문구 생성은 `src/lib/notifications.ts`의 순수함수를 워커가 그대로 import 한다 —
앱과 서버가 같은 언어라 규칙을 두 벌 짜지 않는다.

## 서비스워커 — `public/sw.js`

```js
self.addEventListener('push', e => {
  const d = e.data.json();
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title, { body: d.body, tag: d.tag, data: { url: d.url } }),
    navigator.setAppBadge?.(d.badge),
  ]));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(/* 기존 창이 있으면 focus + postMessage(url), 없으면 openWindow(url) */);
});
```

`public/`은 `expo export -p web`이 `dist/`로 복사하므로(`icons/`·`manifest.json`이 그렇게 배포되고 있다)
`/sw.js`로 서빙된다. **단 `vercel.json`의 catch-all rewrite에서 제외해야 한다.**

## 클라이언트

### 신규

- **`src/lib/notifications.ts`** (순수함수 · 테스트 대상)
  - `notificationText(n, actorName)` → `{ title, body }`
  - `notificationHref(n)` → 이동 경로
  - `notificationIcon(n)` → kind별 아이콘 키
  - React·Supabase import 금지 (lib/ 규칙). 워커도 이 파일을 import 한다
- **`src/api/webPush.ts`** — 구독 등록/해제
  - `isWebPushAvailable()` — `'serviceWorker' in navigator && 'PushManager' in window`
  - iOS에서 `navigator.standalone !== true`면 "홈 화면에 추가해야 알림을 받을 수 있어요" 안내
  - `subscribe()` — SW 등록 → `pushManager.subscribe({ applicationServerKey })` → `push_subscriptions` upsert
- **`src/app/notifications.tsx`** — 알림 목록 화면. 항목 탭 → `notificationHref()`로 이동 + 그 행 `read_at` 채움

### 수정

- **`src/api/notifications.ts`** — 기존 `usePushRegistration()` 유지. 아래를 추가
  - `useUnreadCount()` — 배지·종 아이콘 점
  - `useNotifications()` — 목록
  - `useMarkRead(id)`
  - 앱 포커스 시 `navigator.clearAppBadge?.()` + 미읽음 재조회
- **피드 헤더** — 종 아이콘 + 미읽음 점, `/notifications`로 이동
- **피드 설정** — "알림 켜기" 버튼 (권한 요청은 이 제스처 안에서만)
- **`vercel.json`** — rewrite 예외에 `api/`·`sw.js` 추가

## 에러 처리

| 상황 | 처리 |
|---|---|
| kicker 실패 (Vault 미설정·네트워크) | 무시. 행은 큐에 남아 다음 kick 때 발송 |
| 워커가 죽은 구독을 만남 (404·410) | `push_subscriptions` 행 삭제. 다음 접속 때 재구독된다 |
| 그 외 발송 실패 | `failed_at` 기록 + `pushed_at` 도장. 무한 재시도 안 함 |
| 구독이 하나도 없는 수신자 | `pushed_at`만 찍는다. 알림 행은 남아 배지·목록에 반영된다 |
| 알림 대상(글·스토리)이 삭제됨 | 목록에서 탭하면 대상이 없으므로 읽음 처리만 하고 머문다. `on delete cascade`를 걸지 않는 이유는 `target_id`가 다형 참조라서다 |
| 권한 거부 | 구독을 만들지 않는다. 앱 안 종 아이콘·목록은 그대로 동작한다 |
| iOS 브라우저 탭(미설치) | 안내 문구만 노출. 등록 시도하지 않는다 |

## 테스트

`npm test` 대상은 `src/lib/notifications.ts` 뿐이다 (lib/만 단위 테스트 — 기존 규칙).

- kind별 문구가 맞는가 (`story`/`post`/`comment`)
- `comment`의 `preview`가 40자에서 잘리고, 없으면 본문이 비지 않는가
- `notificationHref()`가 kind별로 올바른 경로를 내는가

트리거·워커는 원격에 적용한 뒤 **실제 두 기기(설치된 PWA)로 수동 검증**한다:
스토리 올리기 → 상대 폰에 배너 + 아이콘 배지 → 탭 → 해당 스토리 → 배지 사라짐.

## 배포 후 1회 수동 설정

1. VAPID 키쌍 생성 — `npx web-push generate-vapid-keys`
2. Vercel 환경변수: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `NOTIFY_WORKER_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
3. 앱 상수에 VAPID 공개키 (`EXPO_PUBLIC_VAPID_PUBLIC_KEY`)
4. Supabase Vault:
   ```sql
   select vault.create_secret('https://<vercel-domain>/api/notifications/deliver', 'notify_worker_url');
   select vault.create_secret('<NOTIFY_WORKER_SECRET>', 'notify_worker_secret');
   ```
   ⚠️ 자리표시자 문자열을 그대로 저장하지 말 것 (cron 시크릿에서 겪었던 실패)

## 범위 밖

- 하트(리액션) 알림 — 빈도가 높아 피로를 만든다. 필요해지면 `kind`에 추가
- 알림 묶음/집계 — 워커에 집계를 넣으면 되지만 지금은 안 한다
- 알림 종류별 on/off 설정 — 3종뿐이라 전체 on/off로 충분
- 캘린더 일정·오늘의 주제·게임 알림 — `notify-game`은 현행 유지. 이 구조로 이관하는 건 별건
- Next.js API 계층 전면 도입 — 이번 워커가 첫 조각이 될 뿐, RLS 이관은 하지 않는다
