import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { color, radius, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { Meta } from '@/components/Meta';
import { Avatar } from '@/components/Avatar';
import type { PostComment } from '@/api/posts';

type Props = {
  comments: PostComment[];
  myUid: string;
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
  onAdd: (body: string, parentId: string | null) => void;
  onDelete: (commentId: string) => void;
  /** 펼침은 카드가 소유한다 (말풍선 아이콘으로도 펼치므로) */
  expanded: boolean;
  onExpand: () => void;
};

const PREVIEW = 2;

/** 게시물 댓글 — 기본 2개 미리보기 + 1단계 답글 + 입력 */
export function CommentList({
  comments,
  myUid,
  name,
  avatarUrl,
  onAdd,
  onDelete,
  expanded,
  onExpand,
}: Props) {
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);

  const roots = comments.filter((c) => c.parentId === null);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);
  const shown = expanded ? roots : roots.slice(0, PREVIEW);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onAdd(body, replyTo?.id ?? null);
    setDraft('');
    setReplyTo(null);
  };

  const startReply = (c: PostComment) => {
    setReplyTo(c);
    onExpand();
  };

  return (
    <View style={{ gap: 10 }}>
      {!expanded && roots.length > PREVIEW && (
        <Pressable onPress={onExpand} hitSlop={6}>
          <Meta style={{ fontSize: 13 }}>댓글 {comments.length}개 모두 보기</Meta>
        </Pressable>
      )}

      {shown.map((c) => (
        <View key={c.id} style={{ gap: 10 }}>
          <Row
            comment={c}
            myUid={myUid}
            name={name}
            avatarUrl={avatarUrl}
            onReply={() => startReply(c)}
            onDelete={() => onDelete(c.id)}
          />
          {repliesOf(c.id).map((r) => (
            <View key={r.id} style={{ paddingLeft: 34 }}>
              <Row
                comment={r}
                myUid={myUid}
                name={name}
                avatarUrl={avatarUrl}
                size={22}
                onDelete={() => onDelete(r.id)}
              />
            </View>
          ))}
        </View>
      ))}

      {replyTo && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Meta style={{ fontSize: 12, flex: 1 }}>{name(replyTo.authorId)}님에게 답글 남기는 중</Meta>
          <Pressable onPress={() => setReplyTo(null)} hitSlop={10}>
            <Text style={{ fontFamily: typeface, fontSize: 13, color: color.muted }}>취소</Text>
          </Pressable>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar url={avatarUrl(myUid)} name={name(myUid)} size={26} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={replyTo ? '답글 남기기' : '댓글 남기기'}
          placeholderTextColor={color.muted}
          onSubmitEditing={submit}
          returnKeyType="send"
          style={{
            flex: 1,
            fontFamily: typeface,
            fontSize: 14,
            color: color.white,
            backgroundColor: color.surface1,
            borderRadius: radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 9,
          }}
        />
        {!!draft.trim() && (
          <Pressable onPress={submit} hitSlop={10}>
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.accent }}>
              등록
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** 댓글 한 줄 — 이름+본문 인라인, 아래 시간·답글·삭제 (인스타 동일). onReply 없으면 답글 버튼 없음 = 답글 줄 */
function Row({
  comment,
  myUid,
  name,
  avatarUrl,
  size = 26,
  onReply,
  onDelete,
}: {
  comment: PostComment;
  myUid: string;
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
  size?: number;
  onReply?: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <Avatar url={avatarUrl(comment.authorId)} name={name(comment.authorId)} size={size} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* 이름은 흰색 굵게, 본문은 한 톤 낮춰 구분한다 */}
        <Text style={{ fontFamily: typeface, fontSize: 14, lineHeight: 20, color: color.sub }}>
          <Text style={{ fontWeight: '700', color: color.white }}>{name(comment.authorId)}</Text>
          {'   '}
          {comment.body}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 }}>
          <Meta style={{ fontSize: 11.5 }}>{formatRelative(comment.createdAt)}</Meta>
          {onReply && (
            <Pressable onPress={onReply} hitSlop={6}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 11.5, color: color.sub }}>
                답글 달기
              </Text>
            </Pressable>
          )}
          {comment.authorId === myUid && (
            <Pressable onPress={onDelete} hitSlop={6}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 11.5, color: color.muted }}>
                삭제
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
