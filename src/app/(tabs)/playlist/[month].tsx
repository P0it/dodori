import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

/** 월 플레이리스트 상세 (목업 08) — M4 구현. month = "2026-07" */
export default function MonthDetail() {
  const { month } = useLocalSearchParams<{ month: string }>();
  return <PlaceholderScreen title={`${month}`} note="M4: 월 트랙 목록 + 콜라주 커버" />;
}
