import { Pressable, ScrollView, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import type { MapPin } from './TrackCourseMap';

interface Props {
  stops: MapPin[];
  selectedId: string | null;
  /** 카드 탭 — 해당 핀으로 카메라 이동 + 선택 */
  onSelect: (stop: MapPin) => void;
}

/** 지도 하단 코스 카드 스트립 — 번호·이름·분류. 가로 스크롤. props-only. */
export function CourseCardStrip({ stops, selectedId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
    >
      {stops.map((s) => {
        const selected = s.placeId === selectedId;
        return (
          <Pressable
            key={s.placeId}
            onPress={() => onSelect(s)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              maxWidth: 220,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: color.surface1,
              borderWidth: 1,
              borderColor: selected ? color.accent : color.surface3,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: color.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: color.white, fontFamily: typeface, fontWeight: '800', fontSize: 11 }}>
                {s.label}
              </Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text numberOfLines={1} style={{ color: color.white, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>
                {s.name}
              </Text>
              {s.category ? (
                <Text numberOfLines={1} style={{ color: color.sub, fontFamily: typeface, fontSize: 11.5, marginTop: 1 }}>
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
