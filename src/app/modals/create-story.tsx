import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import {
  color,
  DEFAULT_STORY_TEXT_COLOR,
  radius,
  space,
  tintBg,
  typeface,
} from '@/theme/tokens';
import {
  containedRect,
  createTextOverlay,
  OVERLAY_MAX,
  type TextOverlay,
} from '@/lib/stories';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { PlusGlyph } from '@/components/glyphs';
import { StoryTextEditor } from '@/components/story/StoryTextEditor';
import { TextComposer } from '@/components/story/TextComposer';
import { pickPhotos, type PickedPhoto } from '@/api/photos';
import { useCreateStory } from '@/api/stories';
import { useTodayTrack } from '@/api/tracks';

/** 스토리 올리기 — 사진 1장 + 캡션(선택). 그날 앨범이 있으면 자동으로 거기에도 담긴다 */
export default function CreateStory() {
  const router = useRouter();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  // 그날 앨범에 담을지는 직접 고른다 — 자동으로 붙이지 않는다
  const [attachToTrack, setAttachToTrack] = useState(false);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  /** 텍스트 입력 시트 — 'new'는 새로 넣는 중, TextOverlay면 그걸 고치는 중 */
  const [editing, setEditing] = useState<'new' | TextOverlay | null>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  // 텍스트는 프레임이 아니라 사진에 붙는다 — 사진이 실제로 그려지는 사각형을 기준으로
  const rect = containedRect(photo?.width ?? null, photo?.height ?? null, frame.width, frame.height);

  const createStory = useCreateStory();
  const todayTrack = useTodayTrack();

  const onPick = async () => {
    try {
      const [picked] = await pickPhotos(1);
      if (picked) setPhoto(picked);
    } catch (e) {
      Alert.alert('사진 선택 실패', e instanceof Error ? e.message : String(e));
    }
  };

  const save = async () => {
    if (!photo || saving) return;
    setSaving(true);
    try {
      await createStory.mutateAsync({
        caption,
        photo,
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

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="스토리" />
      <ScrollView contentContainerStyle={{ padding: space[4], gap: space[4] }}>
        <View
          onLayout={(e) => setFrame(e.nativeEvent.layout)}
          style={{
            aspectRatio: 0.8,
            borderRadius: radius.cover,
            overflow: 'hidden',
            backgroundColor: color.surface1,
            borderWidth: photo ? 0 : 1,
            borderColor: color.surface3,
            borderStyle: photo ? 'solid' : 'dashed',
          }}
        >
          <Pressable
            onPress={onPick}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {photo ? (
              // 텍스트가 사진에 붙어야 하므로 편집 화면도 뷰어와 같은 contain으로 본다
              <Image
                source={{ uri: photo.uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            ) : (
              <>
                <PlusGlyph size={26} color={color.sub} />
                <Meta style={{ marginTop: 8 }}>오늘 한 컷을 골라주세요</Meta>
              </>
            )}
          </Pressable>

          {photo && (
            <StoryTextEditor
              overlays={overlays}
              rect={rect}
              onChange={(o) => setOverlays((prev) => prev.map((p) => (p.id === o.id ? o : p)))}
              onEdit={(o) => setEditing(o)}
            />
          )}
        </View>

        {photo && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <Pressable
              onPress={() => setEditing('new')}
              disabled={overlays.length >= OVERLAY_MAX}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingHorizontal: 13,
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: color.surface2,
                opacity: overlays.length >= OVERLAY_MAX ? 0.4 : pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 15, color: color.white }}>
                T
              </Text>
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: color.white }}>
                텍스트
              </Text>
            </Pressable>
            <Meta style={{ flex: 1 }}>
              {overlays.length
                ? '끌어서 옮기고, 오므려서 키우고, 탭하면 고쳐요'
                : '사진을 다시 누르면 바꿔요'}
            </Meta>
          </View>
        )}

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
              backgroundColor: attachToTrack ? tintBg.date : color.surface1,
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
                color: attachToTrack ? color.date : color.sub,
              }}
            >
              {todayTrack.data.title}에도 담기
            </Text>
          </Pressable>
        )}

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="한 줄 남기기 (선택)"
          placeholderTextColor={color.muted}
          style={{
            height: 52,
            borderRadius: radius.field,
            backgroundColor: color.surface2,
            paddingHorizontal: 14,
            fontFamily: typeface,
            fontSize: 15,
            color: color.white,
          }}
        />

        <Pressable
          onPress={save}
          disabled={!photo || saving}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: radius.pill,
            backgroundColor: color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !photo ? 0.4 : pressed || saving ? 0.85 : 1,
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

        <Meta style={{ textAlign: 'center' }}>24시간 뒤엔 링에서 내려가고 보관함에 남아요</Meta>
      </ScrollView>

      {editing && (
        <TextComposer
          initialText={editing === 'new' ? '' : editing.text}
          initialColor={editing === 'new' ? DEFAULT_STORY_TEXT_COLOR : editing.color}
          onCancel={() => setEditing(null)}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  setOverlays((prev) => prev.filter((p) => p.id !== editing.id));
                  setEditing(null);
                }
          }
          onDone={(text, textColor) => {
            const body = text.trim();
            setOverlays((prev) =>
              editing === 'new'
                ? [...prev, createTextOverlay(Crypto.randomUUID(), body, textColor)]
                : prev.map((p) => (p.id === editing.id ? { ...p, text: body, color: textColor } : p)),
            );
            setEditing(null);
          }}
        />
      )}
    </View>
  );
}
