import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color, typeface } from '@/theme/tokens';
import { isReleased, todayKST } from '@/lib/date';
import { nearestIndex } from '@/lib/albums';
import { recommendPlaces } from '@/lib/recommend';
import { useAllTracks, useTrack } from '@/api/tracks';
import { usePlaylists, useSavedPlaces } from '@/api/playlists';
import { useAddSavedPlaceToTrack } from '@/api/places';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { AlbumCarousel } from '@/components/AlbumCarousel';
import { Skeleton } from '@/components/Skeleton';
import { RecommendStrip } from '@/components/playlist/RecommendStrip';
import { PlaylistTile } from '@/components/playlist/PlaylistTile';
import { ChevronGlyph } from '@/components/glyphs';
import { alertDialog } from '@/components/dialog';

/** 플레이리스트 탭 루트 (목업 07) */
export default function PlaylistRoot() {
  const router = useRouter();
  const tracks = useAllTracks();
  const playlists = usePlaylists();

  // 앨범 캐러셀 — 과거→미래 오름차순. 포커스는 오늘에 가장 가까운 데이트.
  const albums = useMemo(
    () => [...(tracks.data ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [tracks.data],
  );
  const focusIndex = useMemo(() => nearestIndex(albums.map((t) => t.date), todayKST()), [albums]);

  const savedPlaces = useSavedPlaces();

  // 다가오는 데이트 = 아직 안 온 앨범 중 가장 이른 것
  const upcoming = useMemo(() => {
    const future = (tracks.data ?? [])
      .filter((t) => !isReleased(t.date))
      .sort((a, b) => a.date.localeCompare(b.date));
    return future[0];
  }, [tracks.data]);

  // 다가오는 데이트의 코스 — 이미 담긴 장소와 현재 코스 길이(순서 기준)를 알아야 한다
  const upcomingTrack = useTrack(upcoming?.id);
  const addToUpcoming = useAddSavedPlaceToTrack(upcoming?.id ?? '');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  // 다가오는 데이트가 바뀌면(더 이른 날짜를 새로 만드는 등) 담김 표시는 이전 트랙 것이므로 비운다
  const [addedFor, setAddedFor] = useState(upcoming?.id);
  if (addedFor !== upcoming?.id) {
    setAddedFor(upcoming?.id);
    setAddedIds(new Set());
  }
  // 요청 중인 장소 — 연타로 같은 sortOrder·중복 insert가 나가지 않게 스트립 전체를 잠근다
  const pendingId = addToUpcoming.isPending ? (addToUpcoming.variables?.placeId ?? null) : null;
  // 새 장소는 코스 맨 뒤에 — 개수가 아니라 기존 최대 sortOrder + 1을 기준으로 한다.
  // (삭제로 순서에 구멍이 나도 세션을 넘겨 값이 겹치지 않게)
  // 담은 개수는 더하지 않는다 — 담기 뮤테이션이 코스 리페치까지 기다린 뒤에야 잠금을 풀므로
  // 버튼이 눌릴 수 있는 시점의 maxOrder는 항상 최신이다. 더하면 이중 계산이 돼 순서에 구멍이 난다.
  const maxOrder = Math.max(-1, ...(upcomingTrack.data?.places ?? []).map((p) => p.sortOrder));
  const nextSortOrder = maxOrder + 1;

  // 플레이리스트에 담긴 곳 중 이 데이트에 아직 안 담겼고 안 가본 곳.
  // 후보는 모든 플리 — 기본 플리("찜")만 보면 다른 플리에 담은 곳이 영영 추천되지 않는다.
  // 같은 장소가 여러 플리에 있으면 한 번만, 가장 최근에 담긴 시각으로 합친다.
  // "가본 곳" 판정은 visitCount로 한다 — photoThumbs로 대신하면 사진 없이 다녀온 곳이 새 곳으로 잡힌다.
  const recommended = useMemo(() => {
    const all = savedPlaces.data ?? [];
    const byPlace = new Map<string, (typeof all)[number]>();
    for (const p of all) {
      const prev = byPlace.get(p.placeId);
      if (!prev || p.savedAt > prev.savedAt) byPlace.set(p.placeId, p);
    }
    const saved = [...byPlace.values()];
    const visited = all.filter((p) => p.visitCount > 0).map((p) => p.placeId);
    // 마운트 전에 이미 코스에 담긴 곳도 제외 — addedIds만 보면 다시 추천된다
    const inCourse = [...(upcomingTrack.data?.places ?? []).map((p) => p.placeId), ...addedIds];
    return recommendPlaces(saved, { inCourse, visited });
  }, [savedPlaces.data, addedIds, upcomingTrack.data]);

  // 기록 0개 첫 실행 — 빈 섹션들 대신 히어로 하나로 (isSuccess 가드: 로딩 중 깜빡임 방지)
  const noTracks = tracks.isSuccess && (tracks.data ?? []).length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* 화면 제목("라이브러리")은 달지 않는다 — 탭바가 이미 어느 탭인지 말하고, 섹션 헤더가 바로 이어진다 */}
      {tracks.isPending ? (
        /* 아직 모른다 — 빈 캐러셀("새 데이트" 한 칸만)을 보여주면 앨범이 없는 것처럼 읽힌다 */
        <>
          <SectionHeader title="플레이리스트" onAdd={() => router.push('/modals/create-track')} />
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} style={{ flex: 1, aspectRatio: 1, borderRadius: 6 }} />
            ))}
          </View>
        </>
      ) : noTracks ? (
        <FirstTrackHero onPress={() => router.push('/modals/create-track')} />
      ) : (
        /* 앨범 캐러셀 — 과거·미래를 한 줄에, 오늘 최근접이 포커스 */
        <>
          <SectionHeader title="플레이리스트" onAdd={() => router.push('/modals/create-track')} />
          <View style={{ marginTop: 2 }}>
            <AlbumCarousel
              albums={albums}
              focusIndex={focusIndex}
              onPress={(id) => router.push(`/track/${id}`)}
              onCreate={() => router.push('/modals/create-track')}
            />
          </View>
        </>
      )}

      {/* 테마 플레이리스트 — 첫 실행이고 만든 플리도 없으면 숨김 */}
      {!(noTracks && (playlists.data ?? []).length === 0) && (
      <>
      <SectionHeader title="가보고 싶은 곳" onAdd={() => router.push('/modals/new-playlist')} />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {(playlists.data ?? []).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/(tabs)/playlist/custom/${p.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}
          >
            <PlaylistTile colorKey={p.color} icon={p.icon} name={p.name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{p.name}</Text>
              <Meta style={{ marginTop: 2, fontSize: 12.5 }}>장소 {p.placeCount}곳</Meta>
            </View>
            <ChevronGlyph size={22} color={color.sub} />
          </Pressable>
        ))}
      </View>
      </>
      )}

      {/* 다음 데이트 추천 — 플레이리스트에 담긴 곳 중 아직 안 담기고 안 가본 곳 */}
      {/* upcomingTrack이 로드되기 전엔 숨긴다 — 이미 담긴 곳을 추천하거나 순서를 잘못 계산하는 창을 없앤다 */}
      {upcoming && upcomingTrack.isSuccess && recommended.length > 0 && (
        <>
          <SectionHeader title="이런 곳은 어때요?" />
          <Meta style={{ paddingHorizontal: 16, marginTop: 2, fontSize: 12.5 }}>
            {upcoming.date.slice(5).replace('-', '.')} 데이트에 담을 수 있어요
          </Meta>
          <View style={{ paddingTop: 10 }}>
            <RecommendStrip
              // thumbUrl은 넘기지 않는다 — 추천은 안 가본 곳만이라 사진이 있을 수 없고, PlaceThumb의 그라데이션이 의도한 모습
              items={recommended.map((p) => ({
                placeId: p.placeId,
                name: p.name,
                category: p.category,
              }))}
              addedIds={addedIds}
              pendingId={pendingId}
              onAdd={(placeId) =>
                addToUpcoming.mutate(
                  { placeId, sortOrder: nextSortOrder },
                  {
                    onSuccess: () => setAddedIds((s) => new Set(s).add(placeId)),
                    onError: (e) =>
                      alertDialog('추가 실패', e instanceof Error ? e.message : '코스에 담지 못했어요.'),
                  },
                )
              }
            />
          </View>
        </>
      )}
    </ScrollView>
    </View>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 20,
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 19, letterSpacing: -0.3, color: color.white }}>
        {title}
      </Text>
      {onAdd && (
        <Pressable onPress={onAdd} hitSlop={12}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={color.sub} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
      )}
    </View>
  );
}

/** 기록 0개 첫 실행 히어로 — 빈 섹션 나열 대신 첫 트랙 만들기 하나에 집중 */
function FirstTrackHero({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
      <Pressable
        onPress={onPress}
        style={{
          borderRadius: 14,
          backgroundColor: color.surface1,
          borderWidth: 1,
          borderColor: 'rgba(30,215,96,0.18)',
          paddingVertical: 28,
          paddingHorizontal: 20,
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Eyebrow color={color.accent}>Track 01</Eyebrow>
        <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 21, color: color.white }}>
          첫 데이트를 기록해보세요
        </Text>
        <Meta style={{ textAlign: 'center' }}>데이트 하나가 트랙 하나로 쌓여요</Meta>
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 22,
            height: 40,
            borderRadius: 999,
            backgroundColor: color.greenCore,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.onPrimary }}>
            데이트 만들기
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
