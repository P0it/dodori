import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { color, radius, tintBg, typeface } from '@/theme/tokens';

type Props = {
  thumbUrl: string | null;
  caption: string;
  /** 그날 데이트 앨범 제목 — 있으면 앨범 배지 */
  trackTitle: string | null;
  onPress: () => void;
};

/** 보관함 그리드 셀 — 스토리 1장. 데이트날 스토리엔 앨범 배지 */
export function StoryCard({ thumbUrl, caption, trackTitle, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 0.72,
        margin: 1.5,
        borderRadius: radius.mini,
        overflow: 'hidden',
        backgroundColor: color.surface1,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {thumbUrl ? (
        <Image
          source={thumbUrl}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={160}
        />
      ) : (
        <View style={{ flex: 1, padding: 9, justifyContent: 'center' }}>
          <Text
            numberOfLines={4}
            style={{ fontFamily: typeface, fontSize: 11.5, color: color.sub, lineHeight: 16 }}
          >
            {caption}
          </Text>
        </View>
      )}

      {trackTitle && (
        <>
          {/* 밝은 사진 위에서도 배지가 읽히도록 하단 스크림 */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }}
          />
          <View
            style={{
              position: 'absolute',
              left: 5,
              bottom: 5,
              right: 5,
              paddingHorizontal: 6,
              paddingVertical: 2.5,
              borderRadius: radius.pill,
              backgroundColor: tintBg.date,
            }}
          >
            <Text
              numberOfLines={1}
              style={{ fontFamily: typeface, fontWeight: '700', fontSize: 9.5, color: color.date }}
            >
              {trackTitle}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}
