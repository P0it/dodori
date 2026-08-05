import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';
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

const PIN_W = 28;
const PIN_H = 40;
const SELECTED_SCALE = 1.3;

// 네이버 지도 v3 스크립트는 한 번만 로드한다 (여러 번 마운트돼도 재삽입 안 함)
let scriptPromise: Promise<void> | null = null;
function loadNaverMaps(clientId: string): Promise<void> {
  const w = window as unknown as { naver?: { maps?: unknown } };
  if (w.naver?.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('네이버 지도 스크립트를 불러오지 못했어요 (Web 서비스 URL 등록 확인)'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** 리스트 아이콘을 핀 머리 안에 놓는 SVG 문자열 — 네이티브 PlaceMap의 <G transform>과 같은 계산 */
function iconMarkup(iconKey: string): string {
  const shapes = playlistIconShapes(iconKey)
    .map((s) =>
      s.kind === 'path'
        ? `<path d="${s.d}" stroke="${color.white}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        : `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" stroke="${color.white}" stroke-width="2.6" fill="none"/>`,
    )
    .join('');
  return `<g transform="translate(5.04 5.04) scale(0.58)">${shapes}</g>`;
}

// 핀 SVG(원형 머리 + 아래 꼭지, 흰 테두리) — 머리 안엔 번호, 번호가 없으면 리스트 아이콘
function pinSvg(label: string | undefined, selected: boolean, pinColor: string, pinIcon: string | null): string {
  const w = selected ? Math.round(PIN_W * SELECTED_SCALE) : PIN_W;
  const h = selected ? Math.round(PIN_H * SELECTED_SCALE) : PIN_H;
  const inner = label
    ? `<text x="12" y="12.5" text-anchor="middle" dominant-baseline="central" fill="${color.white}" font-family="${typeface},sans-serif" font-weight="800" font-size="12">${label}</text>`
    : pinIcon
      ? iconMarkup(pinIcon)
      : '';
  return `<div style="position:relative;width:${w}px;height:${h}px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
    <svg width="${w}" height="${h}" viewBox="-2 -2 28 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0 C5.373 0 0 5.373 0 12 C0 21 12 36 12 36 S24 21 24 12 C24 5.373 18.627 0 12 0 Z" fill="${pinColor}" stroke="${color.white}" stroke-width="1.5"/>
      ${inner}
    </svg>
  </div>`;
}

/** 마커 아이콘 옵션 — 앵커는 뾰족한 끝(하단 중앙) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function markerIcon(naver: any, pin: MapPin, selected: boolean, pinColor: string, pinIcon: string | null) {
  const w = selected ? Math.round(PIN_W * SELECTED_SCALE) : PIN_W;
  const h = selected ? Math.round(PIN_H * SELECTED_SCALE) : PIN_H;
  return {
    content: pinSvg(pin.label, selected, pinColor, pinIcon),
    size: new naver.maps.Size(w, h),
    anchor: new naver.maps.Point(w / 2, h - 2),
  };
}

/** 웹 장소 지도 — 네이버 지도 JavaScript API v3. 네이티브 SDK가 없는 브라우저 프리뷰용. props-only. */
export const PlaceMap = forwardRef<PlaceMapHandle, PlaceMapProps>(
  function PlaceMap(
    { region, pins, onPinPress, showPath = false, selectedId = null, pinColor = color.accent, pinIcon = null },
    ref,
  ) {
    // RN Web에서 View는 DOM div로 렌더된다 — ref.current가 그 div. 타입 마찰을 피해 any로 받는다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstanceRef = useRef<any>(null);
    // 선택이 바뀔 때 지도를 다시 만들지 않고 아이콘만 갈아끼우려고 마커를 들고 있는다
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markersRef = useRef<Map<string, any>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;
    // onPinPress는 매 렌더 새 함수라 effect 의존성에서 빼고 ref로 최신값을 읽는다 (지도 재생성 방지)
    const onPinPressRef = useRef(onPinPress);
    onPinPressRef.current = onPinPress;
    // 지도를 만드는 시점의 선택 상태도 같은 이유로 ref로 읽는다 (selectedId는 아래 별도 effect가 반영)
    const selectedIdRef = useRef(selectedId);
    selectedIdRef.current = selectedId;

    useImperativeHandle(
      ref,
      () => ({
        focusPin: (lat, lng) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const naver = (window as any).naver;
          if (mapInstanceRef.current && naver) mapInstanceRef.current.panTo(new naver.maps.LatLng(lat, lng));
        },
      }),
      [],
    );

    useEffect(() => {
      let cancelled = false;
      if (!clientId) {
        setError('NAVER_MAP_CLIENT_ID가 설정되지 않았어요');
        return;
      }
      // 인증 실패(잘못된 클라이언트 ID·Web 서비스 URL) 시 네이버 기본 팝업 대신 앱 안에서 원인 표시.
      // Web 서비스 URL은 포트·경로 없이 호스트만 등록해야 한다 (예: http://localhost).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).navermap_authFailure = () =>
        setError('네이버 지도 인증 실패 — NCP 콘솔의 Web 서비스 URL을 "http://localhost"(포트·슬래시 제외)로 등록했는지, 클라이언트 ID가 맞는지 확인하세요');
      loadNaverMaps(clientId)
        .then(() => {
          if (cancelled || !containerRef.current) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const naver = (window as any).naver;
          const centerLat = region.latitude + region.latitudeDelta / 2;
          const centerLng = region.longitude + region.longitudeDelta / 2;
          const map = new naver.maps.Map(containerRef.current, {
            center: new naver.maps.LatLng(centerLat, centerLng),
            zoom: 13,
          });
          mapInstanceRef.current = map;
          markersRef.current = new Map();
          pins.forEach((p) => {
            const pos = new naver.maps.LatLng(p.lat, p.lng);
            const marker = new naver.maps.Marker({
              position: pos,
              map,
              icon: markerIcon(naver, p, p.placeId === selectedIdRef.current, pinColor, pinIcon),
            });
            markersRef.current.set(p.placeId, marker);
            naver.maps.Event.addListener(marker, 'click', () => onPinPressRef.current(p.placeId));
          });
          if (showPath && pins.length >= 2) {
            new naver.maps.Polyline({
              map,
              path: pins.map((p) => new naver.maps.LatLng(p.lat, p.lng)),
              strokeColor: pinColor,
              strokeWeight: 4,
            });
          }
          // 핀들의 실제 bounds가 아니라 region에 맞춘다 — region은 boundsOf가 최소 범위·패딩까지
          // 적용한 값이다. 핀 bounds로 fitBounds하면 한 곳짜리 리스트에서 최대 배율로 확대된다
          if (pins.length >= 1) {
            map.fitBounds(
              new naver.maps.LatLngBounds(
                new naver.maps.LatLng(region.latitude, region.longitude),
                new naver.maps.LatLng(
                  region.latitude + region.latitudeDelta,
                  region.longitude + region.longitudeDelta,
                ),
              ),
            );
          }
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        });
      return () => {
        cancelled = true;
      };
    }, [clientId, region, pins, showPath, pinColor, pinIcon]);

    // 선택이 바뀌면 해당 마커 아이콘만 갈아끼운다 — 지도를 다시 만들면 카메라·줌이 초기화된다
    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const naver = (window as any).naver;
      if (!naver || markersRef.current.size === 0) return;
      pins.forEach((p) => {
        const marker = markersRef.current.get(p.placeId);
        if (marker) marker.setIcon(markerIcon(naver, p, p.placeId === selectedId, pinColor, pinIcon));
      });
    }, [selectedId, pins, pinColor, pinIcon]);

    if (error) {
      return <Meta style={{ textAlign: 'center', marginTop: 40 }}>{error}</Meta>;
    }
    return <View ref={containerRef} style={{ flex: 1 }} />;
  },
);
