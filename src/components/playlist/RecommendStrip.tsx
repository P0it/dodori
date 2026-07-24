import { Pressable, ScrollView, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { Meta } from '@/components/Meta';

export type RecommendItem = {
  placeId: string;
  name: string;
  category: string | null;
};

/**
 * 다가오는 데이트에 담을 만한 장소 — 가로 스트립. 담기 버튼이 코스에 바로 꽂는다.
 * 썸네일은 없다 — 추천은 안 가본 곳만이라 사진이 있을 수 없고, 생성 자켓 색면만 자리를 먹는다.
 */
export function RecommendStrip({
  items,
  addedIds,
  pendingId,
  onAdd,
}: {
  items: RecommendItem[];
  addedIds: Set<string>;
  /** 담기 요청이 진행 중인 장소 — 연타로 같은 순서·중복 insert가 나가지 않게 그동안 전체 비활성 */
  pendingId?: string | null;
  onAdd: (placeId: string) => void;
}) {
  const busy = pendingId != null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingVertical: 4 }}
    >
      {items.map((p) => {
        const added = addedIds.has(p.placeId);
        return (
          <View
            key={p.placeId}
            style={{
              width: 200,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: 12,
              backgroundColor: color.surface1,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{ fontFamily: typeface, fontWeight: '600', fontSize: 13.5, color: color.white }}
              >
                {p.name}
              </Text>
              <Meta numberOfLines={1} style={{ marginTop: 1, fontSize: 11.5 }}>
                {p.category ?? ' '}
              </Meta>
            </View>
            <Pressable
              disabled={added || busy}
              onPress={() => onAdd(p.placeId)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                height: 30,
                borderRadius: 999,
                backgroundColor: added ? color.surface3 : color.date,
                alignItems: 'center',
                justifyContent: 'center',
                // 담는 중엔 스트립 전체가 잠기므로, 아직 안 담긴 버튼은 흐리게 해서 잠금을 보이게 한다
                opacity: pressed ? 0.85 : busy && !added ? 0.5 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: '700',
                  fontSize: 12.5,
                  color: added ? color.sub : color.onPrimary,
                }}
              >
                {added ? '담김' : pendingId === p.placeId ? '담는 중…' : '담기'}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
