import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';
import { formatDday, isReleased } from '@/lib/date';
import { AlbumJacket } from '@/components/AlbumJacket';
import { Dday } from '@/components/Dday';

export type CarouselAlbum = {
  id: string;
  title: string;
  date: string;
  coverThumbUrl: string | null;
};

const CARD = 190;
/** 이웃 카드가 가운데 카드 뒤로 파고드는 폭 */
const OVERLAP = 58;
const STEP = CARD - OVERLAP;

/**
 * 앨범 캐러셀 — 가운데가 현재, 왼쪽이 지난 데이트·오른쪽이 앞으로의 데이트.
 * 이웃은 뒤로 겹쳐 들어가며 작고 연하게 깔린다. 스크롤하면 STEP 단위로 스냅되고
 * 가운데 온 앨범이 활성으로 바뀐다. 사진 없는 앨범은 생성 자켓으로 채운다.
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
  const { width: screen } = useWindowDimensions();
  const [active, setActive] = useState(focusIndex);
  const side = Math.max(0, (screen - CARD) / 2);

  // 마운트·포커스 변경 시 해당 앨범을 가운데로
  useEffect(() => {
    setActive(focusIndex);
    ref.current?.scrollTo({ x: focusIndex * STEP, animated: false });
  }, [focusIndex, albums.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / STEP);
    if (i !== active && i >= 0 && i < albums.length) setActive(i);
  };

  const current = albums[active];

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: side, paddingVertical: 8 }}
      >
        {albums.map((a, i) => {
          const dist = Math.abs(i - active);
          const isActive = dist === 0;
          const upcoming = !isReleased(a.date);
          return (
            <Pressable
              key={a.id}
              onPress={() => onPress(a.id)}
              style={{
                width: CARD,
                height: CARD,
                marginRight: i === albums.length - 1 ? 0 : -OVERLAP,
                // 가운데가 맨 위, 멀어질수록 뒤로
                zIndex: albums.length - dist,
                opacity: isActive ? 1 : Math.max(0.25, 0.5 - (dist - 1) * 0.12),
                transform: [{ scale: isActive ? 1 : Math.max(0.76, 0.86 - (dist - 1) * 0.05) }],
              }}
            >
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 6,
                  overflow: 'hidden',
                  backgroundColor: color.surface2,
                }}
              >
                {a.coverThumbUrl ? (
                  <Image source={a.coverThumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <AlbumJacket seed={a.id} dateLabel={a.date.slice(5).replace('-', '.')} title={a.title} size={CARD} />
                )}
                {upcoming && isActive && (
                  <View style={{ position: 'absolute', left: 8, top: 8 }}>
                    <Dday tone="accent">{formatDday(a.date)}</Dday>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 제목은 가운데 앨범 것만 — 카드가 겹쳐 있어 카드마다 달 수 없다 */}
      {current && (
        <View style={{ alignItems: 'center', marginTop: 10, paddingHorizontal: 16 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}
          >
            {current.title}
          </Text>
          <Text style={{ marginTop: 2, fontFamily: typeface, fontSize: 12, color: color.muted }}>
            {current.date.slice(5).replace('-', '.')}
          </Text>
        </View>
      )}
    </View>
  );
}
