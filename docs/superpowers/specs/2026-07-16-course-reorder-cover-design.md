# 코스 순서 변경(드래그) + 앨범 커버 등록 — 설계

작성일 2026-07-16. 대상 화면: `src/app/track/[id]/index.tsx` (Track 상세).

## 배경 / 문제

트랙(데이트) 상세의 두 기능이 미구현이라 사용자가 "안 된다"고 인지:

1. **코스 장소 순서 변경** — `track_places.sort_order` 컬럼과 정렬 로직은 있으나, 순서를
   바꾸는 뮤테이션·UI가 없다. 추가(`useAddTrackPlace`)·삭제(`useRemoveTrackPlace`)만 존재.
2. **앨범 커버 등록** — 커버는 `tracks.cover_photo_id`에서 파생되지만, 사진 업로드 UI가
   `{released && ...}`로 막혀 있어 **계획(미발매) 상태에선 커버를 넣을 경로 자체가 없다.**

## 결정

- 순서 변경: **드래그 앤 드롭** (사용자 선택). 이미 설치된 `react-native-reanimated@4` +
  `react-native-gesture-handler@2`로 **직접 구현** — 새 라이브러리 없음(캘린더를 라이브러리
  없이 자체 구현한 프로젝트 방침과 일치). `react-native-draggable-flatlist`는 reanimated 4
  호환 불확실 + ScrollView 내 가상 리스트 중첩 문제로 배제.
- 커버 등록: **커버 탭 → 사진 1장 선택 → 업로드 → `cover_photo_id` 지정.** 계획·발매 양쪽 모두.

## 변경 사항

### API
- `src/api/places.ts` — `useReorderTrackPlaces(trackId)` 추가. 드롭 시점의 새 순서
  `placeId[]`를 받아 각 행 `sort_order = index`로 update. `onMutate`로 `['track', id]`
  캐시를 즉시 재정렬(낙관적), 실패 시 롤백, `onSettled`에서 invalidate.
- `src/api/photos.ts` — `uploadPhotos()` 반환을 `number`(개수) → `string[]`(삽입된 photo
  id 배열)로 변경. 기존 소비처(posts.ts, track index)는 반환값을 쓰지 않으므로 무영향.
- `src/api/tracks.ts` — `useSetTrackCover(trackId)` 추가. `PickedPhoto` 1장을
  `uploadPhotos`로 올리고, 반환된 photo id로 `tracks.cover_photo_id` update.

### 컴포넌트
- `src/components/track/DraggableCourseList.tsx` (신규) — 고정 행 높이 + 절대배치. 행을
  **길게 눌러** 들어올린 뒤 세로 드래그, 놓으면 새 순서 확정. 드래그 중 다른 행은 spring으로
  자리 양보. `positions`(id→index) 공유값으로 재배치, 활성 행은 손가락을 따라감.
  Props: `ids`, `rowHeight`, `renderItem(id, dragging)`, `onReorder(newIds)`,
  `onDragActiveChange(active)`(부모 ScrollView 잠금용). `ids`가 바뀌면(추가/삭제) 드래그
  중이 아닐 때 `positions` 재동기화. 길게-누르기 활성이라 행 내부 × 버튼의 탭과 충돌하지 않음.

### 화면 / 루트
- `src/app/_layout.tsx` — 최상위 View를 `GestureHandlerRootView`로 감쌈(제스처 동작 전제,
  현재 미설정). 앱 최초의 reanimated/gesture 사용.
- `src/app/track/[id]/index.tsx`
  - 코스 섹션(미발매): 정적 목록 대신 `DraggableCourseList`로 렌더. 드롭 시
    `useReorderTrackPlaces`. 발매 후에는 기존대로 정적(재정렬·삭제 숨김).
  - 헤더 `TrackCover`를 Pressable로 감싸 탭 → `pickPhotos(1)` → `useSetTrackCover`.
    업로드 중 스피너 오버레이. 계획 모드의 점선/D-day 오버레이에 `pointerEvents="none"`을
    줘 탭이 커버까지 전달되게 함.

## 부수효과 / 비고
- 계획 때 지정한 커버 사진은 `photos`(track_id) 행으로 저장되므로 발매 후 '사진' 섹션에
  첫 사진으로 나타남 — 의도된 동작.
- gesture-handler·reanimated 모두 이미 설치됨(네이티브 모듈 링크됨). 앱 첫 사용이라
  변경 후 `expo start --clear` + dev client에서 드래그 동작을 실기기로 확인 필요
  (worklet/제스처는 typecheck로 검증 불가).

## 범위 밖
- 드래그 라이브러리 도입, 발매 후 기존 사진 중 커버 선택 UI, 다중 커버, 방문시간 자동 재계산.
