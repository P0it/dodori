import { Pressable, Text } from 'react-native';
import { color, typeface } from '@/theme/tokens';

/** 장소 찜 토글 하트 — 표현만 한다(props-only). 상태·뮤테이션은 화면이 들고 있는다. */
export function SavedHeart({
  saved,
  onPress,
  size = 20,
}: {
  saved: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 2 })}
    >
      <Text style={{ fontFamily: typeface, fontSize: size, color: saved ? color.date : color.muted }}>
        {saved ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}
