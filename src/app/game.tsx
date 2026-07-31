import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, space, typeface } from '@/theme/tokens';
import { todayKST } from '@/lib/date';
import { outcome, pickTodayGame, type GameDef } from '@/lib/games';
import { useCoupleProfiles } from '@/api/couple';
import { useSubmitRound, useTodayGameScores } from '@/api/games';
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
          mineBest={mine?.bestScore ?? null}
          partnerBest={scores.data.partner?.bestScore ?? null}
          attempts={attempts}
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
  mineBest,
  partnerBest,
  attempts,
  partnerName,
  canRetry,
  onRetry,
}: {
  game: GameDef;
  mineBest: number | null;
  partnerBest: number | null;
  attempts: number;
  partnerName: string;
  canRetry: boolean;
  onRetry: () => void;
}) {
  const o =
    mineBest !== null && partnerBest !== null
      ? outcome(mineBest, partnerBest, game.higherIsBetter)
      : null;
  const verdict =
    o === 'win' ? '이기고 있어요' : o === 'lose' ? '지고 있어요' : o === 'draw' ? '동점!' : null;

  return (
    <View
      style={{
        marginTop: space[6],
        borderRadius: 14,
        padding: space[5],
        backgroundColor: color.surface1,
      }}
    >
      <Row label="나" value={mineBest !== null ? game.format(mineBest) : '-'} />
      <Row
        label={partnerName}
        value={
          partnerBest !== null
            ? game.format(partnerBest)
            : mineBest !== null
              ? '아직 안 했어요'
              : '먼저 한 판 해야 열려요'
        }
      />
      {verdict && (
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 18,
            color: color.accent,
            marginTop: space[4],
          }}
        >
          {verdict}
        </Text>
      )}
      {canRetry ? (
        <Pressable onPress={onRetry} style={({ pressed }) => ({ marginTop: space[4], opacity: pressed ? 0.6 : 1 })}>
          <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>
            다시 도전 ({attempts}/3)
          </Text>
        </Pressable>
      ) : (
        <Meta style={{ marginTop: space[4] }}>오늘 3판을 다 썼어요</Meta>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space[2] }}
    >
      <Meta>{label}</Meta>
      <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>{value}</Text>
    </View>
  );
}
