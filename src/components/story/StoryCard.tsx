import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, radius, typeface } from '@/theme/tokens';
import { photoSource } from '@/lib/photoSource';

type Props = {
  thumbUrl: string | null;
  caption: string;
  onPress: () => void;
};

/** 보관함 그리드 셀 — 스토리 1장 */
export function StoryCard({ thumbUrl, caption, onPress }: Props) {
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
          source={photoSource(thumbUrl)}
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
    </Pressable>
  );
}
