import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** 커스텀(테마) 플레이리스트 상세 (목업 P1) — M4 구현 */
export default function CustomPlaylist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceholderScreen title="테마 플레이리스트" note={`M4: playlists/${id} 장소 목록`} />;
}
