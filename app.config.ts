import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * 동적 설정 — app.json을 베이스로 카카오 SDK 플러그인을 주입한다.
 * KAKAO_NATIVE_APP_KEY는 .env(로컬) / EAS secrets(빌드)에서 온다. (PRD §10)
 * 카카오 네이티브 모듈은 Expo Go에서 동작하지 않음 → dev client 빌드 필요:
 *   npx expo run:ios | npx expo run:android | eas build --profile development
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const kakaoKey = process.env.KAKAO_NATIVE_APP_KEY;
  // 키가 없으면 플러그인을 빼고 경고만 — prebuild 전까지는 키 없이도 개발 가능
  const kakaoPlugin = kakaoKey
    ? [
        [
          '@react-native-kakao/core',
          {
            nativeAppKey: kakaoKey,
            android: { authCodeHandlerActivity: true },
            ios: { handleKakaoOpenUrl: true },
          },
        ] as const,
      ]
    : (console.warn('[app.config] KAKAO_NATIVE_APP_KEY 미설정 — 카카오 플러그인 제외'), []);
  return {
    ...config,
    name: config.name ?? 'duet',
    slug: config.slug ?? 'duet',
    plugins: [...(config.plugins ?? []), ...kakaoPlugin] as ExpoConfig['plugins'],
    extra: { ...config.extra, kakaoNativeAppKey: kakaoKey ?? null },
  };
};
