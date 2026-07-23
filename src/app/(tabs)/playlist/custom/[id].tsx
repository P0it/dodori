import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import {
  usePlaylistDetail,
  useDeletePlaylist,
  useRemovePlaylistPlace,
} from '@/api/playlists';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';

/** 테마(커스텀) 플레이리스트 상세 (목업 P1) — 데이트가 아니라 장소를 모은다 */
export default function CustomPlaylist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = usePlaylistDetail(id);
  const removePlace = useRemovePlaylistPlace(id!);
  const delPlaylist = useDeletePlaylist();

  const p = detail.data;
  // 찜은 커플당 하나뿐이고 다시 만들 수 없다 — 삭제 진입점 자체를 감춘다(DB 트리거가 최종 방어)
  const isSaved = p?.kind === 'saved';
  const thumbs = p?.places.flatMap((pl) => pl.photoThumbs).slice(0, 4) ?? [];
  const totalVisits = p?.places.reduce((n, pl) => n + pl.visitCount, 0) ?? 0;

  const onDelete = () =>
    Alert.alert('플레이리스트 삭제', '장소 목록만 삭제되고 기록은 남아요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => delPlaylist.mutate(id!, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title={p?.name ?? ''}
        right={
          isSaved ? undefined : (
            <Pressable hitSlop={8} onPress={onDelete}>
              <Text style={{ fontFamily: typeface, color: color.sub, fontSize: 18 }}>⋯</Text>
            </Pressable>
          )
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <View
            style={{
              width: 176,
              height: 176,
              borderRadius: 6,
              overflow: 'hidden',
              flexDirection: 'row',
              flexWrap: 'wrap',
              backgroundColor: color.surface2,
            }}
          >
            {[0, 1, 2, 3].map((i) =>
              thumbs[i] ? (
                <Image key={i} source={thumbs[i]} style={{ width: '50%', height: '50%' }} contentFit="cover" />
              ) : (
                <View key={i} style={{ width: '50%', height: '50%', backgroundColor: color.surface2 }} />
              ),
            )}
          </View>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 24, color: color.white, marginTop: 16 }}>
            {p?.name}
          </Text>
          <Meta style={{ marginTop: 6 }}>
            플레이리스트 · 장소 {p?.places.length ?? 0}곳 · 방문 {totalVisits}회
          </Meta>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {(p?.places ?? []).map((pl) => (
            <Pressable
              key={pl.placeId}
              onPress={() => router.push(`/place/${pl.placeId}`)}
              onLongPress={() =>
                Alert.alert(pl.name, undefined, [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '플레이리스트에서 제거',
                    style: 'destructive',
                    onPress: () => removePlace.mutate(pl.placeId),
                  },
                ])
              }
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}
            >
              {pl.photoThumbs[0] ? (
                <Image
                  source={pl.photoThumbs[0]}
                  style={{ width: 52, height: 52, borderRadius: 8 }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: color.sub,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: typeface, color: color.sub, fontSize: 11 }}>가고픈</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15.5, color: color.white }}>
                    {pl.name}
                  </Text>
                  {pl.visitCount === 0 && (
                    <Text
                      style={{
                        fontSize: 9.5,
                        fontFamily: typeface, fontWeight: '700',
                        color: color.anniv,
                        borderWidth: 1,
                        borderColor: color.anniv,
                        borderRadius: 4,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                      }}
                    >
                      가고 싶은 곳
                    </Text>
                  )}
                </View>
                <Meta style={{ marginTop: 3, fontSize: 12.5 }}>
                  {pl.category ?? '장소'} · 방문 {pl.visitCount}회
                </Meta>
              </View>
              <Text style={{ fontFamily: typeface, color: color.muted }}>›</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() =>
              router.push({ pathname: '/modals/place-search', params: { playlistId: id! } })
            }
            style={({ pressed }) => ({
              marginTop: 10,
              height: 46,
              borderRadius: 10,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: color.accent, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>+ 장소 담기</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
