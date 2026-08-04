import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { color, tintBg, typeface } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  tone?: 'accent' | 'anniv' | 'date';
  /**
   * 사진 위에 얹을 때. 기본 pill은 15% 틴트라 밝은 커버 위에선 배지도 글자도 사라진다 —
   * 색을 꽉 채우고 글자를 어둡게 뒤집어 어떤 사진 위에서도 읽히게 한다.
   */
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** D-day pill (목업 Dday) — 기본 green, 기념일 amber, 데이트 보라 */
export function Dday({ children, tone = 'accent', solid = false, style }: Props) {
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          height: solid ? 25 : 22,
          paddingHorizontal: solid ? 11 : 10,
          borderRadius: 999,
          backgroundColor: solid ? color[tone] : tintBg[tone],
        },
        style,
      ]}
    >
      <Text
        style={{
          color: solid ? color.onPrimary : color[tone],
          fontFamily: typeface,
          fontWeight: solid ? '800' : '700',
          fontSize: solid ? 12.5 : 11.5,
          letterSpacing: 0.2,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
