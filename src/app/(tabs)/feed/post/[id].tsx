import { RefreshControl, useWindowDimensions, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { color } from '@/theme/tokens';
import { useSession } from '@/api/auth';
import { useCoupleProfiles } from '@/api/couple';
import {
  usePosts,
  useAddComment,
  useDeleteComment,
  useDeletePost,
  useToggleReaction,
  type Post,
} from '@/api/posts';
import { TopBar } from '@/components/TopBar';
import { PostCard } from '@/components/feed/PostCard';
import { confirmDialog } from '@/components/dialog';

/** 게시물 피드 — 그리드에서 탭한 게시물 위치부터 세로 스크롤 (인스타 동일) */
export default function PostFeed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const posts = usePosts();
  const session = useSession();
  const profiles = useCoupleProfiles();

  const toggleReaction = useToggleReaction();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const deletePost = useDeletePost();

  const uid = session.data?.user.id ?? '';
  const data = posts.data ?? [];
  const startIndex = Math.max(
    0,
    data.findIndex((p) => p.id === id),
  );

  const profileOf = (author: string) =>
    author === uid ? profiles.data?.me : profiles.data?.partner;
  const name = (author: string): string =>
    profileOf(author)?.nickname || (author === uid ? '나' : '상대');
  const avatarUrl = (author: string): string | null => profileOf(author)?.avatar_url ?? null;

  const onDelete = async (post: Post) => {
    if (!(await confirmDialog('피드 삭제', '되돌릴 수 없어요.', '삭제'))) return;
    deletePost.mutate({ id: post.id, photos: post.photos });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="피드" />
      <FlashList
        data={data}
        keyExtractor={(p) => p.id}
        initialScrollIndex={startIndex}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={posts.isRefetching}
            onRefresh={posts.refetch}
            tintColor={color.sub}
            colors={[color.accent]}
          />
        }
        renderItem={({ item: p }) => (
          <PostCard
            post={p}
            width={width}
            myUid={uid}
            name={name}
            avatarUrl={avatarUrl}
            onToggleReaction={(emoji, on) => toggleReaction.mutate({ postId: p.id, emoji, on })}
            onAddComment={(body, parentId) => addComment.mutate({ postId: p.id, body, parentId })}
            onDeleteComment={(commentId) => deleteComment.mutate(commentId)}
            onDelete={() => onDelete(p)}
          />
        )}
      />
    </View>
  );
}
