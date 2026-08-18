import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { color, typeface } from '@/theme/tokens';
import { useTrack, useUpdateTrack } from '@/api/tracks';
import { useDeletePhotos } from '@/api/photos';
import { useSession } from '@/api/auth';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { alertDialog, confirmDialog } from '@/components/dialog';
import { Photo } from '@/components/Photo';

/**
 * 사진 전체 갤러리 (목업 15).
 *
 * 조회가 기본 — 탭하면 큰 사진으로 본다. "수정"을 눌러야 선택이 열리고,
 * 고른 사진을 지우거나(내 사진만) 한 장일 때 커버로 지정한다. 앨범 상세와 같은 관례다.
 * `edit=1`로 들어오면 수정 모드로 열린다 (앨범 상세의 '우리 사진에서 고르기').
 */
export default function Gallery() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const router = useRouter();
  const track = useTrack(id);
  const update = useUpdateTrack(id!);
  const delPhotos = useDeletePhotos(id!);
  const session = useSession();
  const uid = session.data?.user.id;

  const [editing, setEditing] = useState(edit === '1');
  const [selected, setSelected] = useState<string[]>([]);

  const photos = track.data?.photos ?? [];
  // 스토리에서 흘러온 사진은 앨범이 빌려 보여줄 뿐 — 커버 지정·삭제는 스토리 뷰어에서
  const selectable = (p: (typeof photos)[number]) => !p.storyId;
  const picked = photos.filter((p) => selected.includes(p.id));
  const mine = picked.length > 0 && picked.every((p) => p.uploaderId === uid);
  const coverPicked = picked.length === 1 && track.data?.coverPhotoId === picked[0].id;

  const leaveEdit = () => {
    setEditing(false);
    setSelected([]);
  };

  const onPress = (p: (typeof photos)[number], index: number) => {
    if (!editing) {
      router.push({
        pathname: '/track/[id]/viewer',
        params: { id: String(id), start: String(index) },
      });
      return;
    }
    setSelected((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]));
  };

  const onSetCover = () => {
    update.mutate({ coverPhotoId: coverPicked ? null : picked[0].id });
    leaveEdit();
  };

  const onDelete = async () => {
    const label = picked.length === 1 ? '사진을 삭제할까요?' : `사진 ${picked.length}장을 삭제할까요?`;
    if (!(await confirmDialog(label, '되돌릴 수 없어요.', '삭제'))) return;
    delPhotos.mutate(picked, {
      onSuccess: leaveEdit,
      onError: (e) => alertDialog('삭제 실패', e instanceof Error ? e.message : String(e)),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title={editing ? '사진 고르기' : (track.data?.title ?? '갤러리')}
        left={
          editing ? (
            <Pressable hitSlop={8} onPress={leaveEdit}>
              <Text style={{ fontFamily: typeface, fontSize: 14, color: color.sub }}>취소</Text>
            </Pressable>
          ) : undefined
        }
        right={
          !editing && photos.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => setEditing(true)}>
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 14, color: color.accent }}>
                수정
              </Text>
            </Pressable>
          ) : undefined
        }
      />
      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Meta style={{ fontSize: 12.5 }}>
          {editing
            ? selected.length
              ? `${selected.length}장 선택`
              : '지우거나 커버로 쓸 사진을 고르세요'
            : `사진 ${photos.length} · 탭하면 크게 보기`}
        </Meta>
      </View>
      <FlashList
        data={photos}
        numColumns={3}
        keyExtractor={(p) => p.id}
        extraData={[editing, selected]}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
        renderItem={({ item: p, index }) => {
          const dim = editing && !selectable(p);
          const on = selected.includes(p.id);
          return (
            <Pressable
              onPress={() => onPress(p, index)}
              disabled={dim}
              style={{
                flex: 1,
                aspectRatio: 1,
                margin: 2,
                borderRadius: 3,
                overflow: 'hidden',
                opacity: dim ? 0.35 : 1,
              }}
            >
              <Photo url={p.thumbUrl} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              {track.data?.coverPhotoId === p.id && (
                <View
                  style={{
                    position: 'absolute',
                    left: 5,
                    top: 5,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                  }}
                >
                  <Text style={{ fontSize: 8.5, fontFamily: typeface, fontWeight: '700', color: color.accent }}>
                    커버
                  </Text>
                </View>
              )}
              {/* 선택 표시는 체크 동그라미 — 어둡게만 덮으면 어느 쪽이 골라진 건지 안 읽힌다 */}
              {editing && !dim && (
                <>
                  {on && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                      }}
                    />
                  )}
                  <View
                    style={{
                      position: 'absolute',
                      right: 5,
                      bottom: 5,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: on ? color.accent : 'rgba(255,255,255,0.7)',
                      backgroundColor: on ? color.accent : 'rgba(0,0,0,0.25)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on && (
                      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 11, color: color.bg }}>
                        ✓
                      </Text>
                    )}
                  </View>
                </>
              )}
            </Pressable>
          );
        }}
      />
      {/* 액션 바 — 고른 게 있을 때만. 커버는 한 장일 때만 뜻이 있고, 삭제는 내가 올린 사진만 */}
      {editing && picked.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 28,
            borderTopWidth: 1,
            borderTopColor: color.hairline,
            backgroundColor: color.bg,
          }}
        >
          {picked.length === 1 && (
            <ActionButton
              label={coverPicked ? '커버 해제' : '커버로 지정'}
              onPress={onSetCover}
              disabled={update.isPending}
            />
          )}
          {mine && (
            <ActionButton label="삭제" destructive onPress={onDelete} disabled={delPhotos.isPending} />
          )}
        </View>
      )}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  destructive,
  disabled,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flex: 1,
        height: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: destructive ? color.danger : 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed || disabled ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: typeface,
          fontWeight: '600',
          fontSize: 13.5,
          color: destructive ? color.danger : color.accent,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
