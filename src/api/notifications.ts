import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useSession } from './auth';
import type { NotificationKind, NotificationTargetKind } from '@/lib/notifications';

/**
 * 푸시 토큰 등록 (§7.7) — dev client에서만 동작(Expo Go 제한), 실패는 조용히 무시.
 * 토큰은 profiles.push_token에 저장, 발송은 Edge Function(daily-release 등)이 담당.
 */
export function usePushRegistration() {
  const session = useSession();
  const uid = session.data?.user.id;

  useEffect(() => {
    if (!uid || Platform.OS === 'web') return;
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        const Device = await import('expo-device');
        if (!Device.isDevice) return;
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: '기본',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await supabase.from('profiles').update({ push_token: token }).eq('id', uid);
      } catch (e) {
        console.warn('[push] 토큰 등록 실패 (dev client 필요):', e);
      }
    })();
  }, [uid]);
}

/* ------------------------------------------------------------------
   알림 목록·배지 — 행은 DB 트리거가 만들고, 여기서는 읽기와 읽음 처리만 한다.
   설계: docs/superpowers/specs/2026-08-18-web-push-notifications-design.md
   ------------------------------------------------------------------ */

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  targetKind: NotificationTargetKind;
  targetId: string;
  preview: string | null;
  actorId: string;
  readAt: string | null;
  createdAt: string;
}

/** 최근 알림 (읽은 것 포함) — 목록 화면용 */
export function useNotifications() {
  const session = useSession();
  const uid = session.data?.user.id;
  return useQuery({
    queryKey: ['notifications', 'list', uid],
    enabled: !!uid,
    queryFn: async (): Promise<AppNotification[]> => {
      // RLS(recipient_id = auth.uid())가 내 알림만 돌려주므로 필터를 걸지 않는다
      const { data, error } = await supabase
        .from('notifications')
        .select('id, kind, target_kind, target_id, preview, actor_id, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        kind: r.kind as NotificationKind,
        targetKind: r.target_kind as NotificationTargetKind,
        targetId: r.target_id,
        preview: r.preview,
        actorId: r.actor_id,
        readAt: r.read_at,
        createdAt: r.created_at,
      }));
    },
  });
}

/** 안 읽은 수 — 종 아이콘 점과 앱 아이콘 배지가 같은 값을 쓴다 */
export function useUnreadCount() {
  const session = useSession();
  const uid = session.data?.user.id;
  return useQuery({
    queryKey: ['notifications', 'unread', uid],
    enabled: !!uid,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** 알림 하나 읽음 — 목록에서 탭할 때 */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

/**
 * 안 읽은 수를 앱 아이콘 배지에 반영한다.
 * 푸시가 올 때는 서비스워커가 찍지만, 앱 안에서 읽고 나면 여기서 내려준다.
 * (서비스워커는 DB를 못 읽으므로 두 곳 모두 필요하다)
 */
export function useAppBadgeSync(unread: number | undefined) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (unread === undefined) return;
    // 실패는 무시한다 — 배지는 지원하지 않는 브라우저가 있고, 없다고 앱이 망가지진 않는다
    void (unread > 0 ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.())?.catch(() => {});
  }, [unread]);
}
