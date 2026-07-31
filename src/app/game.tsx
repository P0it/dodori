import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, space, tintBg, typeface } from '@/theme/tokens';
import { todayKST } from '@/lib/date';
import { outcome, pickTodayGame, type GameDef } from '@/lib/games';
import { useCoupleProfiles } from '@/api/couple';
import { useSubmitRound, useTodayGameScores, type Score } from '@/api/games';
import { GameHost } from '@/components/game/GameHost';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';

type Phase = 'intro' | 'play' | 'result';

/** 오늘의 게임 — 인트로 → 종목 플레이 → 결과(상대 공개). 3판 소진 후 재진입 시 결과만. */
export default function GameScreen() {
  const router = useRouter();
  const game = pickTodayGame(todayKST());
  const scores = useTodayGameScores();
  const submit = useSubmitRound();
  const profiles = useCoupleProfiles();
  const partnerName = profiles.data?.partner?.nickname || '상대';

  const [phase, setPhase] = useState<Phase>('intro');

  if (!scores.data) {
    return (
      <View
        style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={color.sub} />
      </View>
    );
  }

  const mine = scores.data.mine;
  const attempts = mine?.attempts ?? 0;
  const capped = attempts >= 3;
  const showResult = phase === 'result' || capped;

  async function playRound(score: number) {
    await submit.mutateAsync(score);
    setPhase('result');
  }

  return (
    <ScrollView
      style={{ backgroundColor: color.bg }}
      contentContainerStyle={{ padding: space[4], paddingTop: space[6] }}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: space[4] }}>
        <Meta>‹ 홈</Meta>
      </Pressable>

      <Eyebrow>오늘의 게임</Eyebrow>
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '800',
          fontSize: 24,
          color: color.white,
          marginTop: space[1],
        }}
      >
        {game.name}
      </Text>
      <Meta style={{ marginTop: space[2] }}>{game.blurb}</Meta>

      {!showResult && phase === 'intro' && (
        <View style={{ marginTop: space[6], alignItems: 'center' }}>
          <Meta>{attempts}/3 판</Meta>
          <Pressable
            onPress={() => setPhase('play')}
            style={({ pressed }) => ({
              marginTop: space[3],
              paddingHorizontal: space[6],
              paddingVertical: space[3],
              borderRadius: 999,
              backgroundColor: pressed ? color.greenPress : color.greenCore,
            })}
          >
            <Text
              style={{
                fontFamily: typeface,
                fontWeight: '800',
                fontSize: 16,
                color: color.onPrimary,
              }}
            >
              {attempts === 0 ? '시작' : '다시 도전'}
            </Text>
          </Pressable>
        </View>
      )}

      {!showResult && phase === 'play' && (
        <View style={{ marginTop: space[5] }}>
          {/* key로 판마다 새 인스턴스 — 두 번째 판이 첫 판의 타이머·상태를 물려받지 않게 */}
          <GameHost key={attempts} gameKey={game.key} onFinish={playRound} />
        </View>
      )}

      {showResult && (
        <ResultCard
          game={game}
          mine={mine}
          partner={scores.data.partner}
          partnerName={partnerName}
          canRetry={!capped}
          onRetry={() => setPhase('intro')}
        />
      )}
    </ScrollView>
  );
}

function ResultCard({
  game,
  mine,
  partner,
  partnerName,
  canRetry,
  onRetry,
}: {
  game: GameDef;
  mine: Score | null;
  partner: Score | null;
  partnerName: string;
  canRetry: boolean;
  onRetry: () => void;
}) {
  const o =
    mine && partner ? outcome(mine.bestScore, partner.bestScore, game.higherIsBetter) : null;
  const verdict =
    o === 'win' ? '이기고 있어요' : o === 'lose' ? '지고 있어요' : o === 'draw' ? '동점!' : null;

  return (
    <View style={{ marginTop: space[6], gap: space[3] }}>
      <PlayerCard label="나" game={game} score={mine} placeholder="아직 한 판도 안 했어요" />
      <PlayerCard
        label={partnerName}
        game={game}
        score={partner}
        placeholder={mine ? `${partnerName}님을 기다리는 중` : '내가 먼저 한 판 해야 열려요'}
      />

      {verdict && (
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 20,
            color: color.accent,
            textAlign: 'center',
            marginTop: space[2],
          }}
        >
          {verdict}
        </Text>
      )}

      {canRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            marginTop: space[2],
            height: 52,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: color.surface4,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
            다시 도전 ({mine?.attempts ?? 0}/3)
          </Text>
        </Pressable>
      ) : (
        <Meta style={{ textAlign: 'center', marginTop: space[2] }}>오늘 3판을 다 썼어요</Meta>
      )}
    </View>
  );
}

/** 한 사람의 3판 — 이름 옆에 최고 기록, 아래에 차시별로 편다 */
function PlayerCard({
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
                  color:
                    value === undefined ? color.muted : isBest ? color.accent : color.white,
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
