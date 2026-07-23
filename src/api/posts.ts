import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import { signedThumbUrl, uploadPhotos, type PickedPhoto } from './photos';

export interface PostPhoto {
  id: string;
  storagePath: string;
  /** 서명된 썸네일 URL (비공개 버킷) — 피드 캐러셀용 비율 보존 변형 */
  thumbUrl: string;
  width: number | null;
  height: number | null;
}
export interface PostComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  /** 1단계 답글 — 답글에는 다시 답글을 달지 않는다 */
  parentId: string | null;
}
export interface Post {
  id: string;
  authorId: string;
  caption: string;
  createdAt: string;
  photos: PostPhoto[];
  /** 계정 그리드용 첫 사진 360 정사각 썸네일 */
  gridThumbUrl: string | null;
  /** 이모지별로 누른 사람들 */
  reactions: { emoji: string; userIds: string[] }[];
  comments: PostComment[];
}

const SELECT = `id, author_id, caption, created_at,
   photos!photos_post_id_fkey(id, storage_path, width, height, created_at),
   post_reactions(emoji, user_id),
   post_comments(id, author_id, body, created_at, parent_id)`;

type PostRow = {
  id: string;
  author_id: string;
  caption: string;
  created_at: string;
  photos: { id: string; storage_path: string; width: number | null; height: number | null; created_at: string }[];
  post_reactions: { emoji: string; user_id: string }[];
  post_comments: {
    id: string;
    author_id: string;
    body: string;
    created_at: string;
    parent_id: string | null;
  }[];
};

async function toPost(row: PostRow): Promise<Post> {
  const byEmoji = new Map<string, string[]>();
  for (const r of row.post_reactions ?? []) {
    byEmoji.set(r.emoji, [...(byEmoji.get(r.emoji) ?? []), r.user_id]);
  }
  const sortedPhotos = (row.photos ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    id: row.id,
    authorId: row.author_id,
    caption: row.caption,
    createdAt: row.created_at,
    photos: await Promise.all(
      sortedPhotos.map(async (p) => ({
        id: p.id,
        storagePath: p.storage_path,
        thumbUrl: await signedThumbUrl(p.storage_path, 'feed'),
        width: p.width,
        height: p.height,
      })),
    ),
    gridThumbUrl: sortedPhotos[0] ? await signedThumbUrl(sortedPhotos[0].storage_path, 'grid') : null,
    reactions: [...byEmoji.entries()].map(([emoji, userIds]) => ({ emoji, userIds })),
    comments: (row.post_comments ?? [])
      .map((c) => ({
        id: c.id,
        authorId: c.author_id,
        body: c.body,
        createdAt: c.created_at,
        parentId: c.parent_id,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

/** 커플 게시물 전체 (최신순) — 계정 그리드·피드 공용 */
export function usePosts() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select(SELECT)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return Promise.all((data as PostRow[]).map(toPost));
    },
  });
}

/** 게시물 작성 — post 생성 후 사진 업로드까지 한 번에 */
export function useCreatePost() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async ({ caption, photos }: { caption: string; photos: PickedPhoto[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data) throw new Error('로그인·연결이 필요해요');
      const { data, error } = await supabase
        .from('posts')
        .insert({ couple_id: couple.data.coupleId, author_id: uid, caption: caption.trim() })
        .select('id')
        .single();
      if (error) throw error;
      const postId = data.id as string;
      if (photos.length) await uploadPhotos({ postId }, couple.data.coupleId, photos);
      return postId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: { id: string; photos: PostPhoto[] }) => {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      if (post.photos.length) {
        await supabase.storage.from('photos').remove(post.photos.map((p) => p.storagePath));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

/** 내 리액션 토글 — 같은 이모지 재탭이면 취소 */
export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, emoji, on }: { postId: string; emoji: string; on: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const { error } = on
        ? await supabase.from('post_reactions').insert({ post_id: postId, user_id: uid, emoji })
        : await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', uid)
            .eq('emoji', emoji);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      body,
      parentId,
    }: {
      postId: string;
      body: string;
      parentId?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const { error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, author_id: uid, body: body.trim(), parent_id: parentId ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}
