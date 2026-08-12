import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import { GestureHandlerRootView, type GestureType } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  color,
  DEFAULT_STORY_TEXT_COLOR,
  radius,
  space,
  tintBg,
  typeface,
} from '@/theme/tokens';
import {
  CANVAS_ZOOM_MIN,
  createTextOverlay,
  OVERLAY_MAX,
  OVERLAY_SIZE_DEFAULT,
  STORY_ASPECT,
  type TextOverlay,
} from '@/lib/stories';
import { StoryCanvas, type CanvasTransform } from '@/components/story/StoryCanvas';
import { StoryTextEditor } from '@/components/story/StoryTextEditor';
import { StoryTextInput } from '@/components/story/StoryTextInput';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  composeStoryCanvas,
  cropToCanvas,
  pickPhotos,
  STORY_BACKDROP,
  type PickedPhoto,
  type UploadProgress,
} from '@/api/photos';
import { uploadRatio } from '@/lib/media';
import { useCreateStory } from '@/api/stories';
import { useStorageQuota } from '@/api/couple';
import { useTodayTrack } from '@/api/tracks';
import { alertDialog } from '@/components/dialog';
import { ArrowUpGlyph, CloseGlyph, TextToolGlyph } from '@/components/glyphs';

const IDENTITY: CanvasTransform = { scale: 1, tx: 0, ty: 0 };

/** 굽는 방법만 플랫폼마다 다르다 — 네이티브는 화면 캡처, 웹은 canvas 합성 */
const IS_WEB = Platform.OS === 'web';

/** 상단 도구 버튼 한 칸 — 전부 같은 원이라 한 줄에 나란히 맞는다 */
const TOOL_SIZE = 38;

function ToolButton({
  children,
  onPress,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => ({
        width: TOOL_SIZE,
        height: TOOL_SIZE,
        borderRadius: TOOL_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

/**
 * 스토리 올리기 — 인스타식 편집 화면.
 *
 * 캔버스는 화면 맨 위에 붙는 **9:16 카드**다(`STORY_ASPECT`). 화면 전체를 캔버스로 삼으면
 * 기기마다 스토리 비율이 달라지고, 길쭉한 화면에서는 위아래로 흐린 여백만 커진다.
 * 카드 아래 남는 검은 자리가 올리기 줄의 자리다 — 인스타의 "내 스토리 / →" 줄과 같은 칸.
 * 닫기·텍스트 버튼은 카드 위에 얹힌다.
 *
 * 상자 크기는 **처음 한 번 재서 고정**한다. 창 크기(`Dimensions`)를 쓰면 안 된다 —
 * 루트가 상태바만큼 위를 이미 밀어 두어서 창보다 낮은 상자에 창 높이짜리 캔버스를 그리게 되고,
 * 그만큼 전체가 아래로 쏠린 채 밑이 잘린다. 매 렌더 다시 재지 않는 이유는 따로 있다 —
 * 키보드가 올라올 때 창이 줄면서 사진까지 같이 줄어든다.
 */
export default function CreateStory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [transform, setTransform] = useState<CanvasTransform>(IDENTITY);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  /** 올리는 중 누르는 취소 — 영상이면 압축에 몇 초씩 걸린다 */
  const abort = useRef(false);
  // 그날 앨범에 담을지는 직접 고른다 — 자동으로 붙이지 않는다
  const [attachToTrack, setAttachToTrack] = useState(false);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  /** 지금 인라인으로 고치는 중인 텍스트. 없으면 캔버스 조작 모드 */
  const [editingId, setEditingId] = useState<string | null>(null);

  const createStory = useCreateStory();
  const todayTrack = useTodayTrack();
  const quota = useStorageQuota();

  /**
   * 영상 스토리의 미리보기 — 편집(핀치·팬)이 없으므로 9:16 칸에 cover로 꽉 채운다.
   * 여백이 없으니 사진 쪽의 흐린 배경·스크림도 그리지 않는다.
   */
  const videoPlayer = useVideoPlayer(photo?.video ? { uri: photo.uri } : null, (p) => {
    p.loop = true;
    p.play();
  });
  /** 굽기의 대상 — 사진과 흐린 배경까지, 텍스트는 뺀 레이어 */
  const photoLayer = useRef<View>(null);
  // 캔버스(사진)와 텍스트 레이어는 형제 뷰라 RNGH가 알아서 우선순위를 정해 주지 않는다.
  // 이 ref들로 "글자를 잡으면 사진 제스처는 막는다"를 명시한다
  const canvasGestures = {
    pan: useRef<GestureType | undefined>(undefined),
    pinch: useRef<GestureType | undefined>(undefined),
    reset: useRef<GestureType | undefined>(undefined),
  };

  const editing = overlays.find((o) => o.id === editingId) ?? null;

  const onPick = async () => {
    try {
      const [picked] = await pickPhotos(1, { videos: true });
      if (picked) {
        setPhoto(picked);
        setTransform(IDENTITY);
      } else {
        // 진입하자마자 뜬 갤러리를 그냥 닫았다 = 올릴 생각이 없다
        router.dismiss();
      }
    } catch (e) {
      alertDialog('선택 실패', e instanceof Error ? e.message : String(e));
      router.dismiss();
    }
  };

  // 들어오면 곧바로 갤러리 — 사진을 고르는 것 말고 할 일이 없는 화면을 한 장 끼우지 않는다.
  // 다만 잔량을 먼저 본다: 다 찬 채로 갤러리를 열면 고르고 나서야 실패한다.
  const opened = useRef(false);
  useEffect(() => {
    // enabled=false(연결 전)면 isLoading이 false라 여기서 멎지 않는다
    if (opened.current || quota.isLoading) return;
    opened.current = true;
    if (quota.data?.full) {
      alertDialog('공간이 가득 찼어요', '곧 더 많은 공간을 제공할 예정이에요');
      router.dismiss();
      return;
    }
    onPick();
    // 잔량이 정해진 뒤 한 번 (onPick은 매 렌더 새 함수)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quota.isLoading, quota.data?.full]);

  /*
    웹 전용 — 키보드가 떠도 화면이 밀려 올라가지 않게.

    iOS 사파리는 입력 칸을 보이겠다고 페이지를 통째로 위로 민다. 이 화면은 사진이
    제자리에 못 박혀 있어야 하는데 사진도 도구도 같이 올라가 화면 밖으로 나갔다.
    문서 높이를 **지금 보이는 만큼**(visualViewport)으로 줄여 두면 밀어 올릴 자리가
    없어진다 — 키보드는 카드의 아랫부분을 덮기만 하고, 사진과 위쪽 도구는 그대로다.
  */
  useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const sync = () => {
      root.style.height = `${vv.height}px`;
      window.scrollTo(0, 0);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      root.style.height = '';
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  // 첫 렌더는 재기만 한다 — 이 상자 안에 카드를 앉힌다
  if (!box) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#000' }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setBox({ width, height });
        }}
      />
    );
  }

  /** 스토리 카드 — 화면이 9:16보다 길쭉하면 남는 자리는 아래에 검게 둔다 */
  const canvas = {
    width: box.width,
    height: Math.min(box.height, box.width * STORY_ASPECT),
  };

  const addText = () => {
    if (overlays.length >= OVERLAY_MAX) return;
    // 먼저 만들어 캔버스에 올리고 그 자리에서 친다 — 완료를 눌러야 나타나지 않는다
    const fresh = createTextOverlay(
      Crypto.randomUUID(),
      '',
      DEFAULT_STORY_TEXT_COLOR,
      OVERLAY_SIZE_DEFAULT,
    );
    setOverlays((prev) => [...prev, fresh]);
    setEditingId(fresh.id);
  };

  /**
   * 편집 화면의 사진 레이어를 그대로 한 장으로 굽는다 — 흐린 배경과 여백까지 픽셀로 남는다.
   * 이래야 뷰어·피드·보관함이 구도를 몰라도 되고, 텍스트의 0~1 좌표가 곧 이미지 좌표가 된다.
   *
   * 네이티브는 그려진 화면을 그대로 캡처하고, 웹은 같은 그림을 canvas에 다시 그린다
   * (`captureRef`가 네이티브 전용이라). 흐린 배경 값은 양쪽이 `STORY_BACKDROP` 하나를 본다.
   */
  const bakePhotoLayer = async (source: PickedPhoto): Promise<PickedPhoto> => {
    // 영상은 구울 수 없다 — 포스터만 9:16으로 잘라 둔다.
    // 그러면 저장된 width/height가 9:16이 되고, 뷰어의 containedRect()가 돌려주는 사각형에
    // cover로 영상을 그렸을 때 편집 화면·포스터·재생 구도가 정확히 겹친다
    // (텍스트 오버레이의 0~1 좌표가 그대로 맞는 이유이기도 하다).
    if (source.video) {
      return cropToCanvas(source, {
        ...IDENTITY,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      });
    }
    if (IS_WEB) {
      return composeStoryCanvas(source, {
        ...transform,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      });
    }
    const uri = await captureRef(photoLayer, { format: 'jpg', quality: 0.92, result: 'tmpfile' });
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) =>
      RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject),
    );
    return { uri, width: size.width, height: size.height, takenAt: source.takenAt };
  };

  const save = async () => {
    if (!photo || saving) return;
    abort.current = false;
    setProgress(null);
    setSaving(true);
    try {
      await createStory.mutateAsync({
        photo: await bakePhotoLayer(photo),
        trackId: attachToTrack ? (todayTrack.data?.id ?? null) : null,
        overlays,
        onProgress: setProgress,
        abort,
      });
      router.dismiss();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // 취소는 실패가 아니다 — 사용자가 방금 누른 것이라 알림을 한 겹 더 띄우지 않는다
      if (message !== '취소했어요') alertDialog('올리기 실패', message);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  // 텍스트는 캔버스에 붙는다 — 잘라낸 사진이 곧 캔버스라 이 좌표가 저장 후에도 그대로 맞는다
  const rect = { x: 0, y: 0, width: canvas.width, height: canvas.height };

  return (
    /*
      전체 화면 모달은 네이티브 창을 따로 띄운다 — 앱 루트의 GestureHandlerRootView가
      거기까지 닿지 않아서 그 안에서는 핀치·팬이 통째로 죽는다 (사진이 안 줄어들던 원인).
      이 화면은 제 뿌리를 따로 심는다
    */
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* 사진 — 화면에 못 박혀 있다. 키보드가 올라와도 여기는 움직이지 않는다 */}
      {photo && (
        <View style={{ position: 'absolute', top: 0, left: 0, width: canvas.width, height: canvas.height }}>
          {/*
            굽는 건 이 안쪽만 — 사진과 흐린 배경까지다.
            텍스트는 바깥에 두어 좌표로 저장되고 볼 때 얹힌다 (해상도에 안 눌린다)
          */}
          <View
            ref={photoLayer}
            collapsable={false}
            style={{ width: canvas.width, height: canvas.height, backgroundColor: '#000' }}
          >
            {photo.video ? (
              // 영상은 크롭·줌이 없다(결정 5) — cover로 꽉 채우므로 여백도 흐린 배경도 없다
              <VideoView
                player={videoPlayer}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
              />
            ) : (
              <>
                <Image
                  source={{ uri: photo.uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  blurRadius={STORY_BACKDROP.blurRadius}
                />
                {/* 흐린 배경이 사진보다 튀지 않게 한 겹 눌러 준다 */}
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: STORY_BACKDROP.scrim }]}
                />
                <StoryCanvas
                  uri={photo.uri}
                  photoWidth={photo.width}
                  photoHeight={photo.height}
                  width={canvas.width}
                  height={canvas.height}
                  minScale={CANVAS_ZOOM_MIN}
                  onChange={setTransform}
                  gestureRefs={canvasGestures}
                />
              </>
            )}
          </View>
          {/* 편집 중인 글자는 입력 쪽에 떠 있다 — 캔버스에 두 번 그리지 않는다 */}
          <StoryTextEditor
            overlays={overlays.filter((o) => o.id !== editingId && !!o.text)}
            rect={rect}
            onChange={(o) => setOverlays((prev) => prev.map((p) => (p.id === o.id ? o : p)))}
            onEdit={(o) => setEditingId(o.id)}
            blocks={[canvasGestures.pan, canvasGestures.pinch, canvasGestures.reset]}
          />
        </View>
      )}

      {photo && !editing && (
        <>
          {/* 밝은 사진 위에서도 아이콘이 읽히도록 — 위아래로만 얇게 */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 92 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom + 130 }}
            pointerEvents="none"
          />

          {/*
            상단 — 왼쪽은 나가기(×), 오른쪽은 얹기(T). 양끝에 하나씩이라 헷갈릴 짝이 없고,
            같은 크기의 원이라 한 줄에 정확히 맞는다.
            상태바만큼은 루트가 이미 밀어 두었다 — 여기서 또 더하면 두 번 밀린다
          */}
          <View
            style={{
              position: 'absolute',
              top: space[2],
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: space[4],
            }}
          >
            <ToolButton onPress={() => router.dismiss()}>
              <CloseGlyph size={20} color={color.white} />
            </ToolButton>
            <ToolButton onPress={addText} disabled={overlays.length >= OVERLAY_MAX}>
              <TextToolGlyph size={20} />
            </ToolButton>
          </View>

          {/* 하단 — 앨범에 담기(좌) + 올리기(우). 사진 위에 얹힌 한 줄 */}
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + space[3],
              left: 0,
              right: 0,
              paddingHorizontal: space[4],
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
            }}
          >
            {/*
              올리는 중에는 담기 토글 자리에 진행 상황을 둔다 — 영상은 압축에 몇 초씩 걸려
              동그란 스피너만으로는 멈춘 것처럼 보인다.
            */}
            {saving ? (
              <Pressable
                onPress={() => (abort.current = true)}
                hitSlop={8}
                style={{
                  flexShrink: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: radius.pill,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              >
                <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12.5, color: color.white }}>
                  {progress?.phase === 'compress' ? '영상 줄이는 중' : '올리는 중'}{' '}
                  {Math.round(uploadRatio(progress) * 100)}%
                </Text>
                <Text style={{ fontFamily: typeface, fontSize: 12.5, color: color.muted }}>취소</Text>
              </Pressable>
            ) : (
              todayTrack.data && (
              <Pressable
                onPress={() => setAttachToTrack((v) => !v)}
                style={({ pressed }) => ({
                  flexShrink: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  paddingHorizontal: 11,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: attachToTrack ? tintBg.date : 'rgba(0,0,0,0.45)',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    borderWidth: 1.6,
                    borderColor: attachToTrack ? color.date : color.muted,
                    backgroundColor: attachToTrack ? color.date : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {attachToTrack && (
                    <Text style={{ fontFamily: typeface, fontSize: 10.5, color: color.bg }}>✓</Text>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    flexShrink: 1,
                    fontFamily: typeface,
                    fontWeight: '700',
                    fontSize: 12.5,
                    color: attachToTrack ? color.date : color.white,
                  }}
                >
                  {todayTrack.data.title}에도 담기
                </Text>
              </Pressable>
              )
            )}

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={save}
              disabled={saving}
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: color.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || saving ? 0.85 : 1,
              })}
            >
              {saving ? <ActivityIndicator color={color.onPrimary} /> : <ArrowUpGlyph size={24} />}
            </Pressable>
          </View>
        </>
      )}

      {photo && editing && (
        <StoryTextInput
          key={editing.id}
          initial={{ text: editing.text, color: editing.color, size: editing.size }}
          canvasWidth={canvas.width}
          canvasHeight={canvas.height}
          boxHeight={box.height}
          onDelete={() => {
            setOverlays((prev) => prev.filter((o) => o.id !== editing.id));
            setEditingId(null);
          }}
          onDone={({ text, color: textColor, size }) => {
            // 빈 글자는 남길 이유가 없다 — 캔버스에 안 보이는 스티커가 쌓인다
            setOverlays((prev) =>
              text
                ? prev.map((p) => (p.id === editing.id ? { ...p, text, color: textColor, size } : p))
                : prev.filter((p) => p.id !== editing.id),
            );
            setEditingId(null);
          }}
        />
      )}
    </GestureHandlerRootView>
  );
}
