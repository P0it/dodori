import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { usePlaceSearch, useAddTrackPlace, useAddSavedPlaceToTrack } from '@/api/places';
import { useAddPlaylistPlace, useSavedPlaces, useSaveSearchPlace } from '@/api/playlists';
import { useTrack } from '@/api/tracks';
import { PlaceThumb } from '@/components/PlaceThumb';
import { FilterChip } from '@/components/FilterChip';
import { SavedHeart } from '@/components/SavedHeart';

/**
 * 장소 검색 — 단일 공용 (§7.4).
 * trackId 파라미터가 있으면 트랙 코스에 담기, playlistId면 테마 플리에 담기(M4).
 */
export default function PlaceSearch() {
  const router = useRouter();
  const { trackId, playlistId } = useLocalSearchParams<{
    trackId?: string;
    playlistId?: string;
  }>();
  // 데이트에 담으러 왔으면 찜부터 — 이게 이 화면의 핵심 동선이다.
  // 플리에 담으러 왔으면 찜에서 찜으로 담는 셈이라 검색이 기본.
  const [tab, setTab] = useState<'saved' | 'search'>(trackId ? 'saved' : 'search');
  const savedPlaces = useSavedPlaces();
  const track = useTrack(trackId);
  const addSaved = useAddSavedPlaceToTrack(trackId ?? '');
  const saveSearch = useSaveSearchPlace();
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const search = usePlaceSearch(query);
  const addToTrack = useAddTrackPlace(trackId ?? '');
  const addToPlaylist = useAddPlaylistPlace(playlistId ?? '');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  // 이미 이 날짜 코스에 담긴 찜한 곳 — + 버튼을 눌러도 조용히 실패하지 않도록 미리 added 처리
  const existingPlaceIds = useMemo(
    () => new Set((track.data?.places ?? []).map((p) => p.placeId)),
    [track.data],
  );
  // 코스에 담을 순서 — 검색 탭·찜 탭이 함께 쓴다. 개수나 route param이 아니라 기존 최대 sortOrder + 1 기준.
  // (삭제로 순서에 구멍이 나면 개수 기준은 기존 행과 겹친다)
  // 담은 개수는 더하지 않는다 — 담기 뮤테이션이 코스 리페치까지 기다린 뒤 잠금을 풀므로 maxOrder는 항상 최신이다.
  const maxOrder = Math.max(-1, ...(track.data?.places ?? []).map((p) => p.sortOrder));
  const nextSortOrder = maxOrder + 1;

  const add = (p: Parameters<typeof addToPlaylist.mutate>[0]) => {
    const done = { onSuccess: () => setAddedIds((s) => new Set(s).add(p.naver_id)) };
    if (trackId) addToTrack.mutate({ place: p, sortOrder: nextSortOrder }, done);
    else if (playlistId) addToPlaylist.mutate(p, done);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="장소 담기" />
      {trackId ? (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}>
          <FilterChip selected={tab === 'saved'} onPress={() => setTab('saved')}>
            찜한 곳
          </FilterChip>
          <FilterChip selected={tab === 'search'} onPress={() => setTab('search')}>
            검색
          </FilterChip>
        </View>
      ) : null}
      {tab === 'search' && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="카페, 맛집, 장소 검색"
            placeholderTextColor={color.muted}
            style={{
              height: 44,
              borderRadius: 6,
              backgroundColor: color.surface2,
              paddingHorizontal: 14,
              color: color.white,
              fontSize: 15,
            }}
          />
          <Meta style={{ fontSize: 11, marginTop: 8 }}>
            코스 담기 · 테마 플레이리스트 저장에 함께 쓰는 검색이에요
          </Meta>
        </View>
      )}
      {tab === 'search' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {query.trim().length < 2 ? null : search.isPending ? (
            <ActivityIndicator color={color.accent} style={{ marginTop: 24 }} />
          ) : search.isError ? (
            <Meta style={{ paddingVertical: 16 }}>{String(search.error.message)}</Meta>
          ) : (
            <>
              <Eyebrow style={{ marginVertical: 8 }}>검색 결과</Eyebrow>
              {(search.data ?? []).map((p) => {
                const added = addedIds.has(p.naver_id);
                return (
                  <View
                    key={p.naver_id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                        {p.name}
                      </Text>
                      <Meta style={{ marginTop: 2, fontSize: 12 }}>
                        {[p.category, p.address].filter(Boolean).join(' · ')}
                      </Meta>
                    </View>
                    <SavedHeart
                      saved={justSaved.has(p.naver_id)}
                      onPress={() =>
                        saveSearch.mutate(p, {
                          onSuccess: () => setJustSaved((s) => new Set(s).add(p.naver_id)),
                        })
                      }
                    />
                    <Pressable
                      // 담는 중엔 잠근다 — 연타하면 리페치 전 maxOrder로 같은 순서가 두 번 나간다
                      disabled={added || (!trackId && !playlistId) || addToTrack.isPending}
                      onPress={() => add(p)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        borderWidth: added ? 0 : 1.5,
                        borderColor: color.sub,
                        backgroundColor: added ? color.accent : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: added ? color.bg : color.white, fontFamily: typeface, fontWeight: '700' }}>
                        {added ? '✓' : '+'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
      {tab === 'saved' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {savedPlaces.isPending ? (
            <ActivityIndicator color={color.accent} style={{ marginTop: 24 }} />
          ) : (savedPlaces.data ?? []).length === 0 ? (
            <Meta style={{ paddingVertical: 16 }}>
              아직 찜한 곳이 없어요. 검색 탭에서 마음에 드는 곳을 찜해보세요.
            </Meta>
          ) : (
            (savedPlaces.data ?? []).map((p) => {
              const added = existingPlaceIds.has(p.placeId) || addedIds.has(p.placeId);
              return (
                <View
                  key={`${p.playlistId}:${p.placeId}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
                >
                  <PlaceThumb placeId={p.placeId} name={p.name} thumbUrl={p.photoThumbs[0]} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                      {p.name}
                    </Text>
                    <Meta style={{ marginTop: 2, fontSize: 12 }}>
                      {[p.playlistName, p.category].filter(Boolean).join(' · ')}
                    </Meta>
                  </View>
                  <Pressable
                    disabled={added || !trackId || addSaved.isPending}
                    onPress={() =>
                      addSaved.mutate(
                        {
                          placeId: p.placeId,
                          sortOrder: nextSortOrder,
                        },
                        {
                          onSuccess: () => setAddedIds((s) => new Set(s).add(p.placeId)),
                          onError: (e) =>
                            Alert.alert('추가 실패', e instanceof Error ? e.message : '코스에 담지 못했어요.'),
                        },
                      )
                    }
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: added ? 0 : 1.5,
                      borderColor: color.sub,
                      backgroundColor: added ? color.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: added ? color.bg : color.white, fontFamily: typeface, fontWeight: '700' }}>
                      {added ? '✓' : '+'}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      <View style={{ padding: 16, paddingBottom: 26 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: 999,
            backgroundColor: color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}>완료</Text>
        </Pressable>
      </View>
    </View>
  );
}
