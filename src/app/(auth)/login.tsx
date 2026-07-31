import { useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { KakaoButton } from '@/components/KakaoButton';
import { DodoriMark } from '@/components/DodoriMark';
import { useSignInWithEmailDev, useSignInWithKakao } from '@/api/auth';

/** 웹에는 Alert.alert 구현이 없다 — 실패가 조용히 묻히면 원인을 알 길이 없다 */
function notify(title: string, body: string) {
  if (Platform.OS === 'web') window.alert(`${title}

${body}`);
  else Alert.alert(title, body);
}

export default function Login() {
  const router = useRouter();
  const signIn = useSignInWithKakao();

  const onKakao = () => {
    if (signIn.isPending) return;
    signIn.mutate(undefined, {
      onSuccess: () => router.replace('/'),
      onError: (e) =>
        notify('카카오 로그인 실패', e instanceof Error ? e.message : String(e)),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingHorizontal: 28 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <DodoriMark size={54} />
        <Text
          style={{ fontFamily: typeface, fontWeight: '800', fontSize: 40, letterSpacing: -0.5, color: color.white }}
        >
          dodori
        </Text>
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
        {/* 웹 배포는 테스트 채널이라 함께 노출한다 — 카카오 없이 개발 계정으로 화면을 확인해야 한다 */}
        {(__DEV__ || Platform.OS === 'web') && <DevEmailSignIn />}
      </View>
    </View>
  );
}

/** Expo Go에서 카카오 없이 세션을 얻기 위한 개발 전용 로그인 — 프로덕션 번들엔 포함되지 않음 */
function DevEmailSignIn() {
  const router = useRouter();
  const signIn = useSignInWithEmailDev();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    if (signIn.isPending || !email || !password) return;
    signIn.mutate(
      { email, password },
      {
        onSuccess: () => router.replace('/'),
        onError: (e) =>
          notify('개발용 로그인 실패', e instanceof Error ? e.message : String(e)),
      },
    );
  };

  return (
    <View style={{ marginTop: 20, gap: 8 }}>
      <Text style={{ fontSize: 11, color: color.muted, fontFamily: typeface }}>DEV · 이메일 로그인</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="이메일"
        placeholderTextColor={color.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: color.surface2,
          color: color.white,
          fontFamily: typeface,
          fontSize: 14,
          borderRadius: 6,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="비밀번호"
        placeholderTextColor={color.muted}
        autoCapitalize="none"
        secureTextEntry
        style={{
          backgroundColor: color.surface2,
          color: color.white,
          fontFamily: typeface,
          fontSize: 14,
          borderRadius: 6,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
      <Pressable
        onPress={onSubmit}
        style={({ pressed }) => ({
          alignItems: 'center',
          justifyContent: 'center',
          height: 44,
          borderRadius: 6,
          backgroundColor: color.surface3,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: color.white, fontFamily: typeface, fontWeight: '600', fontSize: 14 }}>
          {signIn.isPending ? '로그인 중…' : '개발용 로그인'}
        </Text>
      </Pressable>
    </View>
  );
}
