import { Text, type TextStyle, type StyleProp } from 'react-native';
import { color, typeface } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** 섹션 레이블 — 대문자·자간 넓은 마이크로 타이틀 (목업 Eyebrow) */
export function Eyebrow({ children, color: fg, style }: Props) {
  return (
    <Text
      style={[
        {
          fontFamily: typeface, fontWeight: '700',
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: fg ?? color.sub,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
