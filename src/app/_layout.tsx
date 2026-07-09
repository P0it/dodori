import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { color } from '@/theme/tokens';
import { useAuthListener } from '@/api/auth';
import { useCoupleRealtime } from '@/api/realtime';
import { usePushRegistration } from '@/api/notifications';

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
    </PersistQueryClientProvider>
  );
}
