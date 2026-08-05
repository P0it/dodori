import { Pressable, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { Meta } from '@/components/Meta';
import { Avatar } from '@/components/Avatar';
import type { TopicComment } from '@/api/topics';

type Props = {
  comments: TopicComment[];
  uid: string | undefined;
  myName: string;
  partnerName: string;
  avatarUrl: (authorId: string) => string | null;
  /** 답글 대상 지정 — 답글에는 다시 답글을 달지 않는다 */
  onReply: (comment: TopicComment) => void;
};

/**
 * 주제 대화 — 전체 폭 스레드 + 1단계 답글.
 * 토론이라 한 사람이 여러 줄을 쓴다. 말풍선(좁은 폭·좌우 정렬)은 긴 글에 부적합해 쓰지 않는다.
 */
export function CommentList({ comments, uid, myName, partnerName, avatarUrl, onReply }: Props) {
  const roots = comments.filter((c) => c.parentId === null);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  if (roots.length === 0) {
    return (
      <Meta style={{ paddingVertical: 18, textAlign: 'center' }}>
        아직 아무 말도 없어요. 먼저 걸어보세요.
      </Meta>
    );
  }

  return (
    <View>
      {roots.map((c, i) => (
        <View
          key={c.id}
          style={{
            paddingTop: 14,
            paddingBottom: 6,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: color.surface1,
          }}
        >
          <Body comment={c} uid={uid} myName={myName} partnerName={partnerName} avatarUrl={avatarUrl} />

          <Pressable onPress={() => onReply(c)} hitSlop={6} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 12.5, color: color.sub }}>
              답글
            </Text>
          </Pressable>

          {repliesOf(c.id).map((r) => (
            <View
              key={r.id}
              style={{
                marginTop: 12,
                marginLeft: 12,
                paddingLeft: 12,
                borderLeftWidth: 2,
                borderLeftColor: color.surface2,
              }}
            >
              <Body comment={r} uid={uid} myName={myName} partnerName={partnerName} avatarUrl={avatarUrl} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Body({
  comment,
  uid,
  myName,
  partnerName,
  avatarUrl,
}: {
  comment: TopicComment;
  uid: string | undefined;
  myName: string;
  partnerName: string;
  avatarUrl: (authorId: string) => string | null;
}) {
  const mine = comment.authorId === uid;
  const name = mine ? myName : partnerName;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Avatar url={avatarUrl(comment.authorId)} name={name} size={22} />
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: 13,
            color: color.white,
          }}
        >
          {name}
        </Text>
        <Meta style={{ fontSize: 11.5 }}>{formatRelative(comment.createdAt)}</Meta>
      </View>
      <Text
        style={{
          fontFamily: typeface,
          fontSize: 15,
          lineHeight: 23,
          color: color.white,
          marginTop: 6,
        }}
      >
        {comment.body}
      </Text>
    </View>
  );
}
