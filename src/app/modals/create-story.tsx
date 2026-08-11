import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import type { GestureType } from 'react-native-gesture-handler';
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
  type TextOverlay,
} from '@/lib/stories';
import { StoryCanvas, type CanvasTransform } from '@/components/story/StoryCanvas';
import { StoryTextEditor } from '@/components/story/StoryTextEditor';
import { StoryTextInput } from '@/components/story/StoryTextInput';
import {
  composeStoryCanvas,
  pickPhotos,
  STORY_BACKDROP,
  type PickedPhoto,
} from '@/api/photos';
import { useCreateStory } from '@/api/stories';
import { useTodayTrack } from '@/api/tracks';
import { alertDialog } from '@/components/dialog';

const IDENTITY: CanvasTransform = { scale: 1, tx: 0, ty: 0 };

/** 굽는 방법만 플랫폼마다 다르다 — 네이티브는 화면 캡처, 웹은 canvas 합성 */
const IS_WEB = Platform.OS === 'web';

/** 사진 위에 얹는 도구 버튼 — 글리프가 아니라 라벨이라 뭘 하는지 읽힌다 */
function ToolPill({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => ({
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(0,0,0,0.45)',
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12.5, color: color.white }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * 스토리 올리기 — 인스타식 풀블리드 캔버스.
 *
 * 캔버스가 곧 화면이다. 검은 여백도 테두리도 없으니 "어디까지 올라가는지"를
 * 물을 자리가 없다 — 보이는 것이 올라가는 것이다. 버튼은 사진 밖이 아니라
 * 사진 위에 얹힌다.
 *
 * 캔버스 크기는 **마운트 시점의 창 크기로 고정**한다. 매 렌더 다시 재면
 * 키보드가 올라올 때 창이 줄면서 사진까지 같이 줄어든다 (텍스트를 칠 때마다
 * 배경이 쪼그라들던 원인).
 */
export default function CreateStory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [canvas] = useState(() => Dimensions.get('window'));

  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [transform, setTransform] = useState<CanvasTransform>(IDENTITY);
  const [saving, setSaving] = useState(false);
  // 그날 앨범에 담을지는 직접 고른다 — 자동으로 붙이지 않는다
  const [attachToTrack, setAttachToTrack] = useState(false);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  /** 지금 인라인으로 고치는 중인 텍스트. 없으면 캔버스 조작 모드 */
  const [editingId, setEditingId] = useState<string | null>(null);

  const createStory = useCreateStory();
  const todayTrack = useTodayTrack();
  /** 굽기의 대상 — 사진과 흐린 배경까지, 텍스트는 뺀 레이어 */
  const photoLayer = useRef<View>(null);
  // 캔버스(사진)와 텍스트 레이어는 형제 뷰라 RNGH가 알아서 우선순위를 정해 주지 않는다.
  // 이 ref들로 "글자를 잡으면 사진 제스처는 막는다"를 명시한다
  const canvasGestures = {
    pan: useRef<GestureType | undefined>(undefined),
    pinch: useRef<GestureType | undefined>(undefined),
    reset: useRef<GestureType | undefined>(undefined),
  };

  // 텍스트는 캔버스에 붙는다 — 잘라낸 사진이 곧 캔버스라 이 좌표가 저장 후에도 그대로 맞는다
  const rect = { x: 0, y: 0, width: canvas.width, height: canvas.height };

  const editing = overlays.find((o) => o.id === editingId) ?? null;

  const onPick = async (first: boolean) => {
    try {
      const [picked] = await pickPhotos(1);
      if (picked) {
        setPhoto(picked);
        setTransform(IDENTITY);
      } else if (first) {
        // 진입하자마자 뜬 갤러리를 그냥 닫았다 = 올릴 생각이 없다
        router.dismiss();
      }
    } catch (e) {
      alertDialog('사진 선택 실패', e instanceof Error ? e.message : String(e));
      if (first) router.dismiss();
    }
  };

  // 들어오면 곧바로 갤러리 — 사진을 고르는 것 말고 할 일이 없는 화면을 한 장 끼우지 않는다
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    onPick(true);
    // 마운트 때 한 번 (onPick은 매 렌더 새 함수)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const removeEditing = () => {
    setOverlays((prev) => prev.filter((o) => o.id !== editingId));
    setEditingId(null);
  };

  /**
   * 편집 화면의 사진 레이어를 그대로 한 장으로 굽는다 — 흐린 배경과 여백까지 픽셀로 남는다.
   * 이래야 뷰어·피드·보관함이 구도를 몰라도 되고, 텍스트의 0~1 좌표가 곧 이미지 좌표가 된다.
   *
   * 네이티브는 그려진 화면을 그대로 캡처하고, 웹은 같은 그림을 canvas에 다시 그린다
   * (`captureRef`가 네이티브 전용이라). 흐린 배경 값은 양쪽이 `STORY_BACKDROP` 하나를 본다.
   */
  const bakePhotoLayer = async (source: PickedPhoto): Promise<PickedPhoto> => {
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
    setSaving(true);
    try {
      await createStory.mutateAsync({
        photo: await bakePhotoLayer(photo),
        trackId: attachToTrack ? (todayTrack.data?.id ?? null) : null,
        overlays,
      });
      router.dismiss();
    } catch (e) {
      alertDialog('올리기 실패', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
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
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 92 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom + 130 }}
            pointerEvents="none"
          />

          {/*
            상단 — 왼쪽은 '이 사진을 떠나는' 것들(닫기·바꾸기), 오른쪽은 '얹는' 것(텍스트).
            둘을 화면 양끝으로 갈라 놓고 각각 라벨을 붙인다 — 나란한 두 글리프는
            어느 쪽이 뭔지 알 수 없었다.
          */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + space[2],
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: space[4],
              gap: space[3],
            }}
          >
            <Pressable hitSlop={12} onPress={() => router.dismiss()}>
              <Text style={{ fontFamily: typeface, fontSize: 22, color: color.white }}>×</Text>
            </Pressable>
            <ToolPill label="사진 바꾸기" onPress={() => onPick(false)} />
            <View style={{ flex: 1 }} />
            <ToolPill
              label="텍스트"
              onPress={addText}
              disabled={overlays.length >= OVERLAY_MAX}
            />
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
            {todayTrack.data && (
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
            )}

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={save}
              disabled={saving}
              style={({ pressed }) => ({
                height: 46,
                minWidth: 96,
                paddingHorizontal: 24,
                borderRadius: radius.pill,
                backgroundColor: color.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || saving ? 0.85 : 1,
              })}
            >
              {saving ? (
                <ActivityIndicator color={color.onPrimary} />
              ) : (
                <Text
                  style={{
                    fontFamily: typeface,
                    fontWeight: '700',
                    fontSize: 15,
                    color: color.onPrimary,
                  }}
                >
                  올리기
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {photo && editing && (
        <StoryTextInput
          key={editing.id}
          initial={{ text: editing.text, color: editing.color, size: editing.size }}
          canvasWidth={canvas.width}
          photoUri={photo.uri}
          onDelete={removeEditing}
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
    </View>
  );
}
