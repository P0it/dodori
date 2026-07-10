import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, role, typeface } from '@/theme/tokens';
import { isReleased, formatDday } from '@/lib/date';
import { useTrack, useUpdateTrack, useDeleteTrack, useAddNote, type TrackDetail } from '@/api/tracks';
import { pickPhotos, thumbUrl, useUploadPhotos } from '@/api/photos';
import { useRemoveTrackPlace } from '@/api/places';
import { useSession } from '@/api/auth';
import { useCoupleProfiles } from '@/api/couple';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { Divider } from '@/components/Divider';
import { Dday } from '@/components/Dday';
import { OwnerDot } from '@/components/OwnerDot';
import { TrackCover } from '@/components/TrackCover';

/** Track 상세 — released 여부로 플랜/아카이브 모드 파생 (§7.2, 목업 11~13) */
export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const track = useTrack(id);

  if (track.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={role.me} />
      </View>
    );
  }
  if (track.isError || !track.data) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <TopBar title="Track" />
        <Meta style={{ textAlign: 'center', marginTop: 40 }}>불러오지 못했어요</Meta>
      </View>
    );
  }
  return <TrackBody t={track.data} />;
}

function TrackBody({ t }: { t: TrackDetail }) {
  const router = useRouter();
  const released = isReleased(t.date);
  const session = useSession();
  const uid = session.data?.user.id;
  const profiles = useCoupleProfiles();
  const update = useUpdateTrack(t.id);
  const del = useDeleteTrack(t.id);
  const addNote = useAddNote(t.id);
  const upload = useUploadPhotos(t.id);
  const removePlace = useRemoveTrackPlace(t.id);

  const [noteDraft, setNoteDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(t.title);

  const photoPaths = t.photos.map((p) => p.storagePath);
  const nameOf = (userId: string) =>
    userId === uid
      ? profiles.data?.me?.nickname || '나'
      : profiles.data?.partner?.nickname || '상대';

  const onAddPhotos = async () => {
    try {
      const picked = await pickPhotos();
      if (picked.length) {
        await upload.mutateAsync(picked);
      }
    } catch (e) {
      Alert.alert('업로드 실패', e instanceof Error ? e.message : String(e));
    }
  };

  const onDelete = () => {
    Alert.alert('데이트 삭제', '기록과 사진 연결이 함께 삭제돼요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => del.mutate(undefined, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const saveTitle = () => {
    setEditingTitle(false);
    const v = titleDraft.trim();
    if (v && v !== t.title) update.mutate({ title: v });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title={released ? t.title : '계획 중인 데이트'}
        right={
          <Pressable hitSlop={8} onPress={onDelete}>
            <Text style={{ fontFamily: typeface, color: color.sub, fontSize: 18 }}>⋯</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 헤더: 커버 + 제목 + 메타 */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 6 }}>
          <View>
            <TrackCover coverPhotoPath={t.coverPhotoPath} photoPaths={photoPaths} size={168} />
            {!released && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: role.me,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 12,
                }}
              >
                <Dday>{formatDday(t.date)}</Dday>
              </View>
            )}
          </View>
          {editingTitle ? (
            <TextInput
              value={titleDraft}
              onChangeText={setTitleDraft}
              onBlur={saveTitle}
              onSubmitEditing={saveTitle}
              autoFocus
              style={{
                marginTop: 16,
                fontFamily: typeface, fontWeight: '800',
                fontSize: 25,
                color: color.white,
                textAlign: 'center',
                borderBottomWidth: 1,
                borderBottomColor: color.surface3,
                paddingBottom: 4,
                minWidth: 180,
              }}
            />
          ) : (
            <Pressable onPress={() => setEditingTitle(true)} style={{ marginTop: 16 }}>
              <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 25, letterSpacing: -0.5, color: color.white }}>
                {t.title} <Text style={{ fontFamily: typeface, fontSize: 14, color: color.muted }}>✎</Text>
              </Text>
            </Pressable>
          )}
          <Meta style={{ marginTop: 6 }}>
            {t.date.replaceAll('-', '.')}
            {released ? '' : ` · ${formatDday(t.date)}`}
          </Meta>
          {/* Favorites */}
          <Pressable
            onPress={() => update.mutate({ liked: !t.liked })}
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ fontFamily: typeface, fontSize: 18, color: t.liked ? role.me : color.muted }}>
              {t.liked ? '♥' : '♡'}
            </Text>
            <Meta style={{ fontSize: 12 }}>{t.liked ? 'Favorites에 있음' : 'Favorites에 추가'}</Meta>
          </Pressable>
        </View>

        {/* 아카이브: 사진 (목업 12·13) */}
        {released && (
          <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
            >
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>
                사진 <Text style={{ color: color.sub, fontFamily: typeface, fontWeight: '500' }}>{t.photos.length}</Text>
              </Text>
              {t.photos.length > 0 && (
                <Pressable onPress={() => router.push(`/track/${t.id}/gallery`)}>
                  <Text style={{ fontSize: 12.5, color: role.me, fontFamily: typeface, fontWeight: '600' }}>
                    전체 보기
                  </Text>
                </Pressable>
              )}
            </View>
            {t.photos.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 12 }}>
                <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>
                  오늘의 데이트가 발매됐어요
                </Text>
                <Meta style={{ textAlign: 'center', lineHeight: 20 }}>
                  아직 사진이 없어요. 첫 사진을 올리면{'\n'}베스트 컷이 이 트랙의 커버가 돼요.
                </Meta>
              </View>
            ) : (
              <PhotoStrip trackId={t.id} photos={t.photos.slice(0, 6)} total={t.photos.length} />
            )}
            <Pressable
              onPress={onAddPhotos}
              disabled={upload.isPending}
              style={({ pressed }) => ({
                marginTop: 12,
                height: 46,
                borderRadius: 10,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {upload.isPending ? (
                <ActivityIndicator color={role.me} />
              ) : (
                <Text style={{ color: role.me, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>+ 사진 올리기</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* 코스 */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>코스</Text>
            <Meta style={{ fontSize: 12.5 }}>{t.places.length}곳</Meta>
          </View>
          {t.places.map((p) => (
            <View
              key={p.placeId}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
            >
              <View style={{ width: 42, alignItems: 'center' }}>
                <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: released ? role.me : color.white }}>
                  {p.visitTime ? p.visitTime.slice(0, 5) : `${p.sortOrder + 1}`}
                </Text>
              </View>
              <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{p.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Meta style={{ fontSize: 12 }}>{p.category ?? '장소'}</Meta>
                  <OwnerDot who={p.addedBy === uid ? 'me' : 'partner'} size={6} />
                  <Meta style={{ fontSize: 12 }}>{nameOf(p.addedBy)} 추가</Meta>
                </View>
              </View>
              {!released && (
                <Pressable hitSlop={8} onPress={() => removePlace.mutate(p.placeId)}>
                  <Text style={{ fontFamily: typeface, color: color.muted, fontSize: 16 }}>×</Text>
                </Pressable>
              )}
            </View>
          ))}
          {!released && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/modals/place-search',
                  params: { trackId: t.id, next: String(t.places.length) },
                })
              }
              style={({ pressed }) => ({
                marginTop: 8,
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: role.me, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>+ 장소 담기</Text>
            </Pressable>
          )}
        </View>

        {/* 노트 (사전 메모 / 라이너 노트) */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>
            {released ? '라이너 노트' : '사전 메모'}
          </Text>
          {t.notes.map((n) => (
            <View key={n.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}>
              <OwnerDot who={n.authorId === uid ? 'me' : 'partner'} size={10} style={{ marginTop: 4 }} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: typeface, fontWeight: '700',
                    color: n.authorId === uid ? role.me : role.partner,
                  }}
                >
                  {nameOf(n.authorId)}
                </Text>
                <Text style={{ fontFamily: typeface, fontSize: 14, color: '#e5e5e5', lineHeight: 21, marginTop: 3 }}>
                  {n.body}
                </Text>
              </View>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder={released ? '이 날의 기억을 남겨보세요' : '메모 남기기'}
              placeholderTextColor={color.muted}
              multiline
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 100,
                borderRadius: 10,
                backgroundColor: color.surface1,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: color.white,
                fontSize: 14,
              }}
            />
            <Pressable
              disabled={!noteDraft.trim() || addNote.isPending}
              onPress={() =>
                addNote.mutate(noteDraft, { onSuccess: () => setNoteDraft('') })
              }
              style={{
                alignSelf: 'flex-end',
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: noteDraft.trim() ? role.me : color.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: typeface, fontWeight: '700',
                  fontSize: 13,
                  color: noteDraft.trim() ? color.onPrimary : color.muted,
                }}
              >
                남기기
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 메타 푸터 */}
        {released && (
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Divider />
            <Meta style={{ fontSize: 11.5, lineHeight: 19, marginTop: 12 }}>
              발매 {t.date.replaceAll('-', '.')} · 사진 {t.photos.length} · 코스 {t.places.length}곳 ·
              노트 {t.notes.length}
            </Meta>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* 목업 12 사진 스트립 — 3열, 마지막 +N */
function PhotoStrip({
  trackId,
  photos,
  total,
}: {
  trackId: string;
  photos: { id: string; storagePath: string }[];
  total: number;
}) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {photos.map((p, i) => (
        <Pressable
          key={p.id}
          onPress={() => router.push(`/track/${trackId}/gallery`)}
          style={{ width: '32%', aspectRatio: 1, borderRadius: 4, overflow: 'hidden' }}
        >
          <Image
            source={thumbUrl(p.storagePath, 'grid')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {i === photos.length - 1 && total > photos.length && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
                +{total - photos.length}
              </Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

