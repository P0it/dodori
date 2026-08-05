import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface, DEFAULT_EVENT_COLOR } from '@/theme/tokens';
import { useCreatePlaylist } from '@/api/playlists';
import { Meta } from '@/components/Meta';
import { PlaylistTile } from '@/components/playlist/PlaylistTile';
import { PlaylistLookFields } from '@/components/playlist/PlaylistLookFields';

/** 새 테마 플레이리스트 (목업 P3) — 이름 + 색·아이콘으로 타일을 꾸민다 */
export default function NewPlaylist() {
  const router = useRouter();
  const create = useCreatePlaylist();
  const [name, setName] = useState('');
  const [colorKey, setColorKey] = useState<string>(DEFAULT_EVENT_COLOR);
  const [icon, setIcon] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim() || create.isPending) return;
    create.mutate(
      { name, color: colorKey, icon },
      {
        onSuccess: (id) => {
          router.dismiss();
          router.push(`/(tabs)/playlist/custom/${id}`);
        },
      },
    );
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
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>가보고 싶은 곳</Text>
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

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        {/* 미리보기 타일 */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <PlaylistTile colorKey={colorKey} icon={icon} name={name || '?'} size={92} radius={14} />
        </View>

        <PlaylistLookFields
          name={name}
          onChangeName={setName}
          colorKey={colorKey}
          onChangeColor={setColorKey}
          icon={icon}
          onChangeIcon={setIcon}
          autoFocus
          onSubmitEditing={submit}
        />

        <Meta style={{ fontSize: 11.5, lineHeight: 19, marginTop: 24, textAlign: 'center' }}>
          리스트는 데이트가 아니라 <Text style={{ fontFamily: typeface, color: color.white }}>장소</Text>를 모아요.{'\n'}
          예: Cafe, 야경 좋은 곳, 다음에 갈 맛집
        </Meta>
      </ScrollView>
    </View>
  );
}
