import { Text, View } from 'react-native';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
} from '@mj-studio/react-native-naver-map';
import { color, typeface } from '@/theme/tokens';
import type { MapRegion } from '@/lib/map';

export interface MapPin {
  placeId: string;
  lat: number;
  lng: number;
  /** 핀 캡션 — 방문 시간(HH:MM) 또는 순번 */
  label: string;
}

export interface TrackCourseMapProps {
  region: MapRegion;
  pins: MapPin[];
  onPinPress: (placeId: string) => void;
}

/** 네이티브(iOS/Android) 코스 지도 — 네이버 지도 SDK. props-only. */
export function TrackCourseMap({ region, pins, onPinPress }: TrackCourseMapProps) {
  return (
    <NaverMapView style={{ flex: 1 }} initialRegion={region}>
      {pins.length >= 2 && (
        <NaverMapPathOverlay
          coords={pins.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
          width={4}
          color={color.accent}
        />
      )}
      {pins.map((p) => (
        <NaverMapMarkerOverlay
          key={p.placeId}
          latitude={p.lat}
          longitude={p.lng}
          // 앵커를 뾰족한 끝(하단 중앙)에 둬 위치를 정확히 가리킨다
          anchor={{ x: 0.5, y: 1 }}
          width={34}
          height={42}
          onTap={() => onPinPress(p.placeId)}
        >
          {/* 물방울 핀 — 초록 머리(한 모서리만 각지게 + 45° 회전으로 아래를 향함) + 흰 번호.
              iOS 신아키텍처 대응: 최상위 자식에 key·collapsable=false (SDK 문서 권고) */}
          <View key={p.label} collapsable={false} style={{ width: 34, height: 42 }}>
            <View
              style={{
                position: 'absolute',
                left: 3,
                top: 2,
                width: 28,
                height: 28,
                backgroundColor: color.accent,
                borderWidth: 2,
                borderColor: color.white,
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                borderBottomRightRadius: 15,
                borderBottomLeftRadius: 0,
                transform: [{ rotate: '-45deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 5,
                width: 34,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: color.onPrimary, fontFamily: typeface, fontWeight: '800', fontSize: 13 }}>
                {p.label}
              </Text>
            </View>
          </View>
        </NaverMapMarkerOverlay>
      ))}
    </NaverMapView>
  );
}
