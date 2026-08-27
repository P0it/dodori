// ESLint 설정 — `npm run lint`(expo lint)가 이 파일을 찾는다.
// 없으면 lint 스크립트가 설정 생성 프롬프트에서 멈춘다(비대화형 실행에서는 그냥 실패한다).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      // 빌드 산출물·네이티브 생성물
      'dist/*',
      'android/*',
      'ios/*',
      '.expo/*',
      // 참조 전용 목업 — Claude Design이 뽑은 남의 코드고 앱 번들에 들어가지 않는다.
      // 여기 경고를 섞으면 우리 코드의 문제 20여 건이 400건 사이에 묻힌다 (실측)
      'design-mockup/*',
      // Deno 런타임 — `npm:` 지정자와 원격 import를 Node 해석기가 풀지 못한다.
      // 이쪽 타입 검사는 supabase CLI(deno check)의 몫이다
      'supabase/functions/*',
    ],
  },
  {
    // 이미 붙어 있던 eslint-disable 주석들은 이 설정에 없는 규칙(no-explicit-any 등)을
    // 가리켜 "쓸모없는 지시자"로 보고된다. 주석을 지우면 다른 설정에서 되살아날 때 다시
    // 붙여야 하므로, 보고만 끈다.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      /*
        React Compiler의 세 규칙은 Reanimated의 shared value 패턴(`x.value = …`)을
        "props/훅 인자를 수정한다"고 읽어 전부 오탐한다 — 워클릿 안에서의 `.value` 할당은
        Reanimated의 정상적인 사용법이고, 이 앱의 제스처·애니메이션이 전부 그 위에 서 있다.
        끄지 않으면 error 74건이 상시로 깔려 lint가 아무 신호도 주지 못한다.
      */
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      /*
        이건 오탐이 아니라 실제 개선 여지다(효과 안에서 동기적으로 setState → 연쇄 렌더).
        다만 해당하는 9곳은 대부분 "데이터가 도착하면 초기값을 한 번 세팅"하는 자리라
        고치려면 화면 로직을 재설계해야 한다. 지금 손대면 회귀 위험이 이득보다 크다 —
        경고로 남겨 다음에 그 화면을 만질 때 함께 정리한다.
      */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
