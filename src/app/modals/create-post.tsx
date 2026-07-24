import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { color, radius, space, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { PlusGlyph } from '@/components/glyphs';
import { pickPhotos, type PickedPhoto } from '@/api/photos';
import { useCreatePost } from '@/api/posts';

/** 게시물 작성 — 사진 선택 + 캡션 */
export default function CreatePost() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const createPost = useCreatePost();

  const onPick = async () => {
    try {
      const picked = await pickPhotos(10);
      if (picked.length) setPhotos((prev) => [...prev, ...picked].slice(0, 10));
    } catch (e) {
      Alert.alert('사진 선택 실패', e instanceof Error ? e.message : String(e));
    }
  };

  const canSave = photos.length > 0 || caption.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await createPost.mutateAsync({ caption, photos });
      router.dismiss();
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="새 피드" />
      <ScrollView contentContainerStyle={{ padding: space[4], gap: space[4] }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {photos.map((p) => (
            <View key={p.uri}>
              <Image
                source={{ uri: p.uri }}
                style={{ width: 88, height: 88, borderRadius: radius.coverSm }}
                contentFit="cover"
              />
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
        <Meta>사진 {photos.length}/10 · ×를 누르면 빼요</Meta>

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
      </ScrollView>
    </View>
  );
}
