import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
} from '@mj-studio/react-native-naver-map';
import { color } from '@/theme/tokens';
import { pinnablePlaces, boundsOf } from '@/lib/map';
import { useTrack } from '@/api/tracks';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';

/** 코스 동선 지도 — 트랙 장소를 순번 핀 + 직선으로 잇는다 (좌표 있는 장소만) */
export default function TrackMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const track = useTrack(id);

  // 좌표 있는 장소만, sortOrder 순. 순번/시간 라벨은 코스 목록과 같은 규칙.
  const pinned = useMemo(() => pinnablePlaces(track.data?.places ?? []), [track.data]);
  const region = useMemo(
    () => boundsOf(pinned.map((p) => ({ lat: p.lat, lng: p.lng }))),
    [pinned],
  );

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
        <NaverMapView style={{ flex: 1 }} initialRegion={region}>
          {pinned.length >= 2 && (
            <NaverMapPathOverlay
              coords={pinned.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              width={4}
              color={color.accent}
            />
          )}
          {pinned.map((p) => (
            <NaverMapMarkerOverlay
              key={p.placeId}
              latitude={p.lat}
              longitude={p.lng}
              caption={{
                text: p.visitTime ? p.visitTime.slice(0, 5) : `${p.sortOrder + 1}`,
                color: color.bg,
                haloColor: color.white,
              }}
              onTap={() => router.push(`/place/${p.placeId}`)}
            />
          ))}
        </NaverMapView>
      ) : (
        <Meta style={{ textAlign: 'center', marginTop: 40 }}>지도에 표시할 좌표가 있는 장소가 없어요</Meta>
      )}
    </View>
  );
}
