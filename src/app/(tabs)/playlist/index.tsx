import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import { daysSince, isReleased, monthKey, todayKST } from '@/lib/date';
import { nearestIndex } from '@/lib/albums';
import { useAllTracks, type TrackListItem } from '@/api/tracks';
import { useMyCouple, useCoupleProfiles } from '@/api/couple';
import { usePlaylists } from '@/api/playlists';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { AlbumCarousel } from '@/components/AlbumCarousel';

/** 플레이리스트 탭 루트 (목업 07) */
export default function PlaylistRoot() {
  const router = useRouter();
  const couple = useMyCouple();
  const profiles = useCoupleProfiles();
  const tracks = useAllTracks();
  const playlists = usePlaylists();

  // 앨범 캐러셀 — 과거→미래 오름차순. 포커스는 오늘에 가장 가까운 데이트.
  const albums = useMemo(
    () => [...(tracks.data ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [tracks.data],
  );
  const focusIndex = useMemo(() => nearestIndex(albums.map((t) => t.date), todayKST()), [albums]);

  // 아카이브(월별)는 지난 데이트만
  const months = useMemo(() => {
    const map = new Map<string, TrackListItem[]>();
    for (const t of tracks.data ?? []) {
      if (!isReleased(t.date)) continue;
      const k = monthKey(t.date);
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [tracks.data]);

  const names = [profiles.data?.me?.nickname, profiles.data?.partner?.nickname]
    .filter(Boolean)
    .join(' & ');

  // 기록 0개 첫 실행 — 빈 섹션들 대신 히어로 하나로 (isSuccess 가드: 로딩 중 깜빡임 방지)
  const noTracks = tracks.isSuccess && (tracks.data ?? []).length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <View>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 26, letterSpacing: -0.5, color: color.white }}>
            플레이리스트
          </Text>
          <Meta style={{ marginTop: 2, fontSize: 12.5 }}>
            {names || '우리'} ·{' '}
            {couple.data?.startedAt ? (
              <Text style={{ color: color.accent, fontFamily: typeface, fontWeight: '700' }}>
                {daysSince(couple.data.startedAt)}일째
              </Text>
            ) : null}
          </Meta>
        </View>
      </View>

      {noTracks ? (
        <FirstTrackHero onPress={() => router.push('/modals/create-track')} />
      ) : (
      <>
      {/* 앨범 캐러셀 — 과거·미래를 한 줄에, 오늘 최근접이 포커스 */}
      <View style={{ marginTop: 14 }}>
        <AlbumCarousel albums={albums} focusIndex={focusIndex} onPress={(id) => router.push(`/track/${id}`)} />
      </View>

      {/* 아카이브 — 달별로 모인 지난 데이트 */}
      <SectionHeader title="아카이브" />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {months.map(([k, list]) => (
          <Pressable
            key={k}
            onPress={() => router.push(`/(tabs)/playlist/${k}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
          >
            <View style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', backgroundColor: color.surface2 }}>
              {list.find((t) => t.coverThumbUrl)?.coverThumbUrl && (
                <Image
                  source={list.find((t) => t.coverThumbUrl)!.coverThumbUrl!}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                {k.slice(0, 4)}년 {Number(k.slice(5))}월
              </Text>
              <Meta style={{ marginTop: 2, fontSize: 12.5 }}>{list.length} 데이트</Meta>
            </View>
            <Text style={{ fontFamily: typeface, color: color.muted }}>›</Text>
          </Pressable>
        ))}
        {months.length === 0 && <Meta style={{ paddingVertical: 10 }}>기록이 쌓이면 달별로 모여요</Meta>}
      </View>
      </>
      )}

      {/* 테마 플레이리스트 — 첫 실행이고 만든 플리도 없으면 숨김 */}
      {!(noTracks && (playlists.data ?? []).length === 0) && (
      <>
      <SectionHeader title="테마 플레이리스트" />
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        {(playlists.data ?? []).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/(tabs)/playlist/custom/${p.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                backgroundColor: color.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: color.sub, fontFamily: typeface, fontWeight: '700' }}>{p.name.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{p.name}</Text>
              <Meta style={{ marginTop: 2, fontSize: 12.5 }}>장소 {p.placeCount}곳</Meta>
            </View>
            <Text style={{ fontFamily: typeface, color: color.muted }}>›</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => router.push('/modals/new-playlist')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 8,
              backgroundColor: color.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: typeface, color: color.white, fontSize: 20 }}>+</Text>
          </View>
          <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.sub }}>새 플레이리스트 만들기</Text>
        </Pressable>
      </View>
      </>
      )}
    </ScrollView>

    {/* 새 데이트 만들기 — 캘린더 FAB와 동일한 떠 있는 버튼 */}
    {!noTracks && (
      <Pressable
        onPress={() => router.push('/modals/create-track')}
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
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={color.onPrimary} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      </Pressable>
    )}
    </View>
  );
}

function SectionHeader({ title, onMore }: { title: string; onMore?: () => void }) {
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
      {onMore && (
        <Pressable onPress={onMore}>
          <Meta style={{ fontSize: 12.5 }}>더보기</Meta>
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
