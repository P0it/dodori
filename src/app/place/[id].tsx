import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** 장소 상세 — 우리 데이터만 (목업 P2) — M4 구현 */
export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceholderScreen title="장소" note={`M4: places/${id} 사진·트랙`} />;
}
