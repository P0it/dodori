import { Pressable, Text, View } from 'react-native';
import { color } from '@/theme/tokens';

type Props = {
  selected?: boolean;
  onPress?: () => void;
  children: string;
  /** 라벨 앞 장식 (OwnerDot 등) */
  leading?: React.ReactNode;
};

/** 필터 칩 (DS FilterChip 대응) */
export function FilterChip({ selected, onPress, children, leading }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 32,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: selected ? color.white : color.surface2,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {leading}
      <Text
        style={{
          fontWeight: '600',
          fontSize: 12.5,
          color: selected ? color.bg : color.sub,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
