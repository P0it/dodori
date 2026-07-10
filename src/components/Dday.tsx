import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { role, roleBg, typeface } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  tone?: 'me' | 'anniv';
  style?: StyleProp<ViewStyle>;
};

/** D-day pill (목업 Dday) — 기본 green, 기념일은 amber */
export function Dday({ children, tone = 'me', style }: Props) {
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
          backgroundColor: roleBg[tone],
        },
        style,
      ]}
    >
      <Text style={{ color: role[tone], fontFamily: typeface, fontWeight: '700', fontSize: 11.5, letterSpacing: 0.2 }}>
        {children}
      </Text>
    </View>
  );
}
