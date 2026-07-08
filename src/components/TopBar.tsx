import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color } from '@/theme/tokens';

type Props = {
  title?: string;
  onBack?: boolean;
  right?: React.ReactNode;
  tint?: string;
};

/** 상단 바 — back / 중앙 타이틀 / 우측 액션 (목업 TopBar) */
export function TopBar({ title, onBack = true, right, tint = color.white }: Props) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 52,
        paddingHorizontal: 16,
      }}
    >
      {onBack ? (
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5l-7 7 7 7"
              stroke={tint}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      ) : (
        <View style={{ width: 22 }} />
      )}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          textAlign: 'center',
          fontWeight: '700',
          fontSize: 15,
          letterSpacing: -0.15,
          color: tint,
        }}
      >
        {title}
      </Text>
      <View style={{ width: 22, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
