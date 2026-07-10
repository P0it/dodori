import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { KakaoButton } from '@/components/KakaoButton';
import { DodoriMark } from '@/components/DodoriMark';
import { useSignInWithKakao } from '@/api/auth';

export default function Login() {
  const router = useRouter();
  const signIn = useSignInWithKakao();

  const onKakao = () => {
    if (signIn.isPending) return;
    signIn.mutate(undefined, {
      onSuccess: () => router.replace('/'),
      onError: (e) =>
        Alert.alert('카카오 로그인 실패', e instanceof Error ? e.message : String(e)),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <DodoriMark size={54} />
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{ fontFamily: typeface, fontWeight: '800', fontSize: 40, letterSpacing: -0.5, color: color.white }}
          >
            dodori
          </Text>
          <Text style={{ fontFamily: typeface, fontWeight: '500', fontSize: 15, color: color.sub, marginTop: 8 }}>
            둘이서 쓰는 캘린더, 둘만의 아카이브
          </Text>
        </View>
      </View>
      <View style={{ gap: 12, paddingBottom: 48 }}>
        <KakaoButton onPress={onKakao} />
        <Text
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: color.muted,
            marginTop: 6,
            lineHeight: 17,
          }}
        >
          계속하면 이용약관과 개인정보 처리방침에{'\n'}동의하는 것으로 간주돼요.
        </Text>
      </View>
    </View>
  );
}
