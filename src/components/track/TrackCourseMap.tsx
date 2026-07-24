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
          width={32}
          height={40}
          onTap={() => onPinPress(p.placeId)}
        >
          {/* 핀 — 원형 초록 머리(흰 번호 중앙) + 아래 삼각형 꼭지가 좌표를 가리킴.
              iOS 신아키텍처 대응: 최상위 자식에 key·collapsable=false (SDK 문서 권고) */}
          <View key={p.label} collapsable={false} style={{ width: 32, height: 40 }}>
            {/* 삼각형 꼭지 (아래로) */}
            <View
              style={{
                position: 'absolute',
                left: 9,
                top: 23,
                width: 0,
                height: 0,
                borderLeftWidth: 7,
                borderRightWidth: 7,
                borderTopWidth: 14,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: color.accent,
              }}
            />
            {/* 원형 머리 + 번호 */}
            <View
              style={{
                position: 'absolute',
                left: 2,
                top: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: color.accent,
                borderWidth: 2,
                borderColor: color.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: color.white, fontFamily: typeface, fontWeight: '800', fontSize: 13 }}>
                {p.label}
              </Text>
            </View>
          </View>
        </NaverMapMarkerOverlay>
      ))}
    </NaverMapView>
  );
}
