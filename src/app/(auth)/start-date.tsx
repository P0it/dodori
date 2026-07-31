import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color, typeface } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';
import { StarGlyph } from '@/components/glyphs';
import { DatePicker, initialMonth } from '@/components/DatePicker';
import { isISODate, todayKST, weekdayKo } from '@/lib/date';
import { nthDayAnniversary, yearlyAnniversary } from '@/lib/anniversaries';
import { useCompleteSetup } from '@/api/couple';

/** 시작일 입력 (목업 06 StartDate) — 완료 시 기념일 자동 생성 (§7.1). 생일은 설정에서 받는다 */
export default function StartDate() {
  const router = useRouter();
  const complete = useCompleteSetup();
  const [startedAt, setStartedAt] = useState('');
  const [month, setMonth] = useState(() => initialMonth(''));
  const [error, setError] = useState<string | null>(null);

  const validStart = isISODate(startedAt);
  const today = todayKST();

  const preview = useMemo(() => {
    if (!validStart) return [];
    const md = (d: string) => `${d.slice(5, 7)}.${d.slice(8, 10)}`;
    return [
      `100일 · ${md(nthDayAnniversary(startedAt, 100))}`,
      `200일 · ${md(nthDayAnniversary(startedAt, 200))}`,
      `300일 · ${md(nthDayAnniversary(startedAt, 300))}`,
      `1주년 · ${yearlyAnniversary(startedAt, 1).replaceAll('-', '.')}`,
    ];
  }, [startedAt, validStart]);

  const submit = () => {
    if (!validStart || complete.isPending) return;
    setError(null);
    complete.mutate(
      { startedAt },
      {
        // 다음 화면은 가드가 정한다 — 상대가 아직 안 들어왔으면 초대 대기로, 다 됐으면 홈으로
        onSuccess: () => router.replace('/'),
        onError: (e) => setError(e instanceof Error ? e.message : String(e)),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="함께한 시작" onBack={false} />
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={{ fontFamily: typeface, fontWeight: '800', fontSize: 24, color: color.white, letterSpacing: -0.5 }}>
          언제부터{'\n'}함께했나요
        </Text>
        <Meta style={{ marginTop: 8, marginBottom: 18, lineHeight: 20 }}>
          이 날짜로 기념일이 자동으로 만들어져요.{'\n'}생일은 나중에 설정에서 추가할 수 있어요.
        </Meta>

        <Eyebrow style={{ marginBottom: 8 }}>
          {validStart ? `처음 만난 날 · ${startedAt.replaceAll('-', '.')} ${weekdayKo(startedAt)}` : '처음 만난 날'}
        </Eyebrow>
        <DatePicker
          value={startedAt}
          onChange={setStartedAt}
          month={month}
          onMonthChange={setMonth}
          maxDate={today}
        />

        {preview.length > 0 && (
          <View
            style={{
              marginTop: 22,
              padding: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(232,184,75,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(232,184,75,0.20)',
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }}
            >
              <StarGlyph size={15} />
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 13.5, color: color.white }}>
                이런 기념일이 만들어져요
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {preview.map((c) => (
                <Text
                  key={c}
                  style={{
                    fontSize: 11.5,
                    fontFamily: typeface, fontWeight: '600',
                    color: color.anniv,
                    backgroundColor: 'rgba(232,184,75,0.12)',
                    borderRadius: 999,
                    paddingHorizontal: 11,
                    paddingVertical: 5,
                    overflow: 'hidden',
                  }}
                >
                  {c}
                </Text>
              ))}
            </View>
          </View>
        )}

        {error ? (
          <Text style={{ fontFamily: typeface, color: '#E8567A', fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!validStart || complete.isPending}
          style={({ pressed }) => ({
            marginTop: 24,
            height: 52,
            borderRadius: 999,
            backgroundColor: color.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !validStart ? 0.4 : pressed ? 0.85 : 1,
          })}
        >
          {complete.isPending ? (
            <ActivityIndicator color={color.onPrimary} />
          ) : (
            <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.onPrimary }}>
              완료하고 시작하기
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
