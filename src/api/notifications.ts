import { useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useSession } from './auth';

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
