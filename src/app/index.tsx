import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/api/auth';
import { useMyCouple } from '@/api/couple';
import { color } from '@/theme/tokens';

/** 진입 가드 — 세션·커플 연결·시작일 입력 상태에 따라 분기 */
export default function Index() {
  const session = useSession();
  const couple = useMyCouple();

  if (session.isPending || (session.data && couple.isPending)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  if (!session.data) return <Redirect href="/(auth)/login" />;
  const c = couple.data;
  if (!c) return <Redirect href="/(auth)/connect" />;
  if (c.memberCount < 2) return <Redirect href="/(auth)/send-invite" />;
  if (!c.startedAt) return <Redirect href="/(auth)/start-date" />;
  return <Redirect href="/(tabs)/home" />;
}
