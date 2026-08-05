import { Pressable, RefreshControl, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { color, radius, typeface } from '@/theme/tokens';
import { daysSince } from '@/lib/date';
import { useMyCouple, useCoupleProfiles } from '@/api/couple';
import { usePosts } from '@/api/posts';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { DodoriMark } from '@/components/DodoriMark';
import { PlusGlyph, MenuGlyph, HeartGlyph } from '@/components/glyphs';
import { PostGridCell } from '@/components/feed/PostGridCell';

/** 스튜디오 = 우리 계정 (목업 25 + 게시물 그리드) — 셀 탭 → 세로 스크롤 피드 */
export default function Studio() {
  const router = useRouter();
  const posts = usePosts();

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
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
            colors={[color.accent]}
          />
        }
        ListHeaderComponent={<AccountHeader />}
        // 로딩 중에는 빈 화면을 보여주지 않는다 — "첫 피드를 올려보세요"가 떴다가
        // 1~2초 뒤 목록으로 바뀌면 아무것도 없다가 생긴 것처럼 보인다
        ListEmptyComponent={
          posts.isPending ? null : (
            <EmptyPosts onPress={() => router.push('/modals/create-post')} />
          )
        }
        renderItem={({ item: p }) => (
          <PostGridCell
            thumbUrl={p.gridThumbUrl}
            caption={p.caption}
            multiple={p.photos.length > 1}
            onPress={() => router.push(`/feed/post/${p.id}`)}
          />
        )}
      />

      {/* 올리기 — 스토리는 홈 화면의 일이라 여기선 갈래를 두지 않는다 */}
      <Pressable
        accessibilityLabel="게시물 올리기"
        onPress={() => router.push('/modals/create-post')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 16,
          bottom: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: color.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <PlusGlyph size={26} color={color.onPrimary} />
      </Pressable>
    </View>
  );
}

function EmptyPosts({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 34, paddingHorizontal: 24 }}>
      <Text
        style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}
      >
        아직 피드가 없어요
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
          backgroundColor: color.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}
        >
          첫 피드 올리기
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
  const me = profiles.data?.me?.nickname || undefined;
  const partner = profiles.data?.partner?.nickname || undefined;

  return (
    <View style={{ paddingHorizontal: 6 }}>
      {/* 상단 액션 — 스토리 보기 / 만들기 / 관리 */}
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
        <Pressable hitSlop={10} onPress={() => router.push('/feed/settings')}>
          <MenuGlyph size={21} />
        </Pressable>
      </View>

      {/* 프로필 — 두 사람 아바타를 겹쳐서. 사진이 없는 쪽은 이니셜 원 */}
      <View style={{ alignItems: 'center', paddingTop: 6 }}>
        {profiles.data?.me || profiles.data?.partner ? (
          <View style={{ flexDirection: 'row' }}>
            {[profiles.data?.me, profiles.data?.partner].map(
              (p, i) =>
                p && (
                  <CoupleAvatar
                    key={p.id}
                    avatarUrl={p.avatar_url}
                    name={p.nickname}
                    overlap={i === 1}
                  />
                ),
            )}
          </View>
        ) : (
          <DodoriMark size={68} />
        )}
        {me && partner ? (
          // 하트를 축으로 중앙 정렬 — 좌우를 같은 폭(flex:1)으로 나눠 이름 길이가 달라도 하트가 안 밀린다
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 14 }}>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <NameText>{me}</NameText>
            </View>
            <View style={{ paddingHorizontal: 9 }}>
              <HeartGlyph size={16} filled color={color.danger} />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <NameText>{partner}</NameText>
            </View>
          </View>
        ) : (
          <NameText style={{ marginTop: 14 }}>{me || partner || 'dodori'}</NameText>
        )}
        {couple.data?.startedAt && (
          <>
            <Meta style={{ marginTop: 5 }}>since {couple.data.startedAt.replaceAll('-', '.')}</Meta>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 10 }}>
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '700',
                  fontSize: 20,
                  color: color.accent,
                  letterSpacing: -0.3,
                }}
              >
                {daysSince(couple.data.startedAt)}
              </Text>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 13, color: color.muted }}>
                일째
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 그리드 섹션 라벨 — 게시물이 있을 때만 */}
      {count > 0 && (
        <View style={{ paddingHorizontal: 8, paddingTop: 24, paddingBottom: 10 }}>
          <Eyebrow>피드 {count}</Eyebrow>
        </View>
      )}
    </View>
  );
}

/** 프로필 이름 텍스트 — 나 ♥ 상대 사이에 끼거나 단독으로 쓴다 */
function NameText({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text
      style={[
        {
          fontFamily: typeface,
          fontWeight: '800',
          fontSize: 22,
          color: color.white,
          letterSpacing: -0.3,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** 커플 아바타 — 사진이 없으면 이름 첫 글자. 링 없이 배경 대비로만 겹침을 구분 */
function CoupleAvatar({
  avatarUrl,
  name,
  overlap,
}: {
  avatarUrl: string | null;
  name: string;
  overlap: boolean;
}) {
  const base = {
    width: 72,
    height: 72,
    borderRadius: 36,
    // 겹치는 쪽만 배경색 링으로 잘라낸다 (인스타 겹침 아바타)
    borderWidth: overlap ? 3 : 0,
    borderColor: color.bg,
    marginLeft: overlap ? -16 : 0,
    backgroundColor: color.surface2,
  } as const;

  if (avatarUrl) return <Image source={{ uri: avatarUrl }} style={base} />;
  return (
    <View style={[base, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 26, color: color.sub }}>
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

