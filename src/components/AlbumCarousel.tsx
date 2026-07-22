import { useEffect, useRef } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, role, typeface } from '@/theme/tokens';
import { formatDday, isReleased } from '@/lib/date';
import { AlbumJacket } from '@/components/AlbumJacket';
import { Dday } from '@/components/Dday';

export type CarouselAlbum = {
  id: string;
  title: string;
  date: string;
  coverThumbUrl: string | null;
};

const FOCUS = 200;
const NORMAL = 140;
const GAP = 14;
const SCREEN = Dimensions.get('window').width;

/**
 * 앨범 캐러셀 — 왼쪽 과거 · 오른쪽 미래. focusIndex(오늘 최근접) 앨범을 크게 띄우고
 * 마운트 시 화면 중앙으로 스크롤한다. 사진 없는 앨범은 생성 자켓으로 채운다.
 */
export function AlbumCarousel({
  albums,
  focusIndex,
  onPress,
}: {
  albums: CarouselAlbum[];
  focusIndex: number;
  onPress: (id: string) => void;
}) {
  const ref = useRef<ScrollView>(null);

  // focus 카드 앞 카드들의 누적 폭 → focus를 화면 중앙에 오도록 스크롤
  useEffect(() => {
    const before = focusIndex * (NORMAL + GAP);
    const x = before - (SCREEN - FOCUS) / 2 + 16;
    ref.current?.scrollTo({ x: Math.max(0, x), animated: false });
  }, [focusIndex, albums.length]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center', gap: GAP }}
    >
      {albums.map((a, i) => {
        const focused = i === focusIndex;
        const size = focused ? FOCUS : NORMAL;
        const upcoming = !isReleased(a.date);
        return (
          <Pressable key={a.id} onPress={() => onPress(a.id)} style={{ width: size, opacity: focused ? 1 : 0.7 }}>
            <View
              style={{
                width: size,
                height: size,
                borderRadius: 6,
                overflow: 'hidden',
                backgroundColor: color.surface2,
                borderWidth: focused ? 2 : 0,
                borderColor: upcoming ? role.me : color.date,
              }}
            >
              {a.coverThumbUrl ? (
                <Image source={a.coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <AlbumJacket seed={a.id} dateLabel={a.date.slice(5).replace('-', '.')} title={a.title} size={size} />
              )}
              {upcoming && (
                <View style={{ position: 'absolute', left: 8, top: 8 }}>
                  <Dday tone="me">{formatDday(a.date)}</Dday>
                </View>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={{
                marginTop: 8,
                fontFamily: typeface,
                fontWeight: focused ? '700' : '600',
                fontSize: focused ? 15 : 13,
                color: focused ? color.white : color.sub,
              }}
            >
              {a.title}
            </Text>
            <Text style={{ marginTop: 1, fontFamily: typeface, fontSize: 12, color: color.muted }}>
              {a.date.slice(5).replace('-', '.')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
