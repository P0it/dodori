import { Text, View } from 'react-native';
import { color, space, typeface } from '@/theme/tokens';
import { weekdayKo } from '@/lib/date';
import { outcome } from '@/lib/games';
import { Meta } from '@/components/Meta';
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

/**
 * 지난 날 한 칸 — 결과는 최고점 한 줄로 요약하고, 그날 주고받은 말은 그대로 편다.
 * 차시별 점수(PlayerCard)는 오늘 것만 — 지난 날까지 3판씩 펴면 목록이 오늘만큼 무거워진다.
 */
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

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <ScoreChip
          name={myName}
          value={mine ? game.format(mine.bestScore) : null}
          highlight={o === 'win'}
        />
        <ScoreChip
          name={partnerName}
          value={partner ? game.format(partner.bestScore) : null}
          highlight={o === 'lose'}
          // 상대 칸이 빈 이유는 두 가지 — 내가 안 해서 안 열린 건지, 상대가 안 한 건지
          empty={mine ? '안 함' : '안 열림'}
        />
      </View>

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

/** 한 사람의 그날 최고점 — 이긴 쪽만 accent로 든다 */
function ScoreChip({
  name,
  value,
  highlight,
  empty = '안 함',
}: {
  name: string;
  value: string | null;
  highlight: boolean;
  empty?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space[2],
        paddingHorizontal: space[3],
        paddingVertical: space[2],
        borderRadius: 10,
        backgroundColor: color.surface1,
      }}
    >
      <Meta style={{ flexShrink: 1, fontSize: 12.5 }} numberOfLines={1}>
        {name}
      </Meta>
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: highlight ? '800' : '600',
          fontSize: 14,
          color: value === null ? color.muted : highlight ? color.accent : color.white,
        }}
      >
        {value ?? empty}
      </Text>
    </View>
  );
}
