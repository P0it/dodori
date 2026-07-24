import { useEffect, useRef } from 'react';
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
 * 핀↔카드 양방향: 넘기면 지도가 따라오고, 핀을 탭하면(selectedId 변경) 그 카드로 스크롤한다.
 * 네이버 지도(라이트 테마)에 얹히므로 카드도 밝은 테마. props-only.
 */
export function CourseCardStrip({ stops, selectedId, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  // 첫·마지막 카드도 화면 중앙에 올 수 있게 좌우 여백을 반 카드만큼
  const sidePad = Math.max(12, (width - CARD_W) / 2);
  const lastIndexRef = useRef(-1);
  // 프로그램 스크롤(핀 탭·카드 탭)로 움직이는 동안엔 onScroll의 선택을 억제한다 (되먹임 방지)
  const suppressRef = useRef(false);
  const targetRef = useRef(-1);

  // 바깥에서 선택이 바뀌면(핀 탭 등) 그 카드로 스크롤
  useEffect(() => {
    const i = stops.findIndex((s) => s.placeId === selectedId);
    if (i < 0 || i === lastIndexRef.current) return;
    lastIndexRef.current = i;
    targetRef.current = i;
    suppressRef.current = true;
    scrollRef.current?.scrollTo({ x: i * SLOT, animated: true });
  }, [selectedId, stops]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(stops.length - 1, Math.round(e.nativeEvent.contentOffset.x / SLOT)));
    if (suppressRef.current) {
      // 프로그램 스크롤 진행 중 — 목표에 도달하면 억제 해제, 그동안 선택은 발생시키지 않음
      lastIndexRef.current = i;
      if (i === targetRef.current) suppressRef.current = false;
      return;
    }
    if (i !== lastIndexRef.current) {
      lastIndexRef.current = i;
      const s = stops[i];
      if (s) onSelect(s);
    }
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
            onPress={() => onSelect(s)}
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
