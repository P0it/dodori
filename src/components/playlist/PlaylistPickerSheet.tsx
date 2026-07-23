import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';

export interface PickerPlaylist {
  id: string;
  name: string;
  placeCount: number;
}

/**
 * 장소를 어느 플레이리스트에 담을지 고르는 바텀시트 — 표현만 한다(props-only).
 * 기본 플레이리스트("찜")도 목록의 한 줄일 뿐, 특별 취급하지 않는다.
 */
export function PlaylistPickerSheet({
  visible,
  placeName,
  playlists,
  onSelect,
  onClose,
}: {
  visible: boolean;
  placeName: string;
  playlists: PickerPlaylist[];
  onSelect: (playlistId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: color.surface1,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingTop: 18,
          paddingBottom: 28,
        }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 18, color: color.white }}>
            어느 플레이리스트에 담을까요?
          </Text>
          <Meta style={{ marginTop: 4, fontSize: 12.5 }} numberOfLines={1}>
            {placeName}
          </Meta>
        </View>

        <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}>
          {playlists.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => onSelect(p.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 10,
                backgroundColor: pressed ? color.surface2 : 'transparent',
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: color.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: color.sub, fontFamily: typeface, fontWeight: '700' }}>
                  {p.name.slice(0, 1)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>
                  {p.name}
                </Text>
                <Meta style={{ marginTop: 2, fontSize: 12 }}>장소 {p.placeCount}곳</Meta>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
