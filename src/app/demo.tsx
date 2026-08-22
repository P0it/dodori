import { Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, radius, space, typeface } from '@/theme/tokens';
import { DodoriMark } from '@/components/DodoriMark';
import { useSignInWithEmailDev } from '@/api/auth';

/**
 * 포트폴리오용 둘러보기 — 공개 링크(`…/demo`)로 들어온 사람을 데모 커플의 '한지우' 계정으로
 * 로그인시킨다. 앱 전체에서 데모를 아는 곳은 이 파일 하나뿐이다: 로그인 뒤로는 평범한
 * 로그인 사용자와 완전히 같은 경로를 탄다(진입 가드 → 홈). 데모 전용 분기를 화면마다 심으면
 * 데모에서만 깨지는 화면이 생긴다 — 포트폴리오에서 가장 나쁜 실패다.
 *
 * 데이터는 서버가 매일 04:00 KST에 되돌린다 (`reset_demo_couple()`).
 *
 * 계정 값은 EXPO_PUBLIC_이라 웹 번들에 그대로 박힌다. 의도한 것이다 —
 * 이 계정은 데모 커플 하나에만 속하고 매일 초기화되는 일회용 계정이다.
 */
const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL;
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD;

export default function Demo() {
  const router = useRouter();
  const signIn = useSignInWithEmailDev();
  const configured = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

  const onStart = () => {
    if (signIn.isPending || !configured) return;
    signIn.mutate(
      { email: DEMO_EMAIL!, password: DEMO_PASSWORD! },
      // 홈으로 직행하지 않고 루트로 보낸다 — 커플 연결·시작일 가드를 실제 사용자와 똑같이 태운다
      { onSuccess: () => router.replace('/') },
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.bg,
        paddingHorizontal: 28,
        alignItems: 'center',
        justifyContent: 'center',
        gap: space[6],
      }}
    >
      <DodoriMark size={72} showWord layout="stack" />

      <View style={{ gap: space[3], maxWidth: 420 }}>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 20,
            color: color.white,
            textAlign: 'center',
          }}
        >
          둘러보기 모드
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 22, color: color.sub, textAlign: 'center' }}>
          도돌이는 커플 두 사람이 함께 쓰는 앱이에요.{'\n'}
          로그인이나 상대 없이도 볼 수 있도록,{'\n'}
          가상의 커플 데이터를 준비해 두었어요.
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 21, color: color.muted, textAlign: 'center' }}>
          마음껏 눌러보고 써보셔도 괜찮아요.{'\n'}
          남긴 것은 매일 새벽에 처음 상태로 돌아갑니다.
        </Text>
      </View>

      {configured ? (
        <Pressable
          onPress={onStart}
          style={({ pressed }) => ({
            width: '100%',
            maxWidth: 420,
            alignItems: 'center',
            justifyContent: 'center',
            height: 50,
            borderRadius: radius.pill,
            backgroundColor: color.accent,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.bg }}
          >
            {signIn.isPending ? '준비하는 중…' : '둘러보기 시작'}
          </Text>
        </Pressable>
      ) : (
        <Text style={{ fontSize: 12, color: color.muted, textAlign: 'center' }}>
          데모 계정이 설정되지 않았어요{'\n'}
          (EXPO_PUBLIC_DEMO_EMAIL / EXPO_PUBLIC_DEMO_PASSWORD)
        </Text>
      )}

      {signIn.isError && (
        <Text style={{ fontSize: 12, color: color.sub, textAlign: 'center' }}>
          들어가지 못했어요 —{' '}
          {signIn.error instanceof Error ? signIn.error.message : String(signIn.error)}
        </Text>
      )}

      {Platform.OS === 'web' && (
        <Text style={{ fontSize: 11, color: color.muted, textAlign: 'center' }}>
          한지우 · 박서연 — 실제 인물이 아니에요
        </Text>
      )}
    </View>
  );
}
