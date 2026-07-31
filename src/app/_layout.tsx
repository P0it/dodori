import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { color } from '@/theme/tokens';
import { BrandSplash } from '@/components/BrandSplash';
import { useAuthListener } from '@/api/auth';
import { useCoupleRealtime } from '@/api/realtime';
import { usePushRegistration } from '@/api/notifications';

// 네이티브 스플래시는 BrandSplash가 마운트된 뒤 직접 내린다 (워드마크 등장까지 이어붙이기)
SplashScreen.preventAutoHideAsync();

/**
 * 웹 카카오 OAuth는 페이지를 통째로 다시 로드하며 돌아온다 — 로그인 한 번에 스플래시를 두 번
 * 보게 되므로 복귀 로드에서는 건너뛴다. supabase가 URL의 인증 파라미터를 지우기 전에 읽어야 해서
 * 모듈 평가 시점(동기)에 판정한다.
 */
const isWebAuthReturn =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  /[?#].*(code=|access_token=|error=)/.test(window.location.href);

// 크래시·에러 리포팅. DSN은 공개값이라 클라이언트에 박혀도 된다.
// DSN이 없는 환경(DSN 미설정 로컬)에서는 초기화를 건너뛴다 — Sentry 없이도 앱은 떠야 한다.
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000, // persist 대상이므로 넉넉히 (PRD §9: 마지막 캐시 즉시 렌더)
      retry: 2,
    },
  },
});

const persister = createAsyncStoragePersister({ storage: AsyncStorage });

/** QueryClientProvider 안쪽에서 auth·Realtime·푸시 등록 (§7.5·§7.7) */
function AuthBridge() {
  useAuthListener();
  useCoupleRealtime();
  usePushRegistration();
  return null;
}

function RootLayout() {
  const insets = useSafeAreaInsets();
  const [splashDone, setSplashDone] = useState(isWebAuthReturn);
  const onSplashDone = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    // BrandSplash를 띄우지 않으므로 네이티브 스플래시도 여기서 내린다
    if (isWebAuthReturn) SplashScreen.hideAsync();
    SystemUI.setBackgroundColorAsync(color.bg);
    // 카카오 JS SDK 초기화 — 네이티브 모듈은 dev client에서만 존재
    const kakaoKey = Constants.expoConfig?.extra?.kakaoNativeAppKey as string | null;
    if (kakaoKey && Platform.OS !== 'web') {
      import('@react-native-kakao/core')
        .then(({ initializeKakaoSDK }) => initializeKakaoSDK(kakaoKey))
        .catch(() => console.warn('[kakao] 네이티브 모듈 없음 — dev client 빌드 필요'));
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        // 이미 ['session']=null이 저장된 기기가 있다 — 버스터를 올려 옛 캐시를 한 번 버린다
        buster: 'session-excluded-1',
        // 세션은 캐시로 복원하지 않는다 — supabase가 토큰을 따로 들고 있고, 여기 담긴 낡은 값이
        // 복원되면 (staleTime Infinity라 재조회도 없어) 로그인 직후에도 로그아웃 상태로 보인다
        dehydrateOptions: { shouldDehydrateQuery: (q) => q.queryKey[0] !== 'session' },
      }}
    >
      <AuthBridge />
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        {/* 모든 화면이 시스템 상태바 아래에서 시작하도록 — 없으면 헤더가 상태바에 가려 터치도 먹지 않는다 */}
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.bg },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modals" options={{ presentation: 'modal' }} />
          </Stack>
        </View>
        {!splashDone && <BrandSplash onDone={onSplashDone} />}
      </View>
    </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

// Sentry.wrap — 렌더 트리에서 터진 에러를 잡아 보고한다
export default Sentry.wrap(RootLayout);
