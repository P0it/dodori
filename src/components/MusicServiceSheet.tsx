import { Modal, Pressable, Text, View } from 'react-native';
import { color, font, radius, space, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';
import { MusicServiceIcon } from '@/components/glyphs';
import { MUSIC_SERVICES, type MusicService, type Song } from '@/lib/song';

/**
 * 전곡을 어느 음원 앱에서 들을지 고르는 바텀시트 — 표현만 한다(props-only).
 * 기억하지 않는다: 매번 물어보는 대신 저장·설정 화면이 없다.
 */
export function MusicServiceSheet({
  visible,
  song,
  onSelect,
  onClose,
}: {
  visible: boolean;
  song: Song;
  onSelect: (service: MusicService) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: color.surface1,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingTop: space[5],
          paddingBottom: space[8],
        }}
      >
        <View style={{ paddingHorizontal: space[5] }}>
          <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: font.titleMd, color: color.white }}>
            어디서 들을까요?
          </Text>
          <Meta style={{ marginTop: space[1], fontSize: font.caption }} numberOfLines={1}>
            {song.artist} — {song.title}
          </Meta>
        </View>

        <View style={{ paddingHorizontal: space[3], paddingTop: space[3] }}>
          {MUSIC_SERVICES.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => onSelect(service)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space[3],
                paddingVertical: space[3],
                paddingHorizontal: space[2],
                borderRadius: 10,
                backgroundColor: pressed ? color.surface2 : 'transparent',
              })}
            >
              <MusicServiceIcon id={service.id} size={28} />
              <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: font.body, color: color.white }}>
                {service.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
