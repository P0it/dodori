import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { useClaimInvite } from '@/api/couple';
import { clearPendingInvite, useRefreshPendingInvite } from '@/api/pendingInvite';

/** 초대 코드 입력 (PRD §6.1 — Phase A 주 경로, 목업 StartDate 입력 필드 스타일 재조합) */
export default function CodeEntry() {
  const router = useRouter();
  const claim = useClaimInvite();
  const refreshPending = useRefreshPendingInvite();
  // 초대 링크로 들어왔으면 코드가 채워진 채 시작한다
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (code.trim().length < 6 || claim.isPending) return;
    setError(null);
    claim.mutate(code, {
      onSuccess: async () => {
        await clearPendingInvite();
        refreshPending();
        router.replace('/(auth)/start-date');
      },
      onError: (e) => setError(e instanceof Error ? e.message : String(e)),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="초대 코드 입력" />
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 24, color: color.white, letterSpacing: -0.5 }}>
          받은 코드를{'\n'}입력해주세요
        </Text>
        <Meta style={{ marginTop: 8, lineHeight: 20 }}>
          상대가 보낸 10자리 초대 코드예요. 대소문자는 구분하지 않아요.
        </Meta>

        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          placeholder="ABCD123456"
          placeholderTextColor={color.muted}
          style={{
            marginTop: 28,
            height: 64,
            borderRadius: 12,
            backgroundColor: color.surface1,
            borderWidth: 1.5,
            borderColor: error ? '#E8567A' : code.length === 10 ? color.accent : color.surface3,
            color: color.white,
            fontSize: 22,
            fontFamily: typeface, fontWeight: '700',
            letterSpacing: 4,
            textAlign: 'center',
          }}
        />
        {error ? (
          <Text style={{ fontFamily: typeface, color: '#E8567A', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}
        {/* 이미 쓰인 링크로 들어오면 여기서 갇히므로 탈출구를 둔다 */}
        {error && params.code ? (
          <Pressable
            onPress={async () => {
              await clearPendingInvite();
              refreshPending();
              router.replace('/(auth)/connect');
            }}
            style={({ pressed }) => ({ marginTop: 10, opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              style={{
                fontFamily: typeface,
                fontSize: 12.5,
                color: color.muted,
                textAlign: 'center',
                textDecorationLine: 'underline',
              }}
            >
              다른 방법으로 연결하기
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={code.trim().length < 6 || claim.isPending}
          style={({ pressed }) => ({
            marginTop: 24,
            height: 52,
            borderRadius: 999,
            backgroundColor: color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: code.trim().length < 6 ? 0.4 : pressed ? 0.85 : 1,
          })}
        >
          {claim.isPending ? (
            <ActivityIndicator color={color.onPrimary} />
          ) : (
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.onPrimary }}>
              연결하기
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
