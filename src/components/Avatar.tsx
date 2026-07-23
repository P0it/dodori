import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, typeface } from '@/theme/tokens';

type Props = {
  url: string | null;
  name: string;
  size: number;
};

/** 작성자 아바타 — 사진은 원형 그대로, 없으면 이름 첫 글자. 사람을 색으로 구분하지 않는다 */
export function Avatar({ url, name, size }: Props) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color.surface2,
        }}
      />
    );
  }
  const initial = [...name.trim()][0] ?? '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color.surface3,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: size * 0.44, color: color.sub }}>
        {initial}
      </Text>
    </View>
  );
}
