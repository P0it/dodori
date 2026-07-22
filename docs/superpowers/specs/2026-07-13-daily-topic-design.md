# 오늘의 대화주제 — 설계

## 배경

도도리에는 **매일 바뀌는 것이 없다.** 데이트는 주 1회, 캘린더는 한 달에 몇 칸, 아카이브는 일주일에 한 번 갱신된다. 그래서 무엇을 홈에 두든 지루하고, 매일 앱을 열 이유가 생기지 않는다. 캘린더를 키우는 것은 빈 화면을 크게 만드는 것일 뿐이다.

**매일 생기는 공유 콘텐츠를 하나 만든다.** 하루 한 개의 대화주제("깻잎논쟁" 류)에 둘이 각자 투표하고, 서로의 답을 확인한 뒤 댓글로 논쟁한다. 진입장벽이 극히 낮고(선택지 두 개 중 탭 한 번), 잘/못이 없고, 준비물이 없다. 그러면서 커플이 앱 안에서 실제로 **말을 섞는** 유일한 기능이 된다.

핵심 훅: **내가 투표해야 상대의 답이 열린다.** 이게 매일 앱을 열게 만든다.

### 왜 이 형태인가 (검토하고 버린 대안)

- **오늘의 한 곡 / 사진 / 낙서** — 매일 리추얼로는 성립하지만, 곡을 떠올리거나 사진을 찍거나 그림을 그리는 부담이 있다. 투표는 3초다.
- **이상형 월드컵** — 콘텐츠 공급이 치명적이다. 매일 새 토너먼트의 후보 이미지를 어디서 가져오는가에 답할 수 없고(공개 API 부재, 인물 사진 저작권), "이상형"이라는 주제 자체가 커플에게 지뢰다. 대화주제는 텍스트 한 줄 + 선택지 둘이면 끝이라 이 문제가 통째로 사라진다.

### 리스크

- **주제 큐레이션이 곧 제품 품질이다.** 가벼운 유치한 논쟁만 담고, 진짜 지뢰(전 애인, 결혼관, 돈)는 뺀다. 재밌자고 만든 게 싸움이 되면 안 된다.
- **주제 고갈**. 시드 200개 = 반년치. 그 안에 보충하지 않으면 기능이 죽는다.

## 결정 사항

- **주제 배정**: 커플별 순차. 각 커플이 1번 주제부터 시작한다. (전역 동일 날짜 배정은 화제성이 있지만 신규 커플이 중간부터 받게 되어 탈락)
- **홈**: 오늘의 주제 + 그 아래 지난 주제 히스토리.
- **캘린더 연동**: 하지 않는다. 캘린더는 일정 전용으로 둔다.
- **댓글**: 대댓글 없이 시간순 한 줄. 참여자가 둘뿐이라 트리 구조가 생길 일이 없다.
- **게시글 피드는 스튜디오에 둔다** (별도 진행 중인 작업). 홈에는 게시글이 오지 않는다.
  - 남는 리스크: 앱에 "돌아보는 곳"이 홈(지난 주제)과 스튜디오(게시글) 두 군데가 된다. 스튜디오 피드가 실제로 붙은 뒤 재검토.

## 데이터 모델

기존 `public.my_couple_id()` 기반 couple 스코프 RLS 패턴을 그대로 따른다 (`supabase/migrations/20260708000001_schema_v1.sql`).

```sql
-- 전역 카탈로그. 커플 스코프가 아니다 — 모든 커플이 같은 주제 풀을 순서대로 소비한다.
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  seq integer not null unique,      -- 배정 순번 (1부터)
  question text not null,
  option_a text not null,
  option_b text not null,
  created_at timestamptz not null default now()
);

create table public.topic_votes (
  couple_id uuid not null references public.couples (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  choice text not null check (choice in ('a', 'b')),
  created_at timestamptz not null default now(),
  primary key (couple_id, topic_id, user_id)
);

create table public.topic_comments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index topic_comments_idx on public.topic_comments (couple_id, topic_id, created_at);
```

**배정 테이블도 cron도 없다.** 오늘의 주제 번호는 `couples.created_at`(KST 날짜)부터 오늘까지의 일수로 계산된다. 서버는 아무 일도 하지 않는다.

## 잠금 — 반드시 서버에서

"내가 투표해야 상대 것이 열린다"를 클라이언트에서 가리면 **아무 의미가 없다.** 쿼리 한 번이면 뚫린다. RLS로 막는다.

`topic_votes`의 select 정책이 자기 테이블을 참조하면 무한 재귀가 나므로, `my_couple_id()`와 같은 방식으로 `security definer` 함수를 하나 둔다.

```sql
create or replace function public.has_voted(p_topic_id uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.topic_votes
    where topic_id = p_topic_id
      and user_id = auth.uid()
      and couple_id = public.my_couple_id()
  )
$$;
```

- `topics`: 인증 유저 전체 읽기, 쓰기 없음(시드는 마이그레이션).
- `topic_votes` **select**: `couple_id = my_couple_id() and (user_id = auth.uid() or public.has_voted(topic_id))`
  → 내 표는 항상 보이고, 상대 표는 내가 투표한 뒤에만 보인다.
- `topic_votes` **insert**: `couple_id = my_couple_id() and user_id = auth.uid()`.
- `topic_votes` **update** (2026-07-14 완화): 위 조건 + `not public.partner_voted(topic_id)`. delete는 없다.
  → **상대가 고르기 전까지만 바꿀 수 있다.** 원래는 update 정책 자체가 없었지만(뒤집기 방지), 상대가 아직
  투표하지 않았다면 내가 볼 상대 답이 애초에 없으므로 뒤집기가 성립하지 않는다. 그 구간에서만 열어 오탭을 구제한다.
  상대가 고르는 순간 내 표도 함께 잠긴다. `partner_voted()`는 `has_voted()`와 같은 이유로 `security definer`.
- `topic_comments` **select/insert**: 둘 다 `couple_id = my_couple_id() and public.has_voted(topic_id)`.
  → 투표 전에는 댓글을 읽지도 쓰지도 못한다. 잠금이 진짜 잠금이 된다.
- Realtime: `topic_votes`, `topic_comments`를 publication에 추가 (상대가 투표/댓글하면 즉시 반영).

## 도메인 규칙 — `src/lib/topics.ts` (순수 함수, 단위 테스트 대상)

```ts
/** 커플이 만들어진 날부터 n일째 → n번 주제. 시드를 다 쓰면 순환한다. */
export function topicSeqForDay(coupleCreatedAt: ISODate, today: ISODate, topicCount: number): number
```

- `diffDays(coupleCreatedAt, today)`로 경과일 계산 — 기존 `src/lib/date.ts`의 KST 함수만 쓴다. `new Date()` 직접 비교 금지.
- 결과: `((경과일) % topicCount) + 1`.
- 커플 생성일 이전 날짜나 `topicCount === 0`은 방어하지 않는다 (일어날 수 없는 시나리오).

## API — `src/api/topics.ts`

화면은 supabase를 직접 import하지 않는다 (기존 규칙).

- `useTodayTopic()` — `topics` 전체 개수 + 오늘 seq의 주제 1건.
- `useTopicVotes(topicId)` — 내 표 + (열렸다면) 상대 표. RLS가 알아서 가린다.
- `useVote(topicId)` — mutation. 성공 시 votes/comments invalidate.
- `useTopicComments(topicId)` / `useAddComment(topicId)`.
- `usePastTopics()` — 지난 seq의 주제 + 우리 답. 홈 하단 히스토리용.

## 화면

**`src/app/(tabs)/today/index.tsx`** — 새 탭, 첫 번째 자리. (잠시 4탭: 오늘 / 캘린더 / 플레이리스트 / 스튜디오)

- **투표 전**: 질문 + 선택지 두 장. 상대 답 자리는 "OO님이 답했어요" 또는 "아직이에요"만 보이고 내용은 잠겨 있다. 댓글 영역도 잠겨 있다.
- **투표 후**: 양쪽 선택이 드러나고, 같으면/다르면에 따라 다른 한 줄(예: "둘 다 깻잎 파"). 그 아래 댓글 입력 + 시간순 목록.
- **상대가 아직 안 했으면**: 내 답만 보이고 "OO님을 기다리는 중". 댓글은 열려 있다(내가 투표했으므로).
- **하단**: 지난 주제 히스토리 — 질문 한 줄 + 두 사람의 선택 표시. 탭하면 그 주제의 댓글로.

컴포넌트는 props-only: `TopicCard`, `ChoiceButton`, `CommentList`.

## 주제 시드

마이그레이션에 `insert`로 200개. 톤 기준:

- **담는다**: 사소한 취향 대결(깻잎논쟁, 부먹/찍먹, 여행 계획형/즉흥형), 가벼운 딜레마("평생 라면만 vs 평생 치킨만"), 관계 안의 무해한 질문("먼저 연락 안 하면 서운한가").
- **뺀다**: 전 애인, 결혼·출산 계획, 돈·수입, 외모 평가, 가족 갈등. 재밌자고 만든 게 싸움이 되면 안 된다.

## 단계

**1단계 (이번 라운드)** — 위 전부. 기존 화면은 건드리지 않고 `오늘` 탭만 추가한다. 되돌리기 쉽다.

**2단계 (나중)** — 실제로 매일 쓸 만한지 확인한 뒤, 탭 4개가 많다면 재편한다. 스튜디오 게시글 피드가 붙은 뒤 홈/스튜디오의 역할을 재검토한다.

## 검증

1. `npm test` — `topicSeqForDay` 단위 테스트 (1일째 → 1번 / 경과일 순증 / 시드 개수 초과 시 순환).
2. `npm run typecheck`.
3. **잠금은 RLS 레벨에서 직접 검증한다.** 두 계정으로 로컬 스택에서:
   - A가 투표하지 않은 상태에서 `topic_votes`를 select → B의 표가 **안 나온다**.
   - 같은 상태에서 `topic_comments` select/insert → **막힌다**.
   - A가 투표한 직후 → B의 표와 댓글이 **보인다**.
   - A가 자기 표를 update/delete 시도 → **막힌다**.
4. 에뮬레이터(`dodori_emu`, `-port 5556`)에서 오늘 탭 진입 → 투표 → 잠금 해제 → 댓글 작성까지 실제로 확인.
