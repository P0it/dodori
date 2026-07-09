import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, role } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { usePlaceSearch, useAddTrackPlace } from '@/api/places';
import { useAddPlaylistPlace } from '@/api/playlists';

/**
 * 장소 검색 — 단일 공용 (§7.4).
 * trackId 파라미터가 있으면 트랙 코스에 담기, playlistId면 테마 플리에 담기(M4).
 */
export default function PlaceSearch() {
  const router = useRouter();
  const { trackId, next, playlistId } = useLocalSearchParams<{
    trackId?: string;
    next?: string;
    playlistId?: string;
  }>();
  const [query, setQuery] = useState('');
  const search = usePlaceSearch(query);
  const addToTrack = useAddTrackPlace(trackId ?? '');
  const addToPlaylist = useAddPlaylistPlace(playlistId ?? '');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  let order = Number(next ?? 0);

  const add = (p: Parameters<typeof addToPlaylist.mutate>[0]) => {
    const done = { onSuccess: () => setAddedIds((s) => new Set(s).add(p.naver_id)) };
    if (trackId) addToTrack.mutate({ place: p, sortOrder: order++ }, done);
    else if (playlistId) addToPlaylist.mutate(p, done);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="장소 담기" />
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {query.trim().length < 2 ? null : search.isPending ? (
          <ActivityIndicator color={role.me} style={{ marginTop: 24 }} />
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
                    <Text style={{ fontWeight: '600', fontSize: 15, color: color.white }}>
                      {p.name}
                    </Text>
                    <Meta style={{ marginTop: 2, fontSize: 12 }}>
                      {[p.category, p.address].filter(Boolean).join(' · ')}
                    </Meta>
                  </View>
                  <Pressable
                    disabled={added || (!trackId && !playlistId)}
                    onPress={() => add(p)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: added ? 0 : 1.5,
                      borderColor: color.sub,
                      backgroundColor: added ? role.me : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: added ? color.bg : color.white, fontWeight: '700' }}>
                      {added ? '✓' : '+'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: 26 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: 999,
            backgroundColor: role.me,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}>완료</Text>
        </Pressable>
      </View>
    </View>
  );
}
