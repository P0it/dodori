import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface, eventColor, EVENT_COLOR_KEYS, DEFAULT_EVENT_COLOR } from '@/theme/tokens';
import { useCreatePlaylist } from '@/api/playlists';
import { Meta } from '@/components/Meta';
import { PlaylistTile, PLAYLIST_ICON_KEYS } from '@/components/playlist/PlaylistTile';

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
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>새 리스트</Text>
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

        {/* 색 */}
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: color.sub, marginTop: 26, marginBottom: 12 }}>
          색
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {EVENT_COLOR_KEYS.map((k) => {
            const selected = k === colorKey;
            return (
              <Pressable
                key={k}
                onPress={() => setColorKey(k)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: eventColor[k].fg,
                  borderWidth: 3,
                  borderColor: selected ? color.white : 'transparent',
                }}
              />
            );
          })}
        </View>

        {/* 아이콘 */}
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: color.sub, marginTop: 24, marginBottom: 12 }}>
          아이콘
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PLAYLIST_ICON_KEYS.map((key) => {
            const selected = key === icon;
            return (
              <Pressable
                key={key}
                onPress={() => setIcon(selected ? null : key)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selected ? color.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlaylistTile colorKey={colorKey} icon={key} name="" size={44} radius={10} />
              </Pressable>
            );
          })}
        </View>

        <Meta style={{ fontSize: 11.5, lineHeight: 19, marginTop: 24, textAlign: 'center' }}>
          리스트는 데이트가 아니라 <Text style={{ fontFamily: typeface, color: color.white }}>장소</Text>를 모아요.{'\n'}
          예: Cafe, 야경 좋은 곳, 다음에 갈 맛집
        </Meta>
      </ScrollView>
    </View>
  );
}
