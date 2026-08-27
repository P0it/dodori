import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color, space, typeface } from '@/theme/tokens';
import type { LegalDocument } from '@/lib/legal';

/**
 * 약관·방침 원문 렌더러 — 받은 문서를 그대로 그린다.
 *
 * 뒤로 가기를 TopBar에 맡기지 않는 이유: 이 화면은 스토어·카카오 검수에 제출하는 **주소**라
 * 브라우저에서 곧바로 열리는 일이 많고, 그때는 히스토리가 비어 있어 router.back()이
 * 아무 일도 하지 않는다(문서 화면에 갇힌다). 돌아갈 곳이 없으면 앱 첫 화면으로 보낸다.
 */
export function LegalDoc({ doc }: { doc: LegalDocument }) {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: space[4] }}>
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5l-7 7 7 7"
              stroke={color.white}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: 16,
            color: color.white,
          }}
        >
          {doc.title}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space[5],
          paddingBottom: space[8],
          // 웹에서 직접 열면 이 화면이 곧 페이지다 — 본문이 위에 딱 붙지 않게 여백을 준다
          paddingTop: Platform.OS === 'web' ? space[2] : 0,
        }}
      >
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '800',
            fontSize: 24,
            color: color.white,
            marginBottom: space[2],
          }}
        >
          {doc.title}
        </Text>
        <Text style={{ fontFamily: typeface, fontSize: 12, color: color.muted, marginBottom: space[5] }}>
          시행일 {doc.effectiveDate}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 23, color: color.sub, marginBottom: space[6] }}>
          {doc.intro}
        </Text>

        {doc.sections.map((s) => (
          <View key={s.heading} style={{ marginBottom: space[6] }}>
            <Text
              style={{
                fontFamily: typeface,
                fontWeight: '700',
                fontSize: 16,
                color: color.white,
                marginBottom: space[3],
              }}
            >
              {s.heading}
            </Text>
            {s.paragraphs?.map((p) => (
              <Text key={p} style={{ fontSize: 14, lineHeight: 23, color: color.sub, marginBottom: space[3] }}>
                {p}
              </Text>
            ))}
            {s.bullets?.map((b) => (
              <View key={b} style={{ flexDirection: 'row', gap: space[2], marginBottom: space[2] }}>
                <Text style={{ fontSize: 14, lineHeight: 23, color: color.muted }}>·</Text>
                <Text style={{ flex: 1, fontSize: 14, lineHeight: 23, color: color.sub }}>{b}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
