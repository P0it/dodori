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
import { color, radius, space, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { postFrameRatio, REACTIONS } from '@/lib/posts';
import { Avatar } from '@/components/Avatar';
import { Meta } from '@/components/Meta';
import { CommentGlyph, HeartGlyph, MoreGlyph } from '@/components/glyphs';
import { CommentList } from './CommentList';
import type { Post } from '@/api/posts';

type Props = {
  post: Post;
  width: number;
  myUid: string;
  name: (uid: string) => string;
  avatarUrl: (uid: string) => string | null;
  onToggleReaction: (emoji: string, on: boolean) => void;
  onAddComment: (body: string, parentId: string | null) => void;
  onDeleteComment: (commentId: string) => void;
  onDelete: () => void;
};

const HEART = REACTIONS[0];

/** 피드 카드 — 작성자 / 사진 캐러셀 / 좋아요·댓글 / 캡션 / 댓글 (인스타그램 배치) */
export function PostCard({
  post,
  width,
  myUid,
  name,
  avatarUrl,
  onToggleReaction,
  onAddComment,
  onDeleteComment,
  onDelete,
}: Props) {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const mine = post.authorId === myUid;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const first = post.photos[0];
  const carouselH = Math.round(width * postFrameRatio(first?.width, first?.height));

  const likedBy = post.reactions.find((r) => r.emoji === HEART)?.userIds ?? [];
  const iLiked = likedBy.includes(myUid);

  return (
    <View style={{ paddingBottom: space[6] }}>
      {/* 작성자 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: space[4],
          paddingVertical: 10,
        }}
      >
        <Avatar url={avatarUrl(post.authorId)} name={name(post.authorId)} size={34} />
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: 14,
            color: color.white,
            flex: 1,
          }}
        >
          {name(post.authorId)}
        </Text>
        {mine && (
          <Pressable onPress={onDelete} hitSlop={10}>
            <MoreGlyph size={18} />
          </Pressable>
        )}
      </View>

      {/* 사진 캐러셀 — 인스타 규격(세로 최대 4:5)으로 꽉 채워 크롭, 페이징 */}
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
                contentFit="cover"
                transition={160}
              />
            ))}
          </ScrollView>

          {/* n/m 카운터 */}
          {post.photos.length > 1 && (
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
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 11, color: color.white }}>
                {page + 1}/{post.photos.length}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 액션 줄 — 좋아요·댓글 좌측, 페이지 점은 가운데 (인스타 동일) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space[4],
          paddingTop: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
          <Pressable
            onPress={() => onToggleReaction(HEART, !iLiked)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={iLiked ? '좋아요 취소' : '좋아요'}
          >
            <HeartGlyph size={25} filled={iLiked} color={iLiked ? color.accent : color.white} />
          </Pressable>
          <Pressable onPress={() => setExpanded(true)} hitSlop={8} accessibilityLabel="댓글">
            <CommentGlyph size={24} />
          </Pressable>
        </View>

        {post.photos.length > 1 && (
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {post.photos.map((p, i) => (
              <View
                key={p.id}
                style={{
                  width: i === page ? 6 : 5,
                  height: i === page ? 6 : 5,
                  borderRadius: 3,
                  backgroundColor: i === page ? color.white : color.surface4,
                }}
              />
            ))}
          </View>
        )}

        {/* 점을 정중앙에 두기 위한 좌우 균형 */}
        <View style={{ flex: 1 }} />
      </View>

      <View style={{ paddingHorizontal: space[4], paddingTop: 8, gap: 7 }}>
        {likedBy.length > 0 && (
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13.5, color: color.white }}>
            {likedBy.length === 1 ? `${name(likedBy[0])}님이 좋아해요` : '둘 다 좋아해요'}
          </Text>
        )}

        {/* 이름은 흰색 굵게, 본문은 한 톤 낮춰 — 한글 이름과 한글 본문이 붙어 읽히는 걸 막는다 */}
        {!!post.caption && (
          <Text style={{ fontFamily: typeface, fontSize: 14.5, lineHeight: 21, color: color.sub }}>
            <Text style={{ fontWeight: '700', color: color.white }}>{name(post.authorId)}</Text>
            {'   '}
            {post.caption}
          </Text>
        )}

        <Meta style={{ fontSize: 11.5 }}>{formatRelative(post.createdAt)}</Meta>

        <CommentList
          comments={post.comments}
          myUid={myUid}
          name={name}
          avatarUrl={avatarUrl}
          onAdd={onAddComment}
          onDelete={onDeleteComment}
          expanded={expanded}
          onExpand={() => setExpanded(true)}
        />
      </View>
    </View>
  );
}
