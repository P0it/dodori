import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color } from '@/theme/tokens';
import { DuetMark } from '@/components/DuetMark';
import { Meta } from '@/components/Meta';

/** 커플 연결 선택 (목업 02 ConnectChoice + §6.1 코드 입력 분기) */
export default function Connect() {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg, paddingHorizontal: 28 }}>
      <View style={{ paddingTop: 40 }}>
        <DuetMark size={30} showWord />
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text
          style={{
            fontWeight: '800',
            fontSize: 27,
            letterSpacing: -0.5,
            color: color.white,
            lineHeight: 36,
          }}
        >
          둘이 연결되어야{'\n'}시작할 수 있어요
        </Text>
        <Meta style={{ marginTop: 12, lineHeight: 22, fontSize: 14 }}>
          상대와 연결하면 서로의 일정을 공유하고 함께 데이트를 기록할 수 있어요. 연결 전에는
          기능이 잠겨 있어요.
        </Meta>
        <View style={{ gap: 14, marginTop: 32 }}>
          <ChoiceCard
            active
            title="초대 코드 보내기"
            sub="코드를 만들어 상대에게 카톡으로 보내요"
            href="/(auth)/send-invite"
          />
          <ChoiceCard
            title="초대 코드가 있어요"
            sub="받은 코드로 상대와 연결해요"
            href="/(auth)/code-entry"
          />
        </View>
      </View>
      <View style={{ height: 30 }} />
    </View>
  );
}

function ChoiceCard({
  title,
  sub,
  href,
  active,
}: {
  title: string;
  sub: string;
  href: Href;
  active?: boolean;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 18,
        borderRadius: 16,
        backgroundColor: active ? 'rgba(30,215,96,0.10)' : color.surface1,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? color.me : 'rgba(255,255,255,0.06)',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: active ? color.me : color.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d={active ? 'M12 5v14M5 12h14' : 'M4 12h16M13 5l7 7-7 7'}
            stroke={active ? color.bg : color.white}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: color.white }}>{title}</Text>
        <Meta style={{ marginTop: 3, fontSize: 12.5 }}>{sub}</Meta>
      </View>
    </Pressable>
  );
}
