import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { useCreatePlaylist } from '@/api/playlists';
import { Meta } from '@/components/Meta';

/** 새 테마 플레이리스트 (목업 P3) */
export default function NewPlaylist() {
  const router = useRouter();
  const create = useCreatePlaylist();
  const [name, setName] = useState('');

  const submit = () => {
    if (!name.trim() || create.isPending) return;
    create.mutate(name, {
      onSuccess: (id) => {
        router.dismiss();
        router.push(`/(tabs)/playlist/custom/${id}`);
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.sub }}>취소</Text>
        </Pressable>
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>새 플레이리스트</Text>
        <Pressable onPress={submit} hitSlop={8} disabled={!name.trim()}>
          {create.isPending ? (
            <ActivityIndicator size="small" color={color.accent} />
          ) : (
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: name.trim() ? color.accent : color.muted }}>
              만들기
            </Text>
          )}
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 30 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          placeholder="Cafe"
          placeholderTextColor={color.muted}
          onSubmitEditing={submit}
          style={{
            textAlign: 'center',
            fontFamily: typeface, fontWeight: '800',
            fontSize: 26,
            letterSpacing: -0.4,
            color: color.white,
            paddingBottom: 16,
            borderBottomWidth: 1.5,
            borderBottomColor: color.surface3,
          }}
        />
        <Meta style={{ fontSize: 11.5, lineHeight: 19, marginTop: 20, textAlign: 'center' }}>
          테마 플레이리스트는 데이트가 아니라 <Text style={{ fontFamily: typeface, color: color.white }}>장소</Text>를 모아요.{'\n'}
          예: Cafe, 야경 좋은 곳, 다음에 갈 맛집
        </Meta>
        <Meta style={{ fontSize: 11.5, marginTop: 8, textAlign: 'center' }}>
          담은 장소 사진으로 커버가 자동 생성돼요
        </Meta>
      </View>
    </View>
  );
}
