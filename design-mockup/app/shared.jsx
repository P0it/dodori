/* ============================================================
   dodori — shared foundations (phone frame, chrome, helpers)
   Built on the Spotify Mobile Design System.
   ============================================================ */
const DS = window.SpotifyMobileDesignSystem_e52d1c;
const {
  Icon, Logo, PlayButton, IconButton, PillButton, ProgressBar,
  CoverArt, TrackRow, NowPlayingBar, SectionHeader, StatusBar,
  FilterChip, SearchField, Equalizer,
} = DS;

const SCREEN_W = 375, SCREEN_H = 812;

/* ---- Data-encoding palette (green is DS; pink/amber added for calendar legibility) ---- */
const C = {
  me:      '#1ED760',   // Hyunwoo  (brand green)
  partner: '#E8688F',   // Jihyun   (pink)
  anniv:   '#E8B84B',   // 기념일 / Single (amber)
  bg:      '#121212',
  s1:      '#181818',
  s2:      '#282828',
  s3:      '#333333',
  sub:     '#B3B3B3',
  muted:   '#777777',
};

const PHOTO = {
  river:    'assets/photo-river.png',
  seongsu1: 'assets/photo-seongsu1.png',
  seongsu2: 'assets/photo-seongsu2.png',
  cafe:     'assets/photo-cafe.png',
  food:     'assets/photo-food.png',
  walk:     'assets/photo-walk.png',
  d100:     'assets/photo-100.png',
  portrait: 'assets/photo-portrait.png',
  sunset:   'assets/photo-sunset.png',
  night:    'assets/photo-night.png',
  coffee2:  'assets/photo-coffee2.png',
  street2:  'assets/photo-street2.png',
};

const SANS = 'var(--font-sans)';

/* ---------- Phone frame ---------- */
function Screen({ children, statusTint, bg, chrome, noHome, style }) {
  return (
    <div style={{
      width: SCREEN_W, height: SCREEN_H, borderRadius: 46, overflow: 'hidden',
      position: 'relative', background: bg || C.bg, fontFamily: SANS,
      boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
      ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <StatusBar time="9:41" tint={statusTint || '#fff'} style={{ flexShrink: 0, zIndex: 5 }} />
        <div className="scrolly" style={{ flex: 1, minHeight: 0, position: 'relative', overflowY: 'auto' }}>
          {children}
        </div>
        {chrome}
      </div>
      {!noHome && (
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          width: 134, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.5)', zIndex: 20,
        }} />
      )}
    </div>
  );
}

/* ---------- Section eyebrow ---------- */
function Eyebrow({ children, color, style }) {
  return (
    <div style={{
      fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: color || C.sub, ...style,
    }}>{children}</div>
  );
}

/* ---------- D-day pill ---------- */
function Dday({ children, tone, style }) {
  const bg = tone === 'anniv' ? 'rgba(232,184,75,0.16)' : 'rgba(30,215,96,0.15)';
  const fg = tone === 'anniv' ? C.anniv : C.me;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px',
      borderRadius: 999, background: bg, color: fg, fontFamily: SANS, fontWeight: 700,
      fontSize: 11.5, letterSpacing: '0.02em', ...style,
    }}>{children}</span>
  );
}

/* ---------- Owner dot ---------- */
function OwnerDot({ who, size = 9, style }) {
  const col = who === 'partner' ? C.partner : who === 'anniv' ? C.anniv : C.me;
  return <span style={{ width: size, height: size, borderRadius: '50%', background: col, display: 'inline-block', flexShrink: 0, ...style }} />;
}

/* ---------- Custom nav glyphs (calendar/studio absent from kit icon set) ---------- */
function CalGlyph({ size = 24, filled }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" fill={filled ? 'currentColor' : 'none'} />
      <path d="M3 9.5h18" stroke={filled ? '#121212' : 'currentColor'} strokeWidth="1.7" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      {filled && <g fill="#121212"><circle cx="8" cy="14" r="1.4" /><circle cx="12" cy="14" r="1.4" /><circle cx="16" cy="14" r="1.4" /><circle cx="8" cy="18" r="1.4" /><circle cx="12" cy="18" r="1.4" /></g>}
    </svg>
  );
}
function DiscGlyph({ size = 24, filled }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" fill={filled ? 'currentColor' : 'none'} />
      <circle cx="12" cy="12" r="3.2" stroke={filled ? '#121212' : 'currentColor'} strokeWidth="1.7" fill="none" />
      <circle cx="12" cy="12" r="0.9" fill={filled ? '#121212' : 'currentColor'} />
    </svg>
  );
}

/* ---------- 3-tab bottom nav (Playlist / Calendar / Studio) ---------- */
function CoupleTabs({ active = 'playlist' }) {
  const tabs = [
    { id: 'playlist', label: '플레이리스트', glyph: 'lib' },
    { id: 'calendar', label: '캘린더', glyph: 'cal' },
    { id: 'studio', label: '스튜디오', glyph: 'disc' },
  ];
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 10 }}>
      {tabs.map((t) => {
        const on = t.id === active;
        const col = on ? '#fff' : C.sub;
        return (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: col }}>
            <div style={{ color: col }}>
              {t.glyph === 'lib' && <Icon name={on ? 'LibrarySolid' : 'LibraryOutline'} size={23} style={{ display: 'block' }} />}
              {t.glyph === 'cal' && <CalGlyph size={23} filled={on} />}
              {t.glyph === 'disc' && <DiscGlyph size={23} filled={on} />}
            </div>
            <span style={{ fontFamily: SANS, fontWeight: on ? 700 : 500, fontSize: 9.5, letterSpacing: '-0.01em' }}>{t.label}</span>
          </div>
        );
      })}
    </nav>
  );
}

/* ---------- "다음 일정" mini-player + tab bar (docked chrome) ---------- */
function NextUp({ variant }) {
  // default: upcoming Track. variant='anniv' → next anniversary.
  const isAnniv = variant === 'anniv';
  return (
    <div style={{ padding: '0 8px 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px 4px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isAnniv ? C.anniv : C.me }} />
        <Eyebrow style={{ fontSize: 9.5, letterSpacing: '0.12em' }} color={isAnniv ? C.anniv : C.me}>다음 일정</Eyebrow>
      </div>
      <NowPlayingBar
        cover={isAnniv ? PHOTO.d100 : PHOTO.cafe}
        title={isAnniv ? '200일' : 'Untitled — 성수 데이트'}
        artist={isAnniv ? '07.23 · D-15' : '07.11 · D-3'}
        progress={isAnniv ? 0.62 : 0.9}
        playing={false}
        color={isAnniv ? '#3A3020' : '#2C2530'}
      />
    </div>
  );
}

function AppChrome({ tab = 'playlist', nextVariant }) {
  return (
    <div style={{ flexShrink: 0, paddingBottom: 22, background: 'linear-gradient(to top, #0d0d0d 55%, rgba(13,13,13,0))' }}>
      <NextUp variant={nextVariant} />
      <CoupleTabs active={tab} />
    </div>
  );
}

/* ---------- Top bar (back / title / action) ---------- */
function TopBar({ onBack = true, title, right, tint = '#fff' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: '0 16px', color: tint }}>
      {onBack ? <Icon name="ChevronLeft" size={22} style={{ display: 'block', flexShrink: 0 }} /> : <div style={{ width: 22 }} />}
      <div style={{ flex: 1, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ width: 22, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>{right}</div>
    </div>
  );
}

/* ---------- Small helpers ---------- */
function Meta({ children, style }) {
  return <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: C.sub, ...style }}>{children}</div>;
}
function Divider({ style }) {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', ...style }} />;
}
function KakaoButton({ children = '카카오톡으로 공유', style }) {
  return (
    <button type="button" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
      height: 52, borderRadius: 999, border: 'none', background: '#FEE500', color: '#191600',
      fontFamily: SANS, fontWeight: 700, fontSize: 15, cursor: 'pointer', ...style,
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#191600"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.9 1.9 5.4 4.8 6.8-.2.7-.8 2.7-.9 3.1 0 0 0 .3.2.4.2 0 .4-.1.4-.1.5-.3 3.2-2.1 4-2.6.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z" /></svg>
      {children}
    </button>
  );
}

/* ---------- Anniversary "Single" cover — simple flat square ---------- */
function AnnivCover({ size = 56, big, small, photo, disc, style }) {
  const rad = size > 90 ? 8 : 6;
  if (photo) {
    return <div style={{ width: size, height: size, borderRadius: rad, overflow: 'hidden', flexShrink: 0, boxShadow: size > 90 ? '0 10px 30px rgba(0,0,0,0.45)' : 'none', ...style }}>
      <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: rad, flexShrink: 0,
      background: '#2A2119', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: size * 0.02,
      boxShadow: size > 90 ? '0 10px 30px rgba(0,0,0,0.45)' : 'none', ...style,
    }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: size * (disc ? 0.24 : 0.36), color: C.anniv, letterSpacing: '-0.02em', lineHeight: 1 }}>{disc ? 'Singles' : big}</span>
      {!disc && small && <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: size * 0.15, color: 'rgba(232,184,75,0.7)', letterSpacing: '0.1em' }}>{small}</span>}
    </div>
  );
}

/* ---------- expose ---------- */
Object.assign(window, {
  Screen, Eyebrow, Dday, OwnerDot, CoupleTabs, AppChrome, NextUp, TopBar,
  Meta, Divider, KakaoButton, CalGlyph, DiscGlyph, AnnivCover,
  C, PHOTO, SANS, SCREEN_W, SCREEN_H,
  Icon, Logo, PlayButton, IconButton, PillButton, ProgressBar,
  CoverArt, TrackRow, NowPlayingBar, SectionHeader, StatusBar,
  FilterChip, SearchField, Equalizer,
});
