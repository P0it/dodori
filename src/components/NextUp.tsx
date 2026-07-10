import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, role, typeface } from '@/theme/tokens';
import { Eyebrow } from '@/components/Eyebrow';
import { AnnivCover } from '@/components/AnnivCover';

export type NextUpItem =
  | {
      kind: 'track';
      title: string;
      /** "07.11 · D-3" 형태 */
      subtitle: string;
      coverUrl?: string;
      /** 오늘까지 진행률 0~1 (미니플레이어 프로그레스 바) */
      progress: number;
    }
  | {
      kind: 'anniv';
      title: string;
      subtitle: string;
      coverUrl?: string;
      progress: number;
    };

type Props = { item: NextUpItem; onPress?: () => void };

/**
 * "다음 일정" 미니플레이어 바 (목업 NextUp / NowPlayingBar 매핑, PRD §7.6)
 * variant 2종: upcoming track(green) / 기념일(amber)
 */
export function NextUp({ item, onPress }: Props) {
  const isAnniv = item.kind === 'anniv';
  const accent = isAnniv ? role.anniv : role.me;
  const barBg = isAnniv ? '#3A3020' : '#2C2530';
  return (
    <View style={{ paddingHorizontal: 8, paddingBottom: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 6,
          paddingBottom: 4,
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
        <Eyebrow color={accent} style={{ fontSize: 9.5, letterSpacing: 1.2 }}>
          다음 일정
        </Eyebrow>
      </View>
      <Pressable
        onPress={onPress}
        style={{ borderRadius: 3, backgroundColor: barBg, overflow: 'hidden' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 }}>
          {item.coverUrl ? (
            <Image
              source={item.coverUrl}
              style={{ width: 40, height: 40, borderRadius: 7 }}
              contentFit="cover"
            />
          ) : isAnniv ? (
            <AnnivCover size={40} big={item.title} />
          ) : (
            <View
              style={{ width: 40, height: 40, borderRadius: 7, backgroundColor: color.surface3 }}
            />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ color: color.white, fontFamily: typeface, fontWeight: '600', fontSize: 13.5 }}
            >
              {item.title}
            </Text>
            <Text style={{ fontFamily: typeface, color: color.sub, fontSize: 12, marginTop: 2 }}>{item.subtitle}</Text>
          </View>
        </View>
        <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <View
            style={{
              width: `${Math.round(Math.min(1, Math.max(0, item.progress)) * 100)}%`,
              height: 2,
              backgroundColor: color.white,
            }}
          />
        </View>
      </Pressable>
    </View>
  );
}
