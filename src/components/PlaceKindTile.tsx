import { View } from 'react-native';
import { placeKind, type PlaceKind } from '@/lib/placeKind';
import { color, radius } from '@/theme/tokens';
import {
  BarGlyph,
  CafeGlyph,
  CultureGlyph,
  FoodGlyph,
  NatureGlyph,
  PinGlyph,
  ShoppingGlyph,
  StayGlyph,
} from './glyphs';

/**
 * 장소 종류 타일 — 네이버 분류 원문을 받아 종류 글리프를 담은 둥근 네모로 그린다.
 * 배경은 종류와 무관하게 단색(surface2): 종류별 색을 만들면 일정색·기념일·데이트 색과 섞여
 * 화면에서 색이 무엇을 뜻하는지 못 읽게 된다. 구분은 글리프 모양이 한다.
 */
const GLYPH: Record<PlaceKind, typeof PinGlyph> = {
  food: FoodGlyph,
  cafe: CafeGlyph,
  bar: BarGlyph,
  culture: CultureGlyph,
  nature: NatureGlyph,
  shopping: ShoppingGlyph,
  stay: StayGlyph,
  etc: PinGlyph,
};

export function PlaceKindTile({ category, size = 36 }: { category: string | null; size?: number }) {
  const Glyph = GLYPH[placeKind(category)];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.field,
        backgroundColor: color.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Glyph size={Math.round(size * 0.56)} color={color.sub} />
    </View>
  );
}
