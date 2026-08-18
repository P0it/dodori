/**
 * 웹 푸시 구독 (RFC 8291 / VAPID) — PWA 전용.
 *
 * 네이티브는 Expo Push(`usePushRegistration`)를 그대로 쓴다. 웹은 expo-notifications가
 * 지원하지 않아 표준 Web Push를 직접 붙인다. 두 경로 모두 워커가 함께 발송한다.
 *
 * 설계: docs/superpowers/specs/2026-08-18-web-push-notifications-design.md
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useSession } from './auth';

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

export type WebPushState =
  /** 이 기기에서는 웹 푸시를 쓸 수 없다 (네이티브이거나 지원하지 않는 브라우저) */
  | 'unsupported'
  /** iOS Safari — 홈 화면에 추가해야 알림을 받을 수 있다 */
  | 'needs-install'
  /** 켤 수 있는 상태 */
  | 'off'
  /** 브라우저 권한이 거부됨 — 앱에서 되돌릴 수 없다 (브라우저 설정에서 풀어야 함) */
  | 'denied'
  | 'on';

/** iOS는 홈 화면에 설치된 PWA(standalone)에서만 웹 푸시가 된다 */
function isIOSBrowserTab(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  if (!isIOS) return false;
  const standalone = (navigator as { standalone?: boolean }).standalone === true;
  const displayMode = window.matchMedia?.('(display-mode: standalone)').matches === true;
  return !standalone && !displayMode;
}

function supported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY
  );
}

/** base64url VAPID 공개키 → Uint8Array (PushManager가 요구하는 형식) */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = window.atob(padded);
  // ArrayBuffer로 명시해 만든다 — Uint8Array.from은 SharedArrayBuffer도 될 수 있어 BufferSource로 안 좁혀진다
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** 서비스워커 등록 — 여러 번 불려도 브라우저가 같은 등록을 돌려준다 */
async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js');
}

/** 지금 이 기기의 알림 상태 */
export function useWebPushState() {
  const session = useSession();
  const uid = session.data?.user.id;
  return useQuery({
    queryKey: ['webPush', 'state', uid],
    // 브라우저 권한은 다른 탭·설정에서 바뀔 수 있어 캐시를 오래 들고 있지 않는다
    staleTime: 0,
    queryFn: async (): Promise<WebPushState> => {
      if (!supported()) return isIOSBrowserTab() ? 'needs-install' : 'unsupported';
      if (isIOSBrowserTab()) return 'needs-install';
      if (Notification.permission === 'denied') return 'denied';
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      return sub ? 'on' : 'off';
    },
  });
}

/**
 * 알림 켜기 — **반드시 사용자 제스처(버튼 onPress) 안에서 불러야 한다.**
 * iOS Safari는 제스처 밖의 requestPermission()을 거부한다.
 */
export function useEnableWebPush() {
  const qc = useQueryClient();
  const session = useSession();
  const uid = session.data?.user.id;
  return useMutation({
    mutationFn: async () => {
      if (!uid) throw new Error('로그인이 필요해요');
      if (!supported()) throw new Error('이 기기에서는 알림을 켤 수 없어요');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('알림 권한이 필요해요');

      const reg = await registration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
        }));

      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) throw new Error('구독 정보를 만들지 못했어요');

      // endpoint가 unique — 같은 기기에서 다시 켜면 갱신된다
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: uid,
          endpoint: sub.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          failed_at: null,
        },
        { onConflict: 'endpoint' },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webPush'] }),
  });
}

/** 알림 끄기 — 이 기기의 구독만 지운다 */
export function useDisableWebPush() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!supported()) return;
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webPush'] }),
  });
}
