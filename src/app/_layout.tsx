import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, type ErrorBoundaryProps } from 'expo-router';
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
import { useQueryFocus } from '@/api/focus';
import { usePushRegistration } from '@/api/notifications';

// 네이티브 스플래시는 BrandSplash가 마운트된 뒤 직접 내린다 (워드마크 등장까지 이어붙이기)
SplashScreen.preventAutoHideAsync();

/** 웹에서 앱이 차지할 최대 가로폭 — 큰 폰(iPhone Pro Max 430pt) 기준 */
const PHONE_MAX_WIDTH = 430;

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
  useQueryFocus();
  usePushRegistration();
  useNotificationClickRouting();
  return null;
}

function RootLayout() {
  const insets = useSafeAreaInsets();
  const [splashDone, setSplashDone] = useState(isWebAuthReturn);
  const onSplashDone = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    /*
      웹의 부트 스플래시(index.html에 HTML로 박아 둔 마크)를 치운다 — 웹에는 네이티브
      스플래시가 없어 번들 받는 동안 그게 대신 서 있다. 자식 effect가 먼저 도니 이 시점엔
      BrandSplash가 이미 같은 자리에 같은 마크를 그린 뒤다(BrandSplash를 건너뛰는
      isWebAuthReturn도 여기서 함께 치워진다). 이 줄이 없으면 앱 위에 계속 덮여 있다.
    */
    if (Platform.OS === 'web') document.getElementById('boot-splash')?.remove();
    // BrandSplash를 띄우지 않으므로 네이티브 스플래시도 여기서 내린다
    if (isWebAuthReturn) SplashScreen.hideAsync();
    // 웹에서는 body 배경을 index.html의 CSS가 맡는다 — 이 API는 body에 인라인 스타일을
    // 박아 넣어서, 데스크톱 폭에서 앱 바깥을 어둡게 까는 미디어쿼리를 이겨 버린다
    if (Platform.OS !== 'web') SystemUI.setBackgroundColorAsync(color.bg);
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
      {/*
        웹(데스크톱)에서는 앱을 폰 너비로 묶어 화면 가운데 세운다 — 이 앱의 모든 화면은
        한 손 폭을 전제로 짜여 있어서, 브라우저 창만큼 늘어나면 카드가 가로로 벌어지고
        글줄이 화면을 가로지른다. 폭을 여기 한 곳에서만 잠그면 화면들은 아무것도 모른 채
        평소대로 그려진다.
      */}
      <View
        style={{
          flex: 1,
          backgroundColor: color.bg,
          ...(Platform.OS === 'web'
            ? { width: '100%', maxWidth: PHONE_MAX_WIDTH, alignSelf: 'center' }
            : null),
        }}
      >
        {/*
          모든 화면이 시스템 상태바 아래에서 시작하도록 — 없으면 헤더가 상태바에 가려 터치도 먹지 않는다.
          웹은 인라인 padding 대신 index.html의 `[data-safe-top]`이 CSS env()로 그린다
          (JS 인셋은 마운트 시점 값에서 잘 갱신되지 않는다 — CoupleTabBar 주석 참고)
        */}
        <View
          style={{ flex: 1, paddingTop: Platform.OS === 'web' ? undefined : insets.top }}
          {...(Platform.OS === 'web' ? { dataSet: { safeTop: '' } } : {})}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.bg },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modals" options={{ presentation: 'modal' }} />
            {/*
              스토리 편집만 시트가 아니라 전체 화면이다. iOS 시트는 키보드가 올라오면
              카드째 위로 밀려 올라가는데(시스템 동작), 사진이 화면에 못 박혀 있어야 하는
              화면이라 그 순간 사진까지 통째로 딸려 올라갔다
            */}
            <Stack.Screen name="story/create" options={{ presentation: 'fullScreenModal' }} />
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

/**
 * 푸시 알림을 탭했을 때의 이동 — 앱이 **이미 열려 있는 경우**만 여기로 온다.
 * 닫혀 있으면 서비스워커가 openWindow(url)로 바로 그 경로를 열기 때문에 할 일이 없다.
 * (public/sw.js의 notificationclick 참조)
 */
function useNotificationClickRouting() {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'notification-click' && typeof e.data.url === 'string') {
        router.push(e.data.url as never);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [router]);
}

/**
 * 렌더 트리에서 에러가 터졌을 때 사용자가 보는 화면.
 *
 * Sentry.wrap은 **보고만** 한다 — 폴백을 주지 않으면 프로덕션에서는 아무것도 그려지지 않은
 * 검은 화면이 남고, 사용자는 앱이 죽었는지 로딩 중인지 알 수 없다.
 * expo-router가 이 이름의 export를 앱 전체의 경계로 쓰고 retry까지 쥐여 준다.
 * 보고는 여기서 명시적으로 한다 — 경계가 에러를 삼키면 Sentry.wrap까지 올라가지 않는다.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.bg,
        paddingHorizontal: 32,
        gap: 12,
      }}
    >
      <Text style={{ fontWeight: '700', fontSize: 16, color: color.white, textAlign: 'center' }}>
        문제가 생겼어요
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 22, color: color.sub, textAlign: 'center' }}>
        잠시 후 다시 시도해 주세요. 계속 이러면 앱을 완전히 껐다가 열어주세요.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => retry()}
        style={{
          marginTop: 8,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 999,
          backgroundColor: color.accent,
        }}
      >
        <Text style={{ fontWeight: '700', fontSize: 14, color: color.onPrimary }}>다시 시도</Text>
      </Pressable>
    </View>
  );
}
