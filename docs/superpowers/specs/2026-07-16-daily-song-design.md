# 오늘의 추천곡 (Daily Song) 설계

- 날짜: 2026-07-16
- 상태: 설계 확정 (구현 전)
- 자리: **오늘** 탭 최상단 히어로. 그 아래 기존 "오늘의 주제" 카드.

## 1. 콘셉트

매일 커플에게 **곡 하나**를 추천한다. 두 사람이 **같은 곡**을 본다. 앨범아트 + **30초 인앱 미리듣기** + "전곡 듣기"(외부 링크). 오늘 탭을 열었을 때 가장 먼저 마주치는 하루의 첫 인상이 된다.

음악 메타포와 결이 맞는다(장소=트랙, 하루=앨범 위에 "오늘의 곡"이 얹힘). 인스타식 BGM(라이선스 필요)이 아니라 **곡을 참조**하는 방식이라 라이선스 부담이 없다 — 30초 미리듣기는 Apple이 그 용도로 공개한 것, 전곡은 외부 앱으로 넘긴다.

## 2. 범위

**0.1 포함**
- 대중적 **한국곡 + 팝송** 섞인 곡 풀 (빌드타임 시드)
- 하루 하나 **결정론적 픽** (두 사람, 사실상 모든 커플이 같은 곡)
- 카드: 앨범아트 · 제목 · 아티스트 · **30초 재생/정지** · "전곡 듣기"(유튜브 뮤직 검색 딥링크)

**보류 (비목표)**
- 시간대별 테마(출근/노동요 등) — 사람마다 출퇴근 시간이 달라 폐기
- 화면 무드 라벨/부제 — 데이터에 자리(`mood`)만 남기고 표시는 안 함
- 곡에 커플 반응(♥) · 플레이리스트 저장
- cron 자동 곡 증식 (런타임 LLM/iTunes 호출) — 이후 마일스톤

## 3. 데이터 파이프라인 — 빌드타임 1회

런타임에 외부 API를 호출하지 않는다. 곡 풀은 **개발 시점에 스크립트로 한 번** 만들어 마이그레이션으로 심는다. (기존 `scripts/build-topics-migration.py` + `docs/topics-160.json` 패턴을 따른다.)

`scripts/build-song-pool.py` (또는 .ts):

1. **LLM 발굴 (Claude API)** — "대중적인 한국곡·팝송"을 무드를 섞어 후보 수십~수백 곡 생성. 각 곡은 구조화 출력:
   `{ artist_en, title_en, artist_kr?, mood }`
   - **핵심 제약:** iTunes는 한글 제목을 로마자/영문으로 색인한다(강남스타일→"Gangnam Style"). 그래서 LLM은 **영문/공식 제목(`title_en`)을 반드시** 낸다. 팝송은 원래 영문이라 무관, 영문 제목 K-pop(Dynamite, Hype Boy 등)도 그대로 매칭된다.
2. **iTunes 검증 + 보강** — 각 후보를 `https://itunes.apple.com/search?term=<artist_en title_en>&country=KR&media=music&entity=song&limit=10`로 조회 후 **매칭 판정**:
   - 정규화(소문자·영숫자/한글만) 후, 결과 중 **아티스트 토큰 일치 AND 제목 토큰 일치**인 첫 곡만 채택.
   - "결과 0건 아니면 통과"는 금지 — iTunes는 아무 쿼리에나 fuzzy 결과를 준다(검증됨: "싸이 강남스타일"→Kenny Rogers). 반드시 아티스트+제목 둘 다 맞아야 KEEP.
   - 매칭 실패 = **환각 또는 미색인으로 보고 DROP** (검증됨: 존재하지 않는 가짜곡은 안전하게 탈락).
   - 채택 시 `trackId, trackName(iTunes 표기), artistName, artworkUrl(→600x600으로 치환), previewUrl, trackViewUrl` 확보.
3. **마이그레이션 생성** — `trackId`로 중복 제거, `seq` 0..N-1 부여, `supabase/migrations/<ts>_song_pool_seed.sql`로 INSERT 방출.

빌드타임 스크립트만 `ANTHROPIC_API_KEY`(로컬 `.env`)가 필요하다. **프로덕션에는 새 시크릿·비용·외부 호출이 없다.**

### 매칭 검증 기록 (실측)
- 팝송(Uptown Funk, Blinding Lights): 정확 매칭 ✓
- 영문 제목 K-pop(BTS Dynamite, NewJeans Hype Boy, BLACKPINK DDU-DU): 매칭 ✓
- 한글 제목(강남스타일, 좋은 날): `title_en` 없이는 DROP → LLM이 영문 제목을 줘야 함
- 가짜곡: DROP ✓

## 4. 데이터 모델

전역 참조 데이터(커플 스코프 아님). 모든 커플이 같은 풀을 공유한다.

```sql
create table public.song_pool (
  id          uuid primary key default gen_random_uuid(),
  seq         int  not null,                 -- 결정론적 픽용 안정 순서 (0..N-1)
  itunes_id   bigint not null unique,        -- 중복 제거 자연키
  title       text not null,                 -- iTunes trackName 표기
  artist      text not null,
  artwork_url text not null,                 -- 600x600
  preview_url text not null,                 -- 30초 m4a
  apple_url   text not null,                 -- trackViewUrl (music.apple.com/kr/...)
  mood        text,                          -- 발굴 시 무드 (표시 안 함, 향후 부제/필터용)
  created_at  timestamptz not null default now()
);
create unique index song_pool_seq_key on public.song_pool (seq);
```

- **RLS:** 인증 사용자는 `select` 허용 (전역 읽기 전용). 쓰기·삭제는 service_role(시드 마이그레이션/향후 cron)만. 커플 술어 없음.
- **Realtime 불필요** (정적 풀).

## 5. 런타임 — 서버 불필요, 결정론적

**`lib/song.ts` (순수 함수, RN·Supabase import 금지 — 단위 테스트 대상)**
- `kstDayNumber(dateKST: string): number` — KST 기준 epoch 이후 며칠째. (`lib/date.ts`의 `todayKST()`를 입력으로 받음)
- `pickTodaySong(pool: Song[], dayNumber: number): Song | null` — `seq` 오름차순 정렬 후 `dayNumber % pool.length` 인덱스. 풀을 하루 하나씩 순서대로 소진 → 초기 중복 없음, 끝나면 순환. 두 폰이 같은 날짜 → 같은 인덱스 → **같은 곡**.
- `youtubeMusicSearchUrl(artist: string, title: string): string` — `https://music.youtube.com/search?q=<encoded artist title>`. 한국에서 보편적이라 "전곡 듣기" 대상.

**`api/songs.ts`**
- `useSongPool()` — `song_pool` 전량을 TanStack Query로 조회(+AsyncStorage persist). 풀이 작고 정적이라 전량 캐시가 적합.
- `useTodaySong()` — `useSongPool()` + `todayKST()`를 조합해 `pickTodaySong(...)` 결과를 반환하는 얇은 훅.

**`components/SongCard.tsx` (props-only)**
- props: `{ title, artist, artworkUrl, previewUrl, appleUrl }` (또는 `Song` + `onOpen`).
- 앨범아트(`expo-image`) + 제목·아티스트 + **재생/정지 토글** + "전곡 듣기".
- **30초 미리듣기:** `expo-audio`(SDK 57의 오디오 라이브러리 — 구 `expo-av` 아님)로 `previewUrl` 재생. 오디오 상태는 카드가 로컬로 소유(전역 상태·네트워크 아님, 기기 I/O). 화면 이탈/언마운트 시 정지.
- "전곡 듣기": `Linking.openURL(youtubeMusicSearchUrl(...))`.
- 색은 전부 토큰(`src/theme/tokens.ts`), hex 금지.

**`app/(tabs)/today/index.tsx`**
- 헤더 아래 **최상단에 `SongCard`**(히어로), 그 아래 기존 오늘의 주제 카드 → 지난 주제. 주제 카드의 "화면의 주인공" 위상은 곡 카드로 이동.
- 곡 풀 로딩 실패/빈 풀이면 카드 자리를 조용히 생략(주제 카드가 그대로 위로). 주제와 독립.

## 6. 아키텍처 매핑 (CLAUDE.md 방향 규칙)

- `lib/song.ts` — 픽·URL 로직 (순수) ← 유일한 단위 테스트 대상
- `api/songs.ts` — Supabase 조회 훅
- `components/SongCard.tsx` — 표현 + 로컬 오디오
- `app/(tabs)/today/index.tsx` — 조합 (곡 카드 + 주제 카드)
- `supabase/migrations/<ts>_song_pool.sql`(스키마·RLS) + `<ts>_song_pool_seed.sql`(시드)
- `scripts/build-song-pool.py` — 빌드타임 생성기 (프로덕션 무관)

## 7. 테스트 (lib 단위 — 유일한 대상)

- `pickTodaySong`: 같은 날 → 같은 곡; 다음 날 → 다음 seq; 끝에서 순환; 빈 풀 → null.
- `kstDayNumber`: KST 자정 경계에서 올바른 증가.
- `youtubeMusicSearchUrl`: 한글·공백·특수문자 인코딩.

## 8. 신규 의존성 / 설정

- **`expo-audio`** 신규 설치 (30초 미리듣기).
- 런타임 신규 시크릿 **없음**. 빌드타임 스크립트만 로컬 `ANTHROPIC_API_KEY` 사용.

## 9. 열린 결정 (전부 확정됨)

- 시간대 테마: **폐기** (출퇴근 시간 편차).
- 무드 표시: **0.1엔 숨김**, 데이터엔 `mood` 보존.
- 픽 범위: **전역**(모든 커플 같은 곡) — 두 사람 일치라는 요건 충족, 커플별 다양화는 이후.
- 미리듣기: **필수 포함**.
