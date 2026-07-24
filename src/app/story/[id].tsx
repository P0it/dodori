import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, space, tintBg, typeface } from '@/theme/tokens';
import { formatRelative } from '@/lib/date';
import { REACTIONS } from '@/lib/posts';
import { isLive, liveStories } from '@/lib/stories';
import { useSession } from '@/api/auth';
import { useCoupleProfiles } from '@/api/couple';
import {
  useDeleteStory,
  useMarkSeen,
  useStories,
  useToggleStoryReaction,
  type Story,
} from '@/api/stories';
import { Avatar } from '@/components/Avatar';
import { Meta } from '@/components/Meta';
import { HeartGlyph } from '@/components/glyphs';
import { StoryProgress } from '@/components/story/StoryProgress';

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
  // 목록이 늦게 도착해도 진입 스토리에서 시작하도록, 처음 한 번만 위치를 맞춘다
  const aligned = useRef(false);
  useEffect(() => {
    if (aligned.current || !list.length) return;
    const at = list.findIndex((s) => s.id === id);
    if (at > 0) setIndex(at);
    aligned.current = true;
  }, [list, id]);

  const current = list[index];

  // 자동 진행 — 마지막 칸이 끝나면 닫는다
  useEffect(() => {
    if (!current) return;
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
  }, [current?.id, index, list.length, router]);

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

  return (
    <GestureDetector gesture={swipeDown}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {current.photo && (
          <Image
            source={current.photo.thumbUrl}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="contain"
            transition={120}
          />
        )}

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

        {/* 하단 — 앨범 배지 + 캡션 + 하트 */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 }}
          pointerEvents="none"
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: space[4],
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: space[3],
          }}
        >
          <View style={{ flex: 1, gap: 8 }}>
            {current.trackTitle && (
              <Pressable
                onPress={() => current.trackId && router.push(`/track/${current.trackId}`)}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: tintBg.date,
                }}
              >
                <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 11, color: color.date }}>
                  {current.trackTitle}
                </Text>
              </Pressable>
            )}
            {!!current.caption && (
              <Text style={{ fontFamily: typeface, fontSize: 15, lineHeight: 21, color: color.white }}>
                {current.caption}
              </Text>
            )}
          </View>

          <Pressable
            hitSlop={10}
            onPress={() =>
              toggleReaction.mutate({ storyId: current.id, emoji: heart, on: !hearted })
            }
          >
            <HeartGlyph size={27} filled={hearted} color={hearted ? color.danger : color.white} />
          </Pressable>
        </View>
      </View>
    </GestureDetector>
  );
}
