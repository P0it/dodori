/* ============================================================
   Group 2 — Playlist tab
   ============================================================ */
(function () {
const {
  Screen, Eyebrow, Dday, OwnerDot, AppChrome, TopBar, Meta, Divider,
  Icon, PlayButton, IconButton, PillButton, CoverArt, SectionHeader, AnnivCover, C, PHOTO, SANS,
} = window;

/* --- shared bits --- */
function UpcomingCard({ tone, kicker, title, meta, dday, photo }) {
  const col = tone === 'anniv' ? C.anniv : C.me;
  return (
    <div style={{ flex: 1, borderRadius: 14, overflow: 'hidden', position: 'relative', background: C.s1, minWidth: 0 }}>
      <div style={{ height: 92, position: 'relative' }}>
        <img src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,20,20,0.9), rgba(20,20,20,0.1))' }} />
        <div style={{ position: 'absolute', left: 12, top: 10 }}><Eyebrow color={col} style={{ fontSize: 9 }}>{kicker}</Eyebrow></div>
        <div style={{ position: 'absolute', right: 10, top: 10 }}><Dday tone={tone === 'anniv' ? 'anniv' : undefined}>{dday}</Dday></div>
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <Meta style={{ marginTop: 3, fontSize: 12 }}>{meta}</Meta>
      </div>
    </div>
  );
}

function RecentTrack({ photo, title, date, upcoming }) {
  return (
    <div style={{ width: 132, flexShrink: 0 }}>
      <div style={{ position: 'relative' }}>
        <CoverArt src={photo} size={132} shape="square" />
        {upcoming && (
          <div style={{ position: 'absolute', left: 8, top: 8 }}><Dday>예정 · D-3</Dday></div>
        )}
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13.5, color: '#fff', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <Meta style={{ marginTop: 2, fontSize: 12 }}>{date}</Meta>
    </div>
  );
}

/* ---------------- 7. Playlist root ---------------- */
function PlaylistRoot() {
  const months = [
    { photo: PHOTO.cafe, name: '2026년 7월', meta: '3 데이트 · 07.01 – 07.11' },
    { photo: PHOTO.d100, name: '2026년 4월', meta: '2 데이트 · 100일' },
    { photo: PHOTO.night, name: '2026년 2월', meta: '4 데이트' },
  ];
  return (
    <Screen chrome={<AppChrome tab="playlist" />}>
      <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: '#fff' }}>플레이리스트</div>
          <Meta style={{ marginTop: 2, fontSize: 12.5 }}>Hyunwoo &amp; Jihyun · <span style={{ color: C.me, fontWeight: 700 }}>185일째</span></Meta>
        </div>
        <CoverArt src={PHOTO.portrait} size={38} shape="circle" />
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '14px 16px 4px' }}>
        <UpcomingCard tone="date" kicker="다가오는 데이트" title="Untitled" meta="성수 · 07.11" dday="D-3" photo={PHOTO.cafe} />
        <UpcomingCard tone="anniv" kicker="다가오는 기념일" title="200일" meta="07.23" dday="D-15" photo={PHOTO.d100} />
      </div>

      <div style={{ padding: '18px 16px 4px' }}>
        <SectionHeader title="최근 데이트" size={19} />
      </div>
      <div className="scrolly" style={{ display: 'flex', gap: 14, padding: '12px 16px 4px', overflowX: 'auto' }}>
        <RecentTrack photo={PHOTO.cafe} title="Untitled" date="성수 · 07.11" upcoming />
        <RecentTrack photo={PHOTO.seongsu1} title="비 오는 성수" date="07.04" />
        <RecentTrack photo={PHOTO.river} title="한강 러닝" date="07.01" />
        <RecentTrack photo={PHOTO.d100} title="100일" date="04.14" />
      </div>

      <div style={{ padding: '18px 16px 4px' }}>
        <SectionHeader title="월별 플레이리스트" size={19} />
      </div>
      <div style={{ padding: '10px 16px 2px' }}>
        {months.map((m) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <CoverArt src={m.photo} size={52} shape="rounded" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>{m.name}</div>
              <Meta style={{ marginTop: 2, fontSize: 12.5 }}>{m.meta}</Meta>
            </div>
            <Icon name="IconChevronRight" size={18} style={{ color: C.muted }} />
          </div>
        ))}
      </div>

      <div style={{ padding: '18px 16px 4px' }}>
        <SectionHeader title="테마 플레이리스트" size={19} action={<Icon name="IconsAppsInstagramAdd" size={20} style={{ color: C.sub }} />} />
      </div>
      <div style={{ padding: '10px 16px 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
          <CoverArt src={PHOTO.cafe} size={52} shape="rounded" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>Cafe</div>
            <Meta style={{ marginTop: 2, fontSize: 12.5 }}>장소 3곳 · 방문 4회</Meta>
          </div>
          <Icon name="IconChevronRight" size={18} style={{ color: C.muted }} />
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="IconsAppsInstagramAdd" size={22} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: C.sub }}>새 플레이리스트 만들기</span>
        </button>
      </div>

      <div style={{ padding: '18px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', borderRadius: 14, background: 'linear-gradient(120deg, rgba(232,184,75,0.18), rgba(232,184,75,0.04))', border: '1px solid rgba(232,184,75,0.18)' }}>
          <AnnivCover size={52} disc />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: '#fff' }}>Singles</div>
            <Meta style={{ marginTop: 2, fontSize: 12.5 }}>기념일 모음 · 6</Meta>
          </div>
          <Icon name="IconChevronRight" size={18} style={{ color: C.anniv }} />
        </div>
      </div>
    </Screen>
  );
}

/* ---------------- 8. Month playlist detail ---------------- */
function CollageCover() {
  const ph = [PHOTO.river, PHOTO.seongsu1, PHOTO.cafe, PHOTO.food];
  return (
    <div style={{ width: 176, height: 176, borderRadius: 6, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      {ph.map((p, i) => <img key={i} src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)}
    </div>
  );
}
function MonthTrackRow({ n, photo, title, date, meta, upcoming, playing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0' }}>
      <div style={{ position: 'relative' }}>
        <CoverArt src={photo} size={48} shape="rounded" style={upcoming ? { opacity: 0.9, outline: `1.5px dashed ${C.me}`, outlineOffset: -1.5 } : {}} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15.5, color: playing ? C.me : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          {upcoming && <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10, color: C.me, border: `1px solid ${C.me}`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>예정</span>}
        </div>
        <Meta style={{ marginTop: 3, fontSize: 12.5 }}>{date} · {meta}</Meta>
      </div>
      <Icon name="IconsAppsAppStoreMore" size={22} style={{ color: C.sub }} />
    </div>
  );
}
function MonthDetail() {
  return (
    <Screen chrome={<AppChrome tab="playlist" />}>
      <TopBar title="2026년 7월" right={<Icon name="IconsAppsAppStoreMore" size={20} style={{ color: '#fff' }} />} />
      <div style={{ background: 'linear-gradient(to bottom, #3a2f22 0%, rgba(18,18,18,0) 62%)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px 6px' }}>
          <CollageCover />
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 24, color: '#fff', marginTop: 16, letterSpacing: '-0.02em' }}>2026년 7월</div>
          <Meta style={{ marginTop: 6 }}>플레이리스트 · 3 데이트 · 사진 12</Meta>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 20px 12px' }}>
          <IconButton name="IconsAppsInstagramAdd" size={24} color={C.sub} label="트랙 추가" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <window.CalGlyph size={22} />
          </div>
          <div style={{ flex: 1 }} />
          <PlayButton size={54} />
        </div>
      </div>
      <div style={{ padding: '2px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Icon name="PlayingRightNow" size={13} style={{ color: C.me }} />
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.sub }}>전체 재생 = 이 달 사진 슬라이드쇼</span>
        </div>
        <MonthTrackRow photo={PHOTO.river} title="한강 러닝" date="07.01" meta="사진 6" />
        <MonthTrackRow photo={PHOTO.seongsu1} title="비 오는 성수" date="07.04" meta="사진 12 · 노트 2" playing />
        <MonthTrackRow photo={PHOTO.cafe} title="Untitled" date="07.11" meta="코스 3곳 · D-3" upcoming />
      </div>
    </Screen>
  );
}

/* ---------------- 9. Singles ---------------- */
function SingleRow({ photo, title, date, state, recorded, big, small }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
      <AnnivCover size={56} photo={recorded ? photo : undefined} big={big} small={small} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15.5, color: '#fff' }}>{title}</div>
        <Meta style={{ marginTop: 3, fontSize: 12.5 }}>{date}</Meta>
      </div>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11.5, color: state.d ? C.anniv : recorded ? C.me : C.muted }}>{state.t}</span>
    </div>
  );
}
function Singles() {
  return (
    <Screen chrome={<AppChrome tab="playlist" nextVariant="anniv" />}>
      <TopBar title="Singles" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 16px 10px' }}>
        <AnnivCover size={132} disc />
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', marginTop: 14 }}>Singles</div>
        <Meta style={{ marginTop: 5 }}>기념일 모음 · 6곡 · 1 발매됨</Meta>
      </div>
      <div style={{ padding: '4px 16px 20px' }}>
        <SingleRow photo={PHOTO.d100} recorded title="100일" date="2026.04.14 · 사진 8" state={{ t: '발매됨' }} big="100" small="일" />
        <SingleRow title="200일" date="2026.07.23" state={{ t: 'D-15', d: true }} big="200" small="일" />
        <SingleRow title="300일" date="2026.10.31" state={{ t: 'D-115', d: true }} big="300" small="일" />
        <SingleRow title="1주년" date="2027.01.05" state={{ t: '예정' }} big="1" small="주년" />
        <Divider style={{ margin: '10px 0' }} />
        <SingleRow title="Hyunwoo 생일" date="03.22" state={{ t: '매년' }} big="H" small="생일" />
        <SingleRow title="Jihyun 생일" date="09.08" state={{ t: 'D-62', d: true }} big="J" small="생일" />
      </div>
    </Screen>
  );
}

/* ---------------- 10. Queue ---------------- */
function QueueRow({ photo, title, meta, dday, tone, gold, big, small }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
      {gold ? (
        <AnnivCover size={50} big={big} small={small} />
      ) : (
        <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.s2 }}>
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>{title}</span>
          {tone && <OwnerDot who={tone} size={7} />}
        </div>
        <Meta style={{ marginTop: 2, fontSize: 12.5 }}>{meta}</Meta>
      </div>
      <Dday tone={gold ? 'anniv' : undefined} style={{ marginRight: 8 }}>{dday}</Dday>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M2 4h12M2 8h12M2 12h12" stroke={C.muted} strokeWidth="1.6" strokeLinecap="round" /></svg>
    </div>
  );
}
function Queue() {
  return (
    <Screen chrome={<AppChrome tab="playlist" />}>
      <TopBar title="다음 순서" />
      <div style={{ padding: '4px 20px 2px' }}>
        <Eyebrow>다가오는 데이트 · 기념일</Eyebrow>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', marginTop: 6 }}>Queue</div>
      </div>
      <div style={{ padding: '12px 16px 4px' }}>
        <Eyebrow color={C.me} style={{ marginBottom: 4 }}>지금 다음</Eyebrow>
        <QueueRow photo={PHOTO.cafe} title="Untitled — 성수 데이트" meta="07.11 · 코스 3곳" dday="D-3" />
        <Divider style={{ margin: '6px 0' }} />
        <Eyebrow style={{ margin: '10px 0 4px' }}>이어서</Eyebrow>
        <QueueRow gold title="200일" meta="07.23 · 기념일" dday="D-15" big="200" small="일" />
        <QueueRow gold title="Jihyun 생일" meta="09.08 · 기념일" dday="D-62" tone="partner" big="J" small="생일" />
        <QueueRow gold title="300일" meta="10.31 · 기념일" dday="D-115" big="300" small="일" />
      </div>
    </Screen>
  );
}

window.SCREENS = window.SCREENS || {};
window.SCREENS.playlist = {
  title: '2 · 플레이리스트 탭',
  items: [
    { label: '07 · 탭 루트', node: <PlaylistRoot /> },
    { label: '08 · 월 플레이리스트 상세', node: <MonthDetail /> },
    { label: '09 · Singles', node: <Singles /> },
    { label: '10 · Queue', node: <Queue /> },
  ],
};
})();
