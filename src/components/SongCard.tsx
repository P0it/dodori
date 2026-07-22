import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { color, font, radius, space, typeface } from '@/theme/tokens';
import { youtubeMusicSearchUrl, type Song } from '@/lib/song';
import { Eyebrow } from './Eyebrow';
import { PauseGlyph, PlayGlyph } from './glyphs';

/**
 * 오늘의 추천곡 — 오늘 탭의 히어로.
 * 30초 미리듣기는 카드가 로컬로 재생한다(기기 I/O). 전곡은 유튜브 뮤직으로 넘긴다.
 */
export function SongCard({ song }: { song: Song }) {
  const player = useAudioPlayer({ uri: song.previewUrl });
  const status = useAudioPlayerStatus(player);

  function toggle() {
    if (status.playing) {
      player.pause();
      return;
    }
    player.seekTo(0); // 30초짜리라 항상 처음부터
    player.play();
  }

  return (
    <View
      style={{
        marginTop: space[4],
        borderRadius: 20,
        padding: space[4],
        backgroundColor: color.surface1,
        borderWidth: 1,
        borderColor: color.surface2,
      }}
    >
      <Eyebrow>오늘의 추천곡</Eyebrow>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4], marginTop: space[3] }}>
        <Image
          source={{ uri: song.artworkUrl }}
          style={{ width: 96, height: 96, borderRadius: radius.cover, backgroundColor: color.surface2 }}
          contentFit="cover"
          transition={200}
        />

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: typeface,
              fontWeight: '800',
              fontSize: font.titleMd + 3,
              lineHeight: 24,
              letterSpacing: -0.3,
              color: color.white,
            }}
          >
            {song.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typeface,
              fontWeight: '600',
              fontSize: font.bodySm,
              color: color.sub,
              marginTop: space[1],
            }}
          >
            {song.artist}
          </Text>
        </View>

        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={status.playing ? '미리듣기 정지' : '30초 미리듣기'}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: radius.pill,
            backgroundColor: pressed ? color.greenPress : color.greenCore,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          {status.playing ? <PauseGlyph /> : <PlayGlyph />}
        </Pressable>
      </View>

      <Pressable
        onPress={() => Linking.openURL(youtubeMusicSearchUrl(song.artist, song.title))}
        hitSlop={6}
        style={({ pressed }) => ({ marginTop: space[4], opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: font.meta, color: color.sub }}>
          전곡 듣기 ›
        </Text>
      </Pressable>
    </View>
  );
}
