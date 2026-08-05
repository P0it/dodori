import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { color, typeface, DEFAULT_EVENT_COLOR } from '@/theme/tokens';
import { withCoords, boundsOf } from '@/lib/map';
import {
  usePlaylistDetail,
  useDeletePlaylist,
  useRemovePlaylistPlace,
  useUpdatePlaylist,
  type PlaylistPlaceItem,
} from '@/api/playlists';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { PlaylistTile } from '@/components/playlist/PlaylistTile';
import { PlaylistLookFields } from '@/components/playlist/PlaylistLookFields';
import { ChevronGlyph, CloseGlyph } from '@/components/glyphs';
import { PlaceKindTile } from '@/components/PlaceKindTile';
import { PlaceMap, type MapPin, type PlaceMapHandle } from '@/components/map/PlaceMap';
import { confirmDialog } from '@/components/dialog';

// 시트 스냅 — 접힘은 지도를 넓게 보는 자리, 펼침은 목록을 훑는 자리
const SNAP = ['38%', '88%'];
const COLLAPSED = 0;
const EXPANDED = 1;
// 행 높이 고정 (사진/타일 52 + 상하 패딩 9씩)
const ROW_H = 70;

/**
 * 테마(커스텀)·찜 플레이리스트 상세 — 담은 장소를 지도 핀으로 보여준다 (네이버 지도식).
 * 지도가 화면 전체, 목록은 아래에서 끌어올리는 시트. 핀 탭 ↔ 목록 행이 서로 가리킨다.
 */
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

  const sheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<React.ComponentRef<typeof BottomSheetFlatList>>(null);
  const mapRef = useRef<PlaceMapHandle>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const places = useMemo(() => p?.places ?? [], [p?.places]);

  // 좌표 있는 장소만 핀으로. 순서가 없는 목록이라 번호 라벨도 연결선도 없다
  const pins: MapPin[] = useMemo(
    () =>
      withCoords(places).map((pl) => ({
        placeId: pl.placeId,
        lat: pl.lat,
        lng: pl.lng,
        name: pl.name,
        category: pl.category,
      })),
    [places],
  );
  const region = useMemo(() => boundsOf(pins.map((pin) => ({ lat: pin.lat, lng: pin.lng }))), [pins]);

  // 핀 탭 — 그 핀으로 카메라를 옮기고, 시트를 접어 지도를 넓게 두고, 목록에서 그 행으로 스크롤·강조.
  // 목록 스크롤은 반대로 카메라를 움직이지 않는다 (스크롤마다 지도가 흔들리면 어지럽다)
  const onPinPress = useCallback(
    (placeId: string) => {
      setSelectedId(placeId);
      const pin = pins.find((x) => x.placeId === placeId);
      if (pin) mapRef.current?.focusPin(pin.lat, pin.lng);
      // 수정 중엔 시트를 접지 않는다 — 입력 필드가 가려진다
      if (!editing) sheetRef.current?.snapToIndex(COLLAPSED);
      const index = places.findIndex((pl) => pl.placeId === placeId);
      if (index >= 0) listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
    },
    [places, pins, editing],
  );

  const startEdit = () => {
    setDraft({ name: p?.name ?? '', color: p?.color ?? DEFAULT_EVENT_COLOR, icon: p?.icon ?? null });
    setEditing(true);
    // 편집 중 시트가 내려가 입력 필드가 가려지지 않게 펼쳐 고정한다 (드래그는 아래 enablePanDownToClose·index로 잠근다)
    sheetRef.current?.snapToIndex(EXPANDED);
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

  const renderPlace = useCallback(
    ({ item: pl }: { item: PlaylistPlaceItem }) => (
      <Pressable
        onPress={() => router.push(`/place/${pl.placeId}`)}
        // 수정 중엔 행 탭으로 화면을 뜨지 않는다 — ×를 겨냥하다 빗나가면 편집이 끊긴다
        disabled={editing}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 9,
          paddingHorizontal: 16,
          height: ROW_H,
          backgroundColor: pl.placeId === selectedId ? color.surface2 : 'transparent',
        }}
      >
        {pl.photoThumbs[0] ? (
          <Image source={pl.photoThumbs[0]} style={{ width: 52, height: 52, borderRadius: 8 }} contentFit="cover" />
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
    ),
    [editing, selectedId, removePlace, router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {/* 지도 — 화면 전체를 채우고 그 위에 TopBar·시트가 얹힌다 */}
      <View style={{ flex: 1 }}>
        {region ? (
          <PlaceMap ref={mapRef} region={region} pins={pins} onPinPress={onPinPress} selectedId={selectedId} />
        ) : (
          <View style={{ flex: 1, backgroundColor: color.surface1, alignItems: 'center', justifyContent: 'center' }}>
            <Meta>지도에 표시할 장소가 없어요</Meta>
          </View>
        )}
      </View>

      {/* TopBar는 지도 위 오버레이 — 배경색이 없어 그대로 얹힌다 */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
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
      </View>

      <BottomSheet
        ref={sheetRef}
        index={COLLAPSED}
        snapPoints={SNAP}
        // 수정 중엔 시트를 펼친 자리에 고정 — 드래그로 내려가면 입력 필드가 가려진다
        enableContentPanningGesture={!editing}
        enableHandlePanningGesture={!editing}
        backgroundStyle={{ backgroundColor: color.surface1 }}
        handleIndicatorStyle={{ backgroundColor: color.muted }}
      >
        <BottomSheetFlatList
            ref={listRef}
            data={places}
            keyExtractor={(pl) => pl.placeId}
            renderItem={renderPlace}
            // 헤더 높이가 수정 모드에 따라 달라 getItemLayout으로는 offset을 못 맞춘다.
            // 아직 안 그려진 행으로 스크롤하려다 실패하면 평균 높이로 근사해서 옮긴다
            onScrollToIndexFailed={({ index, averageItemLength }) =>
              listRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: true })
            }
            ListHeaderComponent={
              // 수정 모드(찜 제외)에선 이름·색·아이콘 입력이 목록 위에 함께 스크롤된다 —
              // 여기서만 편집 UI를 열면 장소 빼기(×)·리스트 삭제까지 한 화면에 남는다
              look ? (
                <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
                  {/* 조회 화면에서 큰 타일이 사라졌으므로 고르는 결과는 이 미리보기로 본다 */}
                  <View style={{ alignItems: 'center', paddingBottom: 16 }}>
                    <PlaylistTile
                      colorKey={draft.color}
                      icon={draft.icon}
                      name={draft.name || '?'}
                      size={64}
                      radius={12}
                    />
                  </View>
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
              ) : (
                <Meta style={{ paddingHorizontal: 16, paddingBottom: 8, fontSize: 12.5 }}>
                  장소 {places.length}곳
                </Meta>
              )
            }
            ListFooterComponent={
              // 담기 진입점은 시트 안에만 있다 — 빈 리스트에서도 시트가 뜨는 이유
              <View style={{ paddingHorizontal: 16 }}>
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
                  <Text style={{ color: color.accent, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>
                    + 장소 담기
                  </Text>
                </Pressable>

                {/* 리스트 통째로 삭제는 수정 모드 안에서만 — 조회 중엔 지울 방법이 노출되지 않는다 */}
                {editing && !isSaved && (
                  <Pressable
                    onPress={onDelete}
                    style={{ height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 18 }}
                  >
                    <Text style={{ color: color.danger, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}>
                      리스트 삭제
                    </Text>
                  </Pressable>
                )}
              </View>
            }
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          />
      </BottomSheet>
    </View>
  );
}
