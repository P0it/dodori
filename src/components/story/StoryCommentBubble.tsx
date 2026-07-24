import { Pressable, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';

type Props = {
  name: string;
  avatarUrl: string | null;
  body: string;
  /** 내가 쓴 말풍선은 오른쪽에 붙는다 — 사람은 색이 아니라 자리와 이름으로 구분한다 */
  mine: boolean;
  /** 내 것이면 길게 눌러 지운다 */
  onLongPress?: () => void;
};

/** 스토리 답장 한 줄 — 사진 위에 얹히므로 반투명 검정 바탕 */
export function StoryCommentBubble({ name, avatarUrl, body, mine, onLongPress }: Props) {
  return (
    <Pressable
      onLongPress={onLongPress}
      disabled={!onLongPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 7,
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        opacity: pressed && onLongPress ? 0.8 : 1,
      })}
    >
      {!mine && <Avatar url={avatarUrl} name={name} size={22} />}
      <View
        style={{
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderRadius: 15,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
        }}
      >
        {!mine && (
          <Text
            style={{ fontFamily: typeface, fontWeight: '700', fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }}
          >
            {name}
          </Text>
        )}
        <Text style={{ fontFamily: typeface, fontSize: 13.5, lineHeight: 19, color: color.white }}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}
