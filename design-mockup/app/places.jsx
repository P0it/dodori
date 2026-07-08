/* ============================================================
   Group 2+ — Place & theme (custom) playlists  [addendum]
   ============================================================ */
(function () {
const {
  Screen, Eyebrow, Dday, OwnerDot, AppChrome, TopBar, Meta, Divider,
  Icon, PlayButton, IconButton, PillButton, CoverArt, SectionHeader, C, PHOTO, SANS,
} = window;

function Collage4({ ph, size = 176 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 6, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      {ph.map((p, i) => p
        ? <img key={i} src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div key={i} style={{ background: C.s2 }} />)}
    </div>
  );
}

/* ---------------- A. Custom (theme) playlist detail ---------------- */
function PlaceRow({ name, cat, visits, photos, thumb, wish }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0' }}>
      {wish ? (
        <div style={{ width: 52, height: 52, borderRadius: 8, border: `1.5px dashed ${C.sub}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="Vector" size={18} style={{ color: C.sub }} />
        </div>
      ) : (
        <CoverArt src={thumb} size={52} shape="rounded" />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15.5, color: '#fff' }}>{name}</span>
          {wish && <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 9.5, color: C.anniv, border: `1px solid ${C.anniv}`, borderRadius: 4, padding: '1px 5px' }}>가고 싶은 곳</span>}
        </div>
        <Meta style={{ marginTop: 3, fontSize: 12.5 }}>
          {cat}{wish ? ' · 사진 0' : ` · 방문 ${visits}회 · 사진 ${photos}`}
        </Meta>
      </div>
      <Icon name="IconsAppsAppStoreMore" size={22} style={{ color: C.sub }} />
    </div>
  );
}
function ThemePlaylistDetail() {
  return (
    <Screen chrome={<AppChrome tab="playlist" />}>
      <TopBar title="Cafe" right={<Icon name="IconsAppsAppStoreMore" size={20} style={{ color: '#fff' }} />} />
      <div style={{ background: 'linear-gradient(to bottom, #3a2f22 0%, rgba(18,18,18,0) 60%)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px 6px' }}>
          <Collage4 ph={[PHOTO.cafe, PHOTO.coffee2, PHOTO.street2, null]} />
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 24, color: '#fff', marginTop: 16, letterSpacing: '-0.02em' }}>Cafe</div>
          <Meta style={{ marginTop: 6 }}>테마 플레이리스트 · 장소 3곳 · 방문 4회</Meta>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 20px 12px' }}>
          <IconButton name="IconsAppsInstagramAdd" size={24} color={C.sub} label="장소 추가" />
          <IconButton name="Share" size={20} color={C.sub} label="공유" />
          <div style={{ flex: 1 }} />
          <PlayButton size={54} />
        </div>
      </div>
      <div style={{ padding: '2px 16px 8px' }}>
        <PlaceRow name="카페 어니언 성수" cat="카페 · 성수동" visits={2} photos={5} thumb={PHOTO.cafe} />
        <PlaceRow name="프릳츠 도화" cat="카페 · 마포" visits={1} photos={3} thumb={PHOTO.coffee2} />
        <PlaceRow name="라이트업 커피" cat="카페 · 연남" wish />
        <button style={addBtn}><Icon name="IconsAppsInstagramAdd" size={15} style={{ color: C.me }} />장소 담기</button>
      </div>
    </Screen>
  );
}
const addBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', height: 46, marginTop: 10, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: C.me, fontFamily: SANS, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' };

/* ---------------- B. Place detail (our data only) ---------------- */
function TrackMini({ photo, title, date, upcoming }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0' }}>
      <CoverArt src={photo} size={46} shape="rounded" style={upcoming ? { outline: `1.5px dashed ${C.me}`, outlineOffset: -1.5 } : {}} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: '#fff' }}>{title}</span>
          {upcoming && <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10, color: C.me, border: `1px solid ${C.me}`, borderRadius: 4, padding: '1px 5px' }}>예정</span>}
        </div>
        <Meta style={{ marginTop: 2, fontSize: 12.5 }}>{date}</Meta>
      </div>
      <Icon name="IconChevronRight" size={16} style={{ color: C.muted }} />
    </div>
  );
}
function PlaceDetail() {
  const ph = [PHOTO.cafe, PHOTO.coffee2, PHOTO.street2, PHOTO.seongsu2, PHOTO.food];
  return (
    <Screen>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
          <img src={PHOTO.cafe} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 40%, #121212 100%)' }} />
          <TopBar title="" right={<Icon name="IconsAppsAppStoreMore" size={20} style={{ color: '#fff' }} />} />
          <div style={{ position: 'absolute', left: 20, bottom: 12, right: 20 }}>
            <Eyebrow style={{ color: 'rgba(255,255,255,0.85)' }}>카페 · 성수동</Eyebrow>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff', marginTop: 4, letterSpacing: '-0.02em' }}>카페 어니언 성수</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 20px 4px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 12px', borderRadius: 999, background: 'rgba(30,215,96,0.12)', color: C.me, fontFamily: SANS, fontWeight: 700, fontSize: 12.5 }}>
          <Icon name="HeartSolid" size={12} style={{ color: C.me }} />방문 2회
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 12px', borderRadius: 999, background: C.s2, color: C.sub, fontFamily: SANS, fontWeight: 600, fontSize: 12.5 }}>
          <Icon name="ListeningOn" size={13} style={{ color: C.sub }} />네이버에서 보기
        </span>
      </div>
      <Meta style={{ padding: '8px 20px 4px', fontSize: 12.5 }}>서울 성동구 아차산로 5길 · 성수동2가</Meta>

      <div style={{ padding: '14px 20px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>우리 사진 <span style={{ color: C.sub, fontWeight: 500 }}>5</span></span>
          <span style={{ fontFamily: SANS, fontSize: 12, color: C.muted }}>이 장소의 데이트에서 자동 연결</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
          {ph.map((p, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 4, overflow: 'hidden' }}>
              <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
          <div style={{ aspectRatio: '1', borderRadius: 4, background: C.s1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 12, color: C.muted }}>전체</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 4px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: '#fff' }}>여기서 만든 데이트 <span style={{ color: C.sub, fontWeight: 500 }}>2</span></span>
        <div style={{ marginTop: 4 }}>
          <TrackMini photo={PHOTO.seongsu1} title="비 오는 성수" date="2026.07.04 · 사진 3" />
          <TrackMini photo={PHOTO.cafe} title="Untitled" date="2026.07.11 · D-3" upcoming />
        </div>
      </div>

      <div style={{ padding: '12px 20px 26px' }}>
        <PillButton variant="primary" style={{ width: '100%' }}>코스에 담기</PillButton>
        <button style={{ width: '100%', background: 'none', border: 'none', color: C.sub, fontFamily: SANS, fontWeight: 600, fontSize: 13.5, padding: '14px 0 2px', cursor: 'pointer' }}>테마 플레이리스트에 저장</button>
      </div>
    </Screen>
  );
}

/* ---------------- C. New playlist ---------------- */
function NewPlaylist() {
  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 6px' }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 15, color: C.sub }}>취소</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: '#fff' }}>새 플레이리스트</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.me }}>만들기</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 16px 6px' }}>
        <div style={{ position: 'relative' }}>
          <Collage4 ph={[PHOTO.cafe, PHOTO.coffee2, PHOTO.street2, null]} size={150} />
          <div style={{ position: 'absolute', right: -6, bottom: -6, width: 36, height: 36, borderRadius: '50%', background: C.s3, border: '2px solid #121212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="IconsAppsInstagramAdd" size={16} style={{ color: '#fff' }} />
          </div>
        </div>
        <Meta style={{ fontSize: 11.5, marginTop: 12 }}>담은 장소 사진으로 커버가 자동 생성돼요</Meta>
      </div>
      <div style={{ padding: '18px 24px 0' }}>
        <div style={{ padding: '4px 4px 16px', borderBottom: `1.5px solid ${C.s3}` }}>
          <input readOnly value="Cafe" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff', letterSpacing: '-0.02em', textAlign: 'center' }} />
        </div>
        <div style={{ marginTop: 22, padding: '16px', borderRadius: 12, background: C.s1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <window.CalGlyph size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14.5, color: '#fff' }}>장소 담기</div>
              <Meta style={{ marginTop: 2, fontSize: 12 }}>검색해서 가고 싶은 곳도 미리 담아둘 수 있어요</Meta>
            </div>
            <Icon name="IconChevronRight" size={16} style={{ color: C.muted }} />
          </div>
        </div>
        <Meta style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 16, textAlign: 'center' }}>
          테마 플레이리스트는 데이트가 아니라 <span style={{ color: '#fff' }}>장소</span>를 모아요.<br />예: Cafe, 야경 좋은 곳, 다음에 갈 맛집
        </Meta>
      </div>
    </Screen>
  );
}

window.SCREENS = window.SCREENS || {};
window.SCREENS.places = {
  title: '2+ · 장소 · 테마 플레이리스트',
  items: [
    { label: 'P1 · 테마 플레이리스트 상세', node: <ThemePlaylistDetail /> },
    { label: 'P2 · 장소 상세', node: <PlaceDetail /> },
    { label: 'P3 · 새 플레이리스트 만들기', node: <NewPlaylist /> },
  ],
};
})();
