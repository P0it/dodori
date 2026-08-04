import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { usePlaceSearch, useAddTrackPlace, useAddSavedPlaceToTrack, type SearchPlace } from '@/api/places';
import { useAddPlaylistPlace, usePlaylists, useSavedPlaces, useSaveSearchPlace } from '@/api/playlists';
import { useTrack } from '@/api/tracks';
import { PlaceThumb } from '@/components/PlaceThumb';
import { FilterChip } from '@/components/FilterChip';
import { SavedHeart } from '@/components/SavedHeart';
import { PlaylistPickerSheet } from '@/components/playlist/PlaylistPickerSheet';
import { CheckGlyph, PlusGlyph } from '@/components/glyphs';

// Supabase 에러는 Error 인스턴스가 아니라 {code, message, details, hint} 객체라 통째로 찍는다
const describeError = (e: unknown) => {
  if (e && typeof e === 'object' && 'message' in e) {
    const { code, message, details, hint } = e as Record<string, unknown>;
    return [code && `[${code}]`, message, details, hint].filter(Boolean).join(' · ');
  }
  return String(e);
};

/**
 * 장소 검색 — 단일 공용 (§7.4).
 * trackId 파라미터가 있으면 트랙 코스에 담기, playlistId면 테마 플리에 담기(M4).
 */
export default function PlaceSearch() {
  const router = useRouter();
  const { trackId, playlistId } = useLocalSearchParams<{
    trackId?: string;
    playlistId?: string;
  }>();
  // 검색이 기본. 플레이리스트 칩을 고르면 그 플리에 담긴 곳만 보여준다 (값 = playlistId)
  const [tab, setTab] = useState<'search' | string>('search');
  const playlists = usePlaylists();
  const savedPlaces = useSavedPlaces();
  const track = useTrack(trackId);
  const addSaved = useAddSavedPlaceToTrack(trackId ?? '');
  const saveSearch = useSaveSearchPlace();
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());
  // 하트를 누른 장소 — 어느 플레이리스트에 담을지 고르는 동안 들고 있는다
  const [pickerPlace, setPickerPlace] = useState<SearchPlace | null>(null);
  const [query, setQuery] = useState('');
  const search = usePlaceSearch(query);
  const addToTrack = useAddTrackPlace(trackId ?? '');
  const addToPlaylist = useAddPlaylistPlace(playlistId ?? '');
  // 담을 곳 — '완료'를 눌러야 실제로 저장된다(장바구니식). +는 로컬 선택만이고, 뒤로 가면 취소된다.
  // 검색어를 바꿔도 유지되며, 완료 시 재생할 뮤테이션 정보를 항목마다 함께 들고 있는다.
  type Staged = {
    id: string; // naver_id(검색) 또는 placeId(찜) — 담김 표시·중복·토글 키
    name: string;
    payload: { kind: 'search'; place: SearchPlace } | { kind: 'saved'; placeId: string };
  };
  const [staged, setStaged] = useState<Staged[]>([]);
  const [committing, setCommitting] = useState(false);
  // 담기 실패 사유 — Alert는 웹에서 no-op이라 화면에 직접 띄운다
  const [failReason, setFailReason] = useState<string | null>(null);
  const stagedIds = useMemo(() => new Set(staged.map((s) => s.id)), [staged]);
  // 이미 이 날짜 코스에 담긴 찜한 곳 — + 버튼을 눌러도 조용히 실패하지 않도록 미리 added 처리
  const existingPlaceIds = useMemo(
    () => new Set((track.data?.places ?? []).map((p) => p.placeId)),
    [track.data],
  );
  // 코스에 담을 순서 — 검색 탭·찜 탭이 함께 쓴다. 개수나 route param이 아니라 기존 최대 sortOrder + 1 기준.
  // (삭제로 순서에 구멍이 나면 개수 기준은 기존 행과 겹친다)
  // 담은 개수는 더하지 않는다 — 담기 뮤테이션이 코스 리페치까지 기다린 뒤 잠금을 풀므로 maxOrder는 항상 최신이다.
  // 고른 칩(플레이리스트)에 담긴 장소만
  const picked = useMemo(
    () => (savedPlaces.data ?? []).filter((p) => p.playlistId === tab),
    [savedPlaces.data, tab],
  );
  const maxOrder = Math.max(-1, ...(track.data?.places ?? []).map((p) => p.sortOrder));
  const nextSortOrder = maxOrder + 1;

  // 한 번 더 누르면 담기 취소 — 아직 저장 전이라 토글이 안전하다
  const toggleSearch = (p: SearchPlace) => {
    setStaged((list) =>
      list.some((s) => s.id === p.naver_id)
        ? list.filter((s) => s.id !== p.naver_id)
        : [...list, { id: p.naver_id, name: p.name, payload: { kind: 'search', place: p } }],
    );
  };
  const toggleSaved = (p: (typeof picked)[number]) => {
    setStaged((list) =>
      list.some((s) => s.id === p.placeId)
        ? list.filter((s) => s.id !== p.placeId)
        : [...list, { id: p.placeId, name: p.name, payload: { kind: 'saved', placeId: p.placeId } }],
    );
  };

  // '완료' — 담은 항목을 순서대로 실제 저장한다. 코스 순서는 base + 0,1,2… 로 배정.
  const commit = async () => {
    if (staged.length === 0) {
      router.back();
      return;
    }
    setCommitting(true);
    setFailReason(null);
    let order = nextSortOrder;
    const failed: Staged[] = [];
    const reasons: string[] = [];
    for (const s of staged) {
      try {
        if (s.payload.kind === 'search') {
          if (trackId) await addToTrack.mutateAsync({ place: s.payload.place, sortOrder: order++ });
          else if (playlistId) await addToPlaylist.mutateAsync(s.payload.place);
        } else {
          await addSaved.mutateAsync({ placeId: s.payload.placeId, sortOrder: order++ });
        }
      } catch (e) {
        failed.push(s);
        reasons.push(`${s.name}: ${describeError(e)}`);
      }
    }
    setCommitting(false);
    if (failed.length) {
      setFailReason(reasons.join('\n'));
      Alert.alert('일부 담기 실패', reasons.join('\n'));
      setStaged(failed); // 성공분은 이미 저장됨 — 실패한 것만 남겨 다시 시도
    } else {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="장소 담기" />
      {trackId ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}
        >
          <FilterChip selected={tab === 'search'} onPress={() => setTab('search')}>
            검색
          </FilterChip>
          {(playlists.data ?? []).map((p) => (
            <FilterChip key={p.id} selected={tab === p.id} onPress={() => setTab(p.id)}>
              {p.name}
            </FilterChip>
          ))}
        </ScrollView>
      ) : null}
      {tab === 'search' && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="카페, 맛집, 장소 검색"
            placeholderTextColor={color.muted}
            style={{
              height: 44,
              borderRadius: 6,
              backgroundColor: color.surface2,
              paddingHorizontal: 14,
              color: color.white,
              fontSize: 15,
            }}
          />
          <Meta style={{ fontSize: 11, marginTop: 8 }}>
            코스 담기 · 리스트 저장에 함께 쓰는 검색이에요
          </Meta>
        </View>
      )}
      {tab === 'search' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {query.trim().length < 2 ? null : search.isPending ? (
            <ActivityIndicator color={color.accent} style={{ marginTop: 24 }} />
          ) : search.isError ? (
            <Meta style={{ paddingVertical: 16 }}>{String(search.error.message)}</Meta>
          ) : (
            <>
              <Eyebrow style={{ marginVertical: 8 }}>검색 결과</Eyebrow>
              {(search.data ?? []).map((p) => {
                const added = stagedIds.has(p.naver_id);
                return (
                  <View
                    key={p.naver_id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                        {p.name}
                      </Text>
                      <Meta style={{ marginTop: 2, fontSize: 12 }}>
                        {[p.category, p.address].filter(Boolean).join(' · ')}
                      </Meta>
                    </View>
                    <SavedHeart saved={justSaved.has(p.naver_id)} onPress={() => setPickerPlace(p)} />
                    <Pressable
                      disabled={!trackId && !playlistId}
                      onPress={() => toggleSearch(p)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        borderWidth: added ? 0 : 1.5,
                        borderColor: color.sub,
                        backgroundColor: added ? color.accent : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {added ? <CheckGlyph size={16} color={color.bg} /> : <PlusGlyph size={18} color={color.white} />}
                    </Pressable>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
      {tab !== 'search' && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {savedPlaces.isPending ? (
            <ActivityIndicator color={color.accent} style={{ marginTop: 24 }} />
          ) : picked.length === 0 ? (
            <Meta style={{ paddingVertical: 16 }}>
              이 리스트엔 아직 장소가 없어요. 검색에서 마음에 드는 곳을 찜해보세요.
            </Meta>
          ) : (
            picked.map((p) => {
              const added = existingPlaceIds.has(p.placeId) || stagedIds.has(p.placeId);
              return (
                <View
                  key={`${p.playlistId}:${p.placeId}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}
                >
                  <PlaceThumb placeId={p.placeId} name={p.name} thumbUrl={p.photoThumbs[0]} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                      {p.name}
                    </Text>
                    <Meta style={{ marginTop: 2, fontSize: 12 }}>
                      {[p.playlistName, p.category].filter(Boolean).join(' · ')}
                    </Meta>
                  </View>
                  <Pressable
                    disabled={existingPlaceIds.has(p.placeId) || !trackId}
                    onPress={() => toggleSaved(p)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      borderWidth: added ? 0 : 1.5,
                      borderColor: color.sub,
                      backgroundColor: added ? color.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {added ? <CheckGlyph size={16} color={color.bg} /> : <PlusGlyph size={18} color={color.white} />}
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
      <View style={{ padding: 16, paddingBottom: 26 }}>
        {failReason && (
          <Text
            selectable
            style={{ fontFamily: typeface, fontSize: 12, color: color.sunday, marginBottom: 10 }}
          >
            담기 실패 — {failReason}
          </Text>
        )}
        {staged.length > 0 && (
          <Meta numberOfLines={1} style={{ fontSize: 12, marginBottom: 10 }}>
            담을 곳 {staged.length} · {staged.map((s) => s.name).join(', ')}
          </Meta>
        )}
        <Pressable
          disabled={committing}
          onPress={commit}
          style={({ pressed }) => ({
            height: 48,
            borderRadius: 999,
            backgroundColor: color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed || committing ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 14.5, color: color.onPrimary }}>
            {committing ? '담는 중…' : staged.length > 0 ? `${staged.length}곳 담기` : '완료'}
          </Text>
        </Pressable>
      </View>

      <PlaylistPickerSheet
        visible={!!pickerPlace}
        placeName={pickerPlace?.name ?? ''}
        playlists={playlists.data ?? []}
        onClose={() => setPickerPlace(null)}
        onSelect={(playlistId) => {
          const place = pickerPlace!;
          setPickerPlace(null);
          saveSearch.mutate(
            { place, playlistId },
            {
              onSuccess: () => setJustSaved((s) => new Set(s).add(place.naver_id)),
              onError: (e) =>
                Alert.alert('담기 실패', e instanceof Error ? e.message : '리스트에 담지 못했어요.'),
            },
          );
        }}
      />
    </View>
  );
}
