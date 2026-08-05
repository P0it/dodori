import { Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import { weekdayKo } from '@/lib/date';
import { outcome } from '@/lib/games';
import { Meta } from '@/components/Meta';
import { PlayerCard } from './PlayerCard';
import { GameCommentList } from './GameCommentList';
import type { PastGameDay } from '@/api/games';

type Props = {
  day: PastGameDay;
  myUid: string;
  myName: string;
  partnerName: string;
  avatarUrl: (uid: string) => string | null;
  onAdd: (body: string) => void;
  onDelete: (commentId: string) => void;
};

/** 지난 날 한 칸 — 그날 결과와 그날 주고받은 말. 접지 않는다(탭할 것이 없다) */
export function PastGameCard({
  day,
  myUid,
  myName,
  partnerName,
  avatarUrl,
  onAdd,
  onDelete,
}: Props) {
  const { mine, partner, game } = day;
  const o = mine && partner ? outcome(mine.bestScore, partner.bestScore, game.higherIsBetter) : null;
  const verdict = o === 'win' ? '이김' : o === 'lose' ? '짐' : o === 'draw' ? '비김' : null;
  const [, month, dayNum] = day.date.split('-');

  return (
    <View style={{ gap: space[3], paddingTop: space[5] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Text
          style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}
        >
          {Number(month)}월 {Number(dayNum)}일 ({weekdayKo(day.date)})
        </Text>
        <Meta style={{ flex: 1 }} numberOfLines={1}>
          {game.name}
        </Meta>
        {verdict && (
          <Text
            style={{
              fontFamily: typeface,
              fontWeight: '800',
              fontSize: 13,
              color: o === 'win' ? color.accent : color.sub,
            }}
          >
            {verdict}
          </Text>
        )}
      </View>

      <PlayerCard label={myName} game={game} score={mine} placeholder="이날은 안 했어요" />
      <PlayerCard
        label={partnerName}
        game={game}
        score={partner}
        placeholder={mine ? '이날은 안 했어요' : '내가 안 해서 안 열려요'}
      />

      {/* 내가 안 한 날은 읽기도 쓰기도 RLS가 막는다(댓글이 늘 비어 있다) — 아예 띄우지 않는다 */}
      {mine && (
        <GameCommentList
          comments={day.comments}
          myUid={myUid}
          name={(uid) => (uid === myUid ? myName : partnerName)}
          avatarUrl={avatarUrl}
          onAdd={onAdd}
          onDelete={onDelete}
          placeholder="이날에 대해 한마디"
        />
      )}
    </View>
  );
}
