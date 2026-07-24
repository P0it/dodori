import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';
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

/** 웹 코스 지도 — 네이버 지도 JavaScript API v3. 네이티브 SDK가 없는 브라우저 프리뷰용. props-only. */
export function TrackCourseMap({ region, pins, onPinPress }: TrackCourseMapProps) {
  // RN Web에서 View는 DOM div로 렌더된다 — ref.current가 그 div. 타입 마찰을 피해 any로 받는다.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  // EXPO_PUBLIC_ 변수는 Metro가 빌드 시 문자열로 인라인한다 — Constants 경로의 객체화 문제를 피한다
  const clientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;
  // onPinPress는 매 렌더 새 함수라 effect 의존성에서 빼고 ref로 최신값을 읽는다 (지도 재생성 방지)
  const onPinPressRef = useRef(onPinPress);
  onPinPressRef.current = onPinPress;

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
        const bounds = new naver.maps.LatLngBounds();
        pins.forEach((p) => {
          const pos = new naver.maps.LatLng(p.lat, p.lng);
          bounds.extend(pos);
          const marker = new naver.maps.Marker({
            position: pos,
            map,
            icon: {
              content: `<div style="display:flex;align-items:center;justify-content:center;width:44px;height:24px;border-radius:12px;background:${color.accent};color:${color.onPrimary};font-weight:700;font-size:12px;font-family:${typeface},sans-serif;border:2px solid ${color.white};box-shadow:0 1px 3px rgba(0,0,0,0.4)">${p.label}</div>`,
              size: new naver.maps.Size(44, 24),
              anchor: new naver.maps.Point(22, 12),
            },
          });
          naver.maps.Event.addListener(marker, 'click', () => onPinPressRef.current(p.placeId));
        });
        if (pins.length >= 2) {
          new naver.maps.Polyline({
            map,
            path: pins.map((p) => new naver.maps.LatLng(p.lat, p.lng)),
            strokeColor: color.accent,
            strokeWeight: 4,
          });
        }
        if (pins.length >= 1) map.fitBounds(bounds);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, region, pins]);

  if (error) {
    return <Meta style={{ textAlign: 'center', marginTop: 40 }}>{error}</Meta>;
  }
  return <View ref={containerRef} style={{ flex: 1 }} />;
}
