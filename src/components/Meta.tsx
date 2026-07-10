import { Text, type TextStyle, type StyleProp } from 'react-native';
import { color, typeface } from '@/theme/tokens';

type Props = { children: React.ReactNode; style?: StyleProp<TextStyle> };

/** 보조 메타 텍스트 (목업 Meta) */
export function Meta({ children, style }: Props) {
  return (
    <Text style={[{ fontFamily: typeface, fontWeight: '500', fontSize: 13, color: color.sub }, style]}>{children}</Text>
  );
}
