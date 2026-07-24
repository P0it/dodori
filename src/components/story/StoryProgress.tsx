import { View } from 'react-native';
import { color } from '@/theme/tokens';

type Props = {
  count: number;
  index: number;
  /** 현재 칸의 진행률 0~1 */
  progress: number;
};

/** 뷰어 상단 진행바 — 지난 칸은 꽉, 현재 칸은 진행률만큼, 남은 칸은 비어 있다 */
export function StoryProgress({ count, index, progress }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 2.5,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: i < index ? '100%' : i === index ? `${Math.min(1, progress) * 100}%` : 0,
              height: '100%',
              backgroundColor: color.white,
            }}
          />
        </View>
      ))}
    </View>
  );
}
