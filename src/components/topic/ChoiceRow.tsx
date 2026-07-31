import { Pressable, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';

type Props = {
  label: string;
  /** 이 선택지를 고른 사람 이름 — 투표 전엔 빈 배열 (RLS가 상대 답을 가림) */
  pickedBy: string[];
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

/** 선택지 한 행 — 라디오 + 한 줄 라벨. 세로로 쌓아 줄바꿈 없이 읽힌다 (2~5개) */
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
        borderColor: selected ? color.accent : color.surface2,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? color.accent : color.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color.accent }} />
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

      {pickedBy.length > 0 && <Meta style={{ fontSize: 12 }}>{pickedBy.join(' · ')}</Meta>}
    </Pressable>
  );
}
