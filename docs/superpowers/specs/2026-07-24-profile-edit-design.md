# 프로필 수정 (닉네임 + 프로필 사진)

작성 2026-07-24 · 상태: 설계 승인

## 목표

사용자가 자기 **닉네임**과 **프로필 사진**을 바꿀 수 있는 화면과 기능. 현재 프로필은
카카오 소셜 로그인에서 받은 값(닉네임·`avatar_url`)으로 고정돼 있고 수정 수단이 없다.

범위 밖(이번 작업 제외):
- 생일 수정 — `birthday`는 기념일 자동 생성(`generate-anniversaries`)의 입력이라 바꾸면
  기념일 재생성이 얽힌다. 별도 작업.
- 아바타 스토리지 고아 정리 — 사진을 여러 번 바꾸면 이전 파일이 버킷에 남는다(작고 무해). YAGNI.

## 배경 (현재 구조)

- `profiles` 테이블: `id`, `nickname`, `birthday`, `avatar_url`. RLS `profiles_update: id = auth.uid()` 이미 있음.
- `avatar_url`은 원격 URL(카카오 사진). `Avatar` 컴포넌트(`src/components/Avatar.tsx`)가 이 URL을
  `Image`의 `uri`로 **직접** 쓴다. 소비처: 홈·피드·캘린더·스토리·댓글.
- `photos` 버킷은 **비공개** — 썸네일/원본은 서명 URL 필요(`api/photos.ts`). 아바타엔 부적합.
- `useCoupleProfiles()`(`api/couple.ts`)는 표시용으로 `givenName()`을 적용해 **성을 뗀** 닉네임을 반환한다.
  → 수정 화면은 원본 닉네임을 프리필해야 하므로 별도 조회가 필요.
- 진입점 후보 화면: `src/app/(tabs)/feed/settings.tsx`("관리") — 기념일/연결/로그아웃 행만 있음.

## 접근법 결정

아바타 저장 방식이 유일한 기술 분기.

- **채택 — 공개 `avatars` 버킷**: 경로 `${uid}/${uuid}.jpg`, 공개 URL을 `profiles.avatar_url`에 저장.
  기존 `Avatar`가 URL을 그대로 쓰므로 모든 소비처가 무변경으로 동작. 아바타는 비민감정보.
- 기각 — `photos` 비공개 버킷 재사용: 렌더 시점마다 서명 URL(1h 만료)을 다수 소비처에 배선해야 함. 배선 폭·만료 이슈.

## 설계

### 1. DB 마이그레이션

새 마이그레이션 파일 `supabase/migrations/<ts>_avatars_bucket.sql`:

- `insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);`
- 쓰기 정책 3개 — 본인 폴더(`${uid}/…`)만:
  - insert: `bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text`
  - update: 동일 조건
  - delete: 동일 조건
- 읽기 정책 불필요(공개 버킷은 공개 URL로 읽힘).
- `profiles` 테이블/RLS 변경 없음.

적용: `npx supabase db push` + 타입 재생성(`gen types`)까지 같은 커밋. (스토리지 정책은 profiles 타입에
영향 없어 타입 변화는 없을 수 있음.)

### 2. api 계층

**`api/photos.ts` — `pickAvatar()`**
- `expo-image-picker`를 단일 선택 + `allowsEditing: true`, `aspect: [1, 1]`로 실행(정사각 크롭).
- 선택 취소 시 `null` 반환.
- `expo-image-manipulator`로 512×512 JPEG(compress 0.8)로 리사이즈.
- `avatars` 버킷에 `${uid}/${randomUUID()}.jpg` 업로드.
- `supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl` 반환.

**`api/couple.ts` — `useMyProfile()`**
- 내 프로필 **원본** 조회: `profiles.select('id, nickname, avatar_url').eq('id', uid).single()`.
  `givenName` 미적용(수정 필드 프리필용).
- queryKey `['profile', 'mine', uid]`.

**`api/couple.ts` — `useUpdateProfile()`**
- 입력 `{ nickname: string; avatarUrl?: string | null }`.
- `profiles.update({ nickname, avatar_url }).eq('id', uid)`.
- 성공 시 `invalidateQueries(['couple'])`(me/partner·모든 아바타 소비처) + `invalidateQueries(['profile'])`.

### 3. 화면 `src/app/(tabs)/feed/profile.tsx`

기존 `feed/anniversaries`·`feed/settings`와 같은 pushed 스크린(`TopBar title="내 프로필"`).

- 상단: 큰 `Avatar`(현재값 또는 방금 고른 로컬 미리보기) + "사진 바꾸기" 버튼.
  - 탭 → `pickAvatar()`; 업로드 중 스피너, 완료되면 반환된 공개 URL을 로컬 상태에 보관.
- 닉네임 `TextInput` — `useMyProfile()`의 원본 닉네임으로 프리필.
- 하단 "저장" 버튼 → `useUpdateProfile({ nickname, avatarUrl })` → 성공 시 `router.back()`.
- 검증: 닉네임 `trim()` 빈 값이면 저장 비활성.
- 사진은 고르는 즉시 업로드(공개 URL 확보)하고, 저장 버튼이 nickname+avatar_url을 함께 profiles에 커밋.

### 4. 진입점

`feed/settings.tsx` 맨 위에 "내 프로필" 행 추가:
- 좌측 아이콘 자리에 내 `Avatar`(작게), 라벨 = 닉네임, sub = "프로필 사진·닉네임".
- 탭 → `router.push('/feed/profile')`.
- 기존 `LinkRow` 재사용하되 아이콘 슬롯에 아바타를 넣는다.

### 5. 테스트

순수 함수 추가 없음(lib/ 무변경) → 단위 테스트 대상 없음. `npm run typecheck` 통과 + 수동 확인
(사진 교체 → 저장 → 홈/피드/관리에서 반영, 닉네임 변경 반영, 빈 닉네임 저장 차단).

## 파일 변경 요약

- 신규: `supabase/migrations/<ts>_avatars_bucket.sql`
- 신규: `src/app/(tabs)/feed/profile.tsx`
- 수정: `src/api/photos.ts`(`pickAvatar`), `src/api/couple.ts`(`useMyProfile`, `useUpdateProfile`)
- 수정: `src/app/(tabs)/feed/settings.tsx`(내 프로필 행)
