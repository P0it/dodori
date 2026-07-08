import { Text, View } from 'react-native';
import { color, role } from '@/theme/tokens';

type Props = { size?: number; showWord?: boolean };

/** Duet 마크 — 겹치는 커플 원 2개 + 워드마크 (목업 DuetMark) */
export function DuetMark({ size = 40, showWord = false }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: size * 1.5, height: size }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: role.me,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: size * 0.5,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: role.partner,
            opacity: 0.85,
          }}
        />
      </View>
      {showWord && (
        <Text
          style={{
            fontWeight: '800',
            fontSize: size * 0.8,
            letterSpacing: -1,
            color: color.white,
          }}
        >
          Duet
        </Text>
      )}
    </View>
  );
}
