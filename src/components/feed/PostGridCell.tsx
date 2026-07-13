import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { color, radius, typeface } from '@/theme/tokens';
import { StackGlyph } from '@/components/glyphs';

type Props = {
  thumbUrl: string | null;
  caption: string;
  multiple: boolean;
  onPress: () => void;
};

/** 계정 그리드 셀 — 게시물 첫 사진. 사진이 없으면 캡션, 여러 장이면 겹침 표시 */
export function PostGridCell({ thumbUrl, caption, multiple, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        aspectRatio: 1,
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

      {multiple && (
        <>
          {/* 밝은 사진 위에서도 글리프가 보이도록 상단 스크림 */}
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 34 }}
          />
          <View style={{ position: 'absolute', top: 6, right: 6 }}>
            <StackGlyph size={14} />
          </View>
        </>
      )}
    </Pressable>
  );
}
