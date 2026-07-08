import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color } from '@/theme/tokens';
import { KakaoButton } from '@/components/KakaoButton';
import { DuetMark } from '@/components/DuetMark';

export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onKakao = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // 카카오 네이티브 SDK는 dev client 빌드에서만 동작 (Expo Go 불가)
      const { login } = await import('@react-native-kakao/user');
      const token = await login();
      // TODO(M1): token.idToken을 Supabase Auth(signInWithIdToken)로 교환
      console.log('kakao token', token.accessToken?.slice(0, 8));
      router.replace('/(auth)/connect');
    } catch (e) {
      Alert.alert(
        '카카오 로그인',
        'dev client 빌드와 KAKAO_NATIVE_APP_KEY 설정이 필요해요.\n' + String(e),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <DuetMark size={54} />
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{ fontWeight: '800', fontSize: 40, letterSpacing: -1.2, color: color.white }}
          >
            Duet
          </Text>
          <Text style={{ fontWeight: '500', fontSize: 15, color: color.sub, marginTop: 8 }}>
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
