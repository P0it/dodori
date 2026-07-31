import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { useMyProfile, useUpdateProfile } from '@/api/couple';
import { pickAvatarImage, uploadAvatar } from '@/api/photos';
import { TopBar } from '@/components/TopBar';
import { Avatar } from '@/components/Avatar';
import { Meta } from '@/components/Meta';
import { DatePicker, initialMonth } from '@/components/DatePicker';
import { todayKST } from '@/lib/date';

/** 내 프로필 수정 — 닉네임 + 프로필 사진 */
export default function EditProfile() {
  const router = useRouter();
  const profile = useMyProfile();
  const update = useUpdateProfile();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  // 새로 고른 로컬 이미지 uri — 저장할 때만 업로드한다. null이면 사진 변경 없음.
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [birthday, setBirthday] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState(() => initialMonth(''));
  const [pickingBirthday, setPickingBirthday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // 원본값으로 1회 프리필
  useEffect(() => {
    if (!seeded && profile.data) {
      setNickname(profile.data.nickname ?? '');
      setAvatar(profile.data.avatar_url ?? null);
      setBirthday(profile.data.birthday ?? '');
      setBirthdayMonth(initialMonth(profile.data.birthday ?? ''));
      setSeeded(true);
    }
  }, [profile.data, seeded]);

  const onPick = async () => {
    try {
      const uri = await pickAvatarImage();
      if (uri) setPickedUri(uri);
    } catch (e) {
      Alert.alert('사진 변경 실패', e instanceof Error ? e.message : '사진을 바꾸지 못했어요.');
    }
  };

  const onSave = async () => {
    const name = nickname.trim();
    if (!name) return;
    try {
      setSaving(true);
      // 새로 고른 사진이 있을 때만 업로드 → 그 URL을 저장. 없으면 avatar_url은 건드리지 않는다.
      const avatarUrl = pickedUri ? await uploadAvatar(pickedUri) : undefined;
      await update.mutateAsync({ nickname: name, avatarUrl, birthday: birthday || null });
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : '프로필을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = nickname.trim().length > 0 && !saving;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="내 프로필" />
      {profile.isPending ? (
        <ActivityIndicator color={color.accent} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 24 }}>
            <Pressable onPress={onPick} disabled={saving} style={{ alignItems: 'center' }}>
              <Avatar url={pickedUri ?? avatar} name={nickname || '나'} size={96} />
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

          <Meta style={{ fontSize: 11, marginTop: 18, marginBottom: 6 }}>생일</Meta>
          <Pressable
            onPress={() => setPickingBirthday((v) => !v)}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: 8,
              backgroundColor: color.surface2,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: typeface,
                fontSize: 15.5,
                color: birthday ? color.white : color.muted,
              }}
            >
              {birthday ? birthday.replaceAll('-', '.') : '생일을 더하면 기념일에 나타나요'}
            </Text>
            <Text style={{ fontFamily: typeface, fontSize: 13, color: color.sub }}>
              {pickingBirthday ? '닫기' : birthday ? '변경' : '추가'}
            </Text>
          </Pressable>
          {pickingBirthday && (
            <View style={{ marginTop: 10 }}>
              <DatePicker
                value={birthday}
                onChange={setBirthday}
                month={birthdayMonth}
                onMonthChange={setBirthdayMonth}
                maxDate={todayKST()}
              />
            </View>
          )}

          <View style={{ flex: 1, minHeight: 24 }} />

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
              {saving ? '저장 중…' : '저장'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
