import { Pressable, Text, View } from 'react-native';
import { color, radius, role, roleBg, typeface } from '@/theme/tokens';
import { REACTIONS } from '@/lib/posts';
import type { Post } from '@/api/posts';

type Props = {
  reactions: Post['reactions'];
  myUid: string;
  onToggle: (emoji: string, on: boolean) => void;
};

/** 고정 이모지 리액션 — 내가 누른 건 green 링, 상대만 누른 건 pink 링 */
export function ReactionBar({ reactions, myUid, onToggle }: Props) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {REACTIONS.map((emoji) => {
        const userIds = reactions.find((r) => r.emoji === emoji)?.userIds ?? [];
        const mine = userIds.includes(myUid);
        const partnerOnly = !mine && userIds.length > 0;
        const ring = mine ? role.me : partnerOnly ? role.partner : 'transparent';

        return (
          <Pressable
            key={emoji}
            onPress={() => onToggle(emoji, !mine)}
            hitSlop={4}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              height: 30,
              paddingHorizontal: userIds.length > 0 ? 9 : 8,
              borderRadius: radius.pill,
              backgroundColor: mine ? roleBg.me : partnerOnly ? roleBg.partner : color.surface1,
              borderWidth: 1,
              borderColor: ring,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontFamily: typeface, fontSize: 13.5 }}>{emoji}</Text>
            {userIds.length > 0 && (
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '700',
                  fontSize: 11.5,
                  color: mine ? role.me : role.partner,
                }}
              >
                {userIds.length}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
