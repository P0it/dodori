import { useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { KakaoButton } from '@/components/KakaoButton';
import { DodoriMark } from '@/components/DodoriMark';
import { useSignInWithEmailDev, useSignInWithKakao } from '@/api/auth';

/**
 * 개발용 이메일 로그인 노출 여부. 웹에서는 `?dev=1`로 들어온 경우에만 — 공개 URL에 로그인 폼이
 * 그대로 보이면 안 된다. 가드가 /login으로 보내며 쿼리를 버리므로 모듈 평가 시점에 붙잡아 둔다.
 */
const devLoginEnabled =
  __DEV__ ||
  (Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('dev'));

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
      {/* 스플래시가 끝난 자리를 그대로 이어받는다 — 마크·글자 크기가 스플래시 마지막 프레임과 같다 */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <DodoriMark size={100} showWord layout="stack" />
      </View>
      <View style={{ gap: 12, paddingBottom: 48 }}>
        <KakaoButton onPress={onKakao} />
        {/*
          문구만 두고 문서가 없으면 동의를 받은 게 아니다 — 두 링크는 앱 안에서도 웹에서도
          같은 원문(src/lib/legal.ts)을 연다. 스토어·카카오 검수에 제출하는 주소이기도 하다.
        */}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: color.muted,
            marginTop: 6,
            lineHeight: 17,
          }}
        >
          계속하면{' '}
          <Text
            accessibilityRole="link"
            style={{ color: color.sub, textDecorationLine: 'underline' }}
            onPress={() => router.push('/terms')}
          >
            이용약관
          </Text>
          과{' '}
          <Text
            accessibilityRole="link"
            style={{ color: color.sub, textDecorationLine: 'underline' }}
            onPress={() => router.push('/privacy')}
          >
            개인정보 처리방침
          </Text>
          에{'\n'}동의하는 것으로 간주돼요.
        </Text>
        {devLoginEnabled && <DevEmailSignIn />}
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
