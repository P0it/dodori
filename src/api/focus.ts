import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * AppState → TanStack Query focusManager.
 *
 * RN에는 window의 visibilitychange가 없어 기본 refetchOnWindowFocus가 한 번도 발화하지 않는다.
 * 이걸 잇지 않으면 앱이 떠 있는 동안 데이터가 갱신되는 길은 (1) 화면 첫 마운트 — 탭은 계속
 * 마운트돼 있어 해당 없음 (2) 내 mutation의 invalidate (3) Realtime 이벤트뿐인데,
 * 백그라운드 동안 소켓이 끊기며 놓친 이벤트는 되돌아오지 않는다. 결과적으로 앱을 껐다 켜야만
 * 상대가 한 일이 보였다.
 *
 * 웹은 브라우저가 focus 이벤트를 주므로 기본 동작에 맡긴다.
 */
export function useQueryFocus() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => sub.remove();
  }, []);
}
