import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { color, typeface } from '@/theme/tokens';
import type { MapRegion } from '@/lib/map';
import { playlistIconShapes } from '@/lib/playlistIcons';

export interface MapPin {
  placeId: string;
  lat: number;
  lng: number;
  /** 핀 번호/시간 라벨. 없으면 번호 없는 민핀 (찜 목록처럼 순서가 없는 경우) */
  label?: string;
  name: string;
  category: string | null;
}

export interface PlaceMapProps {
  region: MapRegion;
  pins: MapPin[];
  onPinPress: (placeId: string) => void;
  /** 핀을 순서대로 직선으로 잇는다 (코스 동선). 순서 없는 목록은 false */
  showPath?: boolean;
  /** 선택된 핀 — 조금 키워 강조한다 */
  selectedId?: string | null;
  /** 핀 몸통 색. 리스트 지도는 그 리스트의 색을 쓴다 */
  pinColor?: string;
  /** 핀 머리에 넣을 리스트 아이콘 키. label이 있으면 번호가 우선한다 */
  pinIcon?: string | null;
}

/** 지도 카메라를 특정 핀으로 이동시키는 명령형 핸들 (하단 카드 스트립·시트가 호출) */
export interface PlaceMapHandle {
  focusPin: (lat: number, lng: number) => void;
}

// 핀 기본 크기와 선택 시 배율 — 선택된 핀이 겹친 핀들 위로 도드라지게
const PIN_W = 28;
const PIN_H = 40;
const SELECTED_SCALE = 1.3;

/** 네이티브(iOS/Android) 장소 지도 — 네이버 지도 SDK. props-only. */
export const PlaceMap = forwardRef<PlaceMapHandle, PlaceMapProps>(
  function PlaceMap(
    { region, pins, onPinPress, showPath = false, selectedId = null, pinColor = color.accent, pinIcon = null },
    ref,
  ) {
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
        {showPath && pins.length >= 2 && (
          <NaverMapPathOverlay
            coords={pins.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            width={4}
            color={pinColor}
          />
        )}
        {pins.map((p) => {
          const selected = p.placeId === selectedId;
          const w = selected ? Math.round(PIN_W * SELECTED_SCALE) : PIN_W;
          const h = selected ? Math.round(PIN_H * SELECTED_SCALE) : PIN_H;
          return (
            <NaverMapMarkerOverlay
              key={p.placeId}
              latitude={p.lat}
              longitude={p.lng}
              // 앵커를 뾰족한 끝(하단 중앙)에 둬 위치를 정확히 가리킨다
              anchor={{ x: 0.5, y: 1 }}
              width={w}
              height={h}
              onTap={() => onPinPress(p.placeId)}
            >
              {/* 핀 전체를 하나의 SVG 도형으로 — 흰 테두리가 머리~꼭지까지 이어진다. 번호는 흰색 중앙.
                iOS 신아키텍처 대응: 최상위 자식에 key·collapsable=false (SDK 문서 권고).
                key에 라벨·선택 여부를 함께 넣어 크기가 바뀔 때 마커가 다시 그려지게 한다 */}
              <View
                key={`${p.label ?? pinIcon ?? ''}:${pinColor}:${selected}`}
                collapsable={false}
                style={{ width: w, height: h }}
              >
                <Svg width={w} height={h} viewBox="-2 -2 28 40">
                  <Path
                    d="M12 0 C5.373 0 0 5.373 0 12 C0 21 12 36 12 36 S24 21 24 12 C24 5.373 18.627 0 12 0 Z"
                    fill={pinColor}
                    stroke={color.white}
                    strokeWidth={1.5}
                  />
                  {/* 번호가 없으면 리스트 아이콘을 핀 머리 안에 흰 선으로 얹는다.
                      머리는 중심 (12,12)·반지름 12 — 24×24 아이콘을 0.58배(13.92)로 줄여
                      12 - 13.92/2 = 5.04 만큼 옮기면 정확히 가운데다 */}
                  {!p.label && pinIcon ? (
                    <G transform="translate(5.04 5.04) scale(0.58)">
                      {playlistIconShapes(pinIcon).map((s, i) =>
                        s.kind === 'path' ? (
                          <Path
                            key={i}
                            d={s.d}
                            stroke={color.white}
                            strokeWidth={2.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        ) : (
                          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} stroke={color.white} strokeWidth={2.6} fill="none" />
                        ),
                      )}
                    </G>
                  ) : null}
                </Svg>
                {/* 번호는 RN Text로 머리 위 중앙에 겹친다 */}
                {p.label ? (
                  <View
                    style={{ position: 'absolute', left: 0, top: 0, width: w, height: w, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: color.white, fontFamily: typeface, fontWeight: '800', fontSize: 12 }}>
                      {p.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            </NaverMapMarkerOverlay>
          );
        })}
      </NaverMapView>
    );
  },
);
