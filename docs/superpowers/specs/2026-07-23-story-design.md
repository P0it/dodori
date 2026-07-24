# 스토리 (사진 전용) + 데이트 앨범 연동 — 설계

작성 2026-07-23. 상태: **구현 완료 (2026-07-24, 작업 순서 1~7단계).** 하이라이트·영상은 아래 "다음 차수" 그대로 남았다.

## 왜

피드(추억)는 "남길 만한 것"이라 문턱이 있다. 그 아래에 **오늘 한 컷을 부담 없이 던지는 층**이 없다.
스토리가 그 층이고, 그날 데이트 앨범이 있으면 그 컷이 앨범에 자동으로 얹힌다 —
데이트 사진을 따로 정리하는 수고 없이 앨범이 채워진다.

## 결정 사항 (브레인스토밍 결과)

| 질문 | 결정 |
|---|---|
| 앨범 연동 방식 | ~~올린 날짜로 자동 연결~~ → **올릴 때 직접 고르기** (2026-07-24 변경). 그날 트랙이 있으면 "○○에도 담기" 스위치가 뜨고, 기본은 꺼짐. 켠 스토리만 앨범에 얹힌다 |
| 24시간 뒤 | **링에서만 내려간다. 데이터는 안 지운다** (= 보관함이 곧 아카이브) |
| 하이라이트 | **1차 제외.** 몇 주 써보고 어떤 묶음이 필요한지 보고 결정 |
| 진입점 | **홈 상단에 링**, 보관함은 **피드 탭** |
| 반응 | **하트 하나 포함** (DM이 없어 아무 표시도 못 하고 넘어가는 게 어색) |
| 영상 | 1차 제외 — 사진만 |

핵심 단순화: **만료 삭제가 없다.** cron도, Storage 정리도, "사라지기 전에 남겨야 해"도 없다.
`created_at > now() - 24h`면 링에 뜨고 아니면 보관함에만 있을 뿐이다.

## 데이터 모델

```sql
create table public.stories (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  author_id  uuid not null references auth.users (id) on delete cascade,
  -- 올린 날 데이트 앨범. 트랙이 지워져도 스토리는 남는다
  track_id   uuid references public.tracks (id) on delete set null,
  caption    text not null default '',
  -- 상대가 본 시각. 커플 = 2인이므로 뷰 테이블 대신 컬럼 하나로 충분
  seen_at    timestamptz,
  created_at timestamptz not null default now()
);
create index stories_couple_created_idx on public.stories (couple_id, created_at desc);
create index stories_track_idx on public.stories (track_id);

create table public.story_reactions (
  story_id   uuid not null references public.stories (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id, emoji)
);

-- photos: 부모 2택1 → 3택1
alter table public.photos add column story_id uuid references public.stories (id) on delete cascade;
alter table public.photos drop constraint photos_one_parent;
alter table public.photos add constraint photos_one_parent
  check (num_nonnulls(track_id, post_id, story_id) = 1);
create index photos_story_idx on public.photos (story_id);
```

- **스토리 = 사진 1장.** 여러 장을 남기고 싶으면 추억(post)이다
- `track_id`는 클라이언트가 올릴 때 채운다 — 그날(`date = todayKST()`) 트랙이 있고 **사용자가 스위치를 켰을 때만**. 기본은 null
- RLS는 posts와 동일한 모양: select는 `couple_id = my_couple_id()`, insert는 `author_id = auth.uid()` 동반,
  delete는 본인 것만. `story_reactions`·photos 정책은 story 스코프를 따라간다
- `photos` 기존 정책(`photos_select` / `photos_insert`)에 story 분기를 추가한다 — 안 하면 스토리 사진이 전부 막힌다
- Realtime 발행: `stories`, `story_reactions`

### 앨범이 스토리 사진을 품는 방식

사진을 **복사하지 않는다.** 트랙 상세는 두 소스를 합쳐서 보여준다.

```
트랙 X의 사진 = photos where track_id = X
              ∪ photos where story_id in (select id from stories where track_id = X)
```

정렬은 `created_at` 오름차순으로 섞는다. 커버 사진(`tracks.cover_photo_id`)은 지금처럼 트랙 자체 사진에서만 고른다
(스토리 사진을 커버로 쓰는 건 다음 차수).

## 화면

| 위치 | 라우트 | 내용 |
|---|---|---|
| 홈 상단 | `(tabs)/home/index` | 링 2개(나·상대). 내 링엔 `+` 배지 → 올리기. 상대 링: 새 스토리 accent / 봤으면 hairline / 없으면 흐림 |
| 뷰어 | `story/[id]` | 전체화면 1장, 상단 진행바(5초 자동 진행), 아바타 + "3시간 전", 하단 캡션 + 하트. 좌우 탭 이동, 아래 스와이프로 닫기. 내 스토리면 삭제 |
| 올리기 | `modals/create-story` | 사진 1장 → 캡션(선택) → 올리기. 그날 앨범이 있으면 "○○에도 담기" 스위치(기본 꺼짐) |
| 보관함 | `(tabs)/feed/stories` | 피드 헤더에서 진입. 월별 헤더 + 3열 그리드. 데이트날 스토리엔 앨범 배지 |

- 링은 24시간 내 스토리가 **하나도 없으면 자리를 비우지 않는다** — 내 링(+)은 항상 있고, 상대 링은 흐리게 남는다
  (자리가 생겼다 없어졌다 하면 홈 레이아웃이 흔들린다)
- 뷰어 진입 시 상대 스토리면 `seen_at`을 채운다 (이미 있으면 건드리지 않는다)
- 하트는 이모지 하나(`❤️`)만. `lib/posts.ts`의 "팔레트 불필요" 판단과 같은 이유

## 코드 배치

의존성 방향 규칙(`app/ → components/ → api/·lib/`)을 그대로 따른다.

- **`src/lib/stories.ts`** — 순수 함수만. 유일한 단위 테스트 대상
  - `isLive(createdAt, now)` — 24시간 이내인가
  - `ringState(stories, viewerId, now)` → `'new' | 'seen' | 'none'`
  - `groupByMonth(stories)` — 보관함 섹션
- **`src/api/stories.ts`** — `useStories` / `useLiveStories` / `useCreateStory`(`uploadPhotos` 재사용) /
  `useDeleteStory` / `useMarkSeen` / `useToggleStoryReaction`
- **`src/components/story/`** — `StoryRing`, `StoryProgress`, `StoryCard`(보관함 셀). 전부 props-only
- **`src/api/tracks.ts`** — 트랙 사진 쿼리에 스토리 사진 합치기 (위 § 참조)

## 작업 순서 (내일 이어서)

각 단계 끝에 검증을 붙인다.

1. **마이그레이션** `20260724000001_stories.sql` — 테이블·RLS·photos 부모 확장·Realtime.
   검증: `npx supabase db reset` 통과 + 타입 재생성(`gen types`)
2. **`lib/stories.ts` + 테스트** — 24h 경계, ringState 세 갈래, 월 그룹핑.
   검증: `npm test` 통과
3. **`api/stories.ts`** — 생성(사진 업로드 + 그날 트랙 자동 배정)·조회·삭제·seen·하트.
   검증: typecheck + 앱에서 올리기 1회 성공
4. **올리기 모달 + 홈 링** — 여기까지가 최소 동작.
   검증: 올린 스토리가 링에 뜨고 24h 밖 스토리는 안 뜬다
5. **뷰어** — 진행바·이동·하트·삭제·seen 기록
6. **보관함** — 피드 탭 진입 + 월별 그리드
7. **앨범 합류** — 트랙 상세에서 그날 스토리 사진이 보인다.
   검증: 데이트 당일 스토리 → 해당 앨범 상세에 나타남

## 다음 차수 (이번엔 안 한다)

- **하이라이트(고정 스토리)** — 별도 테이블 + 프로필 헤더 줄 + 편집 화면. 사진이 쌓인 뒤에 결정
- **짧은 영상** — 15초 상한 + 업로드 전 압축(720p/2.5Mbps) + `expo-video` 재생.
  용량은 압축 시 개당 4~5MB, 하루 2개면 연 3GB 수준이라 Supabase Pro에선 문제없다
- 스토리 답장(텍스트), 스토리 사진을 앨범 커버로 지정
