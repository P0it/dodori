import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
} from '@mj-studio/react-native-naver-map';
import { color } from '@/theme/tokens';
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
          caption={{ text: p.label, color: color.bg, haloColor: color.white }}
          onTap={() => onPinPress(p.placeId)}
        />
      ))}
    </NaverMapView>
  );
}
