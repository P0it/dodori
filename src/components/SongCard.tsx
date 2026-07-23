import { Linking, Pressable, Text, useWindowDimensions, View } from 'react-native';
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
  const { width, height } = useWindowDimensions();
  // 세로가 짧은 기기에서도 주제 카드가 접히지 않게 화면 높이로도 한 번 더 제한
  const posterSize = Math.min(width - space[4] * 4, height * 0.32); // 화면 gutter + 카드 padding

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

      {/* 포스터가 주인공이되 주제 카드까지 한 화면에 들어오는 크기 (스포티파이 Now Playing) */}
      <Image
        source={{ uri: song.artworkUrl }}
        style={{
          width: posterSize,
          height: posterSize,
          alignSelf: 'center',
          borderRadius: 12,
          backgroundColor: color.surface2,
          marginTop: space[3],
        }}
        contentFit="cover"
        transition={200}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4], marginTop: space[4] }}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: typeface,
              fontWeight: '800',
              fontSize: font.section,
              lineHeight: 30,
              letterSpacing: -0.5,
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
              fontSize: font.body,
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
            width: 60,
            height: 60,
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
        style={({ pressed }) => ({ marginTop: space[3], opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: font.meta, color: color.sub }}>
          전곡 듣기 ›
        </Text>
      </Pressable>
    </View>
  );
}
