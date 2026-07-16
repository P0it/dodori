import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { color, radius, role, typeface, type OwnerRole } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { Meta } from '@/components/Meta';
import { Avatar } from '@/components/Avatar';
import type { PostComment } from '@/api/posts';

type Props = {
  comments: PostComment[];
  myUid: string;
  who: (uid: string) => OwnerRole;
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
  onAdd: (body: string) => void;
  onDelete: (commentId: string) => void;
};

const PREVIEW = 2;

/** 게시물 댓글 — 기본 2개 미리보기 + 입력 */
export function CommentList({ comments, myUid, who, name, avatarUrl, onAdd, onDelete }: Props) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);

  const hidden = comments.length - PREVIEW;
  const shown = expanded ? comments : comments.slice(0, PREVIEW);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onAdd(body);
    setDraft('');
  };

  return (
    <View style={{ gap: 7 }}>
      {!expanded && hidden > 0 && (
        <Pressable onPress={() => setExpanded(true)} hitSlop={6}>
          <Meta style={{ fontSize: 13 }}>댓글 {comments.length}개 모두 보기</Meta>
        </Pressable>
      )}

      {shown.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Avatar url={avatarUrl(c.authorId)} role={who(c.authorId)} name={name(c.authorId)} size={24} />
          <Text
            style={{ fontFamily: typeface, fontSize: 14, lineHeight: 20, color: color.white, flex: 1 }}
          >
            <Text style={{ fontWeight: '700', color: color.white }}>{name(c.authorId)}</Text>
            {'  '}
            {c.body}
          </Text>
          <Meta style={{ fontSize: 11, lineHeight: 20 }}>{formatRelative(c.createdAt)}</Meta>
          {c.authorId === myUid && (
            <Pressable onPress={() => onDelete(c.id)} hitSlop={10}>
              <Text
                style={{ fontFamily: typeface, fontSize: 13, lineHeight: 20, color: color.muted }}
              >
                ×
              </Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <Avatar url={avatarUrl(myUid)} role={who(myUid)} name={name(myUid)} size={24} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="댓글 남기기"
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
            <Text
              style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: role.me }}
            >
              등록
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
