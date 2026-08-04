import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
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
  createTextOverlay,
  OVERLAY_MAX,
  OVERLAY_SIZE_DEFAULT,
  STORY_ASPECT,
  type TextOverlay,
} from '@/lib/stories';
import { Meta } from '@/components/Meta';
import { PlusGlyph } from '@/components/glyphs';
import { StoryCanvas, type CanvasTransform } from '@/components/story/StoryCanvas';
import { StoryTextEditor } from '@/components/story/StoryTextEditor';
import { StoryTextInput } from '@/components/story/StoryTextInput';
import { pickPhotos, type PickedPhoto } from '@/api/photos';
import { useCreateStory } from '@/api/stories';
import { useTodayTrack } from '@/api/tracks';

const IDENTITY: CanvasTransform = { scale: 1, tx: 0, ty: 0 };

/**
 * 스토리 올리기 — 인스타식 풀스크린 캔버스.
 * 사진은 9:16 캔버스를 덮고, 핀치·팬으로 잡은 구도가 그대로 잘려 올라간다.
 * 텍스트는 캔버스를 떠나지 않고 그 위에서 바로 쓰고 바로 끈다.
 */
export default function CreateStory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();

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

  // 9:16을 화면 안에 넣는다 — 세로가 짧은 기기에서는 높이가 먼저 걸린다
  const chrome = insets.top + insets.bottom + 132;
  const canvasWidth = Math.min(win.width, (win.height - chrome) * STORY_ASPECT);
  const canvasHeight = canvasWidth / STORY_ASPECT;
  // 텍스트는 캔버스에 붙는다 — 잘라낸 사진이 곧 캔버스라 이 좌표가 저장 후에도 그대로 맞는다
  const rect = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };

  const editing = overlays.find((o) => o.id === editingId) ?? null;

  const onPick = async () => {
    try {
      const [picked] = await pickPhotos(1);
      if (picked) {
        setPhoto(picked);
        setTransform(IDENTITY);
      }
    } catch (e) {
      Alert.alert('사진 선택 실패', e instanceof Error ? e.message : String(e));
    }
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

  const removeEditing = () => {
    setOverlays((prev) => prev.filter((o) => o.id !== editingId));
    setEditingId(null);
  };

  const save = async () => {
    if (!photo || saving) return;
    setSaving(true);
    try {
      await createStory.mutateAsync({
        photo,
        crop: { ...transform, canvasWidth, canvasHeight },
        trackId: attachToTrack ? (todayTrack.data?.id ?? null) : null,
        overlays,
      });
      router.dismiss();
    } catch (e) {
      Alert.alert('올리기 실패', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!photo) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Pressable
          onPress={onPick}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <PlusGlyph size={26} color={color.sub} />
          <Meta style={{ marginTop: 8 }}>오늘 한 컷을 골라주세요</Meta>
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={() => router.dismiss()}
          style={{ position: 'absolute', top: insets.top + space[3], left: space[4] }}
        >
          <Text style={{ fontFamily: typeface, fontSize: 22, color: color.white }}>×</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: canvasWidth, height: canvasHeight, borderRadius: radius.cover, overflow: 'hidden' }}>
        <StoryCanvas
          uri={photo.uri}
          photoWidth={photo.width}
          photoHeight={photo.height}
          width={canvasWidth}
          height={canvasHeight}
          onChange={setTransform}
        />
        {/* 편집 중인 글자는 입력 쪽에 떠 있다 — 캔버스에 두 번 그리지 않는다 */}
        <StoryTextEditor
          overlays={overlays.filter((o) => o.id !== editingId && !!o.text)}
          rect={rect}
          onChange={(o) => setOverlays((prev) => prev.map((p) => (p.id === o.id ? o : p)))}
          onEdit={(o) => setEditingId(o.id)}
        />
      </View>

      {!editing && (
        <>
          {/* 상단 — 닫기 / 텍스트 */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + space[2],
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: space[4],
            }}
          >
            <Pressable hitSlop={12} onPress={() => router.dismiss()}>
              <Text style={{ fontFamily: typeface, fontSize: 22, color: color.white }}>×</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable hitSlop={12} onPress={onPick}>
              <Text style={{ fontFamily: typeface, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                사진 바꾸기
              </Text>
            </Pressable>
            <Pressable
              hitSlop={12}
              onPress={addText}
              disabled={overlays.length >= OVERLAY_MAX}
              style={{ marginLeft: space[4], opacity: overlays.length >= OVERLAY_MAX ? 0.4 : 1 }}
            >
              <Text
                style={{ fontFamily: typeface, fontWeight: '900', fontSize: 19, color: color.white }}
              >
                T
              </Text>
            </Pressable>
          </View>

          {/* 하단 — 앨범에 담기 + 올리기 */}
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + space[3],
              left: 0,
              right: 0,
              paddingHorizontal: space[4],
              gap: space[3],
            }}
          >
            {todayTrack.data && (
              <Pressable
                onPress={() => setAttachToTrack((v) => !v)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  alignSelf: 'flex-start',
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
                  style={{
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

            <Pressable
              onPress={save}
              disabled={saving}
              style={({ pressed }) => ({
                height: 52,
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

      {editing && (
        <StoryTextInput
          key={editing.id}
          initial={{ text: editing.text, color: editing.color, size: editing.size }}
          canvasWidth={canvasWidth}
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
