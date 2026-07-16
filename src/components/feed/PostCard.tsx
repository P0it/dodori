import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { color, radius, role, space, typeface, type OwnerRole } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { Avatar } from '@/components/Avatar';
import { Meta } from '@/components/Meta';
import { MoreGlyph } from '@/components/glyphs';
import { ReactionBar } from './ReactionBar';
import { CommentList } from './CommentList';
import type { Post } from '@/api/posts';

type Props = {
  post: Post;
  width: number;
  myUid: string;
  who: (uid: string) => OwnerRole;
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
  onToggleReaction: (emoji: string, on: boolean) => void;
  onAddComment: (body: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDelete: () => void;
};

/** 피드 카드 — 작성자 / 사진 캐러셀 / 리액션 / 캡션 / 댓글 */
export function PostCard({
  post,
  width,
  myUid,
  who,
  name,
  avatarUrl,
  onToggleReaction,
  onAddComment,
  onDeleteComment,
  onDelete,
}: Props) {
  const [page, setPage] = useState(0);
  const mine = post.authorId === myUid;
  const authorRole = who(post.authorId);
  const avatar = avatarUrl(post.authorId);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const first = post.photos[0];
  const ratio = first?.width && first?.height ? first.height / first.width : 1;
  const carouselH = Math.round(width * Math.min(1.25, Math.max(0.5625, ratio)));

  return (
    <View style={{ paddingBottom: space[5] }}>
      {/* 작성자 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: space[4],
          paddingVertical: 11,
        }}
      >
        <Avatar url={avatar} role={authorRole} name={name(post.authorId)} size={32} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.white }}
          >
            {name(post.authorId)}
          </Text>
          <Meta style={{ fontSize: 11.5, marginTop: 1 }}>{formatRelative(post.createdAt)}</Meta>
        </View>
        {mine && (
          <Pressable onPress={onDelete} hitSlop={10}>
            <MoreGlyph size={18} />
          </Pressable>
        )}
      </View>

      {/* 사진 캐러셀 — 원본 비율(레터박스), 페이징 */}
      {post.photos.length > 0 && (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={{ width, height: carouselH }}
          >
            {post.photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.thumbUrl }}
                style={{ width, height: carouselH, backgroundColor: color.bg }}
                contentFit="contain"
                transition={160}
              />
            ))}
          </ScrollView>

          {post.photos.length > 1 && (
            <>
              {/* n/m 카운터 */}
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.pill,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                }}
              >
                <Text
                  style={{
                    fontFamily: typeface,
                    fontWeight: '700',
                    fontSize: 11,
                    color: color.white,
                  }}
                >
                  {page + 1}/{post.photos.length}
                </Text>
              </View>
              {/* 활성 페이지 인디케이터 */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 5,
                  paddingTop: 10,
                }}
              >
                {post.photos.map((p, i) => (
                  <View
                    key={p.id}
                    style={{
                      width: i === page ? 6 : 5,
                      height: i === page ? 6 : 5,
                      borderRadius: 3,
                      backgroundColor: i === page ? role[authorRole] : color.surface4,
                    }}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: space[4], paddingTop: space[3], gap: 10 }}>
        <ReactionBar reactions={post.reactions} myUid={myUid} onToggle={onToggleReaction} />

        {!!post.caption && (
          <Text style={{ fontFamily: typeface, fontSize: 14.5, color: color.white, lineHeight: 21 }}>
            {post.caption}
          </Text>
        )}

        {!!post.caption && (
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        )}

        <CommentList
          comments={post.comments}
          myUid={myUid}
          who={who}
          name={name}
          avatarUrl={avatarUrl}
          onAdd={onAddComment}
          onDelete={onDeleteComment}
        />
      </View>

      {/* 카드 구분 */}
      <View
        style={{
          height: 1,
          marginTop: space[5],
          marginHorizontal: space[4],
          backgroundColor: 'rgba(255,255,255,0.06)',
        }}
      />
    </View>
  );
}
