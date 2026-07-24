import { useRef } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { color, typeface } from '@/theme/tokens';
import type { MapPin } from './TrackCourseMap';

const CARD_W = 200;
const GAP = 10;
const SLOT = CARD_W + GAP;

interface Props {
  stops: MapPin[];
  selectedId: string | null;
  /** 카드가 가운데로 오거나 탭될 때 — 해당 핀으로 카메라 이동 + 선택 */
  onSelect: (stop: MapPin) => void;
}

/**
 * 지도 하단 코스 카드 스트립 — 번호·이름·분류. 캐러셀처럼 넘기면 가운데 카드가 포커스된다.
 * 네이버 지도(라이트 테마)에 얹히므로 카드도 밝은 테마. props-only.
 */
export function CourseCardStrip({ stops, selectedId, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  // 첫·마지막 카드도 화면 중앙에 올 수 있게 좌우 여백을 반 카드만큼
  const sidePad = Math.max(12, (width - CARD_W) / 2);
  const lastIndexRef = useRef(-1);

  const focusIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(stops.length - 1, i));
    if (clamped === lastIndexRef.current) return;
    lastIndexRef.current = clamped;
    const s = stops[clamped];
    if (s) onSelect(s);
  };

  // 스크롤하며 가운데 카드가 바뀔 때마다 그 장소를 포커스 (인덱스가 바뀔 때만 호출)
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    focusIndex(Math.round(e.nativeEvent.contentOffset.x / SLOT));
  };

  const onTapCard = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * SLOT, animated: true });
    focusIndex(i);
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SLOT}
      snapToAlignment="start"
      scrollEventThrottle={16}
      onScroll={onScroll}
      contentContainerStyle={{ paddingHorizontal: sidePad }}
    >
      {stops.map((s, i) => {
        const selected = s.placeId === selectedId;
        return (
          <Pressable
            key={s.placeId}
            onPress={() => onTapCard(i)}
            style={{
              width: CARD_W,
              marginRight: i === stops.length - 1 ? 0 : GAP,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 11,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: color.white,
              borderWidth: 1.5,
              borderColor: selected ? color.accent : color.white,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: color.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: color.white, fontFamily: typeface, fontWeight: '800', fontSize: 12 }}>
                {s.label}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: color.bg, fontFamily: typeface, fontWeight: '700', fontSize: 14 }}>
                {s.name}
              </Text>
              {s.category ? (
                <Text numberOfLines={1} style={{ color: color.muted, fontFamily: typeface, fontSize: 11.5, marginTop: 1 }}>
                  {s.category}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
