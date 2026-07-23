import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, role, roleBg, typeface, type OwnerRole } from '@/theme/tokens';

type Props = {
  url: string | null;
  role: OwnerRole;
  name: string;
  size: number;
};

/** 작성자 아바타 — 사진은 링 없는 원형, 없으면 이름 첫 글자 이니셜(역할 틴트) */
export function Avatar({ url, role: who, name, size }: Props) {
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
        backgroundColor: roleBg[who],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: size * 0.44, color: role[who] }}>
        {initial}
      </Text>
    </View>
  );
}
