import { useEffect } from 'react';
import { Alert, Platform, Pressable, Share, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { color, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';
import { useCreateInvite, useMyCouple } from '@/api/couple';
import { inviteShareMessage, inviteUrl } from '@/lib/invite';

/**
 * 초대 링크의 베이스 주소 — 웹은 지금 열려 있는 주소가 정답이고,
 * 네이티브는 웹 배포 주소를 env로 알려줘야 한다 (없으면 코드만 공유된다).
 */
const webBaseUrl =
  Platform.OS === 'web' ? window.location.origin : (process.env.EXPO_PUBLIC_WEB_URL ?? null);

/**
 * 초대 보내기 + 수락 대기 (목업 03·04, §6.1 코드 직접 전달이 주 경로)
 * 커플이 없으면 진입 시 생성. 상대가 수락하면(멤버 2인) 시작일 입력으로 이동.
 */
export default function SendInvite() {
  const router = useRouter();
  const couple = useMyCouple();
  const createInvite = useCreateInvite();

  // 커플 미생성 상태로 진입하면 초대 생성. 만들고 나면 가드로 돌려보내 시작일부터 받는다
  useEffect(() => {
    if (couple.isSuccess && couple.data === null && createInvite.isIdle) {
      createInvite.mutate(undefined, { onSuccess: () => router.replace('/') });
    }
  }, [couple.isSuccess, couple.data, createInvite, router]);

  // 상대 수락 감지 — 5초 폴링 (M2에서 Realtime 구독으로 교체 여지)
  useEffect(() => {
    if (couple.data && couple.data.memberCount >= 2) {
      router.replace(couple.data.startedAt ? '/(tabs)/home' : '/(auth)/start-date');
      return;
    }
    const t = setInterval(() => couple.refetch(), 5000);
    return () => clearInterval(t);
  }, [couple.data, couple, router]);

  const code = couple.data?.inviteCode ?? createInvite.data?.invite_code ?? null;
  const link = code ? inviteUrl(webBaseUrl, code) : null;

  // 웹에는 Alert.alert 구현이 없어 조용히 사라진다 — 알림이 안 보이면 실패를 알 길이 없다
  const notify = (title: string, body: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${body}`);
    else Alert.alert(title, body);
  };

  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(link ?? code);
    notify(
      '복사됨',
      link ? '초대 링크를 붙여넣어 상대에게 보내주세요.' : '초대 코드를 붙여넣어 상대에게 보내주세요.',
    );
  };

  /** 주 동선 — 초대는 결국 카톡으로 보내는 일이다. 웹은 Share.share가 없어 navigator.share로, 그마저 없으면 복사로 떨어진다 */
  const share = async () => {
    if (!code) return;
    const message = inviteShareMessage(link, code);
    if (Platform.OS !== 'web') {
      Share.share({ message });
      return;
    }
    if (navigator.share) {
      // 사용자가 공유 시트를 닫으면 reject된다 — 실패가 아니므로 조용히 넘어간다
      await navigator.share({ text: message }).catch(() => {});
      return;
    }
    await copy();
  };

  // 웹은 이 경로로 직접 새로고침할 수 있어 진입 가드를 건너뛴다 — 시작일이 먼저다
  if (couple.data && !couple.data.startedAt) return <Redirect href="/(auth)/start-date" />;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="초대 보내기" />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        <Eyebrow style={{ marginBottom: 10 }}>초대 코드 · 한 번만 사용 가능</Eyebrow>

        <View
          style={{
            borderRadius: 16,
            backgroundColor: color.surface1,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            paddingVertical: 28,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: typeface, fontWeight: '800',
              fontSize: 30,
              letterSpacing: 6,
              color: code ? color.accent : color.muted,
            }}
          >
            {code ?? (createInvite.isError ? '생성 실패' : '생성 중…')}
          </Text>
          <Meta style={{ marginTop: 10, fontSize: 12.5 }}>
            {link
              ? '링크를 보내면 코드를 입력하지 않아도 연결돼요'
              : '상대가 앱에서 이 코드를 입력하면 연결돼요'}
          </Meta>
        </View>

        <View style={{ gap: 12, marginTop: 24 }}>
          <PrimaryBtn label={link ? '초대 링크 공유' : '초대 코드 공유'} onPress={share} disabled={!code} />
          <SecondaryBtn label={link ? '링크 복사' : '코드 복사'} onPress={copy} disabled={!code} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 28, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.anniv }} />
            <Meta style={{ fontSize: 12.5 }}>수락을 기다리는 중… 수락되면 자동으로 넘어가요</Meta>
          </View>
        </View>
      </View>
    </View>
  );
}

function PrimaryBtn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 999,
        backgroundColor: color.accent,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.onPrimary }}>{label}</Text>
    </Pressable>
  );
}

function SecondaryBtn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 14.5, color: color.white }}>{label}</Text>
    </Pressable>
  );
}
