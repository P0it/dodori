import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { color, typeface, DEFAULT_EVENT_COLOR } from '@/theme/tokens';
import {
  usePlaylistDetail,
  useDeletePlaylist,
  useRemovePlaylistPlace,
  useUpdatePlaylist,
} from '@/api/playlists';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { PlaylistTile } from '@/components/playlist/PlaylistTile';
import { PlaylistLookFields } from '@/components/playlist/PlaylistLookFields';
import { ChevronGlyph, CloseGlyph } from '@/components/glyphs';
import { PlaceKindTile } from '@/components/PlaceKindTile';
import { confirmDialog } from '@/components/dialog';
import { photoSource } from '@/lib/photoSource';

/** 테마(커스텀) 플레이리스트 상세 (목업 P1) — 데이트가 아니라 장소를 모은다 */
export default function CustomPlaylist() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const detail = usePlaylistDetail(id);
  const removePlace = useRemovePlaylistPlace(id!);
  const delPlaylist = useDeletePlaylist();
  const updatePlaylist = useUpdatePlaylist();

  const p = detail.data;
  // 찜은 커플당 하나뿐이고 다시 만들 수 없다 — 리스트 삭제 진입점만 감춘다(DB 트리거가 최종 방어).
  // 담은 곳 빼기는 찜에서도 돼야 하므로 수정 모드 자체는 막지 않는다
  const isSaved = p?.kind === 'saved';
  // 조회가 기본, "수정"을 눌러야 편집 어포던스(이름·색·아이콘, 장소 ×, 리스트 삭제)가 열린다 — 앨범 상세와 같은 규칙
  const [editing, setEditing] = useState(false);
  // 이름·색·아이콘은 '완료'를 눌러야 저장된다 (장소 ×는 지금도 즉시 반영)
  const [draft, setDraft] = useState({ name: '', color: DEFAULT_EVENT_COLOR as string, icon: null as string | null });

  const startEdit = () => {
    setDraft({ name: p?.name ?? '', color: p?.color ?? DEFAULT_EVENT_COLOR, icon: p?.icon ?? null });
    setEditing(true);
  };

  /** 이름·색·아이콘 입력을 여는가 (찜은 열지 않는다) */
  const look = editing && !isSaved;

  const finishEdit = () => {
    const name = draft.name.trim();
    if (p && !isSaved && name && (name !== p.name || draft.color !== p.color || draft.icon !== p.icon)) {
      updatePlaylist.mutate({ id: id!, name, color: draft.color, icon: draft.icon });
    }
    setEditing(false);
  };

  const onDelete = async () => {
    if (!(await confirmDialog('리스트 삭제', '장소 목록만 삭제되고 기록은 남아요.', '삭제'))) return;
    delPlaylist.mutate(id!, { onSuccess: () => router.back() });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title={editing ? '리스트 수정' : (p?.name ?? '')}
        // 좌측은 수정 중에도 뒤로가기 그대로 — 저장 전에 나가면 이름·색·아이콘 변경은 버려진다
        right={
          // hitSlop으로 키우면 부모(폭 22) 밖으로 나간 영역이 안드로이드에서 잘려 눌리지 않는다.
          // 실제 크기를 44로 준다.
          <Pressable
            onPress={editing ? finishEdit : startEdit}
            style={{ height: 44, justifyContent: 'center', paddingLeft: 12 }}
          >
            <Text
              style={{
                fontFamily: typeface,
                fontWeight: '700',
                fontSize: 14,
                color: editing ? color.accent : color.sub,
              }}
            >
              {editing ? '완료' : '수정'}
            </Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          {/* 수정 중엔 타일이 고르는 대로 바뀌는 미리보기가 된다 */}
          <PlaylistTile
            colorKey={look ? draft.color : (p?.color ?? null)}
            icon={look ? draft.icon : (p?.icon ?? null)}
            name={(look ? draft.name : p?.name) || '?'}
            size={140}
            radius={16}
          />
          {!look && (
            <>
              <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 24, color: color.white, marginTop: 16 }}>
                {p?.name}
              </Text>
              <Meta style={{ marginTop: 6 }}>리스트 · 장소 {p?.places.length ?? 0}곳</Meta>
            </>
          )}
        </View>

        {/* 찜은 이름·꾸밈을 바꾸지 않는다 (커플당 하나뿐인 고정 목록) */}
        {look && (
          <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
            <PlaylistLookFields
              name={draft.name}
              onChangeName={(name) => setDraft((d) => ({ ...d, name }))}
              colorKey={draft.color}
              onChangeColor={(c) => setDraft((d) => ({ ...d, color: c }))}
              icon={draft.icon}
              onChangeIcon={(icon) => setDraft((d) => ({ ...d, icon }))}
              onSubmitEditing={finishEdit}
            />
          </View>
        )}

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {(p?.places ?? []).map((pl) => (
            <Pressable
              key={pl.placeId}
              onPress={() => router.push(`/place/${pl.placeId}`)}
              // 수정 중엔 행 탭으로 화면을 뜨지 않는다 — ×를 겨냥하다 빗나가면 편집이 끊긴다
              disabled={editing}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }}
            >
              {pl.photoThumbs[0] ? (
                <Image
                  source={photoSource(pl.photoThumbs[0])}
                  style={{ width: 52, height: 52, borderRadius: 8 }}
                  contentFit="cover"
                />
              ) : (
                <PlaceKindTile category={pl.category} size={52} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15.5, color: color.white }}>
                  {pl.name}
                </Text>
                <Meta style={{ marginTop: 3, fontSize: 12.5 }}>{pl.category ?? '장소'}</Meta>
              </View>
              {editing ? (
                <Pressable
                  onPress={() => removePlace.mutate(pl.placeId)}
                  style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <CloseGlyph />
                </Pressable>
              ) : (
                <ChevronGlyph size={22} color={color.sub} />
              )}
            </Pressable>
          ))}
          <Pressable
            onPress={() =>
              router.push({ pathname: '/modals/place-search', params: { playlistId: id! } })
            }
            style={({ pressed }) => ({
              marginTop: 10,
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
            <Text style={{ color: color.accent, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>+ 장소 담기</Text>
          </Pressable>

          {/* 리스트 통째로 삭제는 수정 모드 안에서만 — 조회 중엔 지울 방법이 노출되지 않는다 */}
          {editing && !isSaved && (
            <Pressable onPress={onDelete} style={{ height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
              <Text style={{ color: color.danger, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>
                리스트 삭제
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
