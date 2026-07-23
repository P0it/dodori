import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { color, tintBg, typeface } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  tone?: 'accent' | 'anniv' | 'date';
  style?: StyleProp<ViewStyle>;
};

/** D-day pill (목업 Dday) — 기본 green, 기념일 amber, 데이트 보라 */
export function Dday({ children, tone = 'accent', style }: Props) {
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          height: 22,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: tintBg[tone],
        },
        style,
      ]}
    >
      <Text style={{ color: color[tone], fontFamily: typeface, fontWeight: '700', fontSize: 11.5, letterSpacing: 0.2 }}>
        {children}
      </Text>
    </View>
  );
}
