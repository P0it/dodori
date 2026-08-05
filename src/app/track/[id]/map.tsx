import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { color } from '@/theme/tokens';
import { pinnablePlaces, boundsOf } from '@/lib/map';
import { useTrack } from '@/api/tracks';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { PlaceMap, type MapPin, type PlaceMapHandle } from '@/components/map/PlaceMap';
import { CourseCardStrip } from '@/components/track/CourseCardStrip';

/** 코스 동선 지도 — 트랙 장소를 순번 핀 + 직선으로 잇는다 (좌표 있는 장소만).
 *  지도 렌더링은 플랫폼별 컴포넌트(TrackCourseMap: 네이티브=SDK / 웹=JS API)가 맡고,
 *  하단 카드 스트립으로 어떤 핀이 어떤 장소인지 보여주고 탭하면 그 핀으로 이동한다. */
export default function TrackMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const track = useTrack(id);
  const mapRef = useRef<PlaceMapHandle>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 좌표 있는 장소만, sortOrder 순. 순번/시간 라벨은 코스 목록과 같은 규칙.
  const pins: MapPin[] = useMemo(
    () =>
      pinnablePlaces(track.data?.places ?? []).map((p) => ({
        placeId: p.placeId,
        lat: p.lat,
        lng: p.lng,
        label: p.visitTime ? p.visitTime.slice(0, 5) : `${p.sortOrder + 1}`,
        name: p.name,
        category: p.category,
      })),
    [track.data],
  );
  // 코스는 하단 카드 스트립이 지도 아래를 가린다 — 기본보다 넉넉히 줄여 전체 동선이 한눈에 들게
  const region = useMemo(
    () => boundsOf(pins.map((p) => ({ lat: p.lat, lng: p.lng })), 2),
    [pins],
  );

  // 핀 탭·카드 선택 공통 — 그 장소를 선택하고 지도 카메라를 이동. (핀↔카드 동기화)
  const select = (placeId: string) => {
    setSelectedId(placeId);
    const p = pins.find((x) => x.placeId === placeId);
    if (p) mapRef.current?.focusPin(p.lat, p.lng);
  };

  if (track.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="코스 지도" />
      {region ? (
        <View style={{ flex: 1 }}>
          <PlaceMap
            ref={mapRef}
            region={region}
            pins={pins}
            onPinPress={select}
            showPath
          />
          {/* 하단 카드 스트립 — 핀 탭 시 그 카드로 스크롤, 카드 넘기면 그 핀으로 카메라 이동 */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 16 }}>
            <CourseCardStrip stops={pins} selectedId={selectedId} onSelect={(s) => select(s.placeId)} />
          </View>
        </View>
      ) : (
        <Meta style={{ textAlign: 'center', marginTop: 40 }}>지도에 표시할 좌표가 있는 장소가 없어요</Meta>
      )}
    </View>
  );
}
