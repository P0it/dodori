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
    <View
      style={{
        marginTop: space[6],
        borderRadius: 14,
        padding: space[5],
        backgroundColor: color.surface1,
      }}
    >
      {/* 회차 머리글 — 세 줄이 같은 열에 서야 1·2·3차를 나란히 비교할 수 있다 */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 64 }} />
        {[1, 2, 3].map((n) => (
          <Meta key={n} style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>
            {n}차
          </Meta>
        ))}
      </View>

      <RoundRow label="나" game={game} score={mine} placeholder="아직 안 했어요" />
      <RoundRow
        label={partnerName}
        game={game}
        score={partner}
        placeholder={mine ? '아직 안 했어요' : '먼저 한 판 해야 열려요'}
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
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({ marginTop: space[4], opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', color: color.white }}>
            다시 도전 ({mine?.attempts ?? 0}/3)
          </Text>
        </Pressable>
      ) : (
        <Meta style={{ marginTop: space[4] }}>오늘 3판을 다 썼어요</Meta>
      )}
    </View>
  );
}

/** 한 사람의 3판 — 최고점 칸만 초록으로 도드라진다 */
function RoundRow({
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
  // 같은 점수가 두 번 나오면 앞선 판을 최고로 친다 (indexOf)
  const bestIndex = score ? rounds.indexOf(score.bestScore) : -1;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space[3] }}>
      <Meta numberOfLines={1} style={{ width: 64 }}>
        {label}
      </Meta>
      {!score ? (
        <Meta style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>{placeholder}</Meta>
      ) : (
        [0, 1, 2].map((i) => {
          const value = rounds[i];
          const isBest = i === bestIndex;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                marginHorizontal: 3,
                paddingVertical: space[2],
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: isBest ? tintBg.accent : 'transparent',
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typeface,
                  fontWeight: isBest ? '800' : '600',
                  fontSize: 13,
                  color: value === undefined ? color.muted : isBest ? color.accent : color.sub,
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
