import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { color, typeface } from '@/theme/tokens';
import { formatDday, isISODate, todayKST, weekdayKo } from '@/lib/date';
import { useAnniversaries, type AnnivItem } from '@/api/anniversaries';
import { useMyCouple } from '@/api/couple';
import { supabase } from '@/api/supabase';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Eyebrow } from '@/components/Eyebrow';
import { Divider } from '@/components/Divider';
import { Dday } from '@/components/Dday';
import { DatePicker, initialMonth } from '@/components/DatePicker';
import { AnnivCover } from '@/components/AnnivCover';

/** 기념일 관리 (목업 26) + 커스텀 기념일 추가 (목업 24) */
export default function AnnivManage() {
  const annivs = useAnniversaries();
  const [adding, setAdding] = useState(false);
  const list = annivs.data ?? [];
  const auto = list.filter((a) => a.type !== 'custom');
  const custom = list.filter((a) => a.type === 'custom');
  const today = todayKST();
  const qc = useQueryClient();

  const removeCustom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('anniversaries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anniversaries'] }),
  });

  const Row = ({ a }: { a: AnnivItem }) => {
    const released = !a.repeatYearly && a.date < today;
    return (
      <Pressable
        onLongPress={
          a.type === 'custom'
            ? () =>
                Alert.alert(a.label, undefined, [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '삭제',
                    style: 'destructive',
                    onPress: () => removeCustom.mutate(a.id),
                  },
                ])
            : undefined
        }
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 }}
      >
        <AnnivCover
          size={44}
          big={a.label.replace(/[^0-9]/g, '') || a.label.slice(0, 1)}
          small={/일$/.test(a.label) && /\d/.test(a.label) ? '일' : undefined}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.white }}>{a.label}</Text>
            {a.type === 'custom' && (
              <Text
                style={{
                  fontSize: 9.5,
                  fontFamily: typeface, fontWeight: '700',
                  color: color.anniv,
                  borderWidth: 1,
                  borderColor: color.anniv,
                  borderRadius: 4,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                커스텀
              </Text>
            )}
          </View>
          <Meta style={{ marginTop: 2, fontSize: 12 }}>
            {a.repeatYearly ? `매년 ${a.date.slice(5).replace('-', '.')}` : a.date.replaceAll('-', '.')}
            {released ? ' · 발매됨' : ''}
          </Meta>
        </View>
        {!released && a.nextDate >= today && <Dday tone="anniv">{formatDday(a.nextDate)}</Dday>}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar
        title="기념일 관리"
        right={
          <Pressable hitSlop={8} onPress={() => setAdding(true)}>
            <Text style={{ fontFamily: typeface, color: color.anniv, fontSize: 22, lineHeight: 24 }}>+</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Eyebrow style={{ marginTop: 4, marginBottom: 4 }}>자동 생성</Eyebrow>
        {auto.map((a) => (
          <Row key={a.id} a={a} />
        ))}
        <Eyebrow style={{ marginTop: 20, marginBottom: 4 }}>커스텀</Eyebrow>
        {custom.map((a) => (
          <Row key={a.id} a={a} />
        ))}
        <Pressable
          onPress={() => setAdding(true)}
          style={({ pressed }) => ({
            marginTop: 10,
            height: 46,
            borderRadius: 10,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(232,184,75,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: color.anniv, fontFamily: typeface, fontWeight: '600', fontSize: 14 }}>+ 기념일 추가</Text>
        </Pressable>
        <Meta style={{ fontSize: 11.5, lineHeight: 19, marginTop: 16 }}>
          자동 기념일은 시작일·생일을 바꾸면 다시 계산돼요. 기록 없이 지나가도 카드는 남아요.
          커스텀 기념일은 길게 눌러 삭제할 수 있어요.
        </Meta>
      </ScrollView>

      {adding && <AddCustomAnniv onClose={() => setAdding(false)} />}
    </View>
  );
}

/** 커스텀 기념일 추가 시트 (목업 24) */
function AddCustomAnniv({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(todayKST());
  const [pickerMonth, setPickerMonth] = useState(() => initialMonth(todayKST()));
  const [picking, setPicking] = useState(false);
  const [repeat, setRepeat] = useState(true);
  const couple = useMyCouple();
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: async () => {
      if (!couple.data) throw new Error('연결이 필요해요');
      const { error } = await supabase.from('anniversaries').insert({
        couple_id: couple.data.coupleId,
        type: 'custom',
        label: label.trim(),
        date,
        repeat_yearly: repeat,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['anniversaries'] });
      onClose();
    },
    onError: (e) => Alert.alert('저장 실패', e instanceof Error ? e.message : String(e)),
  });

  const valid = label.trim().length > 0 && isISODate(date);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: '#1c1c1c',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontFamily: typeface, fontWeight: '600', fontSize: 15, color: color.sub }}>취소</Text>
          </Pressable>
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.white }}>기념일 추가</Text>
          <Pressable onPress={() => valid && add.mutate()} hitSlop={8} disabled={!valid}>
            {add.isPending ? (
              <ActivityIndicator size="small" color={color.anniv} />
            ) : (
              <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: valid ? color.anniv : color.muted }}>
                저장
              </Text>
            )}
          </Pressable>
        </View>

        {/* 날짜 피커를 펼치면 시트가 화면을 넘을 수 있다 — 취소·저장은 위에 붙여두고 내용만 굴린다 */}
        <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
        <TextInput
          value={label}
          onChangeText={setLabel}
          autoFocus
          placeholder="우리 첫 여행"
          placeholderTextColor={color.muted}
          style={{
            fontFamily: typeface, fontWeight: '800',
            fontSize: 24,
            letterSpacing: -0.4,
            color: color.white,
            paddingBottom: 14,
            borderBottomWidth: 1.5,
            borderBottomColor: color.surface3,
          }}
        />
        <Pressable
          onPress={() => setPicking((v) => !v)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderRadius: 12,
            backgroundColor: color.surface1,
            borderWidth: 1,
            borderColor: picking ? color.anniv : 'transparent',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ flex: 1, fontFamily: typeface, fontWeight: '500', fontSize: 14, color: color.sub }}>날짜</Text>
          <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 15, color: color.white }}>
            {date.replaceAll('-', '.')} ({weekdayKo(date)})
          </Text>
        </Pressable>
        {picking && (
          <View style={{ marginTop: 10 }}>
            <DatePicker
              value={date}
              onChange={(d) => {
                setDate(d);
                setPicking(false);
              }}
              month={pickerMonth}
              onMonthChange={setPickerMonth}
            />
          </View>
        )}
        <Pressable
          onPress={() => setRepeat((v) => !v)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderRadius: 12,
            backgroundColor: color.surface1,
          }}
        >
          <Text style={{ flex: 1, fontFamily: typeface, fontWeight: '500', fontSize: 14, color: color.sub }}>매년 반복</Text>
          <View
            style={{
              width: 46,
              height: 28,
              borderRadius: 999,
              backgroundColor: repeat ? color.anniv : color.surface3,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: repeat ? 21 : 3,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: color.white,
              }}
            />
          </View>
        </Pressable>
        <Meta style={{ fontSize: 12, lineHeight: 18, marginTop: 14, color: '#e5c98a' }}>
          저장하면 기념일 목록에 추가되고 캘린더에 표시돼요.
        </Meta>
        </ScrollView>
      </View>
    </Modal>
  );
}
