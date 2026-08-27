import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Photo } from '@/components/Photo';
import { color, typeface, eventColor, toEventColor, DEFAULT_EVENT_COLOR } from '@/theme/tokens';
import { withCoords, boundsOf, naverMapUrl } from '@/lib/map';
import { linkKind } from '@/lib/link';
import {
  usePlaylistDetail,
  useDeletePlaylist,
  useRemovePlaylistPlace,
  useUpdatePlaylist,
  type PlaylistPlaceItem,
} from '@/api/playlists';
import { Meta } from '@/components/Meta';
import { PlaylistIcon } from '@/components/playlist/PlaylistTile';
import { Divider } from '@/components/Divider';
import { PlaylistLookFields } from '@/components/playlist/PlaylistLookFields';
import { CloseGlyph, LinkKindGlyph, NaverMapGlyph } from '@/components/glyphs';
import { PlaceKindTile } from '@/components/PlaceKindTile';
import { PlaceMap, type MapPin, type PlaceMapHandle } from '@/components/map/PlaceMap';
import { confirmDialog } from '@/components/dialog';

// 시트 스냅 — 살짝은 헤더만 남기고 지도를 다 보는 자리, 접힘은 목록 몇 줄, 펼침은 목록을 훑는 자리.
// 살짝은 픽셀 고정 — 손잡이 + 헤더(제목 줄 44 + 장소 수) + 구분선 높이라 화면 비율로 잡으면 기기마다 잘린다
const SNAP = [116, '38%', '88%'];
const COLLAPSED = 1;
const EXPANDED = 2;
// 행 높이 고정 (사진/타일 52 + 상하 패딩 9씩)
const ROW_H = 70;

/** 지도 위에 뜨는 컨트롤 공통 — 밝은 지도 위에서도 읽히게 어두운 불투명 배경 + 그림자 */
const FLOAT = {
  backgroundColor: color.surface1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

/** 장소 행 오른쪽의 작은 아이콘 버튼 (네이버 지도·홈페이지) */
function RowAction({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.surface2,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

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
  /** 이름·색·아이콘 입력을 여는가 (찜은 커플당 하나뿐인 고정 목록이라 열지 않는다) */
  const look = editing && !isSaved;

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

  // 이름표는 그 리스트의 색을 쓴다 — 지도만 봐도 어느 리스트를 보고 있는지 알 수 있게.
  // 수정 중엔 draft를 따라가 색을 고르는 결과가 지도에도 바로 보인다
  const pinColor = eventColor[toEventColor(look ? draft.color : (p?.color ?? null))].fg;

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
        // 행 탭은 화면을 뜨지 않고 지도에서 그 장소를 가리킨다 — 장소 상세로 가는 대신
        // 네이버 지도·홈페이지를 오른쪽 버튼으로 바로 연다
        onPress={() => onPinPress(pl.placeId)}
        // 수정 중엔 행 탭을 막는다 — ×를 겨냥하다 빗나가면 편집이 끊긴다
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
          <Photo url={pl.photoThumbs[0]} style={{ width: 52, height: 52, borderRadius: 8 }} contentFit="cover" />
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
            accessibilityRole="button"
            accessibilityLabel="목록에서 빼기"
            style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseGlyph />
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {/* 네이버 지도는 좌표가 없어도 이름 검색으로 열리므로 항상 보인다 */}
            <RowAction onPress={() => Linking.openURL(naverMapUrl(pl))}>
              <NaverMapGlyph size={18} />
            </RowAction>
            {pl.link ? (
              <RowAction onPress={() => Linking.openURL(pl.link!)}>
                <LinkKindGlyph kind={linkKind(pl.link)} size={18} />
              </RowAction>
            ) : null}
          </View>
        )}
      </Pressable>
    ),
    [editing, selectedId, removePlace, onPinPress],
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {/* 지도 — 화면 전체를 채우고 그 위에 TopBar·시트가 얹힌다 */}
      <View style={{ flex: 1 }}>
        {region ? (
          <PlaceMap
            ref={mapRef}
            region={region}
            pins={pins}
            onPinPress={onPinPress}
            selectedId={selectedId}
            pinColor={pinColor}
            // 핀 아이콘 대신 상호명을 깐다 — 지도만 봐도 어떤 가게들인지 읽힌다
            showNames
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: color.surface1, alignItems: 'center', justifyContent: 'center' }}>
            <Meta>지도에 표시할 장소가 없어요</Meta>
          </View>
        )}
      </View>

      {/* 지도 위엔 뒤로가기 하나만 띄운다 — 리스트명·수정은 시트 헤더가 맡는다.
          기본 TopBar는 배경이 없어 밝은 네이버 지도 위에서 흰 글씨가 사라지므로 불투명 원형 버튼으로.
          수정 중에도 그대로 둔다 — 저장 전에 나가면 이름·색·아이콘 변경은 버려진다 */}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        // top은 safe-area를 더하지 않는다 — app/_layout.tsx가 이미 모든 화면에 paddingTop: insets.top을
        // 주므로 여기 좌표계는 상태바 아래에서 시작한다. 더하면 상태바 높이만큼 이중으로 밀린다
        style={[FLOAT, { position: 'absolute', left: 12, top: 8, width: 40, height: 40, borderRadius: 20 }]}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5l-7 7 7 7" stroke={color.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

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
        {/* 시트 헤더 — 목록과 함께 스크롤되지 않게 FlatList 밖에 고정한다.
            아래 장소 행과 같은 모양(사각 썸네일 + 제목 + 부제 + 우측 액션)이 되지 않도록
            일부러 다르게 짠다: 배경 없는 라인 아이콘 + 큰 제목, 그리고 구분선.
            제목 줄과 장소 수를 위아래로 나눠 목록의 촘촘한 행과 밀도도 다르게 뒀다 */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* 타일이 아니라 아이콘만 — 수정 중엔 draft를 따라가 색·아이콘 선택이 여기 바로 보인다 */}
            <PlaylistIcon name={(look ? draft.icon : (p?.icon ?? null)) ?? 'pin'} color={pinColor} size={22} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: typeface,
                fontWeight: '800',
                fontSize: 21,
                letterSpacing: -0.3,
                color: color.white,
              }}
            >
              {(look ? draft.name : p?.name) || ''}
            </Text>
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
          </View>
          <Meta style={{ marginTop: 2, fontSize: 12.5 }}>장소 {places.length}곳</Meta>
        </View>
        <Divider style={{ marginBottom: 4 }} />

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
              // 여기서만 편집 UI를 열면 장소 빼기(×)·리스트 삭제까지 한 화면에 남는다.
              // 고른 결과의 미리보기는 시트 헤더의 타일이 대신하므로 여기 따로 두지 않는다
              look ? (
                <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
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
              ) : null
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
