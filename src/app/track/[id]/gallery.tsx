import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { color, typeface } from '@/theme/tokens';
import { useTrack, useUpdateTrack } from '@/api/tracks';
import { useDeletePhoto } from '@/api/photos';
import { useSession } from '@/api/auth';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { chooseDialog } from '@/components/dialog';
import { Photo } from '@/components/Photo';

/**
 * 사진 전체 갤러리 (목업 15) — 탭: 슬라이드쇼, 길게: 커버 지정/삭제.
 * `pick=cover`로 들어오면 **커버 고르기 모드** — 탭이 곧 커버 지정이다 (앨범 상세에서 보낸다).
 */
export default function Gallery() {
  const { id, pick } = useLocalSearchParams<{ id: string; pick?: string }>();
  const picking = pick === 'cover';
  const router = useRouter();
  const track = useTrack(id);
  const update = useUpdateTrack(id!);
  const delPhoto = useDeletePhoto(id!);
  const session = useSession();
  const uid = session.data?.user.id;

  const photos = track.data?.photos ?? [];

  const onLongPress = async (p: (typeof photos)[number]) => {
    // 스토리에서 흘러온 사진은 앨범이 빌려 보여줄 뿐 — 커버 지정·삭제는 스토리 뷰어에서
    if (p.storyId) return;
    const isCover = track.data?.coverPhotoId === p.id;
    const choices: { label: string; destructive?: boolean }[] = [
      { label: isCover ? '커버 해제' : '커버로 지정' },
    ];
    if (p.uploaderId === uid) choices.push({ label: '삭제', destructive: true });

    const picked = await chooseDialog('사진', choices);
    if (picked === 0) update.mutate({ coverPhotoId: isCover ? null : p.id });
    else if (picked === 1) {
      delPhoto.mutate({ id: p.id, storagePath: p.storagePath, renditions: p.renditions });
    }
  };

  // 스토리에서 흘러온 사진은 커버로 못 쓴다 (롱프레스와 같은 규칙) — 고르기 모드에선 흐리게 둔다
  const pickable = (p: (typeof photos)[number]) => !picking || !p.storyId;

  const onPress = (p: (typeof photos)[number], index: number) => {
    if (picking) {
      update.mutate({ coverPhotoId: p.id });
      router.back();
      return;
    }
    router.push({
      pathname: '/track/[id]/player',
      params: { id: String(id), start: String(index) },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title={picking ? '커버 고르기' : (track.data?.title ?? '갤러리')} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Meta style={{ fontSize: 12.5 }}>
          {picking
            ? '커버로 쓸 사진을 고르세요'
            : `사진 ${photos.length} · 탭하면 슬라이드쇼 · 길게 누르면 커버 지정·삭제`}
        </Meta>
      </View>
      <FlashList
        data={photos}
        numColumns={3}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
        renderItem={({ item: p, index }) => (
          <Pressable
            onPress={() => onPress(p, index)}
            onLongPress={() => onLongPress(p)}
            disabled={!pickable(p)}
            style={{
              flex: 1,
              aspectRatio: 1,
              margin: 2,
              borderRadius: 3,
              overflow: 'hidden',
              opacity: pickable(p) ? 1 : 0.35,
            }}
          >
            <Photo url={p.thumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
