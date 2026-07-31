import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, space, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { REACTIONS } from '@/lib/posts';
import { containedRect, isLive, liveStories } from '@/lib/stories';
import { useSession } from '@/api/auth';
import { useCoupleProfiles } from '@/api/couple';
import {
  useAddStoryComment,
  useDeleteStory,
  useDeleteStoryComment,
  useMarkSeen,
  useStories,
  useToggleStoryReaction,
  type Story,
} from '@/api/stories';
import { Avatar } from '@/components/Avatar';
import { Meta } from '@/components/Meta';
import { HeartGlyph } from '@/components/glyphs';
import { StoryProgress } from '@/components/story/StoryProgress';
import { StoryTextLayer } from '@/components/story/StoryTextLayer';
import { StoryCommentBubble } from '@/components/story/StoryCommentBubble';

/** 한 칸이 머무는 시간 */
const STEP_MS = 5000;
const TICK_MS = 50;

/**
 * 스토리 뷰어 — 전체화면 1장. 좌우 탭으로 이동, 아래로 밀면 닫힌다.
 * 링에서 들어오면 그 사람의 24시간 내 스토리를 순서대로, 보관함에서 들어오면 그 한 장만 본다.
 */
export default function StoryViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const stories = useStories();
  const session = useSession();
  const profiles = useCoupleProfiles();

  const markSeen = useMarkSeen();
  const toggleReaction = useToggleStoryReaction();
  const deleteStory = useDeleteStory();
  const addComment = useAddStoryComment();
  const deleteComment = useDeleteStoryComment();

  const uid = session.data?.user.id ?? '';
  const all = stories.data ?? [];

  // 진입한 스토리가 살아있으면 같은 사람의 24시간 내 스토리를 이어서 본다
  const list = useMemo<Story[]>(() => {
    const entry = all.find((s) => s.id === id);
    if (!entry) return [];
    if (!isLive(entry.createdAt)) return [entry];
    return liveStories(all).filter((s) => s.authorId === entry.authorId);
  }, [all, id]);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [reply, setReply] = useState('');
  // 답장을 쓰는 동안 다음 스토리로 넘어가 버리면 쓰던 말이 엉뚱한 사진에 붙는다
  const [paused, setPaused] = useState(false);
  // 목록이 늦게 도착해도 진입 스토리에서 시작하도록, 처음 한 번만 위치를 맞춘다
  const aligned = useRef(false);
  useEffect(() => {
    if (aligned.current || !list.length) return;
    const at = list.findIndex((s) => s.id === id);
    if (at > 0) setIndex(at);
    aligned.current = true;
  }, [list, id]);

  const current = list[index];

  // 자동 진행 — 마지막 칸이 끝나면 닫는다. 답장을 쓰는 동안엔 멈춘다
  useEffect(() => {
    if (!current || paused) return;
    setProgress(0);
    const started = Date.now();
    const timer = setInterval(() => {
      const p = (Date.now() - started) / STEP_MS;
      if (p >= 1) {
        clearInterval(timer);
        if (index + 1 < list.length) setIndex(index + 1);
        else router.back();
      } else {
        setProgress(p);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [current?.id, index, list.length, paused, router]);

  // 상대 스토리를 열면 본 시각 기록 (이미 있으면 서버에서 걸러진다)
  useEffect(() => {
    if (current && current.authorId !== uid && current.seenAt === null) markSeen.mutate(current.id);
    // markSeen은 매 렌더 새 객체 — 스토리가 바뀔 때만 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const swipeDown = Gesture.Pan().onEnd((e) => {
    if (e.translationY > 90 && e.velocityY > 0) runOnJS(router.back)();
  });

  if (!current) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Meta>{stories.isLoading ? '' : '스토리를 찾지 못했어요'}</Meta>
      </View>
    );
  }

  const isMine = current.authorId === uid;
  const profile = isMine ? profiles.data?.me : profiles.data?.partner;
  const heart = REACTIONS[0];
  const hearted = current.reactions.some((r) => r.emoji === heart && r.userIds.includes(uid));

  const onDelete = () =>
    Alert.alert('스토리 삭제', '되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteStory.mutate({ id: current.id, photo: current.photo });
          router.back();
        },
      },
    ]);

  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0) return;
    if (next >= list.length) router.back();
    else setIndex(next);
  };

  const profileOf = (author: string) =>
    author === uid ? profiles.data?.me : profiles.data?.partner;
  const nameOf = (author: string) =>
    profileOf(author)?.nickname || (author === uid ? '나' : '상대');
  const avatarOf = (author: string) => profileOf(author)?.avatar_url ?? null;

  const send = () => {
    const body = reply.trim();
    if (!body) return;
    addComment.mutate({ storyId: current.id, body });
    setReply('');
  };

  const onDeleteComment = (commentId: string) =>
    Alert.alert('답장 삭제', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteComment.mutate(commentId) },
    ]);

  return (
    <GestureDetector gesture={swipeDown}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onLayout={(e) => setFrame(e.nativeEvent.layout)}
        >
          {current.photo && (
            <Image
              source={current.photo.thumbUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={120}
            />
          )}
          {/* 텍스트 스티커 — 사진에 구워 넣지 않고 올릴 때 잡은 자리 그대로 얹는다 */}
          <StoryTextLayer
            overlays={current.overlays}
            rect={containedRect(
              current.photo?.width ?? null,
              current.photo?.height ?? null,
              frame.width,
              frame.height,
            )}
          />
        </View>

        {/* 좌우 탭 이동 — 사진 위 전면을 반씩 나눠 덮는다 */}
        <Pressable style={{ position: 'absolute', top: 90, bottom: 120, left: 0, width: '32%' }} onPress={() => go(-1)} />
        <Pressable style={{ position: 'absolute', top: 90, bottom: 120, right: 0, width: '32%' }} onPress={() => go(1)} />

        {/* 상단 — 진행바 + 작성자 */}
        <LinearGradient
          colors={['rgba(0,0,0,0.65)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140 }}
          pointerEvents="none"
        />
        <View style={{ paddingHorizontal: space[3], paddingTop: space[3] }}>
          <StoryProgress count={list.length} index={index} progress={progress} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 }}>
            <Avatar url={profile?.avatar_url ?? null} name={profile?.nickname || (isMine ? '나' : '상대')} size={30} />
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13.5, color: color.white }}>
              {profile?.nickname || (isMine ? '나' : '상대')}
            </Text>
            <Text style={{ fontFamily: typeface, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              {formatRelative(current.createdAt)}
            </Text>
            <View style={{ flex: 1 }} />
            {isMine && (
              <Pressable hitSlop={10} onPress={onDelete}>
                <Text style={{ fontFamily: typeface, fontSize: 12.5, color: 'rgba(255,255,255,0.8)' }}>
                  삭제
                </Text>
              </Pressable>
            )}
            <Pressable hitSlop={10} onPress={() => router.back()}>
              <Text style={{ fontFamily: typeface, fontSize: 20, color: color.white }}>×</Text>
            </Pressable>
          </View>
        </View>

        {/* 하단 — 앨범 배지 + 캡션 + 답장 말풍선 + 입력 */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 260 }}
          pointerEvents="none"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        >
          <View style={{ paddingHorizontal: space[4], paddingBottom: space[3], gap: 8 }}>
            {!!current.caption && (
              <Text style={{ fontFamily: typeface, fontSize: 15, lineHeight: 21, color: color.white }}>
                {current.caption}
              </Text>
            )}

            {/* 답장 — 사라지지 않고 스토리 아래에 쌓인다 */}
            {current.comments.length > 0 && (
              <ScrollView style={{ maxHeight: 170 }} contentContainerStyle={{ gap: 6, paddingTop: 4 }}>
                {current.comments.map((c) => (
                  <StoryCommentBubble
                    key={c.id}
                    name={nameOf(c.authorId)}
                    avatarUrl={avatarOf(c.authorId)}
                    body={c.body}
                    mine={c.authorId === uid}
                    onLongPress={
                      c.authorId === uid ? () => onDeleteComment(c.id) : undefined
                    }
                  />
                ))}
              </ScrollView>
            )}

            {/* 내 스토리 — 상대가 봤으면 프로필이 뜬다. 안 봤으면 자리 자체가 없다 */}
            {isMine && current.seenAt && profiles.data?.partner && (
              <View style={{ flexDirection: 'row', paddingTop: 2 }}>
                <Avatar
                  url={profiles.data.partner.avatar_url ?? null}
                  name={profiles.data.partner.nickname || '상대'}
                  size={24}
                />
              </View>
            )}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
              paddingHorizontal: space[4],
              paddingBottom: space[4],
            }}
          >
            <TextInput
              value={reply}
              onChangeText={setReply}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onSubmitEditing={send}
              returnKeyType="send"
              placeholder="답장 남기기"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 999,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.35)',
                backgroundColor: 'rgba(0,0,0,0.35)',
                fontFamily: typeface,
                fontSize: 14,
                color: color.white,
              }}
            />
            {reply.trim() ? (
              <Pressable hitSlop={10} onPress={send}>
                <Text
                  style={{ fontFamily: typeface, fontWeight: '800', fontSize: 14.5, color: color.white }}
                >
                  보내기
                </Text>
              </Pressable>
            ) : (
              <Pressable
                hitSlop={10}
                onPress={() =>
                  toggleReaction.mutate({ storyId: current.id, emoji: heart, on: !hearted })
                }
              >
                <HeartGlyph size={27} filled={hearted} color={hearted ? color.danger : color.white} />
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </GestureDetector>
  );
}
