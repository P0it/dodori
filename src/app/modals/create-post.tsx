import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { color, radius, space, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { PlayGlyph, PlusGlyph } from '@/components/glyphs';
import { PostCropSheet } from '@/components/feed/PostCropSheet';
import type { CanvasTransform } from '@/components/story/StoryCanvas';
import {
  cropToCanvas,
  pickPhotos,
  type PickedPhoto,
  type UploadProgress,
} from '@/api/photos';
import { useCreatePost } from '@/api/posts';
import { useStorageQuota } from '@/api/couple';
import { formatBytes, uploadEstimate, uploadRatio } from '@/lib/media';
import { isFramed, postFrameRatioOf } from '@/lib/posts';
import { alertDialog } from '@/components/dialog';

/** 게시물 작성 — 사진 선택 + 캡션 */
export default function CreatePost() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [cropping, setCropping] = useState<PickedPhoto | null>(null);
  const { width: screenW } = useWindowDimensions();

  const createPost = useCreatePost();
  const quota = useStorageQuota();
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  /** 올리는 중 누르는 취소 — uploadPhotos가 항목 경계와 압축 중에 본다 */
  const abort = useRef(false);

  /** "영상 2개 · 약 9MB · 남은 공간의 6%" — 사람이 놀라는 쪽은 영상이라 영상만 센다 */
  const estimate = uploadEstimate(photos, quota.data?.remainingBytes ?? 0);

  const onPick = async () => {
    if (quota.data?.full) {
      alertDialog('공간이 가득 찼어요', '곧 더 많은 공간을 제공할 예정이에요');
      return;
    }
    try {
      const picked = await pickPhotos(10, { videos: true });
      if (picked.length) setPhotos((prev) => [...prev, ...picked].slice(0, 10));
    } catch (e) {
      alertDialog('선택 실패', e instanceof Error ? e.message : String(e));
    }
  };

  /**
   * 게시물 하나가 쓰는 프레임 비율 — 첫 사진이 정한다.
   * 크롭 시트·저장·피드 표시가 전부 이 값을 봐야 "올릴 때 본 그대로" 보인다.
   */
  const frameRatio = postFrameRatioOf(photos);
  const frameH = Math.round(screenW * frameRatio);

  /** 캔버스 크기는 PostCropSheet이 쓴 값과 같아야 크롭 좌표가 맞는다 */
  const applyCrop = async (t: CanvasTransform) => {
    const target = cropping;
    setCropping(null);
    if (!target) return;
    try {
      const cropped = await cropToCanvas(target, {
        canvasWidth: screenW,
        canvasHeight: frameH,
        scale: t.scale,
        tx: t.tx,
        ty: t.ty,
      });
      setPhotos((prev) => prev.map((p) => (p.uri === target.uri ? cropped : p)));
    } catch (e) {
      alertDialog('자르기 실패', e instanceof Error ? e.message : String(e));
    }
  };

  const canSave = photos.length > 0 || caption.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    abort.current = false;
    setProgress(null);
    setSaving(true);
    try {
      // 크롭 시트를 열지 않은 사진은 여기서 중앙 크롭으로 확정한다 —
      // 비율이 제각각인 채로 올라가면 피드 캐러셀이 표시하면서 한 번 더 자른다
      const framed = await Promise.all(
        photos.map((p) =>
          isFramed(p, frameRatio)
            ? p
            : cropToCanvas(p, { canvasWidth: screenW, canvasHeight: frameH, scale: 1, tx: 0, ty: 0 }),
        ),
      );
      await createPost.mutateAsync({ caption, photos: framed, onProgress: setProgress, abort });
      router.dismiss();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // 취소는 실패가 아니다 — 사용자가 방금 누른 것이라 알림을 한 겹 더 띄우지 않는다
      if (message !== '취소했어요') alertDialog('저장 실패', message);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="새 피드" />
      <ScrollView contentContainerStyle={{ padding: space[4], gap: space[4] }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {photos.map((p) => (
            <View key={p.uri}>
              {/* 영상은 자를 수 없다 — 화면에서 cover로 놓이므로 크롭 시트를 열지 않는다 */}
              <Pressable onPress={() => !p.video && setCropping(p)}>
                <Image
                  source={{ uri: p.video ? p.video.posterUri : p.uri }}
                  style={{ width: 88, height: 88, borderRadius: radius.coverSm }}
                  contentFit="cover"
                />
                {p.video && (
                  <View
                    style={{
                      position: 'absolute',
                      right: 5,
                      bottom: 5,
                      opacity: 0.95,
                    }}
                  >
                    <PlayGlyph size={16} color={color.white} />
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => setPhotos((prev) => prev.filter((x) => x.uri !== p.uri))}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: color.surface3,
                  borderWidth: 1.5,
                  borderColor: color.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: typeface, fontSize: 12, color: color.white }}>×</Text>
              </Pressable>
            </View>
          ))}
          {photos.length < 10 && (
            <Pressable
              onPress={onPick}
              style={({ pressed }) => ({
                width: 88,
                height: 88,
                borderRadius: radius.coverSm,
                backgroundColor: color.surface1,
                borderWidth: 1,
                borderColor: color.surface3,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <PlusGlyph size={22} color={color.sub} />
            </Pressable>
          )}
        </View>
        <Meta>항목 {photos.length}/10 · 눌러서 구도를 잡고, ×를 누르면 빼요</Meta>
        {quota.data && (
          <Meta>
            {quota.data.full
              ? '공간이 가득 찼어요. 곧 더 많은 공간을 제공할 예정이에요'
              : `보관 공간 ${formatBytes(quota.data.usedBytes)} / ${formatBytes(quota.data.quotaBytes)}`}
          </Meta>
        )}
        {estimate.videoCount > 0 && (
          <Meta>
            영상 {estimate.videoCount}개 · 약 {formatBytes(estimate.bytes)} · 남은 공간의{' '}
            {estimate.percentOfRemaining}%
          </Meta>
        )}

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="무슨 일이 있었나요?"
          placeholderTextColor={color.muted}
          multiline
          style={{
            minHeight: 110,
            borderRadius: radius.field,
            backgroundColor: color.surface2,
            padding: 14,
            fontFamily: typeface,
            fontSize: 15,
            color: color.white,
            textAlignVertical: 'top',
          }}
        />

        <Pressable
          onPress={save}
          disabled={!canSave || saving}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: radius.pill,
            backgroundColor: color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !canSave ? 0.4 : pressed || saving ? 0.85 : 1,
          })}
        >
          {saving ? (
            <ActivityIndicator color={color.onPrimary} />
          ) : (
            <Text
              style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.onPrimary }}
            >
              올리기
            </Text>
          )}
        </Pressable>

        {/*
          올리는 중에만 나타나는 줄 — 영상이 섞이면 압축에 몇 초씩 걸려
          스피너만으로는 멈춘 것처럼 보인다.
        */}
        {saving && (
          <View style={{ gap: space[2] }}>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: color.surface2 }}>
              <View
                style={{
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: color.accent,
                  width: `${Math.round(uploadRatio(progress) * 100)}%`,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Meta>
                {progress
                  ? `${progress.phase === 'compress' ? '영상 줄이는 중' : '올리는 중'} ${progress.index + 1}/${progress.total}`
                  : '준비 중'}
              </Meta>
              <Pressable onPress={() => (abort.current = true)} hitSlop={8}>
                <Meta>취소</Meta>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      <PostCropSheet
        photo={cropping}
        frameRatio={frameRatio}
        onCancel={() => setCropping(null)}
        onConfirm={applyCrop}
      />
    </View>
  );
}
