import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { color } from '@/theme/tokens';

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

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(color.bg);
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
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
