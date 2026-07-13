import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import Constants from 'expo-constants';
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

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const [splashDone, setSplashDone] = useState(false);
  const onSplashDone = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
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
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
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
  );
}
