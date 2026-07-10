import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { color, role } from '@/theme/tokens';
import { daysSince } from '@/lib/date';
import { useMyCouple, useCoupleProfiles } from '@/api/couple';
import { useAllTracks } from '@/api/tracks';
import { useAnniversaries } from '@/api/anniversaries';
import { signOut } from '@/api/auth';
import { Meta } from '@/components/Meta';
import { Divider } from '@/components/Divider';
import { StarGlyph } from '@/components/glyphs';
import { OwnerDot } from '@/components/OwnerDot';
import { DodoriMark } from '@/components/DodoriMark';

/** 스튜디오 탭 루트 (목업 25) — 커플 프로필·통계·관리 진입 */
export default function Studio() {
  const router = useRouter();
  const couple = useMyCouple();
  const profiles = useCoupleProfiles();
  const tracks = useAllTracks();
  const annivs = useAnniversaries();

  const photoTotal = (tracks.data ?? []).reduce((n, t) => n + t.photoCount, 0);
  const favorites = (tracks.data ?? []).filter((t) => t.liked);
  const customCount = (annivs.data ?? []).filter((a) => a.type === 'custom').length;
  const names = [profiles.data?.me?.nickname, profiles.data?.partner?.nickname]
    .filter(Boolean)
    .join(' & ');

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
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* 프로필 헤더 — 카카오 프로필 사진이 있으면 커플 아바타, 없으면 도돌이 마크 */}
      <View style={{ alignItems: 'center', paddingTop: 34 }}>
        {profiles.data?.me?.avatar_url || profiles.data?.partner?.avatar_url ? (
          <View style={{ flexDirection: 'row' }}>
            {([
              [profiles.data?.me, role.me],
              [profiles.data?.partner, role.partner],
            ] as const).map(
              ([p, ring], i) =>
                p?.avatar_url && (
                  <Image
                    key={p.id}
                    source={{ uri: p.avatar_url }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: ring,
                      marginLeft: i === 1 ? -10 : 0,
                      backgroundColor: color.surface2,
                    }}
                  />
                ),
            )}
          </View>
        ) : (
          <DodoriMark size={54} />
        )}
        <Text style={{ fontWeight: '800', fontSize: 22, color: color.white, marginTop: 14, letterSpacing: -0.3 }}>
          {names || '도돌이'}
        </Text>
        {couple.data?.startedAt && (
          <>
            <Meta style={{ marginTop: 5 }}>since {couple.data.startedAt.replaceAll('-', '.')}</Meta>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
              <Text style={{ fontWeight: '800', fontSize: 34, color: role.me, letterSpacing: -0.7 }}>
                {daysSince(couple.data.startedAt)}
              </Text>
              <Text style={{ fontWeight: '600', fontSize: 16, color: color.sub }}>일째</Text>
            </View>
          </>
        )}
      </View>

      {/* 통계 */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginTop: 20,
          paddingVertical: 16,
          borderRadius: 14,
          backgroundColor: color.surface1,
        }}
      >
        <Stat n={tracks.data?.length ?? 0} label="데이트" />
        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <Stat n={photoTotal} label="사진" />
        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <Stat n={annivs.data?.length ?? 0} label="싱글" />
      </View>

      {/* 링크 목록 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <LinkRow
          icon={<StarGlyph size={17} />}
          label="기념일 관리"
          sub={`자동 ${(annivs.data?.length ?? 0) - customCount} · 커스텀 ${customCount}`}
          onPress={() => router.push('/studio/anniversaries')}
        />
        <Divider />
        <LinkRow
          icon={<Text style={{ color: role.me, fontSize: 16 }}>♥</Text>}
          label="Favorites"
          sub={`아껴둔 데이트 ${favorites.length}`}
          onPress={() => router.push('/studio/favorites')}
        />
        <Divider />
        <LinkRow
          icon={<OwnerDot who="partner" size={14} />}
          label="연결"
          sub={
            profiles.data?.partner
              ? `${profiles.data.partner.nickname || '상대'}와 연결됨`
              : '연결 대기 중'
          }
        />
        <Divider />
        <LinkRow
          icon={<Text style={{ color: '#E8567A', fontSize: 15 }}>↩</Text>}
          label="로그아웃"
          danger
          onPress={onSignOut}
        />
      </View>
    </ScrollView>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontWeight: '800', fontSize: 22, color: color.white }}>{n}</Text>
      <Meta style={{ marginTop: 2, fontSize: 11.5 }}>{label}</Meta>
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
        <Text style={{ fontWeight: '600', fontSize: 15, color: danger ? '#E8567A' : color.white }}>
          {label}
        </Text>
        {sub && <Meta style={{ marginTop: 2, fontSize: 12 }}>{sub}</Meta>}
      </View>
      {onPress && <Text style={{ color: color.muted }}>›</Text>}
    </Pressable>
  );
}
