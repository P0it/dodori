import { Text, type TextStyle, type StyleProp } from 'react-native';
import { color, typeface } from '@/theme/tokens';

type Props = { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

/** 보조 메타 텍스트 (목업 Meta) */
export function Meta({ children, style, numberOfLines }: Props) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: typeface, fontWeight: '500', fontSize: 13, color: color.sub }, style]}
    >
      {children}
    </Text>
  );
}
