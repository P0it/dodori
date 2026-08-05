# 오늘의 게임 댓글 + 지난 목록 (2026-08-05)

## 문제

오늘의 게임은 점수만 주고받는다. 같이 한 판 하고 나서 할 말("마지막 판에 손이 미끄러졌어")을
남길 자리가 없다. 그런데 댓글을 붙이면 곧장 다음 문제가 따라온다 — 게임 화면은 오늘만 보여주므로
자정이 지나면 어제 주고받은 말이 앱 어디에서도 안 보이게 된다.

확인해보니 지난 주제 목록은 원래 홈 하단에 있었는데 2026-07-23 홈 개편 커밋(9676f2c)에서
같이 떨어져 나갔다. `usePastTopics()`는 호출부 없이 죽은 코드로 남아 있다.
즉 주제도 게임도 지금은 둘 다 하루 리프레시다.

## 결정

**되돌아보기를 각 상세 화면 하단에 세로로 잇는다.** 새 라우트도, 홈 구조 변경도 없다.
오늘 것을 보고 아래로 스크롤하면 지난 날들이 최신순으로 이어진다. 탭해서 펼치는 아코디언이 아니라
처음부터 펼쳐진 카드들이다 — 하루 한 종목에 둘이 주고받는 양이라 접을 만큼 길지 않고,
접는 순간 다시 탭 상호작용이 생긴다.

- `/game`: 오늘 결과 → 오늘 댓글 → 지난 날 카드(결과 + 그날 댓글 + 입력창)
- `topic/[id]`: 오늘 주제일 때만 댓글 아래로 지난 주제 카드(질문 + 양쪽 선택), 누르면 그 주제 상세로

푸시 알림은 보내지 않는다. 게임은 그날 같이 하는 것이라 알림까지 얹을 무게가 아니다.

## 데이터

### `game_comments`

```sql
create table public.game_comments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  game_date date not null,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index game_comments_day_idx on public.game_comments (couple_id, game_date, created_at);
```

`game_scores`를 참조하지 않고 `(couple_id, game_date)`를 직접 든다 — `game_scores`의 PK가
사람별 행이라 스레드 하나를 가리킬 부모 행이 없다.

**대댓글 없음.** `story_comments`와 같은 이유 — 둘뿐인 잡담에 층이 생길 이유가 없다.

### RLS — 점수 정책을 그대로 복제

`has_played(p_date)`가 이미 날짜를 인자로 받으므로 과거 날짜도 같은 함수로 판정된다.

- **select**: `couple_id = my_couple_id() and (author_id = auth.uid() or has_played(game_date))`
  — 그날 내가 한 판이라도 마쳐야 상대 댓글이 열린다. 점수를 가려놓고 댓글로 "나 0.21초 나왔어"가
  새어나가는 걸 막는다
- **insert**: 위 조건 + `has_played(game_date)` — 마치기 전엔 쓰지도 못한다
- **delete**: 본인 것만
- realtime publication에 추가

## API (`src/api/games.ts`)

- `useGameComments(date)` — 그날 스레드. key `['gameComments', date]`
- `useAddGameComment()` / `useDeleteGameComment()` — 둘 다 `gameComments`·`pastGames` 무효화
- `usePastGames(days)` — `[today-days, today-1]` 범위의 점수와 댓글을 한 번에 받아
  날짜별로 묶는다. 한쪽이라도 기록이 있는 날만 반환, 최신순

`src/api/realtime.ts`에 `game_comments` 구독을 추가해 상대 댓글이 바로 뜨게 한다.

## 분량

지난 목록은 **최근 14일**부터 시작하고 "더 보기"로 14일씩 늘린다. 무한 스크롤은 지금 데이터 양에 과하다.
주제 쪽은 날짜가 아니라 `seq` 기준이라 14개씩 끊는다.

## 컴포넌트

- `components/game/GameCommentList.tsx` — props-only. `feed/CommentList`의 한 줄 레이아웃
  (아바타 + 이름 인라인 + 시간·삭제)을 따르되 답글과 "모두 보기" 접기는 뺀다
- `components/game/PastGameCard.tsx` — 날짜·종목·양쪽 회차 점수·승패 + 그날 댓글
- `components/topic/PastTopicCard.tsx` — 질문 + 양쪽 선택

`game.tsx`의 `PlayerCard`는 오늘·지난 날 카드가 같이 쓰도록 컴포넌트 파일로 옮긴다.

## 표시 조건

오늘 댓글은 `mine`이 있을 때(=오늘 한 판이라도 마쳤을 때)만 렌더한다. 결과 카드 표시 여부와는
분리 — 재진입해서 `intro` 화면일 때도 댓글은 보이는 게 맞다.

지난 주제 목록은 **보고 있는 주제가 오늘 주제일 때만** 렌더한다. `topic/[id]`는 오늘 전용
라우트가 아니라서, 조건 없이 붙이면 지난 주제로 들어갔을 때 그 아래 또 지난 주제 목록이 붙어 재귀가 된다.

## 검증

`lib/`에 새 순수 함수가 없어 단위 테스트 대상은 없다(날짜·종목 배정은 기존 `lib/games.ts` 재사용).
`npm run typecheck` + `npm test` 통과, 로컬 스택에서 두 계정으로 확인:

1. 상대가 먼저 댓글 → 내가 플레이하기 전엔 안 보임 → 플레이 후 열림
2. 자정을 넘긴 날짜의 댓글이 지난 목록에 남아 있고 거기서 추가로 쓸 수 있음
3. 지난 주제로 들어가면 그 화면엔 지난 주제 목록이 없음
