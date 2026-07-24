import { Pressable, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { PlusGlyph } from '@/components/glyphs';
import type { RingState } from '@/lib/stories';

type Props = {
  name: string;
  avatarUrl: string | null;
  state: RingState;
  size?: number;
  onPress: () => void;
  /** 주면 `+` 배지가 붙는다 (내 링) — 링 자체와 다른 곳으로 간다 */
  onPressAdd?: () => void;
};

const RING_WIDTH = 2.5;

/**
 * 홈 상단 스토리 링 — 새 스토리 accent / 다 봤으면 hairline / 없으면 흐림.
 * 링은 24시간 내 스토리가 없어도 자리를 비우지 않는다 (홈 레이아웃이 흔들리지 않게).
 */
export function StoryRing({ name, avatarUrl, state, size = 62, onPress, onPressAdd }: Props) {
  const ringColor =
    state === 'new' ? color.accent : state === 'seen' ? color.hairline : color.surface2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ alignItems: 'center', width: size + 14, opacity: pressed ? 0.75 : 1 })}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: RING_WIDTH,
          borderColor: ringColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ opacity: state === 'none' && !onPressAdd ? 0.45 : 1 }}>
          <Avatar url={avatarUrl} name={name} size={size - RING_WIDTH * 2 - 5} />
        </View>

        {onPressAdd && (
          <Pressable
            onPress={onPressAdd}
            hitSlop={8}
            style={{
              position: 'absolute',
              right: -1,
              bottom: -1,
              width: 21,
              height: 21,
              borderRadius: 11,
              backgroundColor: color.accent,
              borderWidth: 2,
              borderColor: color.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlusGlyph size={12} color={color.onPrimary} />
          </Pressable>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{
          fontFamily: typeface,
          fontSize: 11.5,
          color: state === 'none' ? color.muted : color.sub,
          marginTop: 6,
        }}
      >
        {name}
      </Text>
    </Pressable>
  );
}
