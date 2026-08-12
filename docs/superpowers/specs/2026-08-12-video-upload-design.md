# 스토리·피드 동영상 업로드 + 바이트 쿼터 전환

작성일: 2026-08-12

선행 문서: `2026-08-04-photo-pipeline-cost-design.md` (렌디션 2종·서버 이미지 변환 폐기·장수 쿼터).
이 문서는 그 쿼터를 **바이트 총량으로 대체**하므로, 충돌하는 항목은 이 문서가 최신이다.

## Context

지금 도돌이는 사진만 올릴 수 있다. 용량 걱정 때문에 동영상을 미뤄뒀지만, 테스트 사용자가 둘뿐인 지금은 부담이 없고, 서비스화 시에는 **커플당 무료 용량 → 초과 시 업로드 차단 → 구독 유도**라는 비즈니스 모델의 축으로 쓸 수 있다.

현재 쿼터는 `couples.photo_quota = 100`(장수) 카운트다. **영상 1개(15초 720p ≈ 5MB) = 사진 27장**이라 장수로는 셀 수 없다. 그래서 이번 작업은 두 가지가 한 몸이다:

1. 스토리·피드 게시물에 동영상 업로드·재생 추가
2. 쿼터를 장수 → **바이트 총량**으로 전환 (`couples.storage_quota_bytes`, 기본 200MB)

기존 설계 문서 `docs/superpowers/specs/2026-08-04-photo-pipeline-cost-design.md`의 결론(비용은 병목이 아니고 쿼터는 결제 유도 지점이다)은 영상을 넣어도 유효하다. 5만 쌍 기준 커플당 월 원가 약 6원, 손익분기 전환율 0.3%.

### 확정된 결정

| # | 결정 |
|---|---|
| 1 | 적용 범위 = **스토리 + 피드 게시물**. 트랙(앨범) 사진은 제외 |
| 2 | 길이 상한 **15초**. 초과하면 선택 시점에 거부 + 안내 (트리밍 UI 없음) |
| 3 | 업로드 전 기기에서 **720p 압축** (`react-native-compressor`) |
| 4 | 쿼터 = 바이트 총량. `couples.storage_quota_bytes` 기본 **200MB** (사진 1,080장 또는 영상 40개) |
| 5 | 스토리 영상은 **크롭·줌 편집 없음** — 9:16 프레임에 `contentFit="cover"`. 텍스트 오버레이는 유지 |
| 6 | 게시물 영상 개수 **제한 없음**(10칸 전부 가능). 대신 업로드 전 "영상 N개 · 약 X MB · 남은 공간의 Y%" 경고 + 진행률 + 취소 |
| 7 | 웹(PWA)도 업로드 허용 — 압축 없이 원본 크기 상한(45MB)만 검사 |
| 8 | 게시물 영상은 **탭해서 재생**. 자동재생은 이번 범위 밖 |

### 조사로 확인한 사실 (구현 전 정정 완료)

- **`expo-video-thumbnails`는 SDK 56에서 제거됐다.** `expo-video`의 `player.generateThumbnailsAsync(times)`를 쓴다. 반환값 `VideoThumbnail`은 `SharedRef<'image'>`이고 `ImageManipulator.manipulate()`가 이를 직접 받으므로, **기존 `renderRendition`이 입력 타입만 넓히면 포스터를 그대로 처리**한다.
- **`react-native-compressor`는 New Architecture(TurboModule)를 지원**하고 Expo config plugin(`"plugins": ["react-native-compressor"]`)을 제공한다. RN 0.86 조합은 미검증이라 **0단계 스파이크로 먼저 확인**한다.
- **`expo-video`는 디스크 캐시를 내장한다** (`useCaching: true`, LRU 기본 1GB). 재시청 egress가 0이므로 egress는 병목이 아니다.
- **먼저 닿는 한계는 Supabase Pro 포함 스토리지 100GB — 약 1,200쌍.** Spend Cap ON이면 그 시점에 앱 전체 미디어가 안 보인다. 이번 구현으로 푸는 문제가 아니라 **임계점**이므로, 1,000쌍 도달 전에 Spend Cap OFF + 사용량 알림으로 전환하거나 미디어를 R2($0.015/GB, egress $0)로 이전할지 결정한다. 모든 스토리지 접근이 `src/api/photos.ts` 한 곳을 지나므로 이전 비용은 낮다.

---

## 핵심 통찰 — 지렛대는 `renditionPath` 하나다

`src/api/tracks.ts`는 스토리 사진을 앨범에 합쳐 보여주고, 앨범 커버·캘린더·플레이리스트·장소 화면까지 전부 `signedThumbUrl(path, kind, renditions)` / `signedThumbUrls(photos, kind)`만 거친다.

따라서 **`renditionPath()`가 `.mp4` → 포스터 JPEG를 매핑하기만 하면, 그림이 필요한 모든 화면은 영상을 그냥 사진으로 본다.** `TrackCover`·`AlbumCarousel`·`MonthGrid`·`gallery`·`player`·`PlaceThumb` 등은 **0줄 수정**이다.

실제로 영상 분기가 필요한 곳은 `PostCard` · `PostGridCell` · `story/[id].tsx` · 두 작성 화면뿐이다.

---

## 1. `src/lib/media.ts` (신규) — 순수 함수를 lib으로 내린다

`renditionPath`·`storagePathsFor`는 이미 순수 문자열 함수인데 `api/photos.ts`에 있어 테스트 대상이 아니다. 규칙이 복잡해지는 김에 lib으로 옮긴다 (CLAUDE.md: "lib/은 순수 함수만, 유일한 테스트 대상").

```ts
export function isVideoPath(p: string): boolean { return p.endsWith('.mp4'); }

/** 영상은 본체가 mp4다 — 렌디션은 첫 프레임을 구운 포스터 JPEG */
export function renditionPath(storagePath: string, kind: 'feed' | 'grid'): string {
  if (isVideoPath(storagePath))
    return storagePath.replace(/\.mp4$/, kind === 'feed' ? '_poster.jpg' : '_360.jpg');
  return kind === 'feed' ? storagePath : storagePath.replace(/\.jpg$/, '_360.jpg');
}

export function storagePathsFor(photo: { storagePath: string; renditions: boolean }): string[] {
  if (isVideoPath(photo.storagePath))
    return [photo.storagePath, renditionPath(photo.storagePath, 'feed'), renditionPath(photo.storagePath, 'grid')];
  return photo.renditions ? [photo.storagePath, renditionPath(photo.storagePath, 'grid')] : [photo.storagePath];
}
```

lib은 api를 import할 수 없으므로 `'feed'|'grid'` 리터럴을 직접 쓴다.

같은 파일에 함께 둘 순수 함수:

| 함수 | 용도 |
|---|---|
| `VIDEO_MAX_MS = 15000` / `WEB_VIDEO_MAX_BYTES` | 상한 상수 |
| `formatBytes(n)` | `1.5MB` / `62MB` / `200MB` 표기 |
| `estimateVideoBytes(durationMs)` | 720p 2.5Mbps 기준 예상치 |
| `uploadEstimate(items, remainingBytes)` | `{ videoCount, bytes, percentOfRemaining }` → 경고 문구용 |

**결과: `signedThumbUrl`·`signedThumbUrls`·`photoSource`·`signCache`는 한 줄도 안 바뀐다.** 영상 행도 `renditions=true`라 baked 갈래를 타고 서명 대상이 포스터가 된다.

테스트 `src/lib/__tests__/media.test.ts` — jpg/mp4 왕복, 확장자 없는 레거시 경로, `renditions=false`, 바이트 경계값(1023/1024), 남은 공간 0일 때 나눗셈 방어, 15000ms 경계.

**수정할 import 3곳**: `src/api/posts.ts`, `src/api/stories.ts`, `src/api/tracks.ts`.

---

## 2. 마이그레이션 — `supabase/migrations/20260812000001_media_bytes_quota.sql`

```sql
alter table public.photos
  add column media text not null default 'photo' check (media in ('photo','video')),
  add column duration_ms integer,
  add column bytes bigint not null default 0;

-- 기존 행 백필: 실제 스토리지 객체 크기 합 (renditions=true면 본체+_360, false면 본체 하나)
update public.photos p
set bytes = coalesce((
  select sum((o.metadata->>'size')::bigint) from storage.objects o
  where o.bucket_id = 'photos' and o.name in (
    p.storage_path,
    case when p.renditions then regexp_replace(p.storage_path, '\.jpg$', '_360.jpg') end)
), 0);

alter table public.couples
  add column storage_quota_bytes bigint not null default 209715200;  -- 200MB
alter table public.couples drop column photo_quota;

drop trigger if exists photos_quota_check on public.photos;
drop function if exists public.enforce_photo_quota();

create or replace function public.enforce_storage_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare used bigint; allowed bigint;
begin
  select storage_quota_bytes into allowed from public.couples where id = new.couple_id;
  if allowed is null then return new; end if;
  select coalesce(sum(bytes), 0) into used from public.photos where couple_id = new.couple_id;
  if used + coalesce(new.bytes, 0) > allowed then
    raise exception '보관 공간이 가득 찼어요' using errcode = 'P0001';
  end if;
  return new;
end; $$;

create trigger photos_quota_check before insert on public.photos
  for each row execute function public.enforce_storage_quota();

/** 클라가 전 행을 받아오지 않도록 합계만 돌려준다 */
create or replace function public.storage_used_bytes()
returns bigint language sql stable security invoker set search_path = public as $$
  select coalesce(sum(bytes), 0) from public.photos where couple_id = public.my_couple_id();
$$;

update storage.buckets
set file_size_limit = 52428800, allowed_mime_types = array['image/jpeg','video/mp4']
where id = 'photos';
```

설계 근거:

- **삭제 시 감소는 자동** — 쿼터가 `sum(bytes)`라 행이 지워지면 그대로 준다. 별도 트리거 불필요.
- **`>=` → `used + new.bytes > allowed`** — 장수 시절엔 "한 장 남았으면 못 올림"이었지만 바이트는 정확히 계산해야 한다.
- **`media` 컬럼을 따로 두는 이유** — 확장자 문자열 검사에 표시 분기를 의존시키면 취약하고, `duration_ms`가 어차피 필요하다.
- **`duration_ms`** — 스토리 뷰어 진행바가 재생 전에 칸 길이를 알아야 튀지 않는다.
- **`bytes`는 mp4 + 포스터 + 360 합계**(사진이면 1080 + 360). 스토리지 실사용량과 쿼터가 1:1로 맞는다.
- **`photo_quota` 즉시 drop** — 읽는 곳이 `couple.ts:220` 하나뿐이고 CLAUDE.md 마일스톤상 TestFlight 배포 전이다. 만약 이미 폰에 배포된 빌드가 있다면 add만 하고 drop은 다음 릴리스로 미룬다.

이어서 `npx supabase gen types typescript --local > src/types/database.types.ts`.

---

## 3. `src/api/photos.ts` — 업로드 파이프라인

### 3.1 `PickedPhoto` 확장 (최소 침습)

union으로 쪼개지 않는다 — `cropToCanvas`·`uploadPhotos`·`postFrameRatioOf`·`isFramed`가 전부 이 타입을 통화로 쓰고 있어 시그니처가 연쇄로 번진다. **선택 필드 하나만 더한다.**

```ts
export interface PickedPhoto {
  uri: string;
  /** 영상이면 포스터 기준 크기 — 회전 메타데이터가 반영된 실제 표시 크기 */
  width: number;
  height: number;
  takenAt: string | null;
  video?: { posterUri: string; durationMs: number };  // 이게 판별자
}
```

**width/height를 포스터에서 얻는 이유(중요)**: iOS 세로 영상은 `ImagePicker` asset이 회전 변환 전 `1920×1080`을 주는 경우가 있다. 그대로 쓰면 `postFrameRatioOf`가 세로 영상에 가로 프레임을 씌운다. `generateThumbnailsAsync`가 만든 포스터는 회전 적용 후 비트맵이라 항상 옳다.

### 3.2 `pickPhotos(limit, opts?: { videos?: boolean })`

- `mediaTypes: opts?.videos ? ['images','videos'] : ['images']` — 트랙 사진·아바타는 인자를 안 넘기므로 자동으로 사진 전용 유지(결정 1).
- 영상이면 `generateThumbnailsAsync`로 포스터 + 길이 획득. **15초 초과면 `throw new Error('영상은 15초까지 올릴 수 있어요')`** — 두 작성 화면이 이미 `pickPhotos`를 try/catch로 감싸 `alertDialog`를 띄우므로 배선 추가 0줄.
- 포스터를 **선택 시점에** 만든다. `create-post`의 썸네일 스트립이 `<Image source={{uri: p.uri}}>`인데 mp4는 렌더되지 않는다.
- 웹은 `<video muted preload=metadata>` + canvas로 포스터·길이를 얻는다 (`composeStoryCanvas` L278-322와 같은 스타일, 20줄 안쪽).

### 3.3 압축

```ts
async function compressVideo(uri: string, onProgress?: (r: number) => void): Promise<string>
```
- 네이티브: `Video.compress(uri, { compressionMethod:'manual', maxSize:1280, bitrate:2_500_000 }, onProgress)`. `Video.cancelCompression(id)`로 취소.
- 웹: 원본 그대로. 업로드 직전 `byteLength > WEB_VIDEO_MAX_BYTES`면 `throw new Error('영상이 너무 커요 (45MB 이하)')`.

### 3.4 `cropToCanvas`에 영상 갈래 — 핵심 재사용

```ts
// 영상은 화면에서 cover로 놓는다 — 자를 수 있는 건 포스터뿐이다.
// 포스터를 프레임에 맞춰 잘라두면 그림이 필요한 모든 곳이 실제 재생 화면과 같은 구도를 본다.
if (photo.video) {
  const poster = await cropToCanvas(
    { uri: photo.video.posterUri, width: photo.width, height: photo.height, takenAt: null }, crop);
  return { ...photo, width: poster.width, height: poster.height,
           video: { ...photo.video, posterUri: poster.uri } };
}
```

이 한 갈래로 **`create-post`의 저장 로직(L84-90)이 무수정으로 동작**한다. `create-story`도 이걸 그대로 쓴다(§5).

### 3.5 `uploadPhotos` — 진행률 · 취소 · 고아 정리

```ts
export interface UploadProgress { index: number; total: number; phase: 'compress'|'upload'; ratio: number }

uploadPhotos(parent, coupleId, photos, options?: {
  coverOnly?: boolean;
  onProgress?: (p: UploadProgress) => void;
  abort?: { current: boolean };   // 파일 경계에서 확인
}): Promise<string[]>
```

| | 본체 | feed 렌디션 | grid 렌디션 |
|---|---|---|---|
| 사진 | `{uuid}.jpg` (= feed 본체) | 동일 | `{uuid}_360.jpg` |
| 영상 | `{uuid}.mp4` (압축본, `video/mp4`) | `{uuid}_poster.jpg` | `{uuid}_360.jpg` |

- 포스터 두 렌디션은 **기존 `renderRendition`을 그대로 호출**한다. 입력 타입을 `string | ImageRef`로 넓히기만 하면 새 리사이즈 코드가 없다.
- 업로드하며 `body.byteLength`를 누적 → insert에 `media`·`duration_ms`·`bytes`를 함께 넣는다.
- **고아 파일 정리 (기존 버그 동시 해결)**: 지금은 스토리지 업로드가 insert보다 먼저라, 쿼터 트리거가 거부하면 파일이 영구히 남는다. 영상은 5MB짜리라 훨씬 아프다. 항목별로 `uploadedThisItem: string[]`을 모으고, 그 항목의 업로드나 insert가 실패하면 `catch`에서 `storage.remove(uploadedThisItem)` 후 rethrow. **이전 항목의 파일은 지우지 않는다** — 이미 DB 행이 커밋됐다. 순서를 뒤집지(insert 먼저) 않는 이유: 그러면 업로드 실패 시 "깨진 사진 행"이 남고, 화면에 빈칸으로 드러나 고아 파일보다 나쁘다.
- **취소**: `abort.current`를 각 항목 시작 전과 압축 progress 콜백 안에서 확인. supabase-js storage `upload`는 AbortSignal을 안 받으므로 **"올리던 파일 하나는 마치고 멈춘다"**가 정직한 동작이다. 멈추면 그 항목 파일을 `remove`하고 `throw new Error('취소했어요')`.

### 3.6 `signedSourceUrls(paths): Promise<Map<string,string>>`

영상 본체(mp4) 서명 — 렌디션 매핑 없이 경로 그대로. `signedThumbUrls`의 baked 갈래와 같은 구조(`cachedSign`/`createSignedUrls`/`putSign`, 캐시 키 `src:${path}`) 10여 줄. `RENDITION`에 'video'를 끼우지 않는다 — 그건 `{width, compress}` 모양이라 영상과 안 맞는다.

---

## 4. 조회 레이어

- **`src/api/posts.ts`** — SELECT(L37-40)에 `media` 추가. `PostPhoto`에 `media`·`videoUrl` 추가. `usePosts`의 기존 `Promise.all`(L119-122)에 `signedSourceUrls(videoPaths)`를 세 번째로 붙인다(영상 없으면 빈 배열이라 왕복 없음). `useCreatePost`는 `onProgress`·`abort`를 받아 `uploadPhotos`에 전달.
- **`src/api/stories.ts`** — SELECT(L56)에 `media, duration_ms` 추가, `StoryPhoto`에 `media`·`videoUrl`·`durationMs` 추가. `useDeleteStory`는 `storagePathsFor` 경유라 **무수정**으로 mp4 3파일을 지운다.
- **`src/api/tracks.ts`** — §1의 import 경로 외 **무수정**.

---

## 5. 작성 화면

### `src/app/story/create.tsx`

1. `pickPhotos(1)` → `pickPhotos(1, { videos: true })`.
2. 프리뷰 분기 — `photo.video`면 `StoryCanvas`(핀치/팬) 대신 `<VideoView contentFit="cover">`를 9:16 캔버스에 꽉 채운다. 뒤의 블러 배경·스크림 레이어는 영상일 땐 그리지 않는다(cover라 여백이 없다). `StoryTextEditor`는 같은 rect를 그대로 받아 **텍스트 오버레이 유지**(결정 5).
3. `bakePhotoLayer` 분기 — 영상은 굽지 않고(굽을 수 없다) **포스터만 9:16 중앙 크롭**한다:
```ts
const source = photo.video
  ? await cropToCanvas(photo, { ...IDENTITY, canvasWidth: canvas.width, canvasHeight: canvas.height })
  : await bakePhotoLayer(photo);
```
   그러면 저장된 `width/height`가 9:16 → 뷰어의 `containedRect()`가 9:16 사각형을 돌려주고 → 그 안에 `cover`로 영상을 그리면 **편집 화면·포스터·재생 화면 구도가 정확히 일치**한다. 오버레이의 0~1 좌표가 그대로 맞는다. (§3.4를 `cropToCanvas` 안에 넣은 이유)
4. **쿼터 게이트 추가** — 지금 이 화면엔 없다. `useStorageQuota()`를 붙여 `full`이면 선택 전에 막는다.
5. `saving` 스피너 자리에 압축/업로드 % + 취소 버튼.

### `src/app/modals/create-post.tsx`

1. `pickPhotos(10)` → `pickPhotos(10, { videos: true })`.
2. 썸네일 스트립(L108): `uri: p.video ? p.video.posterUri : p.uri` + `p.video &&` **`PlayGlyph`**(`src/components/glyphs.tsx:332`에 이미 있다 — 새 글리프 불필요).
3. 탭 → 크롭은 사진만 (`!p.video && setCropping(p)`).
4. 저장 로직(L84-90) **무수정** (§3.4 덕분).
5. 문구(L155-162): `사진 {n}/10` → `항목 {n}/10`, 쿼터 줄은 바이트 표기, 영상이 있으면 **`영상 2개 · 약 9MB · 남은 공간의 6%`** 경고 줄(결정 6, 계산은 `lib/media.ts`의 `uploadEstimate`).
6. `올리기` 버튼 → 진행률 바 + `취소`. `abort`는 `useRef({current:false})`.

---

## 6. 표시

- **`src/components/feed/PostVideo.tsx` (신규, props-only)** — `{ posterUrl, videoUrl, width, height, active }`. 포스터 `<Image contentFit="cover">` 위에 반투명 원 + `PlayGlyph`. 탭하면 `useVideoPlayer(videoUrl)`로 `<VideoView contentFit="cover" nativeControls={false}>`를 얹고 재생, `active`(현재 캐러셀 페이지)가 false가 되면 pause. **`useCaching: true`로 소스를 만든다** — 재시청 egress가 0이 된다.
- **`PostCard.tsx`** — 캐러셀 map(L113-122)만 분기. `postContentFit`은 영상에도 통한다(저장된 크기가 크롭된 포스터 기준이라 항상 `cover`). n/m 배지·닷 무수정.
- **`PostGridCell.tsx`** — `video?: boolean` prop → 기존 `multiple` 배지와 같은 자리에 `PlayGlyph`. 호출부 `src/app/(tabs)/feed/index.tsx:46`에 한 줄.
- **`src/app/story/[id].tsx`** — `containedRect(...)`를 렌더 안에서 한 번 계산해 변수로 뽑는다(지금은 L247-252 인라인). 사진이면 지금처럼 `<Image contentFit="contain">`, 영상이면 그 rect에 `<VideoView contentFit="cover">`. **고정 `STEP_MS` → 길이 기반**: `const stepMs = photo.media === 'video' ? (photo.durationMs ?? STEP_MS) : STEP_MS`, L156의 나눗셈만 교체(진행바는 0~1을 받으므로 무수정). `paused`면 `player.pause()`. 인터벌이 진행바의 단일 진실이고 플레이어가 따라간다(15초 안에서 드리프트는 무시 가능). prefetch(L137-140)는 포스터라 무수정.
- **`StoryCard.tsx`(보관함 그리드)** — 포스터가 `gridThumbUrl`로 오므로 **무수정**.

---

## 7. 쿼터 UI

- **`src/api/couple.ts`**: `usePhotoQuota` → `useStorageQuota` → `{ usedBytes, quotaBytes, full }`. `supabase.rpc('storage_used_bytes')` + `couples.storage_quota_bytes`. queryKey `['storageQuota', coupleId]`.
- **invalidate 8곳** 치환 (`photos.ts:403,420` / `posts.ts:149,168` / `stories.ts:191,209` / `tracks.ts:348,379`). 기계적이지만 "장수"를 뜻하는 키가 바이트를 가리키면 다음 사람이 오독한다.
- **표시**: `사진 62 / 100장` → `62MB / 200MB 사용 중`. `full`이면 기존 문구 유지(기존 미디어는 절대 안 지우고 열람도 계속 된다 — CLAUDE.md 불변 규칙).
- **`src/app/(tabs)/feed/settings.tsx`에 사용량 행 추가** — 100장은 멀게 느껴졌지만 200MB는 영상 40개 남짓이라 "어디서 확인하나"가 필요해진다. 기존 `LinkRow` 옆에 `Divider` + 비링크 행(라벨 "보관 공간", sub `62MB / 200MB`). 진행 바까지는 YAGNI.

---

## 8. 네이티브 의존성

```
npx expo install expo-video
npm i react-native-compressor
```
`app.json`의 `plugins`에 `"react-native-compressor"` 추가. **새 권한 문자열 없음**(라이브러리 선택만 하고 촬영·녹음을 하지 않으므로 마이크 불필요). `expo-video` 플러그인은 PiP·백그라운드 재생을 안 쓰므로 불필요.

**dev client와 EAS 빌드를 다시 해야 한다** — Windows는 `npx expo run:android`, iOS는 맥미니에서 `npx expo run:ios --device`.

---

## 9. 단계와 검증

| # | 단계 | 검증 |
|---|---|---|
| **0** | **의존성 스파이크** — 두 패키지 설치 + prebuild + `npx expo run:android`. 임시 화면에서 15초 영상 하나를 압축·포스터 추출만 해본다 | 압축본이 720p·수 MB로 나오고 progress 콜백이 오는가. **세로·가로 영상을 둘 다** 찍어 포스터 비율이 옳은가. **막히면 Plan B(§10-1)로 설계가 바뀌므로 반드시 먼저 한다** |
| 1 | `src/lib/media.ts` + 테스트, `api/photos.ts`에서 두 함수 제거·import, 3파일 import 경로 수정 | `npm test` + `npm run typecheck` — **기능 변화 0인 리팩토링 커밋** |
| 2 | 마이그레이션 + 타입 재생성 | `npx supabase db reset` 통과. `select count(*) from photos where bytes = 0` 이 0인가(백필). psql로 200MB 초과 insert가 P0001로 거부되는가 |
| 3 | `useStorageQuota` + invalidate 키 8곳 + create-post 표시 | 기존 사진 업로드가 여전히 되고 쿼터 줄이 `xxMB / 200MB`로 보이며 업로드 후 숫자가 는다 |
| 4 | `uploadPhotos` 고아 정리 + `bytes` 기록 (**영상 없이 사진만**) | 쿼터를 1MB로 임시 낮춰 업로드 → 실패 후 Storage에 파일이 남지 않는가. 정상 시 `bytes`가 실제 파일 합과 일치하는가 |
| 5 | `PickedPhoto.video` + `pickPhotos` + 포스터 + 압축 + `cropToCanvas` 갈래 | create-post에서 영상 선택 시 스트립에 포스터+배지, 저장 후 Storage에 `.mp4`/`_poster.jpg`/`_360.jpg` 3개, DB의 `media`·`duration_ms`·`bytes`가 맞는가 |
| 6 | 표시 — `PostVideo` · `PostCard` · `PostGridCell` | 피드에서 재생되는가. 그리드·프로필·**앨범 상세**에 포스터가 뜨는가(= 핵심 통찰의 실증) |
| 7 | 스토리 — create 분기 + 뷰어 + 쿼터 게이트 | 영상 스토리에 텍스트를 얹었을 때 **뷰어의 글자 위치가 편집 화면과 같은가**(가장 어긋나기 쉬운 지점). 진행바가 영상 길이만큼 도는가 |
| 8 | 진행률 · 취소 · 경고 문구 | 큰 영상 3개를 올리다 취소 → 스토리지 잔여 파일 없음, 게시물 안 생김 |
| 9 | 웹(PWA) 패스 | `npm run web`에서 선택·포스터·업로드·재생. 45MB 초과 거부 문구 |
| 10 | 커밋 | `npm run typecheck` + `npm test` + `npx supabase db push` + 타입 재생성 |

커밋은 CLAUDE.md 규칙대로 기능 단위로 나누고 push까지. `git add -A` 금지 — 만진 파일만 경로로 명시.

---

## 10. 위험과 대안

1. **`react-native-compressor` × RN 0.86 — 최대 위험.** New Architecture(TurboModule) 지원은 문서에 명시돼 있으나 RN 0.86 조합은 미검증이다. 0단계 스파이크가 이걸 위한 것이다.
   → **Plan B**: 압축을 포기하고 **원본 + 하드 상한(25MB)**. 네이티브·웹 코드가 같아져 오히려 단순해지지만, 200MB가 영상 8~10개로 줄고 iPhone 4K 15초는 못 올린다. **Plan B로 가면 쿼터를 500MB로 올릴지 다시 물어야 한다.**
   → Plan C(ffmpeg-kit)는 2025년 retire되어 선택지가 아니다. 서버 트랜스코딩은 Edge Function CPU 한도상 불가.
2. **iOS 세로 영상 회전 메타데이터** — 프레임이 90° 틀어진다. §3.1의 "포스터에서 크기를 얻는다"로 방어. 0단계에서 실측.
3. **HEVC — 웹 전용 함정.** 아이폰 기본 녹화가 HEVC다. 네이티브는 압축하며 h.264로 나오니 안전하지만 **웹은 무압축**이라 HEVC가 그대로 올라가 Chrome/Android에서 재생이 안 된다. → 웹 업로드 시 "일부 기기에서 재생되지 않을 수 있어요" 안내 + 재생 실패 시 포스터 폴백.
4. **백필** — `storage.objects.metadata->>'size'`는 Storage API로 올린 객체엔 항상 있다. 못 채운 행은 무료로 계산될 뿐이라 **실패 방향이 안전하다**.
5. **프로젝트 전역 업로드 상한** — Supabase 대시보드의 글로벌 file size limit(기본 50MB)이 버킷 설정보다 우선한다. 대시보드 값도 확인.
6. **메모리** — `fetch(uri).arrayBuffer()`가 영상 전체를 JS 힙에 올린다. 15초 720p(≈5MB)는 문제없지만 웹 무압축 45MB는 저사양 안드로이드에서 위험할 수 있다. 증상이 나오면 `FormData({uri,name,type})` 스트리밍 업로드로 전환.
7. **`couples.photo_quota` drop** — 폰에 남은 구 빌드가 `select('photo_quota')`를 하면 400. 마일스톤상 TestFlight 미배포라 안전하나, 이미 배포됐다면 마이그레이션을 둘로 쪼갠다.

---

## 11. 범위 밖 (YAGNI)

- 트랙(앨범) 사진의 영상화, 앨범 커버 영상 — 결정 1
- 영상 트리밍 UI — 15초 초과는 거부 (결정 2)
- 스토리 영상 크롭·줌·필터 — 결정 5
- 게시물 영상 자동재생, 그리드 미리보기 자동재생 — 결정 8
- 음소거 토글 상태 저장, 볼륨 UI, 재생 위치 이어보기
- HLS·적응형 스트리밍·서버 트랜스코딩·썸네일 스프라이트
- resumable/TUS 업로드, 백그라운드 업로드, 업로드 큐 영속화
- 영상 다운로드·공유·저장
- 쿼터 상세 화면(용량 큰 항목 목록, 정리 도우미) — 설정에 한 줄까지
- 기존 고아 파일 일괄 청소 cron — 이번 변경은 새 고아를 안 만드는 데까지
- **`couples.plan` 연동(유료 전환·IAP·영수증 검증)** — `storage_quota_bytes` 값만 바꾸면 되게 열어두는 선까지. 무료 한도 확정은 베타 실측 후
- **R2 이전 / Spend Cap 정책 변경** — 약 1,000쌍 도달 전 결정할 임계점으로 기록만
