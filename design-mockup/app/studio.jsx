/* ============================================================
   Group 6 — Studio tab
   ============================================================ */
(function () {
const {
  Screen, Eyebrow, Dday, OwnerDot, AppChrome, TopBar, Meta, Divider,
  Icon, PillButton, CoverArt, AnnivCover, C, PHOTO, SANS,
} = window;

function StudioAvatar({ who, size }) {
  const src = who === 'partner' ? PHOTO.portrait : PHOTO.walk;
  const ring = who === 'partner' ? C.partner : C.me;
  return <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${ring}`, flexShrink: 0 }}><img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
}

function Stat({ n, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.01em' }}>{n}</div>
      <Meta style={{ marginTop: 2, fontSize: 11.5 }}>{label}</Meta>
    </div>
  );
}

function LinkRow({ icon, label, sub, right, custom, danger }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {custom || <Icon name={icon} size={17} style={{ color: danger ? '#E8567A' : '#fff' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: danger ? '#E8567A' : '#fff' }}>{label}</div>
        {sub && <Meta style={{ marginTop: 2, fontSize: 12 }}>{sub}</Meta>}
      </div>
      {right || <Icon name="IconChevronRight" size={17} style={{ color: C.muted }} />}
    </div>
  );
}

/* ---------------- 25. Studio root ---------------- */
function StudioRoot() {
  return (
    <Screen chrome={<AppChrome tab="studio" />}>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 150, position: 'relative', overflow: 'hidden' }}>
          <img src={PHOTO.sunset} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(18,18,18,0.2), #121212)' }} />
        </div>
        <div style={{ marginTop: -54, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex' }}>
            <StudioAvatar who="me" size={78} />
            <StudioAvatar who="partner" size={78} style={{ marginLeft: -18 }} />
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', marginTop: 12, letterSpacing: '-0.01em' }}>Hyunwoo &amp; Jihyun</div>
          <Meta style={{ marginTop: 5 }}>since 2026.01.05</Meta>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: C.me, letterSpacing: '-0.02em' }}>185</span>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, color: C.sub }}>일째</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', margin: '20px 20px 4px', padding: '16px 8px', borderRadius: 14, background: C.s1 }}>
        <Stat n="7" label="데이트" />
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
        <Stat n="34" label="사진" />
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
        <Stat n="1" label="싱글" />
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <LinkRow custom={<svg width="17" height="17" viewBox="0 0 12 12" fill={C.anniv}><path d="M6 0l1.6 3.7 4 .35-3 2.65.9 3.9L6 8.5 2.5 10.6l.9-3.9-3-2.65 4-.35z" /></svg>} label="기념일 관리" sub="자동 6 · 커스텀 1" />
        <Divider />
        <LinkRow icon="HeartSolid" label="Favorites" sub="아껴둔 데이트 3" />
        <Divider />
        <LinkRow icon="IconSettings" label="설정" sub="알림 · 연결 관리" />
      </div>
    </Screen>
  );
}

/* ---------------- 26. Anniversary management ---------------- */
function AnnivRow({ title, date, badge, custom, big, small }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0' }}>
      <AnnivCover size={44} big={big} small={small} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>{title}</span>
          {custom && <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 9.5, color: C.anniv, border: `1px solid ${C.anniv}`, borderRadius: 4, padding: '1px 5px' }}>커스텀</span>}
        </div>
        <Meta style={{ marginTop: 2, fontSize: 12 }}>{date}</Meta>
      </div>
      {badge && <Dday tone="anniv">{badge}</Dday>}
      <Icon name="IconChevronRight" size={16} style={{ color: C.muted, marginLeft: 8 }} />
    </div>
  );
}
function AnnivManage() {
  return (
    <Screen>
      <TopBar title="기념일 관리" right={<Icon name="IconsAppsInstagramAdd" size={20} style={{ color: C.anniv }} />} />
      <div style={{ padding: '4px 20px 4px' }}>
        <Eyebrow style={{ marginBottom: 4 }}>자동 생성</Eyebrow>
        <AnnivRow title="100일" date="2026.04.14 · 발매됨" big="100" small="일" />
        <AnnivRow title="200일" date="2026.07.23" badge="D-15" big="200" small="일" />
        <AnnivRow title="300일" date="2026.10.31" badge="D-115" big="300" small="일" />
        <AnnivRow title="1주년" date="2027.01.05" big="1" small="주년" />
        <Divider style={{ margin: '8px 0' }} />
        <AnnivRow title="Hyunwoo 생일" date="매년 03.22" big="H" small="생일" />
        <AnnivRow title="Jihyun 생일" date="매년 09.08" badge="D-62" big="J" small="생일" />

        <Eyebrow style={{ margin: '20px 0 4px' }}>커스텀</Eyebrow>
        <AnnivRow title="우리 첫 여행" date="매년 05.24" custom big="1" small="여행" />
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46, marginTop: 10, borderRadius: 10, border: '1px dashed rgba(232,184,75,0.4)', background: 'transparent', color: C.anniv, fontFamily: SANS, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          <Icon name="IconsAppsInstagramAdd" size={15} style={{ color: C.anniv }} />기념일 추가
        </button>
        <Meta style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 16 }}>자동 기념일은 시작일·생일을 바꾸면 다시 계산돼요. 기록 없이 지나가도 카드는 남아요.</Meta>
      </div>
    </Screen>
  );
}

/* ---------------- 27. Settings ---------------- */
function Settings() {
  return (
    <Screen>
      <TopBar title="설정" />
      <div style={{ padding: '4px 20px 4px' }}>
        <Eyebrow style={{ marginBottom: 2 }}>연결</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
          <StudioAvatar who="partner" size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>Jihyun과 연결됨</div>
            <Meta style={{ marginTop: 2, fontSize: 12 }}>2026.01.06 연결 · 185일째</Meta>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.me }} />
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.me }}>활성</span>
          </div>
        </div>
        <Divider />
        <LinkRow icon="IconsControlCenterOrientationLock" label="연결 관리" sub="연결 해제 · 재연결" />

        <Eyebrow style={{ margin: '18px 0 2px' }}>알림</Eyebrow>
        <LinkRow icon="Vector" label="푸시 알림" right={<Toggle on={true} />} />
        <Divider />
        <LinkRow custom={<svg width="17" height="17" viewBox="0 0 12 12" fill={C.anniv}><path d="M6 0l1.6 3.7 4 .35-3 2.65.9 3.9L6 8.5 2.5 10.6l.9-3.9-3-2.65 4-.35z" /></svg>} label="기념일 리마인드" sub="D-7 · D-1 · 당일" right={<Toggle on={true} />} />
        <Divider />
        <LinkRow icon="IconsAppsInstagramAdd" label="상대 일정 알림" right={<Toggle on={false} />} />

        <Eyebrow style={{ margin: '18px 0 2px' }}>계정</Eyebrow>
        <LinkRow icon="IconSettings" label="계정 정보" />
        <Divider />
        <LinkRow icon="Album" label="표시 · 테마" sub="다크" />
        <Divider />
        <LinkRow icon="Share" label="도움말 · 문의" />
        <Divider />
        <LinkRow icon="Back" label="로그아웃" danger right={<span />} />
      </div>
    </Screen>
  );
}
function Toggle({ on }) {
  return (
    <div style={{ width: 44, height: 26, borderRadius: 999, background: on ? C.me : C.s3, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
    </div>
  );
}

window.SCREENS = window.SCREENS || {};
window.SCREENS.studio = {
  title: '6 · 스튜디오 탭',
  items: [
    { label: '25 · 스튜디오 루트', node: <StudioRoot /> },
    { label: '26 · 기념일 관리', node: <AnnivManage /> },
    { label: '27 · 설정', node: <Settings /> },
  ],
};
})();
