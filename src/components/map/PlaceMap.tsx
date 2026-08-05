import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { color, typeface } from '@/theme/tokens';
import type { MapRegion } from '@/lib/map';

export interface MapPin {
  placeId: string;
  lat: number;
  lng: number;
  /** 핀 번호/시간 라벨 */
  label: string;
  name: string;
  category: string | null;
}

export interface TrackCourseMapProps {
  region: MapRegion;
  pins: MapPin[];
  onPinPress: (placeId: string) => void;
}

/** 지도 카메라를 특정 핀으로 이동시키는 명령형 핸들 (하단 카드 스트립이 호출) */
export interface TrackCourseMapHandle {
  focusPin: (lat: number, lng: number) => void;
}

/** 네이티브(iOS/Android) 코스 지도 — 네이버 지도 SDK. props-only. */
export const TrackCourseMap = forwardRef<TrackCourseMapHandle, TrackCourseMapProps>(
  function TrackCourseMap({ region, pins, onPinPress }, ref) {
    const mapRef = useRef<NaverMapViewRef>(null);
    useImperativeHandle(
      ref,
      () => ({
        focusPin: (lat, lng) => mapRef.current?.animateCameraTo({ latitude: lat, longitude: lng, zoom: 15 }),
      }),
      [],
    );

    return (
      <NaverMapView ref={mapRef} style={{ flex: 1 }} initialRegion={region}>
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
            width={28}
            height={40}
            onTap={() => onPinPress(p.placeId)}
          >
            {/* 핀 전체를 하나의 SVG 도형으로 — 흰 테두리가 머리~꼭지까지 이어진다. 번호는 흰색 중앙.
                iOS 신아키텍처 대응: 최상위 자식에 key·collapsable=false (SDK 문서 권고) */}
            <View key={p.label} collapsable={false} style={{ width: 28, height: 40 }}>
              <Svg width={28} height={40} viewBox="-2 -2 28 40">
                <Path
                  d="M12 0 C5.373 0 0 5.373 0 12 C0 21 12 36 12 36 S24 21 24 12 C24 5.373 18.627 0 12 0 Z"
                  fill={color.accent}
                  stroke={color.white}
                  strokeWidth={1.5}
                />
              </Svg>
              {/* 번호는 RN Text로 머리 위 중앙에 겹친다 */}
              <View
                style={{ position: 'absolute', left: 0, top: 0, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: color.white, fontFamily: typeface, fontWeight: '800', fontSize: 12 }}>
                  {p.label}
                </Text>
              </View>
            </View>
          </NaverMapMarkerOverlay>
        ))}
      </NaverMapView>
    );
  },
);
