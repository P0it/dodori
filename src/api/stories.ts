import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useMyCouple } from './couple';
import {
  cropToCanvas,
  signedThumbUrl,
  storagePathsFor,
  uploadPhotos,
  type PickedPhoto,
} from './photos';
import { parseOverlays, type TextOverlay } from '@/lib/stories';
import type { Json } from '@/types/database.types';

export interface StoryPhoto {
  id: string;
  storagePath: string;
  /** 미리 구운 렌디션(_360)이 있는지 — 삭제 대상 경로가 이 값으로 갈린다 */
  renditions: boolean;
  /** 뷰어용 비율 보존 썸네일 */
  thumbUrl: string;
  /** 보관함 그리드용 360 정사각 */
  gridThumbUrl: string;
  width: number | null;
  height: number | null;
}

export interface StoryComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  /** 사진 위 텍스트가 생기기 전에 올린 스토리에만 남아 있다 — 새로 쓰지 않는다 */
  caption: string;
  createdAt: string;
  /** 상대가 본 시각 — 링 상태 판정 (lib/stories) */
  seenAt: string | null;
  /** 올린 날 데이트 앨범. 없으면 그냥 일상 스토리 */
  trackId: string | null;
  trackTitle: string | null;
  /** 스토리 = 사진 1장. 업로드가 중간에 실패한 경우에만 null */
  photo: StoryPhoto | null;
  /** 사진 위에 얹은 텍스트 스티커 (사진은 원본 그대로 둔다) */
  overlays: TextOverlay[];
  /** 이모지별로 누른 사람들 (하트 하나뿐이지만 posts와 같은 모양으로 둔다) */
  reactions: { emoji: string; userIds: string[] }[];
  /** 스토리 아래 말풍선으로 남는 답장 (오래된 것부터) */
  comments: StoryComment[];
}

const SELECT = `id, author_id, caption, created_at, seen_at, track_id, overlays,
   tracks(title),
   photos!photos_story_id_fkey(id, storage_path, renditions, width, height, created_at),
   story_reactions(emoji, user_id),
   story_comments(id, author_id, body, created_at)`;

type StoryRow = {
  id: string;
  author_id: string;
  caption: string;
  created_at: string;
  seen_at: string | null;
  track_id: string | null;
  overlays: unknown;
  tracks: { title: string } | null;
  photos: {
    id: string;
    storage_path: string;
    renditions: boolean;
    width: number | null;
    height: number | null;
    created_at: string;
  }[];
  story_reactions: { emoji: string; user_id: string }[];
  story_comments: { id: string; author_id: string; body: string; created_at: string }[];
};

async function toStory(row: StoryRow): Promise<Story> {
  const byEmoji = new Map<string, string[]>();
  for (const r of row.story_reactions ?? []) {
    byEmoji.set(r.emoji, [...(byEmoji.get(r.emoji) ?? []), r.user_id]);
  }
  const p = (row.photos ?? [])[0] ?? null;
  return {
    id: row.id,
    authorId: row.author_id,
    caption: row.caption,
    createdAt: row.created_at,
    seenAt: row.seen_at,
    trackId: row.track_id,
    trackTitle: row.tracks?.title ?? null,
    overlays: parseOverlays(row.overlays),
    photo: p
      ? {
          id: p.id,
          storagePath: p.storage_path,
          renditions: p.renditions,
          thumbUrl: await signedThumbUrl(p.storage_path, 'feed', p.renditions),
          gridThumbUrl: await signedThumbUrl(p.storage_path, 'grid', p.renditions),
          width: p.width,
          height: p.height,
        }
      : null,
    reactions: [...byEmoji.entries()].map(([emoji, userIds]) => ({ emoji, userIds })),
    comments: (row.story_comments ?? [])
      .map((c) => ({
        id: c.id,
        authorId: c.author_id,
        body: c.body,
        createdAt: c.created_at,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

/**
 * 커플 스토리 전체 (최신순) — 홈 링·뷰어·보관함 공용.
 * 24시간 필터는 서버가 아니라 lib/stories의 `liveStories`로 건다 —
 * 만료 개념이 "링에서 내려간다"뿐이라 같은 데이터를 두 번 받아올 이유가 없다.
 */
export function useStories() {
  const couple = useMyCouple();
  return useQuery({
    enabled: !!couple.data,
    queryKey: ['stories'],
    queryFn: async (): Promise<Story[]> => {
      const { data, error } = await supabase
        .from('stories')
        .select(SELECT)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return Promise.all((data as StoryRow[]).map(toStory));
    },
  });
}

/** 스토리 올리기 — story 생성 후 사진 1장 업로드. trackId는 그날 앨범(없으면 null) */
export function useCreateStory() {
  const qc = useQueryClient();
  const couple = useMyCouple();
  return useMutation({
    mutationFn: async ({
      photo,
      crop,
      trackId,
      overlays,
    }: {
      photo: PickedPhoto;
      /**
       * 편집 캔버스에서 잡은 구도 — 올릴 때 그대로 잘라 굽는다.
       * 화면을 통째로 구워 온 경우(네이티브)에는 이미 완성된 그림이라 생략한다.
       */
      crop?: { canvasWidth: number; canvasHeight: number; scale: number; tx: number; ty: number };
      trackId: string | null;
      overlays: TextOverlay[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid || !couple.data) throw new Error('로그인·연결이 필요해요');
      const { data, error } = await supabase
        .from('stories')
        .insert({
          couple_id: couple.data.coupleId,
          author_id: uid,
          track_id: trackId,
          // TextOverlay는 JSON 그대로지만 인덱스 시그니처가 없어 Json 타입과 구조적으로 안 맞는다
          overlays: overlays as unknown as Json,
        })
        .select('id')
        .single();
      if (error) throw error;
      const storyId = data.id as string;
      const baked = crop ? await cropToCanvas(photo, crop) : photo;
      await uploadPhotos({ storyId }, couple.data.coupleId, [baked]);
      return storyId;
    },
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      // 앨범은 그날 스토리 사진을 같이 보여준다 — 붙은 트랙이 있으면 상세도 갱신
      if (vars.trackId) qc.invalidateQueries({ queryKey: ['track', vars.trackId] });
      qc.invalidateQueries({ queryKey: ['photoQuota'] });
    },
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (story: { id: string; photo: StoryPhoto | null }) => {
      const { error } = await supabase.from('stories').delete().eq('id', story.id);
      if (error) throw error;
      if (story.photo) {
        await supabase.storage.from('photos').remove(storagePathsFor(story.photo));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] });
      qc.invalidateQueries({ queryKey: ['track'] });
      qc.invalidateQueries({ queryKey: ['photoQuota'] });
    },
  });
}

/** 상대 스토리를 열었을 때 본 시각 기록 — 이미 있으면 건드리지 않는다 */
export function useMarkSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from('stories')
        .update({ seen_at: new Date().toISOString() })
        .eq('id', storyId)
        .is('seen_at', null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

/** 스토리 답장 — DM이 없으니 스토리 아래에 말풍선으로 남는다 */
export function useAddStoryComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, body }: { storyId: string; body: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const { error } = await supabase
        .from('story_comments')
        .insert({ story_id: storyId, author_id: uid, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useDeleteStoryComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('story_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

/** 하트 토글 — 같은 이모지 재탭이면 취소 (posts와 동일) */
export function useToggleStoryReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storyId,
      emoji,
      on,
    }: {
      storyId: string;
      emoji: string;
      on: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('로그인이 필요해요');
      const { error } = on
        ? await supabase.from('story_reactions').insert({ story_id: storyId, user_id: uid, emoji })
        : await supabase
            .from('story_reactions')
            .delete()
            .eq('story_id', storyId)
            .eq('user_id', uid)
            .eq('emoji', emoji);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}
