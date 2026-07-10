import { Pressable, Text, type ViewStyle, type StyleProp } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { KakaoGlyph } from '@/components/glyphs';

type Props = {
  children?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** 카카오 노란 pill 버튼 (목업 KakaoButton) */
export function KakaoButton({ children = '카카오로 시작하기', onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          width: '100%',
          height: 52,
          borderRadius: 999,
          backgroundColor: color.kakao,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <KakaoGlyph size={20} />
      <Text style={{ color: color.kakaoText, fontFamily: typeface, fontWeight: '700', fontSize: 15 }}>{children}</Text>
    </Pressable>
  );
}
