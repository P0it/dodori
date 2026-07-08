/* ============================================================
   Group 4 — Calendar (월간) · top priority
   ============================================================ */
(function () {
const {
  Screen, Eyebrow, Dday, OwnerDot, AppChrome, TopBar, Meta, Divider,
  Icon, PillButton, FilterChip, CoverArt, AnnivCover, C, PHOTO, SANS,
} = window;

/* ----- month model: July 2026 (1st = Wednesday) ----- */
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
function julyCells() {
  const lead = [{ d: 28, mo: 0 }, { d: 29, mo: 0 }, { d: 30, mo: 0 }]; // Jun tail
  const days = [];
  for (let i = 1; i <= 31; i++) days.push({ d: i, mo: 1 });
  const tail = [{ d: 1, mo: 2 }]; // Aug head
  return [...lead, ...days, ...tail];
}

/* marks keyed by July day number */
const MARKS = {
  1:  { track: 'released', photo: PHOTO.river },
  4:  { track: 'released', photo: PHOTO.seongsu1 },
  8:  { today: true },
  9:  { owners: ['me'] },
  10: { owners: ['partner'] },
  11: { track: 'upcoming', photo: PHOTO.cafe, owners: ['me'] },
  15: { owners: ['me'] },
  16: { busy: true },
  17: { busy: true },
  23: { anniv: '200일' },
};

const CELL_W = (375 - 24) / 7;

function DayCell({ cell, filter }) {
  const inMonth = cell.mo === 1;
  const m = inMonth ? (MARKS[cell.d] || {}) : {};
  const showOwners = (m.owners || []).filter((o) => filter === 'us' || filter === o);
  const showBusy = m.busy && (filter === 'us' || filter === 'partner');
  const releasedThumb = m.track === 'released';
  const base = {
    position: 'relative', height: 62, borderRadius: 7, overflow: 'hidden',
    display: 'flex', flexDirection: 'column', padding: 5,
    background: releasedThumb ? 'transparent' : 'transparent',
  };
  return (
    <div style={base}>
      {releasedThumb && (
        <>
          <img src={m.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.05))', borderRadius: 7 }} />
        </>
      )}
      {m.track === 'upcoming' && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 7, border: `1.5px dashed ${C.me}`, background: 'rgba(30,215,96,0.06)' }} />
      )}
      {/* date number */}
      <div style={{
        position: 'relative', zIndex: 1, alignSelf: 'flex-start',
        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', fontFamily: SANS, fontSize: 12.5,
        fontWeight: m.today || m.anniv ? 700 : 500,
        color: !inMonth ? '#4a4a4a' : m.anniv ? C.anniv : '#fff',
        background: m.today ? C.me : 'transparent',
        outline: m.today ? 'none' : 'none',
      }}>
        <span style={{ color: m.today ? '#121212' : undefined }}>{cell.d}</span>
      </div>

      {/* bottom markers */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {m.anniv && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill={C.anniv}><path d="M6 0l1.6 3.7 4 .35-3 2.65.9 3.9L6 8.5 2.5 10.6l.9-3.9-3-2.65 4-.35z" /></svg>
            <span style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 700, color: C.anniv }}>싱글</span>
          </div>
        )}
        {m.track === 'upcoming' && (
          <span style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 700, color: C.me }}>예정</span>
        )}
        {releasedThumb && (
          <span style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>데이트</span>
        )}
        {showBusy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: `repeating-linear-gradient(45deg, ${C.partner}, ${C.partner} 3px, transparent 3px, transparent 6px)`, opacity: 0.85 }} />
          </div>
        )}
        {showOwners.length > 0 && !showBusy && (
          <div style={{ display: 'flex', gap: 3 }}>
            {showOwners.map((o, i) => <OwnerDot key={i} who={o} size={7} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function MonthGrid({ filter = 'us' }) {
  const cells = julyCells();
  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {WEEK.map((w, i) => (
          <div key={w} style={{ textAlign: 'center', padding: '6px 0 8px', fontFamily: SANS, fontSize: 11, fontWeight: 600, color: i === 0 ? C.partner : i === 6 ? '#8fb4ff' : C.muted }}>{w}</div>
        ))}
        {cells.map((c, i) => <DayCell key={i} cell={c} filter={filter} />)}
      </div>
    </div>
  );
}

function CalHeader({ month = '7', year = '2026', filter, setFilter }) {
  return (
    <div style={{ padding: '4px 16px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: '#fff' }}>{month}월</span>
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: C.sub }}>{year}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button style={btn}><Icon name="ChevronLeft" size={18} style={{ display: 'block', color: C.sub }} /></button>
          <button style={{ ...btn, padding: '0 12px', width: 'auto', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: '#fff' }}>오늘</button>
          <button style={btn}><Icon name="ChevronLeft" size={18} style={{ display: 'block', color: C.sub, transform: 'rotate(180deg)' }} /></button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['us', '우리'], ['me', 'Hyunwoo'], ['partner', 'Jihyun']].map(([id, label]) => (
          <FilterChip key={id} selected={filter === id}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {id !== 'us' && <OwnerDot who={id} size={7} />}{label}
            </span>
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
const btn = { width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

/* ----- legend ----- */
function Legend() {
  const items = [
    [<OwnerDot who="me" size={8} />, 'Hyunwoo'],
    [<OwnerDot who="partner" size={8} />, 'Jihyun'],
    [<div style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px dashed ${C.me}` }} />, '예정 데이트'],
    [<div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg,${PHOTO ? '#7a6' : '#7a6'},#557)` }} />, '데이트 사진'],
    [<svg width="10" height="10" viewBox="0 0 12 12" fill={C.anniv}><path d="M6 0l1.6 3.7 4 .35-3 2.65.9 3.9L6 8.5 2.5 10.6l.9-3.9-3-2.65 4-.35z" /></svg>, '기념일'],
    [<div style={{ width: 12, height: 5, borderRadius: 2, background: `repeating-linear-gradient(45deg,${C.partner},${C.partner} 2px,transparent 2px,transparent 4px)` }} />, '바쁨(숨김)'],
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', padding: '14px 20px 8px' }}>
      {items.map(([g, t], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {g}<span style={{ fontFamily: SANS, fontSize: 11, color: C.sub }}>{t}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- 17. Month view ---------------- */
function CalMonth() {
  return (
    <Screen chrome={<AppChrome tab="calendar" />}>
      <CalHeader filter="us" />
      <MonthGrid filter="us" />
      <Legend />
    </Screen>
  );
}

/* ---------------- 18. Selected day — 개인 일정 + Track ---------------- */
function DaySheet({ children, title, sub }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: '#1c1c1c', borderRadius: '20px 20px 0 0', padding: '10px 0 24px', maxHeight: '78%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 14px' }} />
        <div style={{ padding: '0 20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.01em' }}>{title}</span>
            {sub && <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: C.sub }}>{sub}</span>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function DayRow({ time, who, title, tag, thumb, tone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
      {thumb ? (
        <CoverArt src={thumb} size={44} shape="rounded" />
      ) : (
        <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <OwnerDot who={who} size={9} />
          <span style={{ fontFamily: SANS, fontSize: 11, color: C.sub, marginTop: 6 }}>{time}</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>{title}</div>
        <Meta style={{ marginTop: 2 }}>{tag}</Meta>
      </div>
      {tone && <Dday tone={tone === 'anniv' ? 'anniv' : undefined}>{tone === 'anniv' ? 'D-15' : 'D-3'}</Dday>}
      {!tone && <Icon name="IconChevronRight" size={18} style={{ color: C.muted }} />}
    </div>
  );
}

function CalDayDetail() {
  return (
    <Screen>
      <CalHeader filter="us" />
      <MonthGrid filter="us" />
      <DaySheet title="7월 11일" sub="토요일">
        <Eyebrow style={{ marginBottom: 2 }}>데이트</Eyebrow>
        <DayRow thumb={PHOTO.cafe} title="Untitled — 성수 데이트" tag="계획 중 · 코스 3곳" tone="date" />
        <Divider style={{ margin: '2px 0' }} />
        <Eyebrow style={{ margin: '10px 0 2px' }}>개인 일정</Eyebrow>
        <DayRow time="오후" who="me" title="반차" tag="Hyunwoo · 나만 보기 해제됨" />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <PillButton variant="primary" style={{ flex: 1 }}>이 날 데이트 만들기</PillButton>
          <PillButton variant="outline" size="md">일정 추가</PillButton>
        </div>
      </DaySheet>
    </Screen>
  );
}

/* ---------------- 19. Selected day — anniversary (plan CTA) ---------------- */
function CalAnnivDay() {
  return (
    <Screen>
      <CalHeader filter="us" />
      <MonthGrid filter="us" />
      <DaySheet title="7월 23일" sub="목요일">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0 14px' }}>
          <AnnivCover size={60} big="200" small="일" />
          <div style={{ flex: 1 }}>
            <Eyebrow color={C.anniv}>Single · 기념일</Eyebrow>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', marginTop: 2 }}>200일</div>
            <Meta style={{ marginTop: 2 }}>2026.07.23 · D-15</Meta>
          </div>
        </div>
        <div style={{ background: 'rgba(232,184,75,0.10)', border: '1px solid rgba(232,184,75,0.25)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: '#fff' }}>아직 계획이 없어요</div>
          <Meta style={{ marginTop: 4, lineHeight: 1.5 }}>이 날을 특별하게 만들어 볼까요? 데이트를 만들면 200일이 하나의 싱글로 남아요.</Meta>
        </div>
        <PillButton variant="primary" style={{ width: '100%', marginTop: 16, background: C.anniv }}>200일 데이트 계획하기</PillButton>
        <button style={{ width: '100%', background: 'none', border: 'none', color: C.sub, fontFamily: SANS, fontWeight: 600, fontSize: 13, padding: '14px 0 2px', cursor: 'pointer' }}>기념일만 기록하기</button>
      </DaySheet>
    </Screen>
  );
}

/* ---------------- 20. Empty month ---------------- */
function CalEmpty() {
  return (
    <Screen chrome={<AppChrome tab="calendar" nextVariant="anniv" />}>
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: '#fff' }}>9월</span>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: C.sub }}>2026</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={btn}><Icon name="ChevronLeft" size={18} style={{ display: 'block', color: C.sub }} /></button>
            <button style={{ ...btn, padding: '0 12px', width: 'auto', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: '#fff' }}>오늘</button>
            <button style={btn}><Icon name="ChevronLeft" size={18} style={{ display: 'block', color: C.sub, transform: 'rotate(180deg)' }} /></button>
          </div>
        </div>
      </div>
      {/* faint empty grid */}
      <div style={{ padding: '0 12px', opacity: 0.35 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {WEEK.map((w, i) => <div key={w} style={{ textAlign: 'center', padding: '6px 0 8px', fontFamily: SANS, fontSize: 11, fontWeight: 600, color: C.muted }}>{w}</div>)}
          {Array.from({ length: 35 }).map((_, i) => {
            const d = i - 1; // Sep 1 = Tue → lead 2
            return <div key={i} style={{ height: 58, display: 'flex', justifyContent: 'center', paddingTop: 6, fontFamily: SANS, fontSize: 12.5, color: d >= 1 && d <= 30 ? '#888' : '#3a3a3a' }}>{d >= 1 && d <= 30 ? d : ''}</div>;
          })}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '24px 40px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff' }}>이번 달은 아직 비어 있어요</div>
        <Meta style={{ marginTop: 8, lineHeight: 1.5 }}>다가오는 날 중 하루를 골라 데이트를 계획해 보세요. 계획한 트랙은 여기에 나타나요.</Meta>
        <PillButton variant="primary" style={{ marginTop: 18 }}>데이트 계획하기</PillButton>
      </div>
    </Screen>
  );
}

window.SCREENS = window.SCREENS || {};
window.SCREENS.calendar = {
  title: '4 · 캘린더 탭',
  items: [
    { label: '17 · 월간 뷰', node: <CalMonth /> },
    { label: '18 · 선택일 — 일정+데이트', node: <CalDayDetail /> },
    { label: '19 · 선택일 — 기념일', node: <CalAnnivDay /> },
    { label: '20 · 빈 달 상태', node: <CalEmpty /> },
  ],
};
})();
