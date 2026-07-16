# 게시물 피드 UI 다듬기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게시물 피드 카드의 4가지 UI 문제(사진 크롭·이모지 팔레트·캡션/댓글 구분·글자색 대신 아바타)를 고친다.

**Architecture:** 전부 표현/데이터 계층(`components/`·`api/`) 수정. 새 도메인 규칙 없음. 유일한 서버측 변화는 비율 보존 썸네일 변형 URL 추가(원본 아님). 재사용 `Avatar` 컴포넌트를 신설해 헤더·댓글에서 공유한다.

**Tech Stack:** Expo RN 0.86 / TypeScript strict / expo-image / Supabase Storage image transform / expo-router. 스타일은 RN `style` + `src/theme/tokens.ts` 토큰.

## Global Constraints

- **색상 하드코딩 금지** — 반드시 `src/theme/tokens.ts`의 `color`/`role`/`roleBg` 참조 (CLAUDE.md 불변 규칙).
- **3역할 색 규약 유지** — 나=`role.me`(green) / 상대=`role.partner`(pink). 이름 텍스트 색은 빼되, 역할색은 아바타 링/이니셜 틴트로 남긴다.
- **컴포넌트는 props-only** — 전역 상태·네트워크 직접 접근 금지. Supabase 접근은 `api/`로만.
- **§9 원본 URL 금지** — 목록/피드에서 원본 이미지 URL 사용 금지. `feed` 변형은 원본이 아니라 큰 썸네일이므로 허용.
- **테스트 대상은 `lib/`뿐** (CLAUDE.md) — 이 작업엔 새 `lib/` 순수 함수가 없다. 각 태스크의 자동 게이트는 **`npm run typecheck`** 통과이고, 실제 확인은 앱 시각 검증 체크리스트로 한다. 컴포넌트 단위 테스트는 만들지 않는다(프로젝트 규약).
- 확정된 카드 세로 순서: **사진 → 좋아요 → 캡션(본문) → 구분선 → 댓글 → 입력**.

---

### Task 1: 비율 보존 썸네일 변형

**Files:**
- Modify: `src/api/photos.ts:12-34` (THUMB 상수 + transform 구성 + thumbUrl/signedThumbUrl)
- Modify: `src/api/posts.ts:62` (toPost가 피드 썸네일 kind로 `'feed'` 사용)

**Interfaces:**
- Produces: `THUMB.feed`(높이 미지정), `signedThumbUrl(path, 'feed')`가 원본 비율 보존 URL 반환.
- Consumes: 없음.

- [ ] **Step 1: THUMB에 feed 변형 + height 없을 때 resize 생략하도록 수정**

`src/api/photos.ts`의 `THUMB`와 두 URL 함수를 아래로 교체한다. 현재는 `{ ...THUMB[kind], resize: 'cover' }`를 무조건 붙여 height 없는 변형을 만들 수 없다. height가 있는 변형만 `cover`로 자르고, `feed`(width만)는 비율을 보존하게 한다.

```ts
/**
 * 썸네일 3단계 (§6.3): 캘린더 124@2x / 그리드·스트립 360 / 뷰어 원본.
 * 피드(feed)는 원본 비율 보존 — 높이 미지정으로 가로세로가 안 잘린다.
 * 원본은 뷰어 전용 — 목록 화면에서 원본 URL 사용 금지 (§9)
 */
export const THUMB = {
  calendar: { width: 124, height: 124, quality: 60 },
  grid: { width: 360, height: 360, quality: 70 },
  feed: { width: 1080, quality: 72 },
} as const;

/** height가 있는 변형만 cover로 자른다. feed는 width만 지정해 비율 보존 */
function transformFor(kind: keyof typeof THUMB) {
  const t = THUMB[kind];
  return 'height' in t ? { ...t, resize: 'cover' as const } : { ...t };
}

export function thumbUrl(storagePath: string, kind: keyof typeof THUMB): string {
  const { data } = supabase.storage.from('photos').getPublicUrl(storagePath, {
    transform: transformFor(kind),
  });
  return data.publicUrl;
}

/** 썸네일 서명 URL — photos 버킷이 비공개라 public URL은 렌더되지 않는다 */
export async function signedThumbUrl(
  storagePath: string,
  kind: keyof typeof THUMB,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, 60 * 60, { transform: transformFor(kind) });
  if (error) throw error;
  return data.signedUrl;
}
```

- [ ] **Step 2: 피드가 feed 변형을 쓰도록 posts.ts 수정**

`src/api/posts.ts`의 `toPost` 안 사진 매핑에서 kind를 `'grid'` → `'feed'`로 바꾼다.

```ts
        .map(async (p) => ({
          id: p.id,
          storagePath: p.storage_path,
          thumbUrl: await signedThumbUrl(p.storage_path, 'feed'),
          width: p.width,
          height: p.height,
        })),
```

- [ ] **Step 3: 타입체크**

Run: `npm run typecheck`
Expected: PASS (에러 0). `transformFor`의 `'height' in t` 좁히기로 supabase transform 타입 충족.

- [ ] **Step 4: Commit**

```bash
git add src/api/photos.ts src/api/posts.ts
git commit -m "feat(feed): 비율 보존 feed 썸네일 변형 추가 — 사진 크롭 원인 제거"
```

---

### Task 2: Avatar 컴포넌트 신설

**Files:**
- Create: `src/components/Avatar.tsx`

**Interfaces:**
- Produces: `Avatar({ url: string | null, role: OwnerRole, name: string, size: number })`. `url` 있으면 역할색 링 두른 원형 이미지, 없으면 이름 첫 글자 이니셜을 `roleBg[role]` 배경 + `role[role]` 텍스트로.
- Consumes: 없음.

- [ ] **Step 1: Avatar.tsx 작성**

```tsx
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, role, roleBg, typeface, type OwnerRole } from '@/theme/tokens';

type Props = {
  url: string | null;
  role: OwnerRole;
  name: string;
  size: number;
};

/** 작성자 아바타 — 사진 있으면 역할색 링 원형, 없으면 이름 첫 글자 이니셜(역할 틴트) */
export function Avatar({ url, role: who, name, size }: Props) {
  const ring = Math.max(1, Math.round(size * 0.05));
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring,
          borderColor: role[who],
          backgroundColor: color.surface2,
        }}
      />
    );
  }
  const initial = [...name.trim()][0] ?? '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ring,
        borderColor: role[who],
        backgroundColor: roleBg[who],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: size * 0.44, color: role[who] }}>
        {initial}
      </Text>
    </View>
  );
}
```

주의: prop 이름 `role`은 파라미터에서 `who`로 리네이밍해 import한 `role` 토큰과 겹치지 않게 한다. `roleBg`는 `me`/`partner`/`anniv`를 모두 가지므로 `OwnerRole` 전부 안전.

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Avatar.tsx
git commit -m "feat(feed): 재사용 Avatar 컴포넌트 — 이미지/이니셜 폴백"
```

---

### Task 3: PostCard — 캐러셀 비율·헤더 아바타·캡션 본문화·구분선

**Files:**
- Modify: `src/components/feed/PostCard.tsx` (헤더 아바타 블록, 캐러셀 높이/contain, 캡션, 구분선, 세로 순서)

**Interfaces:**
- Consumes: `Avatar`(Task 2), `post.photos[0].width/height`(nullable), `signedThumbUrl(..., 'feed')` 결과(Task 1).
- Produces: 없음(내부 렌더만).

- [ ] **Step 1: import에 Avatar 추가, OwnerDot import 제거**

`src/components/feed/PostCard.tsx` 상단 import 블록에서 `OwnerDot` 줄을 지우고 `Avatar`를 추가한다.

```tsx
import { Image } from 'expo-image';
import { color, radius, role, space, typeface, type OwnerRole } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { Avatar } from '@/components/Avatar';
import { Meta } from '@/components/Meta';
import { MoreGlyph } from '@/components/glyphs';
```

(`OwnerDot` import 삭제. `Image`는 캐러셀에서 계속 사용하므로 유지.)

- [ ] **Step 2: 헤더 아바타 블록을 Avatar로 교체**

현재 66-91행의 `{avatar ? (<Image .../>) : (<View><OwnerDot/></View>)}` 전체를 아래 한 줄로 교체한다.

```tsx
        <Avatar url={avatar} role={authorRole} name={name(post.authorId)} size={32} />
```

- [ ] **Step 3: 캐러셀 높이를 첫 사진 비율로 계산 + contain 렌더**

`onScroll` 정의 아래(46-52행 근처)에 캐러셀 높이 계산을 추가한다.

```tsx
  const first = post.photos[0];
  const ratio = first?.width && first?.height ? first.height / first.width : 1;
  const carouselH = Math.round(width * Math.min(1.25, Math.max(0.5625, ratio)));
```

캐러셀 `ScrollView`의 `style={{ width, height: width }}`를 `style={{ width, height: carouselH }}`로, 각 `Image`의 `style={{ width, height: width }}`를 `style={{ width, height: carouselH, backgroundColor: color.bg }}`로, `contentFit="cover"`를 `contentFit="contain"`으로 바꾼다.

```tsx
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={{ width, height: carouselH }}
          >
            {post.photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.thumbUrl }}
                style={{ width, height: carouselH, backgroundColor: color.bg }}
                contentFit="contain"
                transition={160}
              />
            ))}
          </ScrollView>
```

- [ ] **Step 4: 캡션에서 이름 프리픽스 제거 + 캡션↔댓글 구분선**

현재 183-191행 캡션 블록(`<Text>` 안에 `[역할색 이름]  캡션`)을 이름 없는 본문으로 바꾸고, 캡션이 있을 때 얇은 구분선을 캡션과 `CommentList` 사이에 넣는다.

```tsx
        {!!post.caption && (
          <Text style={{ fontFamily: typeface, fontSize: 14.5, color: color.white, lineHeight: 21 }}>
            {post.caption}
          </Text>
        )}

        {!!post.caption && (
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        )}
```

(`authorRole`은 캐러셀 인디케이터·아바타 링에서 계속 쓰이므로 `authorRole` 정의는 유지.)

- [ ] **Step 5: 타입체크**

Run: `npm run typecheck`
Expected: PASS. (`OwnerDot` 미사용 import가 남아 있으면 strict에서 경고/에러 — 확실히 삭제했는지 확인.)

- [ ] **Step 6: 시각 검증 (앱)**

dev client 또는 실행 중 앱에서 게시물 피드를 연다. 확인:
- 가로 스크린샷 사진이 **잘리지 않고 전체가** 보인다(위아래 레터박스는 #121212라 티 안 남).
- 헤더 아바타가 카카오 사진(있으면) 또는 이름 첫 글자 이니셜로 뜬다.
- 캡션이 이름 없는 본문으로 보이고, 아래 얇은 구분선이 있다.

- [ ] **Step 7: Commit**

```bash
git add src/components/feed/PostCard.tsx
git commit -m "feat(feed): 캐러셀 비율 가변+contain, 헤더 Avatar, 캡션 본문화·구분선"
```

---

### Task 4: 이모지 팔레트 → 좋아요(하트) 하나

**Files:**
- Modify: `src/lib/posts.ts:2` (REACTIONS 단일화)

**Interfaces:**
- Consumes: `REACTIONS`는 `ReactionBar`만 사용(확인됨). 단일화하면 `ReactionBar`가 하트 칩 하나만 렌더한다.
- Produces: 없음.

근거(Simplicity First): `ReactionBar`는 `REACTIONS`를 map하고, 첫 항목이 이미 하트 `'♥'`다. 세트를 하트 하나로 줄이면 리라이트 없이 "좋아요만" + 기존 하트 리액션 보존이 동시에 달성된다. me=green / partner=pink 링·카운트 로직은 그대로 유효.

- [ ] **Step 1: REACTIONS를 하트 하나로 축소**

```ts
/** 게시물 리액션 — 좋아요(하트) 하나 (커플 앱: 팔레트 불필요) */
export const REACTIONS = ['♥'] as const;

export type Reaction = (typeof REACTIONS)[number];
```

- [ ] **Step 2: 타입체크**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: 시각 검증 (앱)**

피드에서 리액션 줄에 **하트 칩 하나만** 남았는지, 탭하면 green(내가 누름)으로 바뀌고 카운트가 증가하는지, 상대 계정으로 누르면 pink 링/카운트로 표시되는지 확인.

- [ ] **Step 4: Commit**

```bash
git add src/lib/posts.ts
git commit -m "feat(feed): 리액션을 좋아요(하트) 하나로 축소"
```

---

### Task 5: CommentList — 아바타 줄 + 흰 이름, 입력줄 아바타

**Files:**
- Modify: `src/components/feed/CommentList.tsx` (Props에 avatarUrl, 각 줄 Avatar+흰 이름, 입력줄 내 아바타)
- Modify: `src/components/feed/PostCard.tsx:193-200` (`<CommentList>`에 `avatarUrl` 전달)

**Interfaces:**
- Consumes: `Avatar`(Task 2), PostCard가 이미 보유한 `avatarUrl: (uid) => string | null`.
- Produces: `CommentList` Props에 `avatarUrl: (uid: string) => string | null` 추가.

- [ ] **Step 1: CommentList import·Props에 Avatar/avatarUrl 추가**

상단 import에 `Avatar`를 추가하고(`color` 유지, `role`은 더 이상 이름색에 안 쓰지만 다른 데서 안 쓰면 제거), Props에 `avatarUrl`을 넣는다.

```tsx
import { Avatar } from '@/components/Avatar';
```

```tsx
type Props = {
  comments: PostComment[];
  myUid: string;
  who: (uid: string) => OwnerRole;
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
  onAdd: (body: string) => void;
  onDelete: (commentId: string) => void;
};
```

함수 시그니처도 `avatarUrl`을 구조분해에 추가한다:

```tsx
export function CommentList({ comments, myUid, who, name, avatarUrl, onAdd, onDelete }: Props) {
```

- [ ] **Step 2: 각 댓글 줄을 아바타 + 흰 이름 + 본문으로**

현재 42-69행의 댓글 줄(`<View><Text>[역할색 이름] 본문</Text>...`)을 아래로 교체한다. 이름 색을 `role[who(...)]` → `color.white`로 바꾸고 24px 아바타를 앞에 둔다.

```tsx
      {shown.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Avatar url={avatarUrl(c.authorId)} role={who(c.authorId)} name={name(c.authorId)} size={24} />
          <Text
            style={{ fontFamily: typeface, fontSize: 14, lineHeight: 20, color: color.white, flex: 1 }}
          >
            <Text style={{ fontWeight: '700', color: color.white }}>{name(c.authorId)}</Text>
            {'  '}
            {c.body}
          </Text>
          <Meta style={{ fontSize: 11, lineHeight: 20 }}>{formatRelative(c.createdAt)}</Meta>
          {c.authorId === myUid && (
            <Pressable onPress={() => onDelete(c.id)} hitSlop={10}>
              <Text style={{ fontFamily: typeface, fontSize: 13, lineHeight: 20, color: color.muted }}>
                ×
              </Text>
            </Pressable>
          )}
        </View>
      ))}
```

`role` import가 이 파일에서 더 이상 쓰이지 않으면 import에서 제거한다(strict unused).

- [ ] **Step 3: 입력줄 앞에 내 아바타**

72행 입력 `View`의 `TextInput` 앞에 내 24px 아바타를 넣어 댓글 영역임을 강화한다.

```tsx
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <Avatar url={avatarUrl(myUid)} role={who(myUid)} name={name(myUid)} size={24} />
        <TextInput
```

(나머지 TextInput/등록 버튼은 그대로.)

- [ ] **Step 4: PostCard에서 avatarUrl 전달**

`src/components/feed/PostCard.tsx`의 `<CommentList ... />`에 `avatarUrl={avatarUrl}`을 추가한다.

```tsx
        <CommentList
          comments={post.comments}
          myUid={myUid}
          who={who}
          name={name}
          avatarUrl={avatarUrl}
          onAdd={onAddComment}
          onDelete={onDeleteComment}
        />
```

- [ ] **Step 5: 타입체크**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: 시각 검증 (앱)**

피드에서:
- 각 댓글이 24px 아바타 + **흰색 이름** + 본문 줄로 보인다.
- 입력줄 앞에 내 아바타가 있다.
- 캡션(본문, 아바타 없음) vs 댓글(아바타 줄)이 구분선과 함께 한눈에 구분된다.

- [ ] **Step 7: Commit**

```bash
git add src/components/feed/CommentList.tsx src/components/feed/PostCard.tsx
git commit -m "feat(feed): 댓글에 아바타 줄·흰 이름, 입력줄 아바타 — 캡션과 시각 분리"
```

---

## Self-Review

**Spec coverage:**
- 사진 크롭 → Task 1(비율 보존 썸네일) + Task 3(캐러셀 비율·contain). ✅
- 좋아요만 → Task 4. ✅ (스펙의 "pink 미니 하트"는 기존 ReactionBar의 pink 링/카운트로 충족 — 더 단순한 경로 채택.)
- 캡션/댓글 구분 → Task 3(캡션 본문화·구분선) + Task 5(댓글 아바타 줄). ✅
- 아바타 우선 식별 + 이니셜 폴백 → Task 2(Avatar) + Task 3(헤더) + Task 5(댓글). ✅
- 범위 밖(재정렬·아바타 업로드) — 태스크 없음(의도됨). ✅

**Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 실제 코드 포함.

**Type consistency:** `Avatar` props(`url`/`role`/`name`/`size`)가 Task 3·5 호출과 일치. `signedThumbUrl(path, 'feed')`의 `'feed'`가 Task 1 `THUMB.feed`와 일치. `CommentList` `avatarUrl` prop이 Task 5 정의·PostCard 전달과 일치. `REACTIONS`는 `ReactionBar`만 소비(확인됨).

**참고:** 스펙 대비 단순화 2건 — (a) 좋아요는 ReactionBar 리라이트 대신 `REACTIONS` 축소, (b) 재정렬은 애초 범위 밖. 둘 다 Simplicity First에 부합하며 요구 UI를 그대로 만족.
