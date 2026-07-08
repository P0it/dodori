/* ============================================================
   Group 5 — Create / input flows
   ============================================================ */
(function () {
const {
  Screen, Eyebrow, Dday, OwnerDot, TopBar, Meta, Divider,
  Icon, PillButton, CoverArt, AnnivCover, C, PHOTO, SANS,
} = window;

function Toggle({ on, tone }) {
  const col = tone === 'partner' ? C.partner : C.me;
  return (
    <div style={{ width: 46, height: 28, borderRadius: 999, background: on ? col : C.s3, position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
    </div>
  );
}

function InputRow({ label, value, placeholder, right, big }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', borderRadius: 12, background: C.s1, marginBottom: 10 }}>
      <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.sub, minWidth: 64 }}>{label}</span>
      <span style={{ flex: 1, fontFamily: SANS, fontWeight: big ? 700 : 600, fontSize: big ? 17 : 15, color: value ? '#fff' : C.muted }}>{value || placeholder}</span>
      {right}
    </div>
  );
}

/* ---------------- 21. Add my event (lightweight) ---------------- */
function AddEvent() {
  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 6px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: C.sub }}>취소</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff' }}>내 일정</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.me }}>저장</span>
      </div>
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <OwnerDot who="me" size={12} />
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: C.me }}>Hyunwoo의 일정</span>
        </div>
        <div style={{ padding: '4px 4px 18px', borderBottom: `1.5px solid ${C.s3}` }}>
          <input readOnly value="야근" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: SANS, fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: '-0.02em' }} />
        </div>
        <div style={{ marginTop: 20 }}>
          <InputRow label="날짜" value="2026.07.09 목" right={<Icon name="IconChevronRight" size={16} style={{ color: C.muted }} />} />
          <InputRow label="시간" value="20:00 – 22:00" right={<Icon name="IconChevronRight" size={16} style={{ color: C.muted }} />} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: C.s1, marginBottom: 10 }}>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.sub, flex: 1 }}>종일</span>
            <Toggle on={false} />
          </div>
        </div>

        <div style={{ marginTop: 8, padding: '16px', borderRadius: 12, background: C.s1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="IconsControlCenterOrientationLock" size={15} style={{ color: '#fff' }} />
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>제목 숨김</span>
              </div>
              <Meta style={{ marginTop: 5, fontSize: 12, lineHeight: 1.5 }}>상대에게 제목 없이 "바쁨"으로만 보여요</Meta>
            </div>
            <Toggle on={false} />
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Meta style={{ fontSize: 11.5 }}>상대 캘린더에 바로 반영돼요</Meta>
        </div>
      </div>
    </Screen>
  );
}

/* ---------------- 22. Create date — pick date ---------------- */
const WK = ['일', '월', '화', '수', '목', '금', '토'];
function MiniMonth({ sel }) {
  const lead = [28, 29, 30];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const cells = [...lead.map((d) => ({ d, out: true })), ...days.map((d) => ({ d, out: false })), { d: 1, out: true }];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {WK.map((w, i) => <div key={w} style={{ textAlign: 'center', fontFamily: SANS, fontSize: 11, fontWeight: 600, color: i === 0 ? C.partner : C.muted, padding: '6px 0' }}>{w}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px 0' }}>
        {cells.map((c, i) => {
          const selected = !c.out && c.d === sel;
          const today = !c.out && c.d === 8;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'center', padding: '5px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 14.5, fontWeight: selected || today ? 700 : 500, background: selected ? C.me : 'transparent', color: c.out ? '#444' : selected ? '#121212' : today ? C.me : '#fff' }}>{c.d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function CreateDate() {
  return (
    <Screen>
      <TopBar title="데이트 만들기" right={<span style={{ fontFamily: SANS, fontSize: 12.5, color: C.sub }}>1/2</span>} />
      <div style={{ padding: '8px 24px 0' }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 23, color: '#fff', letterSpacing: '-0.02em' }}>언제 만날까요?</div>
        <Meta style={{ marginTop: 8 }}>둘 다 비어 있는 날을 골라보세요.</Meta>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 6px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>2026년 7월</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Icon name="ChevronLeft" size={18} style={{ color: C.sub }} />
          <Icon name="ChevronLeft" size={18} style={{ color: C.sub, transform: 'rotate(180deg)' }} />
        </div>
      </div>
      <div style={{ padding: '0 16px' }}><MiniMonth sel={11} /></div>
      <div style={{ padding: '14px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, background: 'rgba(30,215,96,0.10)', border: `1px solid ${C.me}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.me, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 16, color: '#121212' }}>11</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: '#fff' }}>7월 11일 토요일</div>
            <Meta style={{ marginTop: 2, fontSize: 12 }}>둘 다 일정 없음 · 데이트하기 좋은 날</Meta>
          </div>
        </div>
      </div>
      <div style={{ padding: '18px 24px 24px' }}>
        <PillButton variant="primary" style={{ width: '100%' }}>다음 · 장소 담기</PillButton>
      </div>
    </Screen>
  );
}

/* ---------------- 23. Create date — search places ---------------- */
function PlaceResult({ name, cat, area, added, visits }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <window.CalGlyph size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
          <Meta style={{ fontSize: 12 }}>{cat} · {area}</Meta>
          {visits && <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10, color: C.me, background: 'rgba(30,215,96,0.12)', borderRadius: 4, padding: '1px 6px' }}>방문 {visits}회</span>}
        </div>
      </div>
      <button style={{ width: 34, height: 34, borderRadius: '50%', border: added ? 'none' : `1.5px solid ${C.sub}`, background: added ? C.me : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {added ? <Icon name="Album" size={14} style={{ color: '#121212' }} /> : <Icon name="IconsAppsInstagramAdd" size={16} style={{ color: '#fff' }} />}
      </button>
    </div>
  );
}
function CreatePlaces() {
  return (
    <Screen>
      <TopBar title="장소 담기" right={<span style={{ fontFamily: SANS, fontSize: 12.5, color: C.sub }}>2/2</span>} />
      <div style={{ padding: '4px 16px 8px' }}>
        <window.SearchField variant="dark" placeholder="성수 카페, 맛집 검색" />
      </div>
      <div style={{ padding: '4px 20px 4px' }}>
        <Eyebrow style={{ marginBottom: 2 }}>검색 결과 · 성수</Eyebrow>
        <Meta style={{ fontSize: 11, marginTop: 4 }}>코스 담기 · 테마 플레이리스트 저장에 함께 쓰는 검색이에요</Meta>
      </div>
      <div style={{ padding: '4px 20px' }}>
        <PlaceResult name="카페 어니언 성수" cat="카페" area="성수동2가" visits={2} added />
        <PlaceResult name="연무장길 산책" cat="거리" area="성수동" added />
        <PlaceResult name="소문난 감자탕" cat="맛집" area="성수동" added />
        <PlaceResult name="대림창고 갤러리" cat="갤러리" area="성수동" visits={1} />
        <PlaceResult name="블루보틀 성수" cat="카페" area="성수동" />
      </div>
      {/* docked "담은 코스" queue */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 26px', background: 'linear-gradient(to top, #0d0d0d 70%, rgba(13,13,13,0))' }}>
        <div style={{ borderRadius: 14, background: C.s2, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: '#fff' }}>담은 코스 · 3</span>
            <Meta style={{ fontSize: 11.5 }}>드래그로 순서 변경</Meta>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['어니언', '연무장길', '감자탕'].map((n, i) => (
              <div key={n} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: C.s1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, color: C.me }}>{i + 1}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: '#fff', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
        <PillButton variant="primary" style={{ width: '100%', marginTop: 12 }}>완료 · 데이트 만들기</PillButton>
      </div>
    </Screen>
  );
}

/* ---------------- 24. Custom anniversary ---------------- */
function CustomAnniv() {
  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 6px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: C.sub }}>취소</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff' }}>기념일 추가</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.anniv }}>저장</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 8px' }}>
        <AnnivCover size={96} disc />
        <span style={{ fontFamily: SANS, fontSize: 12, color: C.sub, marginTop: 10 }}>커버는 나중에 사진으로 바꿀 수 있어요</span>
      </div>
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ padding: '4px 4px 16px', borderBottom: `1.5px solid ${C.s3}`, marginBottom: 18 }}>
          <input readOnly value="우리 첫 여행" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: SANS, fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: '-0.02em' }} />
        </div>
        <InputRow label="날짜" value="2026.05.24" right={<Icon name="IconChevronRight" size={16} style={{ color: C.muted }} />} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: C.s1, marginBottom: 10 }}>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.sub, flex: 1 }}>매년 반복</span>
          <Toggle on={true} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: C.s1 }}>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.sub, flex: 1 }}>D-7 · D-1 리마인드</span>
          <Toggle on={true} tone="partner" />
        </div>
        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 12, background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.20)' }}>
          <Meta style={{ fontSize: 12.5, lineHeight: 1.5, color: '#e5c98a' }}>저장하면 Singles에 추가되고, 당일 기록하면 하나의 싱글로 발매돼요.</Meta>
        </div>
      </div>
    </Screen>
  );
}

window.SCREENS = window.SCREENS || {};
window.SCREENS.create = {
  title: '5 · 생성 · 입력',
  items: [
    { label: '21 · 내 일정 추가', node: <AddEvent /> },
    { label: '22 · 데이트 생성 — 날짜', node: <CreateDate /> },
    { label: '23 · 데이트 생성 — 장소', node: <CreatePlaces /> },
    { label: '24 · 커스텀 기념일 추가', node: <CustomAnniv /> },
  ],
};
})();
