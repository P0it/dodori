# 전곡 듣기 — 음악 서비스 선택 설계

- 날짜: 2026-07-23
- 상태: 설계 확정 (구현 전)
- 자리: **홈** 탭 `SongCard`의 "전곡 듣기 ›"
- 선행 스펙: [2026-07-16 오늘의 추천곡](./2026-07-16-daily-song-design.md)

## 1. 문제

"전곡 듣기"가 유튜브 뮤직으로 하드코딩돼 있다(`lib/song.ts`의 `youtubeMusicSearchUrl`, `components/SongCard.tsx`에서 `Linking.openURL`). 한국 사용자의 음원 앱은 멜론·지니·플로·스포티파이·유튜브 뮤직 등으로 갈리므로, 유튜브 뮤직을 안 쓰는 사람은 매번 남의 앱으로 튕긴다.

### OS가 대신 해주지 않는 것 (검토 결과)

"OS가 알아서 사용자의 음악 앱을 열어주면 되지 않나"를 먼저 따졌고, 답은 아니다.

- iOS·Android 어디에도 **"기본 음악 앱"** 개념이 없다. 브라우저·메일과 달리 OS 설정에 그런 항목 자체가 없다.
- Android의 `MEDIA_PLAY_FROM_SEARCH` 인텐트는 유튜브 뮤직·스포티파이 정도만 받고 국내 앱들은 대체로 받지 않는다. iOS엔 대응물이 없다.
- 공유 시트는 "텍스트를 받는" 것이지 "그 곡을 검색해 재생"하지 않는다. 음악 앱이 아니라 메신저·메모가 뜨는 시트가 된다.

OS가 해주는 것은 **"URL → 그 도메인을 소유한 앱"** 매칭까지다(iOS Universal Links / Android App Links). 즉 어느 서비스인지는 우리가 정해야 하고, 정하고 나면 앱 열기는 OS가 대신한다. 현행 유튜브 뮤직 링크가 이미 그 방식으로 동작 중이다.

## 2. 결정

**"전곡 듣기"를 누르면 서비스 선택 바텀시트를 띄우고, 고른 서비스의 https 링크를 연다.**

확정된 선택들:

| 항목 | 결정 | 이유 |
|---|---|---|
| 선택 시점 | **매번 물어본다** | 하루 한 번 누를까 말까 한 버튼이라 두 번 탭의 비용이 작다. 저장·설정 UI·초기화 케이스가 통째로 사라진다 |
| 저장 | **없음** | 위와 같음. AsyncStorage도 `profiles` 컬럼도 쓰지 않는다 |
| 서비스 범위 | **유튜브 뮤직 / 스포티파이 / 애플 뮤직 / 멜론** 4종 | 앞 셋은 링크 형태가 문서화돼 안정적이고, 멜론은 국내 점유율상 값어치가 있다. 지니·플로·바이브·벅스는 스킴 검증 부담이 커서 필요해지면 추가 |
| 링크 방식 | **전부 평범한 https** | 아래 §3 |
| 설치 감지 | **하지 않는다** | 아래 §3 |

## 3. 링크 전략 — 커스텀 스킴 없이 전부 https

네 서비스 모두 자기 웹 도메인을 앱이 소유하므로, https 링크 하나만 열면 OS가 앱→(미설치 시)웹으로 알아서 보낸다.

따라서 **`canOpenURL`도, iOS `LSApplicationQueriesSchemes`도, Android manifest `queries`도, config plugin도 필요 없다.** 설치 감지로 목록을 거르는 것도 불필요하다 — 미설치 서비스를 골라도 웹으로 떨어질 뿐 기능이 죽지 않는다.

| 서비스 | 링크 |
|---|---|
| 유튜브 뮤직 | `https://music.youtube.com/search?q=<artist title>` (현행 유지) |
| 스포티파이 | `https://open.spotify.com/search/<artist title>` (경로 세그먼트) |
| 애플 뮤직 | **`song.appleUrl`** — 검색이 아니라 그 곡 직링크 |
| 멜론 | `https://www.melon.com/search/total/index.htm?q=<artist title>` |

애플 뮤직만 검색이 아닌 이유: `Song.appleUrl`(iTunes `trackViewUrl`)이 DB·타입에 이미 있는데 어디서도 쓰이지 않는 죽은 필드였다(`api/songs.ts`). 이번에 살린다. `appleUrl`이 빈 문자열인 곡이 있을 수 있으므로 그때는 애플 뮤직 검색 URL(`https://music.apple.com/kr/search?term=`)로 떨어뜨린다.

## 4. 코드 구조

`lib/`는 순수, `components/`는 props-only라는 방향 규칙을 그대로 따른다.

**`src/lib/song.ts`** — `youtubeMusicSearchUrl()`를 서비스 표로 대체
```ts
export interface MusicService {
  id: 'youtube' | 'spotify' | 'apple' | 'melon';
  label: string;              // '유튜브 뮤직' 등
  url: (song: Song) => string;
}
export const MUSIC_SERVICES: MusicService[];
```
순수 함수라 lib/ 규칙에 맞고 단위 테스트 대상이 된다.

**`src/components/MusicServiceSheet.tsx`** (신규) — `PlaylistPickerSheet`와 같은 모양의 props-only 바텀시트
- props: `{ visible, song, onSelect(service), onClose }`
- 목록이 4줄 고정이라 `ScrollView` 없이 간다
- 헤더에 곡 제목·아티스트를 한 줄로 보여줘 무엇을 여는지 드러낸다
- 색은 전부 토큰 참조, hex 금지

**`src/components/SongCard.tsx`** — "전곡 듣기 ›"가 `Linking.openURL`을 직접 부르는 대신 시트를 연다
- `useState` 하나(`sheetOpen`) 추가
- 선택 시 `Linking.openURL(service.url(song))` + 시트 닫기
- 30초 미리듣기 로직은 그대로

**변경 없음:** `api/songs.ts`, DB 스키마, 마이그레이션, 설정 화면, `app.json`.

## 5. 테스트 (lib 단위 — 유일한 대상)

`src/lib/__tests__/song.test.ts`의 `youtubeMusicSearchUrl` 블록을 `MUSIC_SERVICES` 블록으로 교체:

- 4종 각각이 기대하는 도메인·경로로 URL을 만든다
- 한글·공백·특수문자 인코딩 (기존 케이스 승계)
- 애플 뮤직: `appleUrl`이 있으면 그 값 그대로, 빈 문자열이면 검색 URL로 폴백
- `pickTodaySong` 블록은 손대지 않는다

## 6. 알려진 위험

**멜론 링크가 앱으로 전환되는지는 미검증이다.** 나머지 셋은 링크 형태가 문서화돼 있지만 멜론 검색 URL의 App Link 여부는 확인이 필요하다. 실기기에서 확인하고, 앱으로 안 넘어가면 브라우저의 멜론 검색 결과로 떨어진다(기능은 살아 있음). 그 경우 멜론 앱 스킴 추가는 별건으로 미룬다.

## 7. 비목표

- 서비스 선택 기억 / 설정 화면 노출
- 지니·플로·바이브·벅스 추가
- 설치된 앱 감지 및 목록 필터링
- 인앱 전곡 재생 (라이선스 문제로 영구 비목표)
