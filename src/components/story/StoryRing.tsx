import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, storyRing, typeface } from '@/theme/tokens';
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
 * 홈 상단 스토리 링 — 새 스토리 무지개 / 다 봤으면 hairline / 없으면 흐림.
 * 링은 24시간 내 스토리가 없어도 자리를 비우지 않는다 (홈 레이아웃이 흔들리지 않게).
 */
export function StoryRing({ name, avatarUrl, state, size = 62, onPress, onPressAdd }: Props) {
  const avatarSize = size - RING_WIDTH * 2 - 5;
  const avatar = (
    <View style={{ opacity: state === 'none' && !onPressAdd ? 0.45 : 1 }}>
      <Avatar url={avatarUrl} name={name} size={avatarSize} />
    </View>
  );

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
          alignItems: 'center',
          justifyContent: 'center',
          // 무지개 링은 그라디언트 자체가 테두리 — 단색일 때만 border로 그린다
          ...(state === 'new'
            ? null
            : {
                borderWidth: RING_WIDTH,
                borderColor: state === 'seen' ? color.hairline : color.surface2,
              }),
        }}
      >
        {state === 'new' ? (
          <LinearGradient
            colors={[...storyRing]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 링과 아바타 사이 배경색 간격 — 없으면 그라디언트가 사진에 눌어붙는다 */}
            <View
              style={{
                width: avatarSize + 5,
                height: avatarSize + 5,
                borderRadius: (avatarSize + 5) / 2,
                backgroundColor: color.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {avatar}
            </View>
          </LinearGradient>
        ) : (
          avatar
        )}

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
