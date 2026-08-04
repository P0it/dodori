import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import { useTrack } from '@/api/tracks';
import { signedThumbUrl } from '@/api/photos';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';

const SLIDE_MS = 3000;

/** 재생 뷰 — 사진 슬라이드쇼 (목업 14). 원본은 뷰어 전용 (§9) */
export default function Player() {
  const { id, start } = useLocalSearchParams<{ id: string; start?: string }>();
  const router = useRouter();
  const track = useTrack(id);
  const photos = useMemo(() => track.data?.photos ?? [], [track.data]);

  const [index, setIndex] = useState(() => Math.min(Number(start ?? 0), Math.max(photos.length - 1, 0)));
  const [playing, setPlaying] = useState(true);
  const [fullUrl, setFullUrl] = useState<string | null>(null);

  // 자동 진행
  useEffect(() => {
    if (!playing || photos.length === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % photos.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [playing, photos.length]);

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
        <View style={{ alignItems: 'center' }}>
          <Eyebrow style={{ fontSize: 9.5 }}>슬라이드쇼 재생 중</Eyebrow>
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: color.white, marginTop: 2 }}>
            {track.data?.title}
          </Text>
        </View>
        <View style={{ width: 20 }} />
      </View>

      {/* 사진 — 탭 좌/우 내비 */}
      <View style={{ flex: 1, marginHorizontal: 16, marginVertical: 10, borderRadius: 10, overflow: 'hidden' }}>
        <Image
          source={fullUrl ?? current.thumbUrl}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={300}
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

      {/* 하단 컨트롤 */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: i <= index ? color.white : 'rgba(255,255,255,0.28)',
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>
              {index + 1} / {photos.length}
            </Text>
            {current.takenAt && (
              <Meta style={{ marginTop: 2, fontSize: 12 }}>
                {current.takenAt.slice(11, 16)}
              </Meta>
            )}
          </View>
          <Pressable
            onPress={() => setPlaying((p) => !p)}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: color.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: typeface, fontSize: 22, color: '#000' }}>{playing ? '❚❚' : '▶'}</Text>
          </Pressable>
          <View style={{ width: 60 }} />
        </View>
      </View>
    </View>
  );
}
