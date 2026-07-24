import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { useMyProfile, useUpdateProfile } from '@/api/couple';
import { pickAvatar } from '@/api/photos';
import { TopBar } from '@/components/TopBar';
import { Avatar } from '@/components/Avatar';
import { Meta } from '@/components/Meta';

/** 내 프로필 수정 — 닉네임 + 프로필 사진 */
export default function EditProfile() {
  const router = useRouter();
  const profile = useMyProfile();
  const update = useUpdateProfile();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // 원본값으로 1회 프리필
  useEffect(() => {
    if (!seeded && profile.data) {
      setNickname(profile.data.nickname ?? '');
      setAvatar(profile.data.avatar_url ?? null);
      setSeeded(true);
    }
  }, [profile.data, seeded]);

  const onPick = async () => {
    try {
      setUploading(true);
      const url = await pickAvatar();
      if (url) setAvatar(url);
    } catch (e) {
      Alert.alert('사진 변경 실패', e instanceof Error ? e.message : '사진을 바꾸지 못했어요.');
    } finally {
      setUploading(false);
    }
  };

  const onSave = () => {
    const name = nickname.trim();
    if (!name) return;
    update.mutate(
      { nickname: name, avatarUrl: avatar },
      {
        onSuccess: () => router.back(),
        onError: (e) =>
          Alert.alert('저장 실패', e instanceof Error ? e.message : '프로필을 저장하지 못했어요.'),
      },
    );
  };

  const canSave = nickname.trim().length > 0 && !uploading && !update.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="내 프로필" />
      {profile.isPending ? (
        <ActivityIndicator color={color.accent} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 24 }}>
            <Pressable onPress={onPick} disabled={uploading} style={{ alignItems: 'center' }}>
              <View>
                <Avatar url={avatar} name={nickname || '나'} size={96} />
                {uploading && (
                  <View
                    style={{
                      position: 'absolute',
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: '#000000aa',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator color={color.white} />
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '600',
                  fontSize: 13.5,
                  color: color.accent,
                  marginTop: 12,
                }}
              >
                사진 바꾸기
              </Text>
            </Pressable>
          </View>

          <Meta style={{ fontSize: 11, marginBottom: 6 }}>닉네임</Meta>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임"
            placeholderTextColor={color.muted}
            maxLength={20}
            style={{
              height: 48,
              borderRadius: 8,
              backgroundColor: color.surface2,
              paddingHorizontal: 14,
              color: color.white,
              fontSize: 15.5,
              fontFamily: typeface,
            }}
          />

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: 999,
              backgroundColor: color.accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !canSave ? 0.5 : pressed ? 0.85 : 1,
              marginBottom: 26,
            })}
          >
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}>
              {update.isPending ? '저장 중…' : '저장'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
