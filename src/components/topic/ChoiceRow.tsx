import { Pressable, Text, View } from 'react-native';
import { color, role, typeface } from '@/theme/tokens';
import { OwnerDot } from '@/components/OwnerDot';

type Props = {
  label: string;
  /** 이 선택지를 고른 사람 — 투표 전엔 빈 배열 (RLS가 상대 답을 가림) */
  pickedBy: ('me' | 'partner')[];
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

/** 2지선다 한 행 — 라디오 + 한 줄 라벨. 세로로 쌓아 줄바꿈 없이 읽힌다 */
export function ChoiceRow({ label, pickedBy, selected, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: selected ? 'rgba(30,215,96,0.12)' : color.surface1,
        borderWidth: 1.5,
        borderColor: selected ? role.me : color.surface2,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? role.me : color.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: role.me }} />
        )}
      </View>

      <Text
        style={{
          flex: 1,
          fontFamily: typeface,
          fontWeight: '600',
          fontSize: 16,
          lineHeight: 22,
          color: color.white,
        }}
      >
        {label}
      </Text>

      <View style={{ flexDirection: 'row', gap: 5 }}>
        {pickedBy.map((who) => (
          <OwnerDot key={who} who={who} size={10} />
        ))}
      </View>
    </Pressable>
  );
}
