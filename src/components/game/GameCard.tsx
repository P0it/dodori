import { Pressable, Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';

/** 홈의 '오늘의 게임' 진입 카드 — 표현만 한다 (승패 판정·집계는 lib/games) */
export function GameCard({
  gameName,
  myBest,
  partnerState,
  record,
  onPress,
}: {
  gameName: string;
  /** 포맷된 내 최고점 (아직 안 했으면 null) */
  myBest: string | null;
  partnerState: string;
  record: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: space[4],
        borderRadius: 14,
        padding: space[4],
        backgroundColor: color.surface1,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Eyebrow>오늘의 게임</Eyebrow>
        <Meta style={{ fontSize: 12.5 }}>{record}</Meta>
      </View>
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '700',
          fontSize: 16,
          color: color.white,
          marginTop: space[2],
        }}
      >
        {gameName}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: space[3],
          marginTop: space[2],
        }}
      >
        <Meta style={{ fontSize: 12.5 }}>
          {myBest ? `내 최고 ${myBest}` : '아직 안 했어요 — 눌러서 시작'}
        </Meta>
        <Meta style={{ fontSize: 12.5 }}>{partnerState}</Meta>
      </View>
    </Pressable>
  );
}
