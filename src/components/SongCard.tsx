import { useState } from 'react';
import { Linking, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { color, font, radius, space, typeface } from '@/theme/tokens';
import { type Song } from '@/lib/song';
import { Eyebrow } from './Eyebrow';
import { MusicServiceSheet } from './MusicServiceSheet';
import { PauseGlyph, PlayGlyph } from './glyphs';

/**
 * 오늘의 추천곡 — 오늘 탭의 히어로.
 * 30초 미리듣기는 카드가 로컬로 재생한다(기기 I/O). 전곡은 고른 음원 앱으로 넘긴다.
 */
export function SongCard({ song }: { song: Song }) {
  const player = useAudioPlayer({ uri: song.previewUrl });
  const status = useAudioPlayerStatus(player);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  // 자켓은 항상 정사각(비율을 깨지 않는다). 큰 폰에서는 자켓이 커져 히어로답게 보이고,
  // 세로가 짧은 기기에서는 눌려서 추천곡·주제·게임 세 카드가 한 화면에 들어온다.
  const artSize = Math.min(Math.round((width - space[4] * 4) * 0.46), Math.round(height * 0.2), 170);

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
      {/* 전곡 듣기를 라벨 옆으로 — 카드 아래 한 줄을 덜어 주제 카드 자리를 만든다 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>오늘의 추천곡</Eyebrow>
        <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text
            style={{ fontFamily: typeface, fontWeight: '700', fontSize: font.meta, color: color.sub }}
          >
            전곡 듣기 ›
          </Text>
        </Pressable>
      </View>

      {/* 자켓은 왼쪽에 크게, 제목·재생은 오른쪽 — 세로로 쌓으면 카드 하나가 화면을 다 먹는다 */}
      <View style={{ flexDirection: 'row', gap: space[4], marginTop: space[3] }}>
        <Image
          source={{ uri: song.artworkUrl }}
          cachePolicy="memory-disk"
          recyclingKey={song.artworkUrl}
          style={{
            width: artSize,
            height: artSize,
            borderRadius: 12,
            backgroundColor: color.surface2,
          }}
          contentFit="cover"
          transition={200}
        />

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: typeface,
              fontWeight: '800',
              fontSize: font.albumTitle,
              lineHeight: 28,
              letterSpacing: -0.5,
              color: color.white,
            }}
          >
            {song.title}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space[3],
              marginTop: space[2],
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: typeface,
                fontWeight: '600',
                fontSize: font.bodySm,
                color: color.sub,
              }}
            >
              {song.artist}
            </Text>

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
        </View>
      </View>

      <MusicServiceSheet
        visible={pickerOpen}
        song={song}
        onSelect={(service) => {
          setPickerOpen(false);
          Linking.openURL(service.url(song));
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
