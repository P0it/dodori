import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { color, radius, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { Meta } from '@/components/Meta';
import { Avatar } from '@/components/Avatar';
import type { GameComment } from '@/api/games';

type Props = {
  comments: GameComment[];
  myUid: string;
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
  onAdd: (body: string) => void;
  onDelete: (commentId: string) => void;
  placeholder?: string;
};

/**
 * 그날 게임에 남기는 말 — 평평한 목록 + 입력 한 줄.
 * 답글도 접기도 없다: 하루 한 종목에 둘이 주고받는 양이라 층도 미리보기도 필요 없다.
 */
export function GameCommentList({
  comments,
  myUid,
  name,
  avatarUrl,
  onAdd,
  onDelete,
  placeholder = '한마디 남기기',
}: Props) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onAdd(body);
    setDraft('');
  };

  return (
    <View style={{ gap: 10 }}>
      {comments.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Avatar url={avatarUrl(c.authorId)} name={name(c.authorId)} size={26} />
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* 이름은 흰색 굵게, 본문은 한 톤 낮춰 구분 (게시물 댓글과 같은 결) */}
            <Text style={{ fontFamily: typeface, fontSize: 14, lineHeight: 20, color: color.sub }}>
              <Text style={{ fontWeight: '700', color: color.white }}>{name(c.authorId)}</Text>
              {'   '}
              {c.body}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 }}>
              <Meta style={{ fontSize: 11.5 }}>{formatRelative(c.createdAt)}</Meta>
              {c.authorId === myUid && (
                <Pressable onPress={() => onDelete(c.id)} hitSlop={6}>
                  <Text
                    style={{
                      fontFamily: typeface,
                      fontWeight: '600',
                      fontSize: 11.5,
                      color: color.muted,
                    }}
                  >
                    삭제
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ))}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar url={avatarUrl(myUid)} name={name(myUid)} size={26} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
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
              style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14, color: color.accent }}
            >
              등록
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
