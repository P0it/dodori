import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { color, radius, space, tintBg, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { PlusGlyph } from '@/components/glyphs';
import { pickPhotos, type PickedPhoto } from '@/api/photos';
import { useCreateStory } from '@/api/stories';
import { useTodayTrack } from '@/api/tracks';

/** 스토리 올리기 — 사진 1장 + 캡션(선택). 그날 앨범이 있으면 자동으로 거기에도 담긴다 */
export default function CreateStory() {
  const router = useRouter();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

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
        trackId: todayTrack.data?.id ?? null,
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
        <Pressable
          onPress={onPick}
          style={({ pressed }) => ({
            aspectRatio: 0.8,
            borderRadius: radius.cover,
            overflow: 'hidden',
            backgroundColor: color.surface1,
            borderWidth: photo ? 0 : 1,
            borderColor: color.surface3,
            borderStyle: photo ? 'solid' : 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {photo ? (
            <Image
              source={{ uri: photo.uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <>
              <PlusGlyph size={26} color={color.sub} />
              <Meta style={{ marginTop: 8 }}>오늘 한 컷을 골라주세요</Meta>
            </>
          )}
        </Pressable>
        {photo && <Meta>사진을 다시 누르면 바꿔요</Meta>}

        {todayTrack.data && (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: tintBg.date,
            }}
          >
            <Text
              style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12, color: color.date }}
            >
              {todayTrack.data.title}에 함께 담겨요
            </Text>
          </View>
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
    </View>
  );
}
