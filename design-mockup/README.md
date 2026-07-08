# design-mockup — Duet UI 목업 (참조 전용)

Claude Design 프로젝트 `bd527553-671a-4c91-8640-e790c75f0ed9` ("Design decisions summary")에서 동기화한 목업입니다.
**앱 구현의 시각적 원본(source of truth)** 이며, 앱 번들에는 포함되지 않습니다.

## 보는 법

`index.html`을 브라우저로 열면 7개 그룹 27개 화면이 캔버스로 렌더됩니다.
(React/Babel CDN을 로드하므로 인터넷 연결 필요)

## ⚠️ assets/ 사진은 플레이스홀더

원본 사진 12장은 도구 전송 한도(256KiB)를 초과해 받지 못했고, 레이아웃 확인용
**단색 그라디언트 플레이스홀더**로 대체되어 있습니다. 원본이 필요하면
[claude.ai 디자인 페이지](https://claude.ai/design/p/bd527553-671a-4c91-8640-e790c75f0ed9)에서
각 이미지를 저장해 `assets/`에 같은 파일명으로 덮어쓰세요.

원본 사진은 PRD §6.5에 따라 **목업 전용**이며 앱 구현(번들·시드 데이터)에 사용하지 않습니다.

## 구조

- `app/shared.jsx` — 공용 컴포넌트 원본 (Screen, Dday, OwnerDot, CoupleTabs, NextUp, TopBar, AnnivCover …) → RN 이식은 `src/components/`
- `app/{onboarding,playlist,places,track,calendar,create,studio}.jsx` — 화면 그룹별 목업
- `_ds/.../tokens/*.css` — 디자인 토큰 원본 → RN 이식은 `src/theme/tokens.ts`
- `_ds/.../_ds_bundle.js` — Spotify Mobile Design System 컴포넌트 번들 (Icon, PillButton, CoverArt …)
