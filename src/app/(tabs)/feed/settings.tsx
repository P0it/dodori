import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { useCoupleProfiles } from '@/api/couple';
import { useAnniversaries } from '@/api/anniversaries';
import { signOut } from '@/api/auth';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Divider } from '@/components/Divider';
import { Avatar } from '@/components/Avatar';
import { StarGlyph, StoryGlyph, LinkGlyph, LogoutGlyph, ChevronGlyph } from '@/components/glyphs';

/** 스튜디오 관리 — 기념일·연결·로그아웃 (계정 화면에서 분리) */
export default function StudioSettings() {
  const router = useRouter();
  const profiles = useCoupleProfiles();
  const annivs = useAnniversaries();

  const customCount = (annivs.data ?? []).filter((a) => a.type === 'custom').length;

  const onSignOut = () =>
    Alert.alert('로그아웃', '다시 로그인하면 기록은 그대로예요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="관리" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <LinkRow
          icon={<Avatar url={profiles.data?.me?.avatar_url ?? null} name={profiles.data?.me?.nickname || '나'} size={34} />}
          label={profiles.data?.me?.nickname || '내 프로필'}
          sub="프로필 사진·닉네임"
          onPress={() => router.push('/feed/profile')}
        />
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
        <LinkRow
          icon={<LinkGlyph size={18} />}
          label="연결"
          sub={
            profiles.data?.partner
              ? `${profiles.data.partner.nickname || '상대'}와 연결됨`
              : '연결 대기 중'
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
