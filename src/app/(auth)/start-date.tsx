import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { color } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Eyebrow } from '@/components/Eyebrow';
import { Meta } from '@/components/Meta';
import { StarGlyph } from '@/components/glyphs';
import { isISODate } from '@/lib/date';
import { nthDayAnniversary, yearlyAnniversary } from '@/lib/anniversaries';
import { useCompleteSetup } from '@/api/couple';

/** 시작일·생일 입력 (목업 06 StartDate) — 완료 시 기념일 자동 생성 (§7.1) */
export default function StartDate() {
  const router = useRouter();
  const complete = useCompleteSetup();
  const [startedAt, setStartedAt] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validStart = isISODate(startedAt);
  const validBirthday = birthday === '' || isISODate(birthday);

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
    if (!validStart || !validBirthday || complete.isPending) return;
    setError(null);
    complete.mutate(
      { startedAt, myBirthday: birthday || undefined },
      {
        onSuccess: () => router.replace('/(tabs)/playlist'),
        onError: (e) => setError(e instanceof Error ? e.message : String(e)),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="함께한 시작" onBack={false} />
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <Text style={{ fontWeight: '800', fontSize: 24, color: color.white, letterSpacing: -0.5 }}>
          두 사람의 정보를{'\n'}알려주세요
        </Text>
        <Meta style={{ marginTop: 8, marginBottom: 22, lineHeight: 20 }}>
          이 날짜로 기념일이 자동으로 만들어져요.
        </Meta>

        <Eyebrow style={{ marginBottom: 8 }}>처음 만난 날</Eyebrow>
        <DateField value={startedAt} onChange={setStartedAt} placeholder="2026-01-05" />

        <Eyebrow style={{ marginTop: 16, marginBottom: 8 }}>내 생일 (선택)</Eyebrow>
        <DateField value={birthday} onChange={setBirthday} placeholder="1997-03-22" />
        <Meta style={{ fontSize: 11.5, marginTop: 6 }}>
          상대 생일은 상대가 직접 입력하면 기념일에 추가돼요.
        </Meta>

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
              <Text style={{ fontWeight: '700', fontSize: 13.5, color: color.white }}>
                이런 싱글이 만들어져요
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
              {preview.map((c) => (
                <Text
                  key={c}
                  style={{
                    fontSize: 11.5,
                    fontWeight: '600',
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
          <Text style={{ color: '#E8567A', fontSize: 12.5, marginTop: 14, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!validStart || !validBirthday || complete.isPending}
          style={({ pressed }) => ({
            marginTop: 24,
            height: 52,
            borderRadius: 999,
            backgroundColor: color.me,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !validStart || !validBirthday ? 0.4 : pressed ? 0.85 : 1,
          })}
        >
          {complete.isPending ? (
            <ActivityIndicator color={color.onPrimary} />
          ) : (
            <Text style={{ fontWeight: '700', fontSize: 15, color: color.onPrimary }}>
              완료하고 시작하기
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/** YYYY-MM-DD 입력 필드 — 숫자만 받아 하이픈 자동 삽입 */
function DateField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const handle = (t: string) => {
    const digits = t.replace(/\D/g, '').slice(0, 8);
    let out = digits;
    if (digits.length > 6) out = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    else if (digits.length > 4) out = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    onChange(out);
  };
  const complete = value.length === 10;
  const valid = !complete || isISODate(value);
  return (
    <TextInput
      value={value}
      onChangeText={handle}
      keyboardType="number-pad"
      placeholder={placeholder}
      placeholderTextColor={color.muted}
      maxLength={10}
      style={{
        height: 56,
        borderRadius: 12,
        backgroundColor: color.surface1,
        borderWidth: 1.5,
        borderColor: !valid ? '#E8567A' : complete ? color.me : color.surface3,
        color: color.white,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 1,
        textAlign: 'center',
      }}
    />
  );
}
