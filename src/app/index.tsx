import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/api/auth';
import { useMyCouple } from '@/api/couple';
import { usePendingInvite } from '@/api/pendingInvite';
import { color, radius, space, typeface } from '@/theme/tokens';

/** 진입 가드 — 세션·커플 연결·시작일 입력 상태에 따라 분기 */
export default function Index() {
  const session = useSession();
  const couple = useMyCouple();
  const pendingInvite = usePendingInvite();

  if (session.isPending || pendingInvite.isPending || (session.data && couple.isPending)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  if (!session.data) return <Redirect href="/(auth)/login" />;

  /*
    커플 조회가 실패하면 여기서 멈춘다.
    아래 분기는 couple.data가 undefined인 것을 "연결된 커플이 없다"로 읽는다 — 실패와
    없음이 같은 모양이라, 비행기 모드나 서버 장애에서 **이미 연결된 사람이 초대 화면으로**
    떨어졌다. 캐시가 있으면 가려지지만 캐시가 비어 있는 첫 실행에서는 그대로 드러난다.
  */
  if (couple.isError) return <RetryScreen onRetry={() => couple.refetch()} />;

  const c = couple.data;
  // 초대 링크로 들어왔으면 연결 방식을 다시 묻지 않고 코드 입력으로 직행 (코드는 채워져 있다)
  if (!c && pendingInvite.data) {
    return <Redirect href={`/(auth)/code-entry?code=${pendingInvite.data}`} />;
  }
  if (!c) return <Redirect href="/(auth)/connect" />;
  // 시작일을 상대 수락보다 먼저 묻는다 — 판을 깐 사람이 채우고, 들어온 사람은 바로 홈으로
  if (!c.startedAt) return <Redirect href="/(auth)/start-date" />;
  if (c.memberCount < 2) return <Redirect href="/(auth)/send-invite" />;
  return <Redirect href="/(tabs)/home" />;
}

/** 연결 상태를 확인하지 못했을 때 — 로그아웃시키지 않고 다시 시도만 시킨다 */
function RetryScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.bg,
        paddingHorizontal: space[8],
        gap: space[3],
      }}
    >
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '700',
          fontSize: 16,
          color: color.white,
          textAlign: 'center',
        }}
      >
        연결 상태를 불러오지 못했어요
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 22, color: color.sub, textAlign: 'center' }}>
        인터넷 연결을 확인하고 다시 시도해 주세요.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={{
          marginTop: space[2],
          paddingHorizontal: space[6],
          paddingVertical: space[3],
          borderRadius: radius.pill,
          backgroundColor: color.accent,
        }}
      >
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.onPrimary }}>
          다시 시도
        </Text>
      </Pressable>
    </View>
  );
}
