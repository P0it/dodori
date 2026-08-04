# 사진 파이프라인 비용 상한 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버 이미지 변환을 온디바이스 렌디션으로 교체하고, 게시물 업로드에 크롭 UI를 붙이고, 커플당 사진 쿼터를 강제해 Supabase Pro $25/월 안에서 서비스가 돌아가게 한다.

**Architecture:** 업로드 시점에 기기에서 1080(본체)·360(목록) 두 파일을 만들어 함께 올린다. 조회는 `transform` 옵션 없이 경로만 서명한다. 기존 사진은 `photos.renditions=false`로 표시해 기존 변환 방식으로 폴백한다. 크롭은 스토리 편집기가 이미 가진 `StoryCanvas`·`cropRect`·`cropToCanvas`를 프레임 크기만 바꿔 재사용한다.

**Tech Stack:** Expo SDK 57 / React Native 0.86 / TypeScript strict / Supabase(Postgres·Storage) / expo-image-manipulator 57 / react-native-gesture-handler 2.32 / react-native-reanimated 4.5 / TanStack Query

**Spec:** `docs/superpowers/specs/2026-08-04-photo-pipeline-cost-design.md`

## Global Constraints

- **모든 색상은 토큰 참조** (`src/theme/tokens.ts`) — hex 하드코딩 금지
- **`lib/` 는 순수 함수만** — React·Supabase·RN import 금지. 유일한 단위 테스트 대상
- **Supabase 접근은 `api/` 로만** — 화면·컴포넌트에서 `supabase` 직접 import 금지
- **`components/` 는 props-only** — 전역 상태·네트워크 접근 금지
- **화면(`app/`)은 조합만** — 훅 호출 + 컴포넌트 배치
- **날짜 연산은 `src/lib/date.ts` 경유** (Asia/Seoul 고정)
- 커밋 전 `npm run typecheck` + `npm test` 통과 필수. 깨지면 커밋하지 않고 보고
- **`git add -A` / `git commit -a` 금지** — 만진 파일만 경로로 명시해 스테이징 (작업 트리를 다른 세션과 공유 중)
- 커밋 메시지는 한글 Conventional Commits
- 마이그레이션은 코드와 같은 커밋에. 원격 적용(`npx supabase db push`)과 타입 재생성도 같이
- 렌디션 크기 상수: **본체 장변 1080 / JPEG 품질 0.8**, **목록 장변 360 / JPEG 품질 0.7**
- 프레임 비율 클램프 상수: **최소 0.5625(가로 16:9) / 최대 1.25(세로 4:5)**
- 무료 쿼터 기본값: **커플당 사진 100장**

---

## Task 0: 사전 확인 (구현 아님, 기록만)

원격 Free 프로젝트에서 `transform` 옵션이 실제로 동작하는지 확인한다. Free 플랜에는 이미지 변환이 없으므로 무시되고 원본이 통째로 내려올 수 있다. 결과는 이후 폴백 설계의 전제가 된다.

**Files:**
- 없음 (조사 결과를 Task 1 커밋 메시지 또는 스펙에 한 줄 기록)

- [ ] **Step 1: 현재 썸네일 URL의 실제 응답 크기 확인**

`.env`의 `EXPO_PUBLIC_SUPABASE_URL`이 원격(`https://iyqttrufrjeytntinsrb.supabase.co`)을 가리키는지 먼저 확인한다. 로컬(127.0.0.1)이면 이 확인은 의미가 없다 — 로컬 스택에는 imgproxy가 포함돼 변환이 동작하기 때문이다.

앱을 띄워 캘린더 화면에서 네트워크 응답 크기를 본다. 124px 썸네일 자리에 수백 KB가 내려오면 변환이 무시되고 있는 것이다.

- [ ] **Step 2: 결과 기록**

변환이 무시되고 있다면 스펙 "핵심 발견" 절의 해당 문단을 확인 결과로 갱신한다. 동작 중이라면 그 문단을 삭제한다. 어느 쪽이든 이 계획의 나머지 태스크는 바뀌지 않는다.

---

## Task 1: `postFrameRatio` — 프레임 비율 클램프 순수 함수

지금 `PostCard.tsx:55`에 인라인으로 박힌 클램프 식을 `lib/`로 꺼낸다. 업로드 크롭 프레임(Task 5)과 피드 표시가 **같은 함수**를 써야 "올릴 때 본 그대로" 보인다.

**Files:**
- Modify: `src/lib/posts.ts` (파일 끝에 추가)
- Modify: `src/components/feed/PostCard.tsx:53-55`
- Test: `src/lib/__tests__/posts.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `postFrameRatio(width: number | null | undefined, height: number | null | undefined): number` — 프레임의 세로/가로 비율. 0.5625 ~ 1.25로 클램프. width/height가 없거나 0 이하면 1(정사각)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/__tests__/posts.test.ts`가 이미 있으면 아래 `describe` 블록을 추가하고, 없으면 파일을 만든다. import 줄은 기존 파일의 형태에 맞춘다.

```ts
import { postFrameRatio } from '../posts';

describe('postFrameRatio', () => {
  it('범위 안의 비율은 그대로 쓴다 — 3:4 폰 사진', () => {
    // 3000x4000 → 4/3 = 1.333… 은 1.25를 넘으므로 잘린다
    expect(postFrameRatio(3000, 4000)).toBeCloseTo(1.25);
    // 4:5 는 경계값 그대로
    expect(postFrameRatio(1080, 1350)).toBeCloseTo(1.25);
    // 정사각
    expect(postFrameRatio(1000, 1000)).toBeCloseTo(1);
  });

  it('세로로 너무 긴 사진은 4:5(1.25)에서 멈춘다', () => {
    expect(postFrameRatio(1080, 1920)).toBeCloseTo(1.25);
  });

  it('가로로 너무 넓은 사진은 16:9(0.5625)에서 멈춘다', () => {
    expect(postFrameRatio(4000, 1000)).toBeCloseTo(0.5625);
    expect(postFrameRatio(1920, 1080)).toBeCloseTo(0.5625);
  });

  it('크기를 모르면 정사각으로 본다', () => {
    expect(postFrameRatio(null, null)).toBe(1);
    expect(postFrameRatio(undefined, undefined)).toBe(1);
    expect(postFrameRatio(0, 0)).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx jest src/lib/__tests__/posts.test.ts -t postFrameRatio`
Expected: FAIL — `postFrameRatio is not a function` (또는 import 실패)

- [ ] **Step 3: 최소 구현**

`src/lib/posts.ts` 끝에 추가한다.

```ts
/** 피드 사진 프레임의 세로/가로 비율 범위 — 인스타 규격 (가로 16:9 ~ 세로 4:5) */
export const POST_FRAME_MIN_RATIO = 0.5625;
export const POST_FRAME_MAX_RATIO = 1.25;

/**
 * 사진 비율을 따르되 범위를 제한한 프레임 비율(세로/가로).
 * 업로드 크롭 프레임과 피드 표시가 같은 값을 써야 "올릴 때 본 그대로" 보인다.
 */
export function postFrameRatio(
  width: number | null | undefined,
  height: number | null | undefined,
): number {
  if (!width || !height || width <= 0 || height <= 0) return 1;
  const ratio = height / width;
  return Math.min(POST_FRAME_MAX_RATIO, Math.max(POST_FRAME_MIN_RATIO, ratio));
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest src/lib/__tests__/posts.test.ts -t postFrameRatio`
Expected: PASS (4 tests)

- [ ] **Step 5: `PostCard.tsx`가 이 함수를 쓰게 바꾼다**

`src/components/feed/PostCard.tsx:53-55`를 교체한다.

바꾸기 전:
```tsx
  const first = post.photos[0];
  const ratio = first?.width && first?.height ? first.height / first.width : 1;
  const carouselH = Math.round(width * Math.min(1.25, Math.max(0.5625, ratio)));
```

바꾼 뒤:
```tsx
  const first = post.photos[0];
  const carouselH = Math.round(width * postFrameRatio(first?.width, first?.height));
```

파일 상단 import에 추가한다 (기존 `@/lib/...` import 줄 근처):
```tsx
import { postFrameRatio } from '@/lib/posts';
```

- [ ] **Step 6: 전체 검증**

Run: `npm run typecheck && npm test`
Expected: 둘 다 통과. 기존 테스트 152개 + 신규 4개

- [ ] **Step 7: 커밋**

```bash
git add src/lib/posts.ts src/lib/__tests__/posts.test.ts src/components/feed/PostCard.tsx
git commit -m "refactor(feed): 프레임 비율 클램프를 postFrameRatio로 추출

업로드 크롭 프레임(후속)과 피드 표시가 같은 식을 써야 하므로 PostCard에
인라인으로 있던 클램프를 lib/posts.ts의 순수 함수로 꺼낸다."
```

---

## Task 2: 마이그레이션 — 렌디션 플래그 · couple_id · 쿼터

**Files:**
- Create: `supabase/migrations/20260804000001_photo_renditions_quota.sql`
- Modify: `src/types/database.types.ts` (재생성)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `photos.renditions boolean not null default false` — true면 `_360` 파일이 존재
  - `photos.couple_id uuid not null references public.couples(id) on delete cascade`
  - `couples.plan text not null default 'free'`
  - `couples.photo_quota integer not null default 100`
  - `before insert on photos` 트리거가 쿼터 초과 시 `errcode 'P0001'`, 메시지 `사진 보관 한도에 도달했어요`로 예외

- [ ] **Step 1: 마이그레이션 파일 작성**

`supabase/migrations/20260804000001_photo_renditions_quota.sql`:

```sql
-- 온디바이스 렌디션 전환 + 커플당 사진 쿼터
-- 서버 이미지 변환(Pro 무료분 100장)을 쓰지 않기 위해 업로드 시 1080/360 두 파일을 올린다.
-- 기존 사진은 _360 파일이 없으므로 renditions=false로 남겨 기존 변환 방식으로 폴백한다.

alter table public.photos
  add column renditions boolean not null default false;

-- 쿼터를 커플 단위로 세려면 couple_id가 필요하다. 지금은 storage_path 접두사에만 있다.
alter table public.photos
  add column couple_id uuid references public.couples (id) on delete cascade;

update public.photos
  set couple_id = split_part(storage_path, '/', 1)::uuid
  where couple_id is null;

alter table public.photos
  alter column couple_id set not null;

create index photos_couple_idx on public.photos (couple_id);

-- 요금제와 한도는 커플에 귀속된다 — 스토어 결제는 개인 단위지만 혜택은 두 사람이 함께 받는다.
-- 결제 연동 시 코드 변경 없이 이 값만 바꾸면 된다.
alter table public.couples
  add column plan text not null default 'free',
  add column photo_quota integer not null default 100;

create or replace function public.enforce_photo_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
  allowed integer;
begin
  select photo_quota into allowed from public.couples where id = new.couple_id;
  if allowed is null then
    return new;
  end if;
  select count(*) into used from public.photos where couple_id = new.couple_id;
  if used >= allowed then
    raise exception '사진 보관 한도에 도달했어요' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger photos_quota_check
  before insert on public.photos
  for each row execute function public.enforce_photo_quota();
```

- [ ] **Step 2: 로컬에 적용해 스키마가 올라가는지 확인**

Run: `npx supabase db reset`
Expected: 에러 없이 모든 마이그레이션 적용 완료

- [ ] **Step 3: 쿼터 트리거가 실제로 막는지 확인**

로컬 DB에서 확인한다. 테스트용 커플의 `photo_quota`를 1로 낮추고 사진 2건을 넣어본다.

Run:
```bash
npx supabase db reset
psql "$(npx supabase status -o json | python -c 'import json,sys;print(json.load(sys.stdin)["DB_URL"])')" -c "
  update couples set photo_quota = 0;
  insert into photos (track_id, uploader_id, storage_path, couple_id)
    select t.id, cm.user_id, 'x/y/z.jpg', t.couple_id
    from tracks t join couple_members cm on cm.couple_id = t.couple_id limit 1;
"
```
Expected: `ERROR: 사진 보관 한도에 도달했어요`

psql이 없으면 Supabase Studio(`http://127.0.0.1:54323`)의 SQL Editor에서 같은 SQL을 실행한다.

- [ ] **Step 4: 원격 적용 + 타입 재생성**

Run:
```bash
npx supabase db push
npx supabase gen types typescript --local > src/types/database.types.ts
```
Expected: `database.types.ts`에 `renditions`·`couple_id`·`plan`·`photo_quota`가 나타난다

- [ ] **Step 5: 타입 검사**

Run: `npm run typecheck`
Expected: 통과. `photos` insert에 `couple_id`가 빠져 에러가 나면 Task 3에서 채우므로, 이 시점에 에러가 있다면 그대로 두지 말고 Task 3을 먼저 끝낸 뒤 함께 커밋한다.

- [ ] **Step 6: 커밋** (Task 3과 함께 커밋해도 된다 — 타입 에러가 남으면 그렇게 한다)

```bash
git add supabase/migrations/20260804000001_photo_renditions_quota.sql src/types/database.types.ts
git commit -m "feat(photos): 렌디션 플래그·couple_id·커플당 사진 쿼터 마이그레이션

온디바이스 렌디션 전환 준비. 쿼터는 couples.photo_quota를 읽는 트리거라
결제 연동 시 컬럼 값만 바꾸면 된다. 무료 기본값 100장."
```

---

## Task 3: 업로드 파이프라인 — 1080 본체 + 360 목록

**Files:**
- Modify: `src/api/photos.ts` (`THUMB`, `transformFor`, `signedThumbUrl`, `originalUrl`, `resizeForUpload`, `uploadPhotos`)
- Modify: `src/api/tracks.ts:48` (`'calendar'` → `'grid'`)
- Modify: `src/app/track/[id]/player.tsx:37` (`originalUrl` → 본체 경로)

**Interfaces:**
- Consumes: `photos.renditions`, `photos.couple_id` (Task 2)
- Produces:
  - `signedThumbUrl(storagePath: string, kind: 'feed' | 'grid', renditions?: boolean): Promise<string>` — `renditions`가 true면 경로 방식, false/생략이면 기존 transform 폴백
  - `RENDITION = { feed: { width: 1080, compress: 0.8 }, grid: { width: 360, compress: 0.7 } }`
  - `uploadPhotos`는 파일 2개를 올리고 `renditions: true`, `couple_id`를 채워 insert

- [ ] **Step 1: `THUMB`을 `RENDITION` 2종으로 교체**

`src/api/photos.ts:8-26`의 `THUMB`·`transformFor`를 아래로 교체한다. `calendar`는 사라진다.

```ts
/**
 * 렌디션 2종 — 업로드할 때 기기에서 만들어 함께 올린다.
 * 서버 이미지 변환(Pro 무료분 원본 100장)을 쓰지 않기 위한 구조다.
 * 본체(feed)가 곧 최대본 — 2048px "원본" 계층은 폐기했다.
 */
export const RENDITION = {
  feed: { width: 1080, compress: 0.8 },
  grid: { width: 360, compress: 0.7 },
} as const;

export type RenditionKind = keyof typeof RENDITION;

/** 목록 렌디션의 경로 — 본체가 `{uuid}.jpg`면 `{uuid}_360.jpg` */
export function renditionPath(storagePath: string, kind: RenditionKind): string {
  return kind === 'feed' ? storagePath : storagePath.replace(/\.jpg$/, '_360.jpg');
}
```

- [ ] **Step 2: `signedThumbUrl`을 경로 방식 + 폴백으로 교체**

`src/api/photos.ts`의 기존 `signedThumbUrl`·`originalUrl`을 아래로 교체한다.

```ts
/**
 * 렌디션 서명 URL — photos 버킷이 비공개라 public URL은 401로 떨어진다.
 * renditions=true(신규 업로드)는 미리 구운 파일 경로를 그대로 서명한다.
 * false(기존 사진)는 _360 파일이 없으므로 기존 서버 변환으로 폴백한다 — Pro에서만 동작하며,
 * 대상이 소수라 무료분 안이다.
 */
export async function signedThumbUrl(
  storagePath: string,
  kind: RenditionKind,
  renditions = false,
): Promise<string> {
  const path = renditions ? renditionPath(storagePath, kind) : storagePath;
  const options = renditions
    ? undefined
    : { transform: { width: RENDITION[kind].width, quality: kind === 'feed' ? 72 : 70 } };
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, 60 * 60, options);
  if (error) throw error;
  return data.signedUrl;
}
```

`originalUrl`은 삭제한다 — 본체(`feed`)가 최대본이다.

- [ ] **Step 3: `resizeForUpload`를 렌디션 2종 생성으로 교체**

`src/api/photos.ts:125-137`의 `resizeForUpload`를 교체한다.

```ts
/** 업로드용 렌디션 하나 만들기 — 장변을 width로 제한(원본이 작으면 그대로) */
async function renderRendition(photo: PickedPhoto, kind: RenditionKind) {
  const { width, compress } = RENDITION[kind];
  const landscape = photo.width >= photo.height;
  const ctx = ImageManipulator.ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > width) {
    ctx.resize(landscape ? { width } : { height: width });
  }
  const rendered = await ctx.renderAsync();
  return rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress });
}
```

- [ ] **Step 4: `uploadPhotos`가 파일 2개를 올리게 바꾼다**

`src/api/photos.ts:182-220`의 `for` 루프 본문을 교체한다. 함수 시그니처는 그대로다.

```ts
  const ids: string[] = [];
  for (const photo of photos) {
    const path = `${coupleId}/${parentId}/${Crypto.randomUUID()}.jpg`;
    const main = await renderRendition(photo, 'feed');
    const small = await renderRendition(photo, 'grid');

    for (const [p, out] of [
      [path, main],
      [renditionPath(path, 'grid'), small],
    ] as const) {
      const body = await (await fetch(out.uri)).arrayBuffer();
      const { error: upError } = await supabase.storage
        .from('photos')
        .upload(p, body, { contentType: 'image/jpeg' });
      if (upError) throw upError;
    }

    const { data: row, error: rowError } = await supabase
      .from('photos')
      .insert({
        track_id: parent.trackId ?? null,
        post_id: parent.postId ?? null,
        story_id: parent.storyId ?? null,
        uploader_id: uid,
        couple_id: coupleId,
        storage_path: path,
        renditions: true,
        width: main.width,
        height: main.height,
        taken_at: photo.takenAt,
      })
      .select('id')
      .single();
    if (rowError) throw rowError;
    ids.push(row.id);
  }
  return ids;
```

- [ ] **Step 5: 호출부를 고친다 — `renditions` 전달**

`signedThumbUrl` 호출부 전부에 `renditions` 인자를 넘긴다. 각 쿼리의 select에 `renditions` 컬럼을 추가해야 한다.

수정 대상 (`storagePath`와 함께 `renditions`를 select·전달):
- `src/api/posts.ts:71` `signedThumbUrl(p.storage_path, 'feed', p.renditions)`
- `src/api/posts.ts:76` `signedThumbUrl(sortedPhotos[0].storage_path, 'grid', sortedPhotos[0].renditions)`
- `src/api/stories.ts:92` `'feed'`, `:93` `'grid'`
- `src/api/tracks.ts:87`, `:196`, `:211` — `'grid'`
- `src/api/playlists.ts:156`, `:238` — `'grid'`
- `src/api/tracks.ts:48` — **`'calendar'`를 `'grid'`로 바꾼다** (124 렌디션 폐기)

각 파일의 Supabase select 문자열에 `renditions`를 추가한다. 예: `tracks.ts:170`의
`photos!photos_track_id_fkey(id, storage_path, uploader_id, taken_at, created_at, width, height)`
→ 끝에 `, renditions` 추가.

- [ ] **Step 6: `player.tsx`가 본체를 쓰게 바꾼다**

`src/app/track/[id]/player.tsx:7`의 `originalUrl` import를 `signedThumbUrl`로 바꾸고, `:37`을
`signedThumbUrl(current.storagePath, 'feed', current.renditions)`로 교체한다.
`current`에 `renditions`가 없으면 `tracks.ts`의 매핑에 추가한다.

- [ ] **Step 7: 타입 검사 + 테스트**

Run: `npm run typecheck && npm test`
Expected: 둘 다 통과. `originalUrl`을 아직 쓰는 곳이 남아 있으면 타입 에러로 잡힌다

- [ ] **Step 8: 실제 업로드 확인**

앱을 띄워 게시물에 사진 1장을 올린다. Supabase Studio의 Storage에서 `{uuid}.jpg`와 `{uuid}_360.jpg` 두 파일이 생겼는지, `photos` 행의 `renditions`가 `true`이고 `couple_id`가 채워졌는지 확인한다. 피드·그리드·캘린더가 정상 렌더되는지도 본다.

- [ ] **Step 9: 커밋**

```bash
git add src/api/photos.ts src/api/posts.ts src/api/stories.ts src/api/tracks.ts src/api/playlists.ts src/app/track/[id]/player.tsx
git commit -m "feat(photos): 서버 이미지 변환을 온디바이스 렌디션으로 교체

업로드 시 1080(본체)/360(목록) 두 파일을 만들어 함께 올린다. 조회는
transform 없이 경로만 서명 — Pro 무료분 100장 제한을 피한다. 보관 최대본이
1080이 되면서 originalUrl과 124(캘린더) 렌디션은 폐기, 캘린더는 360을 쓴다.
기존 사진은 renditions=false로 기존 변환에 폴백한다."
```

---

## Task 4: 삭제 시 렌디션 동반 제거

렌디션이 생겼으므로 삭제할 때 `_360`도 지워야 한다. 누락하면 지운 사진의 파일이 스토리지에 영구히 남는다.

**Files:**
- Modify: `src/api/photos.ts` (`useDeletePhoto`, 헬퍼 추가)
- Modify: `src/api/posts.ts:137` (`useDeletePost`)
- Modify: `src/api/stories.ts:181` (`useDeleteStory`)

**Interfaces:**
- Consumes: `renditionPath` (Task 3)
- Produces: `storagePathsFor(photo: { storagePath: string; renditions: boolean }): string[]` — 지워야 할 경로 전부

- [ ] **Step 1: 헬퍼 추가**

`src/api/photos.ts`의 `renditionPath` 바로 아래에 추가한다.

```ts
/**
 * 사진 하나가 스토리지에 실제로 차지하는 경로 전부.
 * 삭제할 때 이걸 안 쓰면 _360이 고아 파일로 남는다.
 */
export function storagePathsFor(photo: {
  storagePath: string;
  renditions: boolean;
}): string[] {
  return photo.renditions
    ? [photo.storagePath, renditionPath(photo.storagePath, 'grid')]
    : [photo.storagePath];
}
```

- [ ] **Step 2: `useDeletePhoto` 수정**

`src/api/photos.ts`의 `useDeletePhoto`에서 `mutationFn` 인자 타입과 remove 호출을 바꾼다.

바꾸기 전:
```ts
    mutationFn: async (photo: { id: string; storagePath: string }) => {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from('photos').remove([photo.storagePath]);
    },
```

바꾼 뒤:
```ts
    mutationFn: async (photo: { id: string; storagePath: string; renditions: boolean }) => {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      await supabase.storage.from('photos').remove(storagePathsFor(photo));
    },
```

- [ ] **Step 3: `useDeletePost` 수정**

`src/api/posts.ts:137`:

바꾸기 전:
```ts
        await supabase.storage.from('photos').remove(post.photos.map((p) => p.storagePath));
```

바꾼 뒤:
```ts
        await supabase.storage
          .from('photos')
          .remove(post.photos.flatMap((p) => storagePathsFor(p)));
```

`PostPhoto` 타입에 `renditions: boolean`이 있어야 한다 — 없으면 추가하고 select·매핑도 채운다.
`storagePathsFor`를 `@/api/photos`에서 import한다.

- [ ] **Step 4: `useDeleteStory` 수정**

`src/api/stories.ts:181`:

```ts
      if (story.photo) {
        await supabase.storage.from('photos').remove(storagePathsFor(story.photo));
      }
```

`StoryPhoto` 타입에 `renditions: boolean`을 추가하고 select·매핑을 채운다.

- [ ] **Step 5: 타입 검사 + 테스트**

Run: `npm run typecheck && npm test`
Expected: 둘 다 통과. 호출부에서 `renditions`를 안 넘기면 타입 에러로 잡힌다

- [ ] **Step 6: 삭제 동작 확인**

앱에서 사진이 있는 게시물을 하나 올렸다가 삭제한다. Supabase Studio의 Storage에서 `{uuid}.jpg`와 `{uuid}_360.jpg`가 **둘 다** 사라졌는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add src/api/photos.ts src/api/posts.ts src/api/stories.ts
git commit -m "fix(photos): 삭제 시 360 렌디션도 함께 제거

본체만 지우면 _360이 스토리지에 고아 파일로 영구히 남는다.
storagePathsFor로 지울 경로를 한곳에서 만든다."
```

---

## Task 5: 게시물 업로드 크롭 UI

스토리 편집기의 `StoryCanvas`(핀치줌·팬·경계 보정)와 `cropToCanvas`(원본 크롭)를 프레임 크기만 바꿔 재사용한다. 새 제스처 코드는 작성하지 않는다.

**Files:**
- Create: `src/app/modals/crop-photo.tsx`
- Modify: `src/app/modals/_layout.tsx` (라우트 등록 — 기존 모달 등록 형태를 따른다)
- Modify: `src/app/modals/create-post.tsx` (썸네일 탭 → 크롭)

**Interfaces:**
- Consumes: `postFrameRatio` (Task 1), `StoryCanvas`·`CanvasTransform` (`@/components/story/StoryCanvas`), `cropToCanvas` (`@/api/photos`)
- Produces: 없음 (화면)

- [ ] **Step 1: 크롭 모달 작성**

`src/app/modals/crop-photo.tsx`. 고른 사진 하나를 클램프된 프레임에 띄우고, 확인하면 잘린 `PickedPhoto`를 돌려준다. 화면 간 전달은 라우터 params로 URI를 넘기기 어려우므로 **Zustand 임시 스토어 대신 `create-post`가 상태를 들고 모달을 인라인으로 띄우는 방식**을 쓴다 — 즉 별도 라우트가 아니라 `create-post` 안의 전체화면 오버레이로 만든다. 파일은 컴포넌트로 만들고 `create-post`가 조건부 렌더한다.

`src/components/feed/PostCropSheet.tsx`로 만든다 (props-only, `app/modals/`가 아니다):

```tsx
import { useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { color, space, typeface } from '@/theme/tokens';
import { StoryCanvas, type CanvasTransform } from '@/components/story/StoryCanvas';
import { postFrameRatio } from '@/lib/posts';

type Photo = { uri: string; width: number; height: number };

type Props = {
  photo: Photo | null;
  onCancel: () => void;
  onConfirm: (t: CanvasTransform) => void;
};

/**
 * 게시물 사진의 구도 잡기 — 프레임은 사진 비율을 따르되 인스타 범위로 제한된다.
 * minScale=1이라 항상 프레임을 꽉 채운다 (스토리와 달리 여백을 허용하지 않는다).
 */
export function PostCropSheet({ photo, onCancel, onConfirm }: Props) {
  const { width } = useWindowDimensions();
  const [transform, setTransform] = useState<CanvasTransform>({ scale: 1, tx: 0, ty: 0 });

  if (!photo) return null;
  const frameH = Math.round(width * postFrameRatio(photo.width, photo.height));

  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <StoryCanvas
            uri={photo.uri}
            photoWidth={photo.width}
            photoHeight={photo.height}
            width={width}
            height={frameH}
            minScale={1}
            onChange={setTransform}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: space[4],
            gap: space[3],
          }}
        >
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={{ fontFamily: typeface, fontSize: 16, color: color.textMuted }}>취소</Text>
          </Pressable>
          <Pressable onPress={() => onConfirm(transform)} hitSlop={8}>
            <Text style={{ fontFamily: typeface, fontSize: 16, color: color.accent }}>완료</Text>
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
```

`color.textMuted`·`color.accent`가 토큰에 없으면 `src/theme/tokens.ts`에서 실제 이름을 확인해 맞춘다 — **hex를 쓰지 않는다.**

- [ ] **Step 2: `create-post`에서 썸네일 탭 → 크롭**

`src/app/modals/create-post.tsx`를 수정한다. `photos.map` 안의 `<Image>`를 `Pressable`로 감싸 탭하면 크롭을 연다.

상단에 추가:
```tsx
import { PostCropSheet } from '@/components/feed/PostCropSheet';
import { cropToCanvas, pickPhotos, type PickedPhoto } from '@/api/photos';
import type { CanvasTransform } from '@/components/story/StoryCanvas';
```

상태 추가 (`const [saving, setSaving] = useState(false);` 아래):
```tsx
  const [cropping, setCropping] = useState<PickedPhoto | null>(null);
```

`react-native` import에 `useWindowDimensions`를 추가하고 컴포넌트 상단에 선언한다:
```tsx
  const { width: screenW } = useWindowDimensions();
```

크롭 확정 핸들러 (`onPick` 아래). 캔버스 크기는 `PostCropSheet`이 쓴 값과 **정확히 같아야** 크롭 좌표가 맞는다:
```tsx
  const applyCrop = async (t: CanvasTransform) => {
    const target = cropping;
    setCropping(null);
    if (!target) return;
    const cropped = await cropToCanvas(target, {
      canvasWidth: screenW,
      canvasHeight: Math.round(screenW * postFrameRatio(target.width, target.height)),
      scale: t.scale,
      tx: t.tx,
      ty: t.ty,
    });
    setPhotos((prev) => prev.map((p) => (p.uri === target.uri ? cropped : p)));
  };
```

`<Image>`를 감싸는 부분 (`create-post.tsx:52-56`):
```tsx
              <Pressable onPress={() => setCropping(p)}>
                <Image
                  source={{ uri: p.uri }}
                  style={{ width: 88, height: 88, borderRadius: radius.coverSm }}
                  contentFit="cover"
                />
              </Pressable>
```

`ScrollView` 닫는 태그 뒤, 최상위 `View` 안에 추가:
```tsx
      <PostCropSheet
        photo={cropping}
        onCancel={() => setCropping(null)}
        onConfirm={applyCrop}
      />
```

- [ ] **Step 3: 타입 검사 + 테스트**

Run: `npm run typecheck && npm test`
Expected: 둘 다 통과

- [ ] **Step 4: 동작 확인**

앱에서 게시물 작성 → 세로로 긴 사진 선택 → 썸네일 탭 → 핀치로 확대하고 끌어서 구도 조정 → 완료 → 저장. 피드에 뜬 사진이 **크롭 화면에서 본 구도와 같은지** 확인한다. 손대지 않고 바로 저장한 경우 중앙 크롭이 되는지도 본다.

- [ ] **Step 5: 커밋**

```bash
git add src/components/feed/PostCropSheet.tsx src/app/modals/create-post.tsx
git commit -m "feat(feed): 게시물 업로드에 크롭 UI — 핀치줌·팬

스토리 편집기의 StoryCanvas와 cropToCanvas를 프레임 크기만 바꿔 재사용한다.
프레임 비율은 postFrameRatio라 피드 표시와 정확히 일치한다.
손대지 않으면 중앙 크롭이 기본값."
```

---

## Task 6: 쿼터 잔량 표시와 차단 안내

**Files:**
- Modify: `src/api/couple.ts` (잔량 조회 훅 추가)
- Modify: `src/app/modals/create-post.tsx` (잔량 표시 + 초과 시 안내)

**Interfaces:**
- Consumes: `couples.photo_quota` (Task 2)
- Produces: `usePhotoQuota(): UseQueryResult<{ used: number; quota: number; full: boolean }>`

- [ ] **Step 1: 잔량 조회 훅 추가**

`src/api/couple.ts` 끝에 추가한다. 기존 훅들의 `queryKey`·에러 처리 형태를 따른다.

```ts
/** 커플의 사진 사용량 — 업로드 화면에서 잔량을 보여주고 한도에서 막는다 */
export function usePhotoQuota() {
  const couple = useMyCouple();
  const coupleId = couple.data?.coupleId;
  return useQuery({
    queryKey: ['photoQuota', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const [{ data: row, error: rowError }, { count, error: countError }] = await Promise.all([
        supabase.from('couples').select('photo_quota').eq('id', coupleId!).single(),
        supabase
          .from('photos')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', coupleId!),
      ]);
      if (rowError) throw rowError;
      if (countError) throw countError;
      const used = count ?? 0;
      const quota = row.photo_quota;
      return { used, quota, full: used >= quota };
    },
  });
}
```

- [ ] **Step 2: `create-post`에 잔량 표시**

`src/app/modals/create-post.tsx`에서 훅을 부르고 사진 선택 영역 위에 표시한다.

```tsx
  const quota = usePhotoQuota();
```

`ScrollView` 안, 사진 목록 위에:
```tsx
        {quota.data && (
          <Text style={{ fontFamily: typeface, fontSize: 12, color: color.textMuted }}>
            {quota.data.full
              ? '공간이 가득 찼어요. 곧 더 많은 공간을 제공할 예정이에요'
              : `사진 ${quota.data.used} / ${quota.data.quota}장`}
          </Text>
        )}
```

- [ ] **Step 3: 한도 도달 시 사진 추가 막기**

`onPick` 맨 앞에 추가한다:
```tsx
    if (quota.data?.full) {
      Alert.alert('공간이 가득 찼어요', '곧 더 많은 공간을 제공할 예정이에요');
      return;
    }
```

`save`의 `catch`에서 트리거 예외 메시지를 그대로 보여준다 — 이미 `e.message`를 쓰고 있으므로
`사진 보관 한도에 도달했어요`가 그대로 뜬다. 추가 작업 없음.

- [ ] **Step 4: 업로드 성공 시 잔량 갱신**

`src/api/posts.ts`의 `useCreatePost` `onSuccess`에 추가한다:
```ts
      qc.invalidateQueries({ queryKey: ['photoQuota'] });
```

`src/api/photos.ts`의 `useUploadPhotos`, `src/api/stories.ts`의 스토리 생성 훅, `useDeletePost`·`useDeleteStory`·`useDeletePhoto`의 `onSuccess`에도 같은 줄을 추가한다.

- [ ] **Step 5: 타입 검사 + 테스트**

Run: `npm run typecheck && npm test`
Expected: 둘 다 통과

- [ ] **Step 6: 동작 확인**

로컬 DB에서 `update couples set photo_quota = 2;` 후 앱에서 사진 3장을 올려본다.
잔량 표시가 맞는지, 한도에서 막히는지, **기존 사진은 여전히 피드·캘린더·앨범에서 잘 보이는지** 확인한다. 확인 후 `update couples set photo_quota = 100;`으로 되돌린다.

- [ ] **Step 7: 커밋**

```bash
git add src/api/couple.ts src/api/posts.ts src/api/photos.ts src/api/stories.ts src/app/modals/create-post.tsx
git commit -m "feat(photos): 쿼터 잔량 표시와 한도 안내

업로드 화면에 '사진 62 / 100장'을 띄우고 한도에서 새 업로드만 막는다.
기존 사진은 지우지 않고 열람도 계속 된다."
```

---

## Task 7: 마무리 검증

**Files:**
- Modify: `CLAUDE.md` (구조 메모에 렌디션 규칙 한 줄)

- [ ] **Step 1: 서버 변환 잔재 확인**

Run: `grep -rn "transform" src/api/`
Expected: `signedThumbUrl`의 폴백 분기 한 곳에만 나타난다. 다른 곳에 남아 있으면 제거한다

- [ ] **Step 2: `originalUrl` 잔재 확인**

Run: `grep -rn "originalUrl\|'calendar'" src/`
Expected: 결과 없음 (`CoupleTabBar.tsx`의 탭 이름 `'calendar'`는 무관하므로 제외)

- [ ] **Step 3: 전체 검증**

Run: `npm run typecheck && npm test`
Expected: 둘 다 통과

- [ ] **Step 4: `CLAUDE.md` 구조 메모에 추가**

"## 구조 메모" 절 끝에 추가한다:

```markdown
- **사진은 렌디션 2종**: 업로드 시 기기에서 1080(본체)·360(목록)을 만들어 함께 올린다
  (`api/photos.ts` `RENDITION`). 서버 이미지 변환은 Pro 무료분이 원본 100장뿐이라 쓰지 않는다 —
  `renditions=false`인 옛 사진만 폴백한다. 삭제는 반드시 `storagePathsFor()` 경유(고아 파일 방지).
  커플당 사진 쿼터는 `couples.photo_quota`(무료 100장)를 읽는 `photos` insert 트리거가 강제
```

- [ ] **Step 5: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: 사진 렌디션·쿼터 규칙을 구조 메모에 추가"
```

- [ ] **Step 6: push**

```bash
git push
```

---

## 배포 시점에 할 수동 작업 (코드 아님 — 이 계획에는 없다)

- **Supabase Pro 전환 + Spend Cap ON 확인** — Pro는 Spend Cap이 기본 ON이지만 대시보드에서
  직접 확인한다. 이게 요금 상한의 유일한 하드 보장이다
- **사용량 알림** — 70%/90% 알림 이메일 수신 설정
- **무료 한도 사전 고지** — 스토어 소개와 온보딩에 "무료 사진 N장"을 명시. 나중에 알게 되는
  조건이면 별점 리스크가 커진다
- **베타 실측** — `select couple_id, date_trunc('month', created_at), count(*) from photos
  group by 1, 2`로 커플당 월 업로드 장수를 보고 출시 전 `couples.photo_quota` 기본값을 확정

## 이 계획에 없는 것 (스펙의 "범위 밖")

- 결제·구독 구현 (스토어 IAP, 영수증 검증, 요금제 화면)
- 커플 해체·환불 시 권한 처리
- 스토리 만료 삭제 (영구 보관 유지)
- 기존 사진 렌디션 백필 (폴백으로 처리)
- 무료 한도 최종 확정 — 베타 실측 후 `couples.photo_quota` 기본값만 변경
