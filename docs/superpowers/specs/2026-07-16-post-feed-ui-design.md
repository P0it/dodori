# 게시물 피드 UI 다듬기 — 설계

날짜: 2026-07-16
대상 화면: 게시물 피드/상세 (`src/app/(tabs)/studio/post/[id].tsx` → `components/feed/PostCard.tsx`,
`ReactionBar.tsx`, `CommentList.tsx`)

## 배경

커플 피드(게시물)를 실제로 써보며 나온 UI 지적 4건을 한 번에 정리한다. 전부 표현 계층 수정이며,
새 도메인·스키마·서버 로직은 없다(비율 보존 썸네일 변형 1건 제외).

**범위 밖(이번에 안 건드림):**
- 작성 화면(`modals/create-post.tsx`) 사진 재정렬 — 보류(YAGNI). 표시 순서는 업로드 순서=`created_at`
  순서로 이미 결정되므로, 필요해지면 배열 재정렬만으로 해결 가능.
- 아바타 업로드/편집 기능 — 별도 spec. 이번엔 카카오 로그인 시 채워지는 `avatar_url`만 사용하고,
  없을 때 이니셜 폴백으로 개선한다.

## 1. 사진 크롭 해결

### 문제
캐러셀이 정사각 고정(`width×width`, `contentFit="cover"`)이라 가로/세로 사진이 잘린다
([PostCard.tsx:116-123]). 더 근본 원인: 피드 썸네일이 서버에서 이미 정사각으로 잘려 저장된다 —
`THUMB.grid = {width:360, height:360}` + `signedThumbUrl`의 `resize:'cover'`
([photos.ts:12-31])라 정사각 밖 픽셀은 원천적으로 사라진다. 렌더만 고쳐선 해결 불가.

### 설계
1. **비율 보존 썸네일 변형 추가** (`src/api/photos.ts`)
   - `THUMB`에 `feed` 항목 추가. 높이를 지정하지 않아 원본 비율을 유지: `feed: { width: 1080, quality: 72 }`.
   - `signedThumbUrl`(및 `thumbUrl`)의 transform 구성이 `height`가 없을 때 `resize`를 넘기지 않도록 조정
     (현재는 `{ ...THUMB[kind], resize: 'cover' }`를 무조건 붙임). `height` 있는 기존 kind는 그대로 `cover`.
   - `posts.ts`의 `toPost`가 피드 사진에 `feed` 변형을 쓰도록 변경(현재 `'grid'`).
   - §9(목록에서 원본 URL 금지)는 유지 — 이건 원본이 아니라 큰 썸네일이다.
2. **자연 비율 렌더** (`PostCard.tsx`)
   - 캐러셀 높이 = 첫 사진의 `height/width` 비율에서 계산하고 극단값만 클램프:
     `h = width * clamp(ph/pw, 0.5625, 1.25)` (가로 16:9 ~ 세로 4:5).
   - `PostPhoto`에 이미 `width`/`height`가 있으므로 첫 장 값을 사용. 값이 없으면(둘 중 null) 정사각(1:1)로 폴백.
   - 각 이미지 `contentFit="cover"` → **`"contain"`**. 컨테이너가 첫 장 비율이라 첫 장은 꽉 차고(잘림 없음),
     다른 비율의 장은 레터박스. 배경은 `color.bg`(#121212)라 바가 눈에 띄지 않음.
   - 페이지 카운터·인디케이터 위치 로직은 그대로(높이만 가변).

## 2. 좋아요만 남기기

### 문제
고정 이모지 팔레트(`REACTIONS` = ❤️😂😲🥺🔥)를 모두 렌더([ReactionBar.tsx:16], [lib/posts.ts]).
요청: 좋아요(하트) 하나만.

### 설계
- `ReactionBar`를 **하트 단일 토글**로 변경. `post_reactions` 테이블과 `useToggleReaction(postId, emoji, on)`
  시그니처는 그대로 두고, emoji를 `'❤️'`로 고정해 호출.
- 상태 표현(커플 의미 유지):
  - 내가 누름 → 하트 채움 + green.
  - 상대만 누름 → 하트 옆에 pink 미니 하트/점.
  - 카운트 대신 "누가 눌렀나"를 색으로(최대 2인). 기존 green/pink 링·`roleBg` 재사용.
- `lib/posts.ts`의 `REACTIONS`는 단일(`['❤️']`)로 축소하거나 `ReactionBar`에서 상수로 흡수(구현 시 택1).
- 마이그레이션/데이터: 옛 게시물의 비-하트 리액션 행은 렌더되지 않을 뿐 남는다(무해). 신규 토글은 항상 `'❤️'`만 기록.
  DB 변경 없음.

## 3 + 4. 캡션/댓글 구분 · 아바타 우선 식별

### 문제
캡션과 댓글이 둘 다 `[역할색 이름]  본문` 인라인이라 시각적으로 동일하다
([PostCard.tsx:183-191], [CommentList.tsx:44-58]). 또 사람 구분을 이름 **글자색**(green/pink)에 의존한다.
요청: 프로필 사진으로 구분, 캡션/댓글을 층으로 분리.

### 불변 규칙과의 정합
CLAUDE.md 3역할 색 규약(나=green/상대=pink)은 유지한다. "글자색으로 구분하지 말라"는 이름 **텍스트 색**을
빼자는 뜻으로, 역할색은 **아바타 링/이니셜 틴트**라는 보조 신호로 남긴다(주 신호 = 아바타).

### 설계
1. **`components/Avatar.tsx` 신설** (props-only, 재사용)
   - Props: `url: string | null`, `role: OwnerRole`, `name: string`, `size: number`.
   - `url` 있으면 원형 이미지 + `role[role]` 1.5px 링(현재 헤더 인라인 스타일과 동일).
   - `url` 없으면 이니셜 폴백: 이름 첫 글자(1 grapheme)를 `roleBg[role]` 배경 + `role[role]` 텍스트 원형에.
     기존 `OwnerDot` 점 폴백을 대체.
   - 색 하드코딩 금지 — `role`/`roleBg`/`color` 토큰만 사용.
2. **PostCard 헤더**: 인라인 아바타/`OwnerDot` 블록을 `<Avatar size={32}>`로 교체.
3. **캡션**: 이름 프리픽스(`[역할색 이름]  `) 제거 → 순수 본문 텍스트(`color.white`). 작성자는 헤더 아바타로 이미 표시.
4. **댓글**(`CommentList`): 각 줄을 `<Avatar size={24}> + [흰색 이름] + 본문` 행으로. 이름 역할색 제거 → `color.white`.
   - `CommentList`에 `avatarUrl: (uid) => string | null` prop 추가(PostCard에서 전달, 헤더와 동일 소스).
   - 입력줄에도 내 `<Avatar size={24}>`를 앞에 두어 댓글 영역임을 강화(선택적, 구현 시 확정).
5. **층 분리**: 캡션과 댓글 사이에 얇은 hairline 구분선(`rgba(255,255,255,0.06)`, 카드 하단 구분선과 동일 톤).
   카드 세로 순서 확정: 사진 → 하트(좋아요) → 캡션(본문) → 구분선 → 댓글(아바타 줄) → 입력.

## 컴포넌트/파일 영향 요약

| 파일 | 변경 |
|---|---|
| `src/api/photos.ts` | `THUMB.feed` 추가, `signedThumbUrl`/`thumbUrl` transform가 height 없을 때 resize 생략 |
| `src/api/posts.ts` | `toPost`가 사진 썸네일을 `'feed'` 변형으로 |
| `src/components/Avatar.tsx` | 신설 (이미지/이니셜 폴백, 역할 링) |
| `src/components/feed/PostCard.tsx` | 캐러셀 비율 가변+contain, 헤더 Avatar, 캡션 본문화, 구분선, 세로 순서 |
| `src/components/feed/ReactionBar.tsx` | 하트 단일 토글 |
| `src/components/feed/CommentList.tsx` | 줄마다 Avatar+흰 이름, `avatarUrl` prop |
| `src/lib/posts.ts` | `REACTIONS` 단일화(또는 ReactionBar로 흡수) |

의존성 방향 준수: 모든 변경은 `components/`·`api/` 표현/데이터 계층 안. 새 도메인 규칙 없음 → `lib/` 단위 테스트
대상 아님(이니셜 추출 정도가 순수 함수지만 사소해 별도 테스트 불요, 구현 시 판단).

## 검증

- 크롭: 가로 사진(예: 스크린샷) 1장 + 세로 사진 1장 게시물에서 첫 장이 잘리지 않고 전체가 보이는지.
- 좋아요: 하트 토글 시 내 표시 green, 상대 계정에서 누르면 pink 미니 표시. 이모지 팔레트 사라짐.
- 캡션/댓글: 캡션은 이름 없는 본문, 댓글은 아바타 줄, 사이 구분선. 한눈에 구분됨.
- 아바타: 카카오 아바타 있으면 사진, 없으면 이름 첫 글자 이니셜(역할 틴트). 이름 텍스트는 흰색.
- `npm run typecheck` 통과.
