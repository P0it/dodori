/** @type {import('tailwindcss').Config} */
// 모든 색상은 design-mockup/_ds/.../tokens/colors.css + app/shared.jsx의 C 팔레트에서 옮겨온 토큰이다.
// 컴포넌트에서 hex 하드코딩 금지 — 반드시 이 토큰(또는 src/theme/tokens.ts)을 참조한다. (PRD §6.2)
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // 역할 규약 (PRD §6.2): 나=green / 상대=pink / 기념일=amber
        me: '#1ED760',
        partner: '#E8688F',
        anniv: '#E8B84B',
        // 브랜드 green 계열
        'green-bright': '#1ED760',
        'green-core': '#1DB954',
        'green-press': '#17B54E',
        // 서피스 (다크 테마 기본)
        bg: '#121212',
        surface: {
          1: '#181818',
          2: '#282828',
          3: '#333333',
          4: '#3E3F3F',
        },
        hairline: '#47464B',
        // 텍스트
        sub: '#B3B3B3',
        muted: '#777777',
        'on-primary': '#191414',
        // 카카오
        kakao: '#FEE500',
        'kakao-text': '#191600',
      },
      borderRadius: {
        mini: '3px',
        card: '4px',
        'cover-sm': '5px',
        field: '6px',
        cover: '7px',
      },
      fontSize: {
        'screen-title': '34px',
        h1: '28px',
        section: '24px',
        'album-title': '22px',
        'title-md': '16px',
        body: '15px',
        meta: '13px',
        micro: '11px',
        tab: '10px',
      },
    },
  },
  plugins: [],
};
