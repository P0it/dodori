import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color, typeface } from '@/theme/tokens';

type Props = {
  title?: string;
  onBack?: boolean;
  /** 주면 back 화살표 대신 놓인다 (수정 모드의 "취소" 등) */
  left?: React.ReactNode;
  right?: React.ReactNode;
  tint?: string;
};

/** 상단 바 — back / 중앙 타이틀 / 우측 액션 (목업 TopBar) */
export function TopBar({ title, onBack = true, left, right, tint = color.white }: Props) {
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
      {left ? (
        left
      ) : onBack ? (
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => router.back()}
        >
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
          fontFamily: typeface, fontWeight: '700',
          fontSize: 15,
          letterSpacing: -0.15,
          color: tint,
        }}
      >
        {title}
      </Text>
      {/* minWidth — "저장" 같은 글자 액션이 들어와도 잘리지 않게 */}
      <View style={{ minWidth: 22, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
