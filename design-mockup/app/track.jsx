/* ============================================================
   Group 3 — Track (데이트) detail: plan / archive / play / gallery / options
   ============================================================ */
(function () {
const {
  Screen, Eyebrow, Dday, OwnerDot, TopBar, Meta, Divider,
  Icon, PlayButton, IconButton, PillButton, ProgressBar, CoverArt, C, PHOTO, SANS,
} = window;

function Avatar({ who, size = 22 }) {
  const src = who === 'partner' ? PHOTO.portrait : PHOTO.walk;
  const ring = who === 'partner' ? C.partner : C.me;
  return <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${ring}`, flexShrink: 0 }}><img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
}

/* course row */
function CourseRow({ time, name, area, who, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{ width: 42, textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: done ? C.me : '#fff' }}>{time}</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Meta style={{ fontSize: 12 }}>{area}</Meta>
          <span style={{ color: C.muted }}>·</span>
          <OwnerDot who={who} size={6} />
          <Meta style={{ fontSize: 12 }}>{who === 'partner' ? 'Jihyun' : 'Hyunwoo'} 추가</Meta>
        </div>
      </div>
      {done ? <Icon name="Album" size={16} style={{ color: C.me }} /> : <Icon name="IconsAppsAppStoreMore" size={20} style={{ color: C.sub }} />}
    </div>
  );
}

/* ---------------- 11. Plan mode (upcoming) ---------------- */
function PlanMode() {
  return (
    <Screen>
      <div style={{ background: 'linear-gradient(to bottom, #4a3826 0%, rgba(18,18,18,0) 55%)' }}>
        <TopBar title="계획 중인 데이트" right={<Icon name="IconsAppsAppStoreMore" size={20} style={{ color: '#fff' }} />} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 24px 8px' }}>
          <div style={{ position: 'relative' }}>
            <CoverArt src={PHOTO.cafe} size={168} shape="square" style={{ opacity: 0.96 }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 4, border: `2px dashed ${C.me}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12 }}>
              <Dday>D-3</Dday>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 25, color: '#fff', letterSpacing: '-0.02em' }}>Untitled</span>
            <Icon name="IconsAppsInstagramAdd" size={16} style={{ color: C.sub }} />
          </div>
          <Meta style={{ marginTop: 6 }}>2026.07.11 토 · 성수</Meta>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '4px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex' }}><Avatar who="me" size={20} /><Avatar who="partner" size={20} style={{ marginLeft: -6 }} /></div>
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.sub }}>둘 다 편집 가능</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>코스</span>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.sub }}>3곳</span>
      </div>
      <div style={{ padding: '2px 20px 6px' }}>
        <CourseRow time="14:00" name="카페 어니언 성수" area="성수동" who="me" />
        <CourseRow time="16:30" name="연무장길 산책" area="성수동" who="partner" />
        <CourseRow time="19:00" name="소문난 감자탕" area="성수동" who="me" />
        <button style={addBtn}><Icon name="IconsAppsInstagramAdd" size={15} style={{ color: C.me }} />장소 담기</button>
      </div>

      <div style={{ padding: '14px 20px 8px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>사전 메모</span>
        <div style={{ marginTop: 10, padding: '14px', borderRadius: 12, background: C.s1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Avatar who="partner" size={20} /><span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: C.partner }}>Jihyun</span></div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: '#e5e5e5', lineHeight: 1.55 }}>어니언 오픈런 필요할 수도. 우산 챙기기 🌧️ 감자탕은 예약 걸어둘게!</div>
        </div>
        <button style={{ ...addBtn, marginTop: 8 }}><Icon name="IconsAppsInstagramAdd" size={15} style={{ color: C.me }} />메모 추가</button>
      </div>

      <div style={{ padding: '8px 20px 26px' }}>
        <PillButton variant="outline" style={{ width: '100%' }}>캘린더에서 보기</PillButton>
      </div>
    </Screen>
  );
}
const addBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', height: 44, marginTop: 8, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: C.me, fontFamily: SANS, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' };

/* ---------------- 12. Archive mode (released) ---------------- */
function PhotoStrip() {
  const ph = [PHOTO.seongsu1, PHOTO.seongsu2, PHOTO.cafe, PHOTO.street2, PHOTO.coffee2, PHOTO.food];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
      {ph.map((p, i) => (
        <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 4, overflow: 'hidden' }}>
          <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {i === 5 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 15, color: '#fff' }}>+7</div>}
          {i < 2 && <div style={{ position: 'absolute', right: 4, bottom: 4 }}><Avatar who={i === 0 ? 'me' : 'partner'} size={16} /></div>}
        </div>
      ))}
    </div>
  );
}
function LinerNote({ who, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0' }}>
      <Avatar who={who} size={28} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: who === 'partner' ? C.partner : C.me }}>{who === 'partner' ? 'Jihyun' : 'Hyunwoo'}</div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: '#e5e5e5', lineHeight: 1.55, marginTop: 3 }}>{text}</div>
      </div>
    </div>
  );
}
function ArchiveMode() {
  return (
    <Screen>
      <div style={{ background: 'linear-gradient(to bottom, #33414d 0%, rgba(18,18,18,0) 52%)' }}>
        <TopBar title="비 오는 성수" right={<Icon name="IconsAppsAppStoreMore" size={20} style={{ color: '#fff' }} />} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 24px 6px' }}>
          <CoverArt src={PHOTO.seongsu1} size={172} shape="square" />
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 25, color: '#fff', marginTop: 16, letterSpacing: '-0.02em' }}>비 오는 성수</div>
          <Meta style={{ marginTop: 6 }}>2026.07.04 토 · 함께한 시간 5시간</Meta>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '6px 22px 14px' }}>
          <IconButton name="HeartSolid" size={22} active label="Favorite" />
          <IconButton name="IconsAppsInstagramAdd" size={22} color={C.sub} label="사진 추가" />
          <IconButton name="Share" size={20} color={C.sub} label="공유" />
          <div style={{ flex: 1 }} />
          <PlayButton size={54} />
        </div>
      </div>

      <div style={{ padding: '2px 20px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>사진 <span style={{ color: C.sub, fontWeight: 500 }}>12</span></span>
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.me, fontWeight: 600 }}>전체 보기</span>
        </div>
        <PhotoStrip />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Icon name="Album" size={13} style={{ color: C.me }} />
          <Meta style={{ fontSize: 11.5 }}>커버 = 베스트 컷 · 길게 눌러 변경</Meta>
        </div>
      </div>

      <div style={{ padding: '18px 20px 4px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>코스</span>
        <div style={{ marginTop: 4 }}>
          <CourseRow time="15:00" name="대림창고 갤러리" area="성수동" who="me" done />
          <CourseRow time="17:30" name="어니언 성수" area="성수동" who="partner" done />
          <CourseRow time="20:00" name="정식당 성수" area="성수동" who="me" done />
        </div>
      </div>

      <div style={{ padding: '14px 20px 4px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>라이너 노트</span>
        <div style={{ marginTop: 4 }}>
          <LinerNote who="me" text="비 와서 계획 다 틀어졌는데 그게 더 좋았다. 대림창고 처마 밑에서 한참 서 있던 거 기억나." />
          <LinerNote who="partner" text="어니언 롤케이크 최고… 다음엔 맑은 날 다시 오자 ☔️→☀️" />
          <button style={{ ...addBtn, marginTop: 4 }}><Icon name="IconsAppsInstagramAdd" size={15} style={{ color: C.me }} />노트 남기기</button>
        </div>
      </div>

      <div style={{ padding: '14px 20px 4px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>이 날의 노래</span>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: C.s1 }}>
          <div style={{ width: 46, height: 46, borderRadius: 6, background: 'linear-gradient(135deg,#5b6f8a,#2c3a4a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="PlayingRightNow" size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14.5, color: '#fff' }}>빗속의 성수</div>
            <Meta style={{ marginTop: 2, fontSize: 12.5 }}>블루 프리즘</Meta>
          </div>
          <Icon name="ListeningOn" size={18} style={{ color: C.sub }} />
        </div>
      </div>

      <div style={{ padding: '16px 20px 30px' }}>
        <Meta style={{ fontSize: 11.5, lineHeight: 1.7 }}>발매 2026.07.04 · 사진 12 (Hyunwoo 7 · Jihyun 5) · 코스 3곳 · 노트 2</Meta>
      </div>
    </Screen>
  );
}

/* ---------------- 13. Archive empty (0 photos) ---------------- */
function ArchiveEmpty() {
  return (
    <Screen>
      <div style={{ background: 'linear-gradient(to bottom, #4a3826 0%, rgba(18,18,18,0) 55%)' }}>
        <TopBar title="한강 러닝" right={<Icon name="IconsAppsAppStoreMore" size={20} style={{ color: '#fff' }} />} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 24px 6px' }}>
          <div style={{ width: 172, height: 172, borderRadius: 4, background: C.s2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
            <Icon name="IconsAppsInstagramAdd" size={30} style={{ color: C.muted }} />
            <span style={{ fontFamily: SANS, fontSize: 12, color: C.muted }}>커버 없음</span>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 25, color: '#fff', marginTop: 16 }}>한강 러닝</div>
          <Meta style={{ marginTop: 6 }}>방금 발매됨 · 2026.07.01</Meta>
        </div>
      </div>
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(30,215,96,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="IconsAppsInstagramAdd" size={26} style={{ color: C.me }} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 18, color: '#fff' }}>오늘의 데이트가 발매됐어요</div>
        <Meta style={{ marginTop: 10, lineHeight: 1.6, maxWidth: 260 }}>아직 사진이 없어요. 첫 사진을 올리면 베스트 컷이 이 트랙의 커버가 돼요.</Meta>
        <PillButton variant="primary" style={{ marginTop: 20 }}>사진 올리기</PillButton>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, opacity: 0.8 }}>
          <Avatar who="me" size={22} /><Avatar who="partner" size={22} />
          <Meta style={{ fontSize: 12 }}>둘 다 올릴 수 있어요</Meta>
        </div>
      </div>
      <div style={{ padding: '4px 20px 8px' }}>
        <Divider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0 4px' }}>
          <Icon name="Album" size={13} style={{ color: C.sub }} />
          <Meta style={{ fontSize: 12.5 }}>코스 2곳은 계획에서 그대로 남아 있어요</Meta>
        </div>
      </div>
    </Screen>
  );
}

/* ---------------- 14. Play view (slideshow) ---------------- */
function PlayView() {
  return (
    <Screen bg="#000" noHome>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 8px', color: '#fff' }}>
          <Icon name="IconChevronDown" size={24} style={{ color: '#fff' }} />
          <div style={{ textAlign: 'center' }}>
            <Eyebrow style={{ fontSize: 9.5 }}>슬라이드쇼 재생 중</Eyebrow>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 2 }}>비 오는 성수</div>
          </div>
          <Icon name="IconsAppsAppStoreMore" size={22} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1, position: 'relative', margin: '10px 16px', borderRadius: 10, overflow: 'hidden' }}>
          <img src={PHOTO.seongsu2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <Avatar who="partner" size={18} /><span style={{ fontFamily: SANS, fontSize: 11.5, color: '#fff', fontWeight: 600 }}>Jihyun</span>
          </div>
        </div>
        <div style={{ padding: '4px 24px 40px' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 2 ? '#fff' : 'rgba(255,255,255,0.28)' }} />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff' }}>3 / 12</div>
              <Meta style={{ marginTop: 2, fontSize: 12 }}>어니언 성수 · 17:32</Meta>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, marginTop: 16 }}>
            <Icon name="Back" size={26} style={{ color: '#fff' }} />
            <PlayButton size={64} playing />
            <Icon name="Forward" size={26} style={{ color: '#fff' }} />
          </div>
        </div>
      </div>
    </Screen>
  );
}

/* ---------------- 15. Full gallery ---------------- */
function Gallery() {
  const ph = [PHOTO.seongsu1, PHOTO.seongsu2, PHOTO.cafe, PHOTO.street2, PHOTO.coffee2, PHOTO.food, PHOTO.river, PHOTO.walk, PHOTO.night, PHOTO.sunset, PHOTO.d100, PHOTO.portrait];
  return (
    <Screen>
      <TopBar title="비 오는 성수" right={<span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.me }}>선택</span>} />
      <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.sub }}>사진 12 · Hyunwoo 7 · Jihyun 5</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.me }}>
          <Icon name="IconsAppsInstagramAdd" size={15} style={{ color: C.me }} /><span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600 }}>추가</span>
        </div>
      </div>
      <div style={{ padding: '0 16px 24px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
        {ph.map((p, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 3, overflow: 'hidden' }}>
            <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {i === 0 && <div style={{ position: 'absolute', left: 5, top: 5, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 999, background: 'rgba(0,0,0,0.55)' }}><Icon name="Album" size={9} style={{ color: C.me }} /><span style={{ fontFamily: SANS, fontSize: 8.5, color: '#fff', fontWeight: 700 }}>커버</span></div>}
            <div style={{ position: 'absolute', right: 4, bottom: 4 }}><Avatar who={i % 3 === 1 ? 'partner' : 'me'} size={14} /></div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------------- 16. Options sheet ---------------- */
function OptionRow({ icon, label, danger, custom }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 4px' }}>
      {custom || <Icon name={icon} size={20} style={{ color: danger ? '#E8567A' : '#fff' }} />}
      <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15.5, color: danger ? '#E8567A' : '#fff' }}>{label}</span>
    </div>
  );
}
function OptionsSheet() {
  return (
    <Screen>
      {/* dimmed archive behind */}
      <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
        <div style={{ background: 'linear-gradient(to bottom, #33414d 0%, rgba(18,18,18,0) 60%)' }}>
          <TopBar title="비 오는 성수" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 24px 20px' }}>
            <CoverArt src={PHOTO.seongsu1} size={150} shape="square" />
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff', marginTop: 14 }}>비 오는 성수</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ background: '#1c1c1c', borderRadius: '20px 20px 0 0', padding: '10px 0 30px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 20px 12px' }}>
            <CoverArt src={PHOTO.seongsu1} size={52} shape="rounded" />
            <div><div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff' }}>비 오는 성수</div><Meta style={{ marginTop: 2, fontSize: 12.5 }}>데이트 · 2026.07.04</Meta></div>
          </div>
          <Divider style={{ margin: '0 20px' }} />
          <div style={{ padding: '4px 20px 0' }}>
            <OptionRow icon="IconsAppsInstagramAdd" label="제목 수정" />
            <OptionRow icon="Album" label="커버 변경" />
            <OptionRow icon="IconsAppsInstagramAdd" label="사진 추가" />
            <OptionRow custom={<window.CalGlyph size={20} />} label="장소 추가" />
            <OptionRow icon="HeartSolid" label="Favorites에 추가" />
            <OptionRow icon="Share" label="공유" />
            <Divider style={{ margin: '4px 0' }} />
            <OptionRow icon="IconsControlCenterOrientationLock" label="데이트 삭제" danger />
          </div>
        </div>
      </div>
    </Screen>
  );
}

window.SCREENS = window.SCREENS || {};
window.SCREENS.track = {
  title: '3 · Track (데이트)',
  items: [
    { label: '11 · 플랜 모드 (upcoming)', node: <PlanMode /> },
    { label: '12 · 아카이브 모드 (released)', node: <ArchiveMode /> },
    { label: '13 · 아카이브 빈 상태', node: <ArchiveEmpty /> },
    { label: '14 · 재생 뷰 (슬라이드쇼)', node: <PlayView /> },
    { label: '15 · 사진 전체 갤러리', node: <Gallery /> },
    { label: '16 · 옵션 시트', node: <OptionsSheet /> },
  ],
};
})();
