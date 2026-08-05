import { Pressable, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';
import { CHOICE_KEYS, type Choice, type PastTopic } from '@/api/topics';

type Props = {
  topic: PastTopic;
  myName: string;
  partnerName: string;
  onPress: () => void;
};

/** 지난 주제 한 칸 — 질문과 그때 각자 고른 답. 누르면 그 주제 상세로 */
export function PastTopicCard({ topic, myName, partnerName, onPress }: Props) {
  const labelOf = (c: Choice | null): string | null => {
    if (!c) return null;
    return topic.options[CHOICE_KEYS.indexOf(c)] ?? null;
  };
  const mine = labelOf(topic.mine);
  const partner = labelOf(topic.partner);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: 10,
        padding: 14,
        borderRadius: 14,
        backgroundColor: color.surface1,
        borderWidth: 1,
        borderColor: color.surface2,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        numberOfLines={2}
        style={{
          fontFamily: typeface,
          fontWeight: '700',
          fontSize: 15,
          lineHeight: 22,
          color: color.white,
        }}
      >
        {topic.question}
      </Text>
      {/* 안 골랐으면 그 줄을 아예 빼서, 고른 사람 답만 남는다 */}
      <View style={{ marginTop: 8, gap: 2 }}>
        {mine && <Meta>{myName} · {mine}</Meta>}
        {partner && <Meta>{partnerName} · {partner}</Meta>}
        {!mine && <Meta>이 주제는 안 골랐어요</Meta>}
      </View>
    </Pressable>
  );
}
