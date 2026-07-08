import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** Track 상세 — 플랜/아카이브 모드 (목업 11~13, §7.2 date 기준 파생) — M3 구현 */
export default function TrackDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceholderScreen title="Track" note={`M3: tracks/${id} 플랜·아카이브`} />;
}
