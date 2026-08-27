import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import { ZoomableImage } from './PhotoZoom';
import { PostVideo } from './PostVideo';
import { color, radius, space, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { postContentFit, postFrameRatioOf, REACTIONS } from '@/lib/posts';
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
  /** 피드 세로 리스트를 Gesture.Native()로 감싼 제스처 — 핀치와 동시 인식해 세로 스크롤을 살린다 */
  outerGestures?: GestureType[];
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
  outerGestures,
}: Props) {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const mine = post.authorId === myUid;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const frameRatio = postFrameRatioOf(post.photos);
  const carouselH = Math.round(width * frameRatio);

  /*
    가로 캐러셀도 RNGH에 등록해 바깥 세로 리스트와 동시 인식시킨다.
    등록하지 않으면 사진 위 세로 드래그를 안쪽 ScrollView가 먹고 리스트로 넘겨주지 않는다
    (사진이 카드의 대부분이라 화면이 아예 안 움직이는 것처럼 보인다).
  */
  const carouselGesture = useMemo(() => {
    const native = Gesture.Native();
    return outerGestures?.length ? native.simultaneousWithExternalGesture(...outerGestures) : native;
  }, [outerGestures]);
  // 웹에는 핀치가 없으므로(PhotoZoom 참고) 캐러셀도 RNGH로 감싸지 않는다 —
  // 감싸는 순간 touch-action: none이 걸려 사진 위 세로 스크롤이 죽는다
  const isNative = Platform.OS !== 'web';
  // 사진이 한 장이면 캐러셀 없이 그대로 그린다 — 중첩 스크롤 자체를 만들지 않는다
  const single = post.photos.length === 1;
  const photoGestures = useMemo(
    () => (single ? outerGestures : [carouselGesture, ...(outerGestures ?? [])]),
    [single, carouselGesture, outerGestures],
  );

  const renderMedia = (p: Post['photos'][number], i: number) =>
    p.media === 'video' ? (
      <PostVideo
        key={p.id}
        posterUrl={p.thumbUrl}
        videoUrl={p.videoUrl}
        width={width}
        height={carouselH}
        contentFit={postContentFit(p, frameRatio)}
        active={page === i}
      />
    ) : (
      <ZoomableImage
        key={p.id}
        url={p.thumbUrl}
        style={{ width, height: carouselH, backgroundColor: color.bg }}
        contentFit={postContentFit(p, frameRatio)}
        transition={160}
        simultaneousGestures={photoGestures}
      />
    );

  const scroller = (
    <Animated.ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={{ width, height: carouselH }}
    >
      {post.photos.map(renderMedia)}
    </Animated.ScrollView>
  );
  const carousel = isNative ? (
    <GestureDetector gesture={carouselGesture}>{scroller}</GestureDetector>
  ) : (
    scroller
  );

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
          <Pressable
            onPress={onDelete}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="게시물 더보기"
          >
            <MoreGlyph size={18} />
          </Pressable>
        )}
      </View>

      {/*
        사진 캐러셀 — 프레임은 첫 사진이 정하고, 나머지도 올릴 때 같은 비율로 잘려 있다.
        그래서 cover가 실제로 자르는 건 없다.

        예외는 이 규칙 이전에 올라간 게시물이다 — 사진마다 비율이 달라, cover로 그리면
        여기서 두 번째 크롭이 일어난다(세로 사진이 절반 넘게 날아갔다). 원본 비율 그대로
        저장돼 있으므로(업로드는 축소만 한다) 그런 사진만 contain으로 돌리면 전체가 보인다.
      */}
      {post.photos.length > 0 && (
        <View>
          {single ? renderMedia(post.photos[0], 0) : carousel}

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
