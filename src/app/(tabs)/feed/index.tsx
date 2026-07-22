import { Pressable, RefreshControl, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { color, radius, role, typeface, type OwnerRole } from '@/theme/tokens';
import { daysSince } from '@/lib/date';
import { useMyCouple, useCoupleProfiles } from '@/api/couple';
import { usePosts } from '@/api/posts';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { DodoriMark } from '@/components/DodoriMark';
import { PlusGlyph, MenuGlyph } from '@/components/glyphs';
import { PostGridCell } from '@/components/feed/PostGridCell';

/** 스튜디오 = 우리 계정 (목업 25 + 게시물 그리드) — 셀 탭 → 세로 스크롤 피드 */
export default function Studio() {
  const router = useRouter();
  const posts = usePosts();

  return (
    <FlashList
      data={posts.data ?? []}
      numColumns={3}
      keyExtractor={(p) => p.id}
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={posts.isRefetching}
          onRefresh={posts.refetch}
          tintColor={color.sub}
          colors={[role.me]}
        />
      }
      ListHeaderComponent={<AccountHeader />}
      ListEmptyComponent={<EmptyPosts onPress={() => router.push('/modals/create-post')} />}
      renderItem={({ item: p }) => (
        <PostGridCell
          thumbUrl={p.gridThumbUrl}
          caption={p.caption}
          multiple={p.photos.length > 1}
          onPress={() => router.push(`/feed/post/${p.id}`)}
        />
      )}
    />
  );
}

function EmptyPosts({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 34, paddingHorizontal: 24 }}>
      <Text
        style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}
      >
        아직 게시물이 없어요
      </Text>
      <Meta style={{ marginTop: 7, textAlign: 'center' }}>
        특별한 날이 아니어도 좋아요. 오늘 한 컷을 남겨보세요.
      </Meta>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          marginTop: 18,
          height: 44,
          paddingHorizontal: 22,
          borderRadius: radius.pill,
          backgroundColor: role.me,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}
        >
          첫 게시물 올리기
        </Text>
      </Pressable>
    </View>
  );
}

/** 프로필 헤더 + 액션 — 피드 탭이므로 앨범·기념일 수는 두지 않는다 */
function AccountHeader() {
  const router = useRouter();
  const couple = useMyCouple();
  const profiles = useCoupleProfiles();
  const posts = usePosts();

  const count = posts.data?.length ?? 0;
  const names = [profiles.data?.me?.nickname, profiles.data?.partner?.nickname]
    .filter(Boolean)
    .join(' & ');

  return (
    <View style={{ paddingHorizontal: 6 }}>
      {/* 상단 액션 — 새 게시물 / 관리 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 18,
          height: 44,
          paddingHorizontal: 6,
        }}
      >
        <Pressable hitSlop={10} onPress={() => router.push('/modals/create-post')}>
          <PlusGlyph size={24} />
        </Pressable>
        <Pressable hitSlop={10} onPress={() => router.push('/feed/settings')}>
          <MenuGlyph size={21} />
        </Pressable>
      </View>

      {/* 프로필 — 두 사람 아바타를 겹쳐서. 사진이 없는 쪽은 이니셜 원 */}
      <View style={{ alignItems: 'center', paddingTop: 6 }}>
        {profiles.data?.me || profiles.data?.partner ? (
          <View style={{ flexDirection: 'row' }}>
            {([
              [profiles.data?.me, 'me'],
              [profiles.data?.partner, 'partner'],
            ] as const).map(
              ([p, who], i) =>
                p && (
                  <CoupleAvatar
                    key={p.id}
                    avatarUrl={p.avatar_url}
                    name={p.nickname}
                    who={who}
                    overlap={i === 1}
                  />
                ),
            )}
          </View>
        ) : (
          <DodoriMark size={54} />
        )}
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 22,
            color: color.white,
            marginTop: 14,
            letterSpacing: -0.3,
          }}
        >
          {names || 'dodori'}
        </Text>
        {couple.data?.startedAt && (
          <>
            <Meta style={{ marginTop: 5 }}>since {couple.data.startedAt.replaceAll('-', '.')}</Meta>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '800',
                  fontSize: 34,
                  color: role.me,
                  letterSpacing: -0.5,
                }}
              >
                {daysSince(couple.data.startedAt)}
              </Text>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 16, color: color.sub }}>
                일째
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 그리드 섹션 라벨 — 게시물이 있을 때만 */}
      {count > 0 && (
        <View style={{ paddingHorizontal: 8, paddingTop: 24, paddingBottom: 10 }}>
          <Eyebrow>게시물 {count}</Eyebrow>
        </View>
      )}
    </View>
  );
}

/** 커플 아바타 — 사진이 없으면 이름 첫 글자, 테두리는 역할색 */
function CoupleAvatar({
  avatarUrl,
  name,
  who,
  overlap,
}: {
  avatarUrl: string | null;
  name: string;
  who: OwnerRole;
  overlap: boolean;
}) {
  const base = {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: role[who],
    marginLeft: overlap ? -10 : 0,
    backgroundColor: color.surface2,
  } as const;

  if (avatarUrl) return <Image source={{ uri: avatarUrl }} style={base} />;
  return (
    <View style={[base, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 20, color: role[who] }}>
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

