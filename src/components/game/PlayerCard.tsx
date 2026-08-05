import { Text, View } from 'react-native';
import { color, space, tintBg, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';
import type { GameDef } from '@/lib/games';
import type { Score } from '@/api/games';

/** 한 사람의 3판 — 이름 옆에 최고 기록, 아래에 차시별로 편다 */
export function PlayerCard({
  label,
  game,
  score,
  placeholder,
}: {
  label: string;
  game: GameDef;
  score: Score | null;
  placeholder: string;
}) {
  const rounds = score?.rounds ?? [];
  // 같은 점수가 두 번 나오면 앞선 판을 최고로 친다
  const bestIndex = score ? rounds.indexOf(score.bestScore) : -1;

  return (
    <View style={{ borderRadius: 14, padding: space[4], backgroundColor: color.surface1 }}>
      {/* 최고 기록은 아래 차시 줄의 하이라이트가 말해준다 — 위에 또 쓰면 같은 값이 두 번 */}
      <Text
        numberOfLines={1}
        style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}
      >
        {label}
      </Text>

      {!score ? (
        <Meta style={{ marginTop: space[3] }}>{placeholder}</Meta>
      ) : (
        [0, 1, 2].map((i) => {
          const value = rounds[i];
          const isBest = i === bestIndex;
          return (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: space[2],
                paddingHorizontal: space[3],
                paddingVertical: space[3],
                borderRadius: 10,
                backgroundColor: isBest ? tintBg.accent : color.surface2,
                // 테두리는 항상 있고 색만 바뀐다 — 최고 줄에만 넣으면 그 줄만 1px씩 커진다
                borderWidth: 1,
                borderColor: isBest ? color.accent : 'transparent',
              }}
            >
              <Meta style={{ fontSize: 13 }}>{i + 1}차시</Meta>
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: isBest ? '800' : '600',
                  fontSize: 15,
                  color: value === undefined ? color.muted : isBest ? color.accent : color.white,
                }}
              >
                {value === undefined ? '—' : game.format(value)}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}
