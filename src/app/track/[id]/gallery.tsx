import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { color, typeface } from '@/theme/tokens';
import { useTrack, useUpdateTrack } from '@/api/tracks';
import { thumbUrl, useDeletePhoto } from '@/api/photos';
import { useSession } from '@/api/auth';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';

/** 사진 전체 갤러리 (목업 15) — 탭: 슬라이드쇼, 길게: 커버 지정/삭제 */
export default function Gallery() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const track = useTrack(id);
  const update = useUpdateTrack(id!);
  const delPhoto = useDeletePhoto(id!);
  const session = useSession();
  const uid = session.data?.user.id;

  const photos = track.data?.photos ?? [];

  const onLongPress = (p: (typeof photos)[number]) => {
    const isCover = track.data?.coverPhotoId === p.id;
    const buttons: Parameters<typeof Alert.alert>[2] = [
      { text: '취소', style: 'cancel' },
      {
        text: isCover ? '커버 해제' : '커버로 지정',
        onPress: () => update.mutate({ coverPhotoId: isCover ? null : p.id }),
      },
    ];
    if (p.uploaderId === uid) {
      buttons.push({
        text: '삭제',
        style: 'destructive',
        onPress: () => delPhoto.mutate({ id: p.id, storagePath: p.storagePath }),
      });
    }
    Alert.alert('사진', undefined, buttons);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title={track.data?.title ?? '갤러리'} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Meta style={{ fontSize: 12.5 }}>
          사진 {photos.length} · 탭하면 슬라이드쇼 · 길게 누르면 커버 지정
        </Meta>
      </View>
      <FlashList
        data={photos}
        numColumns={3}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
        renderItem={({ item: p, index }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/track/[id]/player',
                params: { id: String(id), start: String(index) },
              })
            }
            onLongPress={() => onLongPress(p)}
            style={{ flex: 1, aspectRatio: 1, margin: 2, borderRadius: 3, overflow: 'hidden' }}
          >
            <Image
              source={thumbUrl(p.storagePath, 'grid')}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            {track.data?.coverPhotoId === p.id && (
              <View
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 5,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                }}
              >
                <Text style={{ fontSize: 8.5, fontFamily: typeface, fontWeight: '700', color: color.accent }}>커버</Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
