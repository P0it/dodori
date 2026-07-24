import { useEffect, useMemo, useRef, useState } from 'react';
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
import { color, typeface } from '@/theme/tokens';
import { isReleased, formatDday, weekdayKo } from '@/lib/date';
import { pinnablePlaces } from '@/lib/map';
import Svg, { Path } from 'react-native-svg';
import {
  useTrack,
  useUpdateTrack,
  useDeleteTrack,
  useAddNote,
  useSetTrackCover,
  type TrackDetail,
  type TrackPlace,
} from '@/api/tracks';
import { pickPhotos, useUploadPhotos } from '@/api/photos';
import { useRemoveTrackPlace, useReorderTrackPlaces } from '@/api/places';
import { DraggableCourseList } from '@/components/track/DraggableCourseList';
import { useSession } from '@/api/auth';
import { useCoupleProfiles } from '@/api/couple';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { Divider } from '@/components/Divider';
import { Dday } from '@/components/Dday';
import { TrackCover } from '@/components/TrackCover';
import { Avatar } from '@/components/Avatar';

/** 코스 한 행의 고정 높이 — 드래그 재정렬(절대배치)이 기준으로 삼는다 */
const COURSE_ROW_H = 62;

/** Track 상세 — released 여부로 플랜/아카이브 모드 파생 (§7.2, 목업 11~13) */
export default function TrackScreen() {
  const { id, addPlaces } = useLocalSearchParams<{ id: string; addPlaces?: string }>();
  const track = useTrack(id);
  const router = useRouter();
  // 만들기 직후엔 장소 담기를 바로 연다 (create-track이 addPlaces=1로 넘긴다). 한 번만.
  const opened = useRef(false);
  useEffect(() => {
    if (addPlaces !== '1' || opened.current) return;
    opened.current = true;
    router.push({ pathname: '/modals/place-search', params: { trackId: id } });
  }, [addPlaces, id, router]);

  if (track.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.accent} />
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
  const upload = useUploadPhotos({ trackId: t.id });
  const removePlace = useRemoveTrackPlace(t.id);
  const reorder = useReorderTrackPlaces(t.id);
  const setCover = useSetTrackCover(t.id);

  const [noteDraft, setNoteDraft] = useState('');
  // 조회가 기본, "수정"을 눌러야 편집 어포던스(커버 ✎·제목 입력·코스 ×·삭제)가 열린다
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(t.title);
  const [reordering, setReordering] = useState(false); // 드래그 중 부모 스크롤 잠금
  // 코스·사진 탭 — 처음 열리는 쪽은 상태가 정한다. 지나간 날은 사진, 다가오는·오늘은 코스
  const [tab, setTab] = useState<'course' | 'photos'>(released ? 'photos' : 'course');

  const placeById = useMemo(() => {
    const m: Record<string, TrackPlace> = {};
    for (const p of t.places) m[p.placeId] = p;
    return m;
  }, [t.places]);

  // 좌표 있는 장소가 하나라도 있어야 지도로 볼 수 있다
  const hasPins = useMemo(() => pinnablePlaces(t.places).length >= 1, [t.places]);

  const photoThumbUrls = t.photos.map((p) => p.thumbUrl);
  const nameOf = (userId: string) =>
    userId === uid
      ? profiles.data?.me?.nickname || '나'
      : profiles.data?.partner?.nickname || '상대';
  const avatarOf = (userId: string) =>
    userId === uid ? profiles.data?.me?.avatar_url ?? null : profiles.data?.partner?.avatar_url ?? null;

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

  const onSetCover = async () => {
    try {
      const picked = await pickPhotos(1);
      if (picked.length) await setCover.mutateAsync(picked[0]);
    } catch (e) {
      Alert.alert('커버 변경 실패', e instanceof Error ? e.message : String(e));
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

  const startEdit = () => {
    setTitleDraft(t.title);
    setEditing(true);
  };

  /** 저장 = 제목 커밋 + 모드 종료. 커버·코스는 고른 즉시 반영되므로 여기서 다시 보내지 않는다 */
  const save = () => {
    const v = titleDraft.trim();
    if (v && v !== t.title) update.mutate({ title: v });
    setEditing(false);
  };

  // 코스 한 행 — 발매(정적)·계획(드래그) 공용. draggable이면 그립(≡) 힌트 표시
  const courseRow = (p: TrackPlace, opts: { dragging?: boolean; draggable?: boolean }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: COURSE_ROW_H,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: opts.dragging ? color.surface2 : 'transparent',
      }}
    >
      <View style={{ width: 42, alignItems: 'center' }}>
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13, color: released ? color.accent : color.white }}>
          {p.visitTime ? p.visitTime.slice(0, 5) : `${p.sortOrder + 1}`}
        </Text>
      </View>
      <View style={{ width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
          {p.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Meta style={{ fontSize: 12 }}>{p.category ?? '장소'}</Meta>
        </View>
      </View>
      {opts.draggable && (
        <Text style={{ fontFamily: typeface, color: color.muted, fontSize: 17, paddingHorizontal: 2 }}>≡</Text>
      )}
      {editing && !released && (
        <Pressable hitSlop={8} onPress={() => removePlace.mutate(p.placeId)}>
          <Text style={{ fontFamily: typeface, color: color.muted, fontSize: 16 }}>×</Text>
        </Pressable>
      )}
    </View>
  );

  // 아카이브: 사진 (목업 12·13) — 발매 전이라도 그날 스토리가 담기면 여기 채워진다
  const photoArchive = (released || t.photos.length > 0) && (
    <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
      >
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>
          사진 <Text style={{ color: color.sub, fontFamily: typeface, fontWeight: '500' }}>{t.photos.length}</Text>
        </Text>
        {t.photos.length > 0 && (
          <Pressable onPress={() => router.push(`/track/${t.id}/gallery`)}>
            <Text style={{ fontSize: 12.5, color: color.accent, fontFamily: typeface, fontWeight: '600' }}>
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
      {/* 수동 사진 추가는 발매 후에만 — 발매 전 앨범은 계획(코스·메모)이 주인공이다 */}
      {released && (
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
            <ActivityIndicator color={color.accent} />
          ) : (
            <Text style={{ color: color.accent, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>+ 사진 올리기</Text>
          )}
        </Pressable>
      )}
    </View>
  );

  const courseSection = (
    <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>코스</Text>
        {hasPins && (
          <Pressable
            onPress={() => router.push(`/track/${t.id}/map`)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M1 6 L1 22 L8 18 L16 22 L23 18 L23 2 L16 6 L8 2 Z"
                stroke={color.accent}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path d="M8 2 L8 18 M16 6 L16 22" stroke={color.accent} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={{ fontSize: 13, color: color.accent, fontFamily: typeface, fontWeight: '700' }}>
              지도로 보기
            </Text>
          </Pressable>
        )}
      </View>
      {/* 순서 바꾸기는 수정 모드에서만 — 조회 중 스크롤하다 코스가 끌려가지 않게 */}
      {released || !editing ? (
        <View style={{ marginTop: 4 }}>
          {t.places.map((p) => (
            <View key={p.placeId}>{courseRow(p, { draggable: false })}</View>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: 4 }}>
          <DraggableCourseList
            ids={t.places.map((p) => p.placeId)}
            rowHeight={COURSE_ROW_H}
            onDragActiveChange={setReordering}
            onReorder={(orderedIds) => reorder.mutate(orderedIds)}
            renderItem={(id, dragging) => {
              const p = placeById[id];
              return p ? courseRow(p, { dragging, draggable: true }) : null;
            }}
          />
        </View>
      )}
      {!released && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/modals/place-search',
              params: { trackId: t.id },
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
          <Text style={{ color: color.accent, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>+ 장소 담기</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title={editing ? '앨범 수정' : released ? t.title : '계획 중인 데이트'}
        left={
          editing ? (
            <Pressable hitSlop={8} onPress={() => setEditing(false)}>
              <Text style={{ fontFamily: typeface, fontSize: 14, color: color.sub }}>취소</Text>
            </Pressable>
          ) : undefined
        }
        right={
          <Pressable hitSlop={8} onPress={editing ? save : startEdit}>
            <Text
              style={{
                fontFamily: typeface,
                fontWeight: '700',
                fontSize: 14,
                color: editing ? color.accent : color.sub,
              }}
            >
              {editing ? '저장' : '수정'}
            </Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} scrollEnabled={!reordering}>
        {/* 헤더: 커버 + 제목 + 메타 */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 6 }}>
          {/* 커버 탭 → 사진 선택 → 커버 지정. 수정 모드에서만 눌린다 */}
          <Pressable onPress={onSetCover} disabled={!editing || setCover.isPending}>
            <TrackCover coverThumbUrl={t.coverThumbUrl} photoThumbUrls={photoThumbUrls} size={168} />
            {/* 경계는 커버 자체의 hairline이 잡는다 — 여기선 D-Day 배지만 얹는다 */}
            {!released && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  paddingBottom: 12,
                }}
              >
                <Dday>{formatDday(t.date)}</Dday>
              </View>
            )}
            {/* 탭 가능 힌트 배지 — 수정 모드에서만 */}
            {editing && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  right: 6,
                  bottom: 6,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: typeface, fontSize: 13, color: color.white }}>✎</Text>
              </View>
            )}
            {setCover.isPending && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 6,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator color={color.accent} />
              </View>
            )}
          </Pressable>
          {editing ? (
            <TextInput
              value={titleDraft}
              onChangeText={setTitleDraft}
              onSubmitEditing={save}
              returnKeyType="done"
              placeholder="앨범 제목"
              placeholderTextColor={color.muted}
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
            <Text
              style={{ marginTop: 16, fontFamily: typeface, fontWeight: '800', fontSize: 25, letterSpacing: -0.5, color: color.white }}
            >
              {t.title}
            </Text>
          )}
          <Meta style={{ marginTop: 6 }}>
            {t.date.replaceAll('-', '.')} ({weekdayKo(t.date)})
            {released ? '' : ` · ${formatDday(t.date)}`}
          </Meta>
        </View>

        {/*
          코스·사진을 탭으로 나눈다 — 둘 다 길면 하나가 다른 하나 밑에 묻히기 때문.
          사진이 아직 없는 계획-only 날은 탭 없이 코스만 (빈 사진 탭을 만들지 않는다).
        */}
        {photoArchive ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 20 }}>
              <TrackTab label="코스" active={tab === 'course'} onPress={() => setTab('course')} />
              <TrackTab label="사진" active={tab === 'photos'} onPress={() => setTab('photos')} />
            </View>
            {tab === 'course' ? courseSection : photoArchive}
          </>
        ) : (
          courseSection
        )}

        {/* 노트 (사전 메모 / 라이너 노트) */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 17, color: color.white }}>
            {released ? '라이너 노트' : '메모'}
          </Text>
          {t.notes.map((n) => (
            <View key={n.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10 }}>
              <Avatar url={avatarOf(n.authorId)} name={nameOf(n.authorId)} size={28} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: typeface, fontWeight: '700',
                    color: color.white,
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
                backgroundColor: noteDraft.trim() ? color.accent : color.surface2,
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
                확인
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 삭제는 수정 모드 안에서만 — 조회 중엔 지울 방법이 노출되지 않는다 */}
        {editing && (
          <View style={{ paddingHorizontal: 20, paddingTop: 28, alignItems: 'center' }}>
            <Pressable hitSlop={8} onPress={onDelete}>
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13.5, color: color.danger }}>
                이 데이트 삭제
              </Text>
            </Pressable>
          </View>
        )}

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

/** 코스·사진 세그먼트 탭 — 활성 쪽만 채워진 pill */
function TrackTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 34,
        paddingHorizontal: 16,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? color.surface2 : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '700',
          fontSize: 14,
          color: active ? color.white : color.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* 목업 12 사진 스트립 — 3열, 마지막 +N */
function PhotoStrip({
  trackId,
  photos,
  total,
}: {
  trackId: string;
  photos: { id: string; thumbUrl: string }[];
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
          <Image source={p.thumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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

