import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { color, space, typeface } from '@/theme/tokens';
import { todayKST } from '@/lib/date';
import { outcome, pickTodayGame, type GameDef } from '@/lib/games';
import { useSession } from '@/api/auth';
import { useCoupleProfiles } from '@/api/couple';
import {
  useAddGameComment,
  useDeleteGameComment,
  useGameComments,
  usePastGames,
  useSubmitRound,
  useTodayGameScores,
  type Score,
} from '@/api/games';
import { GameHost } from '@/components/game/GameHost';
import { GameCommentList } from '@/components/game/GameCommentList';
import { PastGameCard } from '@/components/game/PastGameCard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { ChevronGlyph } from '@/components/glyphs';

type Phase = 'intro' | 'play' | 'result';

/** 되돌아보기는 2주씩 늘린다 — 무한 스크롤은 지금 데이터 양에 과하다 */
const PAST_STEP = 14;

/** 오늘의 게임 — 인트로 → 종목 플레이 → 결과(상대 공개). 3판 소진 후 재진입 시 결과만. */
export default function GameScreen() {
  const router = useRouter();
  const today = todayKST();
  const game = pickTodayGame(today);
  const scores = useTodayGameScores();
  const submit = useSubmitRound();
  const session = useSession();
  const uid = session.data?.user.id ?? '';
  const profiles = useCoupleProfiles();
  const myName = profiles.data?.me?.nickname || '나';
  const partnerName = profiles.data?.partner?.nickname || '상대';
  const avatarUrl = (authorId: string): string | null =>
    (authorId === uid ? profiles.data?.me?.avatar_url : profiles.data?.partner?.avatar_url) ?? null;

  const [phase, setPhase] = useState<Phase>('intro');
  const [pastDays, setPastDays] = useState(PAST_STEP);

  const comments = useGameComments(today);
  const past = usePastGames(pastDays);
  const addComment = useAddGameComment();
  const deleteComment = useDeleteGameComment();

  // 점수를 못 받으면 화면 전체가 이것뿐이다 — 실패를 말없이 삼키면 캄캄한 화면만 남는다.
  // 세션이 아직 없어 쿼리가 꺼져 있는 동안(uid 빈 값)에도 여기 머문다는 걸 화면에 드러낸다.
  if (!scores.data) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: space[3],
        }}
      >
        {scores.isError || (session.isSuccess && !uid) ? (
          <>
            <Meta>{scores.isError ? '점수를 불러오지 못했어요' : '로그인이 풀렸어요'}</Meta>
            <Pressable
              onPress={() => (uid ? scores.refetch() : router.replace('/'))}
              style={({ pressed }) => ({
                paddingHorizontal: space[5],
                paddingVertical: space[2],
                borderRadius: 999,
                borderWidth: 1,
                borderColor: color.surface4,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.white }}
              >
                {uid ? '다시 시도' : '홈으로'}
              </Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={color.sub} />
        )}
      </View>
    );
  }

  const mine = scores.data.mine;
  const attempts = mine?.attempts ?? 0;
  const capped = attempts >= 3;
  // 한 판이라도 냈으면 재진입해도 결과가 보여야 한다 — phase는 화면을 나가면 초기화된다
  const showResult = phase !== 'play' && (phase === 'result' || capped || !!mine);

  async function playRound(score: number) {
    await submit.mutateAsync(score);
    setPhase('result');
  }

  const pastDaysList = past.data ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: color.bg }}
        contentContainerStyle={{ padding: space[4], paddingTop: space[6] }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: 4,
            marginBottom: space[4],
            paddingVertical: space[1],
          }}
        >
          {/* 오른쪽 꺾쇠를 돌려 왼쪽(‹)으로 — 홈으로 돌아가는 표시 */}
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <ChevronGlyph size={24} color={color.sub} />
          </View>
          <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 16, color: color.sub }}>
            홈
          </Text>
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
                시작
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
            onRetry={() => setPhase('play')}
          />
        )}

        {/* 결과 카드를 띄우는지와는 별개 — 한 판이라도 마쳤으면 대화는 열려 있다 */}
        {mine && phase !== 'play' && (
          <View style={{ marginTop: space[6] }}>
            <GameCommentList
              comments={comments.data ?? []}
              myUid={uid}
              name={(authorId) => (authorId === uid ? myName : partnerName)}
              avatarUrl={avatarUrl}
              onAdd={(body) => addComment.mutate({ date: today, body })}
              onDelete={(id) => deleteComment.mutate(id)}
            />
          </View>
        )}

        {pastDaysList.length > 0 && phase !== 'play' && (
          <View style={{ marginTop: space[6] }}>
            <Eyebrow>지난 게임</Eyebrow>
            {pastDaysList.map((day) => (
              <PastGameCard
                key={day.date}
                day={day}
                myUid={uid}
                myName={myName}
                partnerName={partnerName}
                avatarUrl={avatarUrl}
                onAdd={(body) => addComment.mutate({ date: day.date, body })}
                onDelete={(id) => deleteComment.mutate(id)}
              />
            ))}
            <Pressable
              onPress={() => setPastDays((d) => d + PAST_STEP)}
              style={({ pressed }) => ({
                marginTop: space[5],
                height: 46,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: color.surface4,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.sub }}
              >
                더 보기
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
