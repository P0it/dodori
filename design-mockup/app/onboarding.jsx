/* ============================================================
   Group 1 — Onboarding & couple connection
   ============================================================ */
(function () {
const {
  Screen, Eyebrow, Dday, OwnerDot, TopBar, Meta, Divider, KakaoButton,
  Icon, PillButton, CoverArt, C, PHOTO, SANS,
} = window;

/* 도돌이 마크 — 여는 도돌이표 𝄆 (막대 2 + 점 2, 브랜드 그린 단색). 앱 아이콘과 동일 지오메트리 */
function DodoriMark({ size = 40, showWord = true }) {
  const g = C.me;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size * 0.8, height: size }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: size * 0.22, height: size, borderRadius: size * 0.03, background: g }} />
        <div style={{ position: 'absolute', left: size * 0.33, top: 0, width: size * 0.085, height: size, borderRadius: size * 0.03, background: g }} />
        <div style={{ position: 'absolute', left: size * 0.54, top: size * 0.17, width: size * 0.26, height: size * 0.26, borderRadius: '50%', background: g }} />
        <div style={{ position: 'absolute', left: size * 0.54, top: size * 0.57, width: size * 0.26, height: size * 0.26, borderRadius: '50%', background: g }} />
      </div>
      {showWord && <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size * 0.8, letterSpacing: '-0.03em', color: '#fff' }}>dodori</span>}
    </div>
  );
}

function Center({ children, style }) {
  return <div style={{ padding: '0 28px', display: 'flex', flexDirection: 'column', height: '100%', ...style }}>{children}</div>;
}

/* ---------------- 1. Login ---------------- */
function Login() {
  return (
    <Screen noHome={false}>
      <Center>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <DodoriMark size={54} showWord={false} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: '-0.03em', color: '#fff' }}>dodori</div>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: C.sub, marginTop: 8 }}>하루마다 쌓아가는 우리의 마디</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
          <KakaoButton>카카오로 시작하기</KakaoButton>
          <button style={{ ...socialBtn, background: '#fff', color: '#000' }}>
             Apple로 계속하기
          </button>
          <button style={{ ...socialBtn, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' }}>이메일로 계속하기</button>
          <div style={{ textAlign: 'center', fontFamily: SANS, fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
            계속하면 이용약관과 개인정보 처리방침에<br />동의하는 것으로 간주돼요.
          </div>
        </div>
      </Center>
    </Screen>
  );
}
const socialBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', height: 52, borderRadius: 999, border: 'none', fontFamily: SANS, fontWeight: 700, fontSize: 15, cursor: 'pointer' };

/* ---------------- 2. Connect choice ---------------- */
function ConnectChoice() {
  return (
    <Screen>
      <Center>
        <div style={{ paddingTop: 40 }}>
          <DodoriMark size={30} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 27, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.3 }}>둘이 연결되어야<br />시작할 수 있어요</div>
          <Meta style={{ marginTop: 12, lineHeight: 1.6, fontSize: 14 }}>상대와 연결하면 서로의 일정을 공유하고 함께 데이트를 기록할 수 있어요. 연결 전에는 기능이 잠겨 있어요.</Meta>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32 }}>
            <ChoiceCard active title="초대 링크 보내기" sub="상대에게 카카오톡으로 초대를 보내요" icon="Share" />
            <ChoiceCard title="초대 링크가 있어요" sub="받은 링크로 상대와 연결해요" icon="IconsAppsInstagramAdd" />
          </div>
        </div>
        <div style={{ height: 30 }} />
      </Center>
    </Screen>
  );
}
function ChoiceCard({ title, sub, icon, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '18px 18px', borderRadius: 16,
      background: active ? 'rgba(30,215,96,0.10)' : C.s1,
      border: active ? `1.5px solid ${C.me}` : '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: active ? C.me : C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={20} style={{ color: active ? '#121212' : '#fff' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff' }}>{title}</div>
        <Meta style={{ marginTop: 3, fontSize: 12.5 }}>{sub}</Meta>
      </div>
      <Icon name="IconChevronRight" size={18} style={{ color: C.muted }} />
    </div>
  );
}

/* ----- Invite card preview (shared by 3/4) ----- */
function InviteCard() {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: C.s1, border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ position: 'relative', height: 150, background: `linear-gradient(135deg, ${C.me}, ${C.partner})` }}>
        <img src={PHOTO.sunset} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, mixBlendMode: 'overlay' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DodoriMark size={30} showWord={false} />
        </div>
        <div style={{ position: 'absolute', left: 16, bottom: 12 }}>
          <Eyebrow style={{ color: 'rgba(255,255,255,0.9)' }}>dodori 초대장</Eyebrow>
        </div>
      </div>
      <div style={{ padding: '16px 16px 18px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff', lineHeight: 1.4 }}>Hyunwoo님이 함께 만들<br />플레이리스트에 초대했어요</div>
        <Meta style={{ marginTop: 6, fontSize: 12.5 }}>탭해서 연결하고 둘만의 기록을 시작하세요</Meta>
        <div style={{ marginTop: 14, height: 40, borderRadius: 999, background: C.me, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: '#121414' }}>연결하러 가기</div>
      </div>
    </div>
  );
}

/* ---------------- 3. Send invite ---------------- */
function SendInvite() {
  return (
    <Screen>
      <TopBar title="초대 보내기" />
      <div style={{ padding: '8px 24px 30px' }}>
        <Eyebrow style={{ marginBottom: 10 }}>미리보기 · 상대가 받는 화면</Eyebrow>
        <InviteCard />
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <KakaoButton>카카오톡으로 초대 보내기</KakaoButton>
          <div style={{ display: 'flex', gap: 10 }}>
            <SecBtn icon="Share">링크 복사</SecBtn>
            <SecBtn icon="IconsAppsAppStoreMore">기타 공유</SecBtn>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 20 }}>
          <Icon name="IconsControlCenterOrientationLock" size={13} style={{ color: C.muted }} />
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: C.muted }}>초대 링크는 24시간 동안, 한 번만 유효해요</span>
        </div>
      </div>
    </Screen>
  );
}
function SecBtn({ children, icon }) {
  return (
    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 48, borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
      <Icon name={icon} size={16} style={{ color: '#fff' }} />{children}
    </button>
  );
}

/* ---------------- 4. Waiting state ---------------- */
function Waiting() {
  return (
    <Screen>
      <TopBar title="초대 대기 중" />
      <Center style={{ height: 'auto' }}>
        <div style={{ paddingTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${C.s2}`, borderTopColor: C.me, animation: 'spin 1.4s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: `linear-gradient(135deg,${C.me},${C.partner})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DodoriMark size={22} showWord={false} />
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 21, color: '#fff', letterSpacing: '-0.01em' }}>수락을 기다리는 중…</div>
          <Meta style={{ marginTop: 10, lineHeight: 1.6, maxWidth: 260 }}>초대를 보냈어요. 상대가 링크를 열고 수락하면 자동으로 연결돼요.</Meta>
        </div>
        <div style={{ marginTop: 28, padding: '14px 16px', borderRadius: 12, background: C.s1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow style={{ fontSize: 9.5, marginBottom: 4 }}>초대 링크</Eyebrow>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>dodori.app/i/8fK2-hyunwoo</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.anniv }}>
            <Icon name="IconsControlCenterOrientationLock" size={13} style={{ color: C.anniv }} />
            <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600 }}>23:41 남음</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <PillButton variant="outline" style={{ flex: 1 }}>링크 복사</PillButton>
          <div style={{ flex: 1 }}><KakaoButton style={{ height: 44, fontSize: 13.5 }}>다시 공유</KakaoButton></div>
        </div>
        <button style={{ background: 'none', border: 'none', color: C.muted, fontFamily: SANS, fontWeight: 600, fontSize: 13, padding: '18px 0', cursor: 'pointer' }}>초대 취소</button>
      </Center>
    </Screen>
  );
}

/* ---------------- 5. Accept invite ---------------- */
function Accept() {
  return (
    <Screen>
      <TopBar title="초대 수락" />
      <Center style={{ height: 'auto' }}>
        <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Eyebrow color={C.me}>dodori 초대</Eyebrow>
          <div style={{ position: 'relative', margin: '22px 0 18px' }}>
            <CoverArt src={PHOTO.portrait} size={104} shape="circle" style={{ border: `3px solid ${C.me}` }} />
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 23, color: '#fff', letterSpacing: '-0.01em' }}>Hyunwoo님이<br />당신을 초대했어요</div>
          <Meta style={{ marginTop: 12, lineHeight: 1.6, maxWidth: 270 }}>Hyunwoo님과 연결하면 서로의 캘린더를 공유하고 데이트를 함께 기록하게 돼요.</Meta>
        </div>
        <div style={{ marginTop: 22, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <Icon name="Vector" size={15} style={{ color: C.anniv }} />
          <span style={{ fontFamily: SANS, fontSize: 12, color: C.sub }}>본인이 아는 사람이 맞는지 꼭 확인하세요</span>
        </div>
        <div style={{ marginTop: 22 }}>
          <PillButton variant="primary" style={{ width: '100%' }}>Hyunwoo님과 연결하기</PillButton>
          <button style={{ width: '100%', background: 'none', border: 'none', color: C.muted, fontFamily: SANS, fontWeight: 600, fontSize: 13.5, padding: '16px 0 4px', cursor: 'pointer' }}>내가 아는 사람이 아니에요</button>
        </div>
      </Center>
    </Screen>
  );
}

/* ---------------- 5b. Already-connected notice ---------------- */
function AlreadyConnected() {
  return (
    <Screen>
      <TopBar title="" />
      <Center style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <Icon name="IconsControlCenterOrientationLock" size={30} style={{ color: C.sub }} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 21, color: '#fff' }}>이미 연결된 계정이에요</div>
        <Meta style={{ marginTop: 12, lineHeight: 1.6, maxWidth: 280 }}>이 계정은 이미 다른 상대와 연결되어 있어요. 새로 연결하려면 먼저 기존 연결을 해제해야 해요.</Meta>
        <div style={{ marginTop: 26, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PillButton variant="primary" style={{ width: '100%' }}>dodori로 돌아가기</PillButton>
          <PillButton variant="outline" style={{ width: '100%' }}>연결 관리 열기</PillButton>
        </div>
      </Center>
    </Screen>
  );
}

/* ---------------- 6. Start date & birthdays ---------------- */
function FieldRow({ label, value, who }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px', borderRadius: 12, background: C.s1, marginBottom: 10 }}>
      {who && <OwnerDot who={who} size={10} />}
      <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.sub, flex: 1 }}>{label}</span>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: '#fff' }}>{value}</span>
      <Icon name="IconChevronRight" size={16} style={{ color: C.muted }} />
    </div>
  );
}
function StartDate() {
  const chips = ['100일 · 04.14', '200일 · 07.23', '300일 · 10.31', '1주년 · 2027.01.05', 'Hyunwoo 생일', 'Jihyun 생일'];
  return (
    <Screen>
      <TopBar title="함께한 시작" />
      <div style={{ padding: '8px 24px 30px' }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: '-0.02em' }}>두 사람의 정보를<br />알려주세요</div>
        <Meta style={{ marginTop: 8, marginBottom: 22, lineHeight: 1.5 }}>이 날짜로 기념일이 자동으로 만들어져요.</Meta>
        <Eyebrow style={{ marginBottom: 8 }}>처음 만난 날</Eyebrow>
        <FieldRow label="시작일" value="2026.01.05" />
        <Eyebrow style={{ margin: '16px 0 8px' }}>생일</Eyebrow>
        <FieldRow label="Hyunwoo" value="03.22" who="me" />
        <FieldRow label="Jihyun" value="09.08" who="partner" />

        <div style={{ marginTop: 22, padding: '16px', borderRadius: 14, background: 'rgba(232,184,75,0.08)', border: '1px solid rgba(232,184,75,0.20)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <svg width="15" height="15" viewBox="0 0 12 12" fill={C.anniv}><path d="M6 0l1.6 3.7 4 .35-3 2.65.9 3.9L6 8.5 2.5 10.6l.9-3.9-3-2.65 4-.35z" /></svg>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: '#fff' }}>이런 싱글이 만들어져요</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {chips.map((c) => (
              <span key={c} style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: C.anniv, background: 'rgba(232,184,75,0.12)', borderRadius: 999, padding: '5px 11px' }}>{c}</span>
            ))}
          </div>
        </div>
        <PillButton variant="primary" style={{ width: '100%', marginTop: 24 }}>완료하고 시작하기</PillButton>
      </div>
    </Screen>
  );
}

window.SCREENS = window.SCREENS || {};
window.SCREENS.onboarding = {
  title: '1 · 온보딩 · 커플 연결',
  items: [
    { label: '01 · 가입/로그인', node: <Login /> },
    { label: '02 · 연결 선택', node: <ConnectChoice /> },
    { label: '03 · 초대 보내기', node: <SendInvite /> },
    { label: '04 · 초대 대기', node: <Waiting /> },
    { label: '05 · 초대 수락', node: <Accept /> },
    { label: '05b · 이미 연결됨', node: <AlreadyConnected /> },
    { label: '06 · 시작일·생일 입력', node: <StartDate /> },
  ],
};
})();
