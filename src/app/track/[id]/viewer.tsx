import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { useTrack } from '@/api/tracks';
import { signedThumbUrl } from '@/api/photos';
import { Meta } from '@/components/Meta';
import { Photo } from '@/components/Photo';

/** 사진 뷰어 (목업 14) — 큰 사진 한 장, 좌우를 눌러 넘긴다. 원본은 뷰어 전용 (§9) */
export default function Viewer() {
  const { id, start } = useLocalSearchParams<{ id: string; start?: string }>();
  const router = useRouter();
  const track = useTrack(id);
  const photos = useMemo(() => track.data?.photos ?? [], [track.data]);

  const [index, setIndex] = useState(() => Math.min(Number(start ?? 0), Math.max(photos.length - 1, 0)));
  const [fullUrl, setFullUrl] = useState<string | null>(null);

  // 현재 사진의 본체(1080) 서명 URL — 최대본이다 (실패 시 그리드 썸네일 폴백)
  const current = photos[index];
  useEffect(() => {
    let alive = true;
    setFullUrl(null);
    if (current) {
      signedThumbUrl(current.storagePath, 'feed', current.renditions)
        .then((u: string) => alive && setFullUrl(u))
        .catch(() => alive && setFullUrl(current.thumbUrl));
    }
    return () => {
      alive = false;
    };
  }, [current]);

  if (!current) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Meta>사진이 없어요</Meta>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: typeface, color: color.white }}>닫기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* 상단 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 8,
        }}
      >
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Text style={{ fontFamily: typeface, color: color.white, fontSize: 20 }}>▾</Text>
        </Pressable>
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: color.white }}>
          {track.data?.title}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {/* 사진 — 탭 좌/우 내비. contain으로 둔다: 뷰어에서까지 잘라 보여줄 이유가 없다 */}
      <View style={{ flex: 1, marginHorizontal: 16, marginVertical: 10, borderRadius: 10, overflow: 'hidden' }}>
        <Photo
          url={fullUrl ?? current.thumbUrl}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          transition={200}
        />
        <Pressable
          onPress={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%' }}
        />
        <Pressable
          onPress={() => setIndex((i) => (i + 1) % photos.length)}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%' }}
        />
      </View>

      {/* 하단 — 몇 번째인지와 찍은 시각만 */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: 10,
        }}
      >
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
          {index + 1} / {photos.length}
        </Text>
        {current.takenAt && <Meta style={{ fontSize: 12 }}>{current.takenAt.slice(11, 16)}</Meta>}
      </View>
    </View>
  );
}
