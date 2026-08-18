import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, tintBg, typeface } from '@/theme/tokens';
import { useCoupleProfiles, useStorageQuota } from '@/api/couple';
import { useAnniversaries } from '@/api/anniversaries';
import { useDisableWebPush, useEnableWebPush, useWebPushState } from '@/api/webPush';
import { formatBytes } from '@/lib/media';
import { signOut } from '@/api/auth';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Divider } from '@/components/Divider';
import { Avatar } from '@/components/Avatar';
import {
  StarGlyph,
  StoryGlyph,
  StackGlyph,
  LogoutGlyph,
  ChevronGlyph,
  BellGlyph,
} from '@/components/glyphs';
import { confirmDialog } from '@/components/dialog';

/** 스튜디오 관리 — 기념일·연결·로그아웃 (계정 화면에서 분리) */
export default function StudioSettings() {
  const router = useRouter();
  const profiles = useCoupleProfiles();
  const annivs = useAnniversaries();
  const quota = useStorageQuota();

  const me = profiles.data?.me;
  const partner = profiles.data?.partner;
  const customCount = (annivs.data ?? []).filter((a) => a.type === 'custom').length;

  const onSignOut = async () => {
    if (!(await confirmDialog('로그아웃', '다시 로그인하면 기록은 그대로예요.', '로그아웃'))) return;
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="관리" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        {/* 내 프로필 — 중앙에 크게, 아래 닉네임. 탭하면 편집 */}
        <Pressable
          onPress={() => router.push('/feed/profile')}
          style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 20 }}
        >
          <Avatar url={me?.avatar_url ?? null} name={me?.nickname || '나'} size={88} />
          <Text
            style={{ fontFamily: typeface, fontWeight: '800', fontSize: 22, color: color.white, marginTop: 12 }}
          >
            {me?.nickname || '내 프로필'}
          </Text>
          <Text
            style={{ fontFamily: typeface, fontWeight: '600', fontSize: 13, color: color.accent, marginTop: 4 }}
          >
            프로필 편집
          </Text>
        </Pressable>

        {/* 연결 상대 — 아바타·이름·연결 상태 */}
        <PartnerCard
          name={partner?.nickname || '상대'}
          avatarUrl={partner?.avatar_url ?? null}
          connected={!!partner}
        />

        <Divider style={{ marginTop: 20 }} />
        <PushRow />
        <Divider />
        <LinkRow
          icon={<StoryGlyph size={18} />}
          label="스토리 보관함"
          sub="지난 스토리 다시 보기"
          onPress={() => router.push('/feed/stories')}
        />
        <Divider />
        <LinkRow
          icon={<StarGlyph size={17} />}
          label="기념일 관리"
          sub={`자동 ${(annivs.data?.length ?? 0) - customCount} · 커스텀 ${customCount}`}
          onPress={() => router.push('/feed/anniversaries')}
        />
        <Divider />
        {/* 사진만 쓰던 때는 한도가 멀었지만 영상이 들어오면서 잔량을 확인할 곳이 필요해졌다 */}
        <LinkRow
          icon={<StackGlyph size={17} />}
          label="보관 공간"
          sub={
            quota.data
              ? `${formatBytes(quota.data.usedBytes)} / ${formatBytes(quota.data.quotaBytes)}`
              : undefined
          }
        />
        <Divider />
        <LinkRow
          icon={<LogoutGlyph size={18} />}
          label="로그아웃"
          danger
          onPress={onSignOut}
        />
      </ScrollView>
    </View>
  );
}

/** 연결 상대 카드 — 상대 아바타·이름·연결 상태 (연결 전엔 대기 안내) */
function PartnerCard({
  name,
  avatarUrl,
  connected,
}: {
  name: string;
  avatarUrl: string | null;
  connected: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: color.surface1,
      }}
    >
      {connected ? (
        <Avatar url={avatarUrl} name={name} size={44} />
      ) : (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: color.surface3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typeface, fontSize: 20, color: color.muted }}>?</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
          {connected ? name : '아직 연결된 상대가 없어요'}
        </Text>
        <Meta style={{ marginTop: 2, fontSize: 12 }}>{connected ? '연결된 상대' : '초대를 기다리는 중'}</Meta>
      </View>
      {connected ? (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: tintBg.accent,
          }}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12, color: color.accent }}>연결됨</Text>
        </View>
      ) : (
        <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 12, color: color.muted }}>연결 대기 중</Text>
      )}
    </View>
  );
}

function LinkRow({
  icon,
  label,
  sub,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          backgroundColor: color.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '600',
            fontSize: 15,
            color: danger ? color.danger : color.white,
          }}
        >
          {label}
        </Text>
        {sub && <Meta style={{ marginTop: 2, fontSize: 12 }}>{sub}</Meta>}
      </View>
      {onPress && <ChevronGlyph size={18} />}
    </Pressable>
  );
}

/**
 * 알림 켜기 — 브라우저 권한 요청은 **반드시 이 onPress 안에서** 일어나야 한다.
 * iOS Safari는 사용자 제스처 밖의 requestPermission()을 거부한다.
 */
function PushRow() {
  const state = useWebPushState();
  const enable = useEnableWebPush();
  const disable = useDisableWebPush();
  const busy = enable.isPending || disable.isPending;

  const sub = () => {
    if (busy) return '잠시만요…';
    switch (state.data) {
      case 'on':
        return '켜짐 · 이 기기에서 알림을 받아요';
      case 'off':
        return '상대가 올리거나 댓글을 달면 알려드려요';
      case 'needs-install':
        return '공유 → "홈 화면에 추가" 후 켤 수 있어요';
      case 'denied':
        return '브라우저 설정에서 알림을 허용해 주세요';
      default:
        return '이 기기에서는 알림을 켤 수 없어요';
    }
  };

  const canToggle = state.data === 'on' || state.data === 'off';

  return (
    <LinkRow
      icon={<BellGlyph size={18} color={state.data === 'on' ? color.accent : color.white} />}
      label={state.data === 'on' ? '알림 끄기' : '알림 켜기'}
      sub={sub()}
      onPress={
        canToggle && !busy
          ? () => (state.data === 'on' ? disable.mutate() : enable.mutate())
          : undefined
      }
    />
  );
}
