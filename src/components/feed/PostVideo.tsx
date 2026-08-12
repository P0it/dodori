import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image, type ImageContentFit } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { color, radius } from '@/theme/tokens';
import { PlayGlyph } from '@/components/glyphs';

/**
 * 피드 캐러셀 한 칸의 동영상 — 탭해야 재생한다 (자동재생은 범위 밖).
 *
 * 재생 전에는 포스터만 그린다. 캐러셀에 영상이 여러 개여도 실제로 소스를 여는 건
 * 사용자가 누른 하나뿐이고, 다른 페이지로 넘어가면(`active=false`) 멈춘다.
 */
export function PostVideo({
  posterUrl,
  videoUrl,
  width,
  height,
  contentFit,
  active,
}: {
  posterUrl: string;
  /** 서명이 실패했으면 null — 그때는 포스터만 보여주고 재생 버튼을 감춘다 */
  videoUrl: string | null;
  width: number;
  height: number;
  contentFit: ImageContentFit;
  /** 지금 보이는 캐러셀 페이지인가 — 벗어나면 재생을 멈춘다 */
  active: boolean;
}) {
  const [tapped, setTapped] = useState(false);
  /**
   * 다른 페이지로 넘어가면 소스를 놓는다 — 상태를 되돌리는 대신 파생시킨다.
   * 돌아오면 처음부터 다시 재생된다(15초짜리라 이어보기를 기억할 이유가 없다).
   */
  const playing = tapped && active;

  // useCaching — 한 번 받은 영상은 디스크에 남아 다시 볼 때 통신이 없다
  const player = useVideoPlayer(
    playing && videoUrl ? { uri: videoUrl, useCaching: true } : null,
    (p) => {
      p.loop = true;
      p.play();
    },
  );

  return (
    <Pressable
      onPress={() => videoUrl && setTapped((v) => !v)}
      style={{ width, height, backgroundColor: color.bg }}
    >
      {playing ? (
        <VideoView
          player={player}
          style={{ width, height }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <>
          <Image
            source={{ uri: posterUrl }}
            style={{ width, height }}
            contentFit={contentFit}
            transition={160}
          />
          {videoUrl && (
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radius.pill,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // 가운데 삼각형의 시각 무게를 맞춘다
                  paddingLeft: 3,
                }}
              >
                <PlayGlyph size={26} color={color.white} />
              </View>
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}
