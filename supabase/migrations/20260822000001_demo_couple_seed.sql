-- 포트폴리오 데모 커플 — 시드와 매일 초기화
--
-- 공개 링크(`/demo`)로 들어온 방문자는 아래 커플의 '한지우' 계정으로 자동 로그인해서
-- 앱을 그대로 만져본다. 데모 전용 코드 경로를 만들지 않는 것이 요점이다 —
-- 데모는 가짜 모드가 아니라 진짜 커플 하나이고, 앱은 자기가 데모인 줄 모른다.
--
-- 방문자가 데이터를 어지럽히므로 매일 04:00 KST에 통째로 되돌린다.
--
-- ⚠️ 이 파일은 매일 자동으로 대량 DELETE를 실행하는 코드다. 같은 DB에 실제 사용자
-- 데이터가 함께 산다. 모든 삭제는 예외 없이 demo_couple_id()로 범위를 잠근다.

-- ---------- 고정 식별자 ----------
-- 상수로 두는 이유: 삭제 범위를 이 함수 하나로 잠그면 "어디까지 지우는가"를 한 곳에서 읽을 수 있다.

create or replace function public.demo_couple_id() returns uuid
language sql immutable as $$ select '58f6b47e-e56e-4c8e-bed7-ec7b8817cd5d'::uuid $$;

create or replace function public.demo_user_jiwoo() returns uuid
language sql immutable as $$ select '568e3025-dc94-45e5-9681-166f23d4868d'::uuid $$;

create or replace function public.demo_user_seoyeon() returns uuid
language sql immutable as $$ select '0299d64f-8987-4e6f-91b8-bf5fe5114e32'::uuid $$;

-- 데모 장소의 UUID 접두사. places에는 couple_id가 없어(전역 테이블) 커플로 범위를 못 잡는다.
-- 그래서 데모가 만든 장소만 고정 UUID로 심고, 삭제도 이 접두사로만 한다.
create or replace function public.demo_place_prefix() returns text
language sql immutable as $$ select 'd0d00000-0000-4000-8000-' $$;

-- ---------- 시드 ----------

create or replace function public.seed_demo_couple()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_couple    uuid := public.demo_couple_id();
  v_jiwoo     uuid := public.demo_user_jiwoo();   -- 방문자가 되는 쪽
  v_seoyeon   uuid := public.demo_user_seoyeon(); -- 상대역
  v_today     date := (now() at time zone 'Asia/Seoul')::date;
  v_start     date;
  v_topic     uuid;
  v_topic_seq int;
  v_topic_cnt int;
  v_game_key  text;
  v_game_high boolean;
  v_created   date;
  -- 앨범(트랙)
  t1 uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); t3 uuid := gen_random_uuid();
  t4 uuid := gen_random_uuid(); t5 uuid := gen_random_uuid(); t6 uuid := gen_random_uuid();
  t7 uuid := gen_random_uuid();
  -- 가보고 싶은 곳(커스텀 리스트)
  pl1 uuid := gen_random_uuid(); pl2 uuid := gen_random_uuid();
  v_saved uuid;
  -- 게시물
  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid(); p5 uuid := gen_random_uuid(); p6 uuid := gen_random_uuid();
  p7 uuid := gen_random_uuid(); p8 uuid := gen_random_uuid(); p9 uuid := gen_random_uuid();
  c1 uuid := gen_random_uuid();
  -- 스토리
  s1 uuid := gen_random_uuid(); s2 uuid := gen_random_uuid(); s3 uuid := gen_random_uuid();
  s4 uuid := gen_random_uuid();
  -- 장소
  pf text := public.demo_place_prefix();
begin
  -- 커플이 없으면 아무것도 하지 않는다 (계정이 지워진 환경에서 조용히 통과)
  if not exists (select 1 from couples where id = v_couple) then
    raise notice 'demo couple % 없음 — 시드 건너뜀', v_couple;
    return;
  end if;

  -- 시작일: 1000일이 항상 D-14가 되도록 오늘에서 역산한다.
  -- 고정 날짜로 두면 몇 달 뒤 링크를 눌렀을 때 기념일 카드가 의미를 잃는다.
  v_start := v_today - 986;
  update couples
     set started_at = v_start,
         -- 방문자가 사진을 몇 장 올려봐도 막히지 않게 넉넉히 (실서비스 무료는 200MB)
         storage_quota_bytes = 524288000
   where id = v_couple;

  select created_at::date into v_created from couples where id = v_couple;

  -- ---------- 장소 ----------
  -- category는 네이버 지역검색 원문 형식 — lib/placeKind.ts가 이 문자열에서 아이콘을 파생한다.
  insert into places (id, name, category, address, lat, lng) values
    ((pf||'000000000001')::uuid, '대림창고 갤러리 카페', '음식점>카페,디저트',   '서울 성동구 성수이로 78',        37.5427, 127.0555),
    ((pf||'000000000002')::uuid, '어니언 성수',          '음식점>카페,디저트',   '서울 성동구 아차산로9길 8',      37.5445, 127.0567),
    ((pf||'000000000003')::uuid, '서울숲',               '여행,명소>숲,숲길',    '서울 성동구 뚝섬로 273',         37.5443, 127.0374),
    ((pf||'000000000004')::uuid, '소금집델리 성수',      '음식점>양식',          '서울 성동구 연무장길 47',        37.5423, 127.0561),
    ((pf||'000000000005')::uuid, '리움미술관',           '문화,예술>미술관',     '서울 용산구 이태원로55길 60-16', 37.5384, 126.9993),
    ((pf||'000000000006')::uuid, '국립현대미술관 서울',  '문화,예술>미술관',     '서울 종로구 삼청로 30',          37.5785, 126.9800),
    ((pf||'000000000007')::uuid, '망원한강공원',         '여행,명소>공원',       '서울 마포구 마포나루길 467',     37.5551, 126.8961),
    ((pf||'000000000008')::uuid, '연남동 감나무집',      '음식점>한식',          '서울 마포구 성미산로 161',       37.5620, 126.9250),
    ((pf||'000000000009')::uuid, '남산서울타워',         '여행,명소>전망대',     '서울 용산구 남산공원길 105',     37.5512, 126.9882),
    ((pf||'000000000010')::uuid, '안목해변 커피거리',    '음식점>카페,디저트',   '강원 강릉시 창해로14번길',       37.7955, 128.9470),
    ((pf||'000000000011')::uuid, '오죽헌',               '여행,명소>박물관',     '강원 강릉시 율곡로3139번길 24',  37.7791, 128.8784),
    ((pf||'000000000012')::uuid, '츄로 북살롱',          '쇼핑,유통>서점',       '서울 마포구 동교로 268',         37.5570, 126.9250),
    ((pf||'000000000013')::uuid, '을지로 십분의일',      '음식점>술집>와인바',   '서울 중구 을지로 105',           37.5660, 126.9910);

  -- ---------- 앨범(트랙) ----------
  -- 날짜는 전부 오늘 기준 상대값 — 초기화될 때마다 "지난 주말"이 계속 지난 주말로 남는다.
  insert into tracks (id, couple_id, title, date, duration_min, created_by) values
    (t1, v_couple, '성수 카페 투어',        v_today - 3,   240, v_seoyeon),
    (t2, v_couple, '한강에서 늦은 오후',    v_today - 17,  180, v_jiwoo),
    (t3, v_couple, '미술관 두 곳 도장깨기', v_today - 38,  330, v_seoyeon),
    (t4, v_couple, '강릉 2박 3일',          v_today - 72,  600, v_jiwoo),
    (t5, v_couple, '남산 야경 보러',        v_today - 110, 200, v_seoyeon),
    (t6, v_couple, '연남동 골목 산책',      v_today - 158, 260, v_jiwoo),
    (t7, v_couple, '우리 첫 데이트',        v_start,       150, v_jiwoo);

  insert into track_places (track_id, place_id, visit_time, sort_order, added_by, done) values
    (t1, (pf||'000000000002')::uuid, '13:00', 0, v_seoyeon, true),
    (t1, (pf||'000000000001')::uuid, '15:30', 1, v_seoyeon, true),
    (t1, (pf||'000000000004')::uuid, '18:00', 2, v_jiwoo,   true),
    (t2, (pf||'000000000007')::uuid, '16:00', 0, v_jiwoo,   true),
    (t2, (pf||'000000000008')::uuid, '19:00', 1, v_jiwoo,   true),
    (t3, (pf||'000000000006')::uuid, '11:00', 0, v_seoyeon, true),
    (t3, (pf||'000000000005')::uuid, '15:00', 1, v_seoyeon, true),
    (t4, (pf||'000000000010')::uuid, '10:00', 0, v_jiwoo,   true),
    (t4, (pf||'000000000011')::uuid, '14:00', 1, v_jiwoo,   true),
    (t5, (pf||'000000000009')::uuid, '19:30', 0, v_seoyeon, true),
    (t6, (pf||'000000000012')::uuid, '14:00', 0, v_jiwoo,   true),
    (t6, (pf||'000000000008')::uuid, '18:30', 1, v_jiwoo,   true),
    (t7, (pf||'000000000003')::uuid, '13:00', 0, v_jiwoo,   true);

  insert into notes (track_id, author_id, body) values
    (t1, v_seoyeon, '대림창고 2층 창가 자리가 제일 좋았다. 다음엔 평일에 가자.'),
    (t4, v_jiwoo,   '안목해변 커피 들고 걷던 그 아침이 이번 여행의 하이라이트.'),
    (t7, v_jiwoo,   '서울숲에서 세 시간을 걸었는데 하나도 안 힘들었던 날.');

  -- ---------- 가보고 싶은 곳 ----------
  insert into playlists (id, couple_id, kind, name, created_by, color, icon) values
    (pl1, v_couple, 'custom', '주말에 가볼 곳', v_seoyeon, 'indigo', 'coffee'),
    (pl2, v_couple, 'custom', '언젠가 멀리',    v_jiwoo,   'coral',  'star');

  insert into playlist_places (playlist_id, place_id, added_by) values
    (pl1, (pf||'000000000012')::uuid, v_seoyeon),
    (pl1, (pf||'000000000013')::uuid, v_jiwoo),
    (pl1, (pf||'000000000005')::uuid, v_seoyeon),
    (pl2, (pf||'000000000010')::uuid, v_jiwoo),
    (pl2, (pf||'000000000011')::uuid, v_jiwoo);

  -- 찜(saved)은 커플당 하나뿐이고 삭제가 트리거로 금지돼 있다 — 지우지 않고 내용만 채운다
  select id into v_saved from playlists where couple_id = v_couple and kind = 'saved' limit 1;
  if v_saved is not null then
    insert into playlist_places (playlist_id, place_id, added_by) values
      (v_saved, (pf||'000000000009')::uuid, v_seoyeon),
      (v_saved, (pf||'000000000013')::uuid, v_jiwoo);
  end if;

  -- ---------- 일정 ----------
  -- 여러 날 일정의 ends_at은 마지막 날 23:59:59 (그 날을 포함시키려고 — CLAUDE.md 규칙).
  -- 색은 사람이 아니라 일정의 속성이다.
  insert into events (couple_id, owner_id, title, starts_at, ends_at, all_day, color, place_id, description) values
    (v_couple, v_seoyeon, '저녁 같이 먹기',
      ((v_today + 1)::text || ' 19:00 Asia/Seoul')::timestamptz,
      ((v_today + 1)::text || ' 21:00 Asia/Seoul')::timestamptz, false, 'green',
      (pf||'000000000008')::uuid, '연남동에서 만나기'),
    (v_couple, v_jiwoo, '전시 예매한 날',
      ((v_today + 4)::text || ' 11:00 Asia/Seoul')::timestamptz,
      ((v_today + 4)::text || ' 14:00 Asia/Seoul')::timestamptz, false, 'purple',
      (pf||'000000000005')::uuid, null),
    (v_couple, v_seoyeon, '1000일',
      ((v_today + 14)::text || ' 00:00 Asia/Seoul')::timestamptz,
      ((v_today + 14)::text || ' 23:59:59 Asia/Seoul')::timestamptz, true, 'amber', null, null),
    (v_couple, v_jiwoo, '속초 여행',
      ((v_today + 21)::text || ' 00:00 Asia/Seoul')::timestamptz,
      ((v_today + 23)::text || ' 23:59:59 Asia/Seoul')::timestamptz, true, 'blue', null, '2박 3일, 숙소는 예약 완료'),
    (v_couple, v_seoyeon, '서연 회사 워크숍',
      ((v_today + 8)::text || ' 09:00 Asia/Seoul')::timestamptz,
      ((v_today + 9)::text || ' 23:59:59 Asia/Seoul')::timestamptz, true, 'indigo', null, null),
    (v_couple, v_jiwoo, '치과',
      ((v_today + 6)::text || ' 15:30 Asia/Seoul')::timestamptz,
      ((v_today + 6)::text || ' 16:30 Asia/Seoul')::timestamptz, false, 'red', null, null),
    (v_couple, v_seoyeon, '영화 보기',
      ((v_today - 2)::text || ' 20:00 Asia/Seoul')::timestamptz,
      ((v_today - 2)::text || ' 22:30 Asia/Seoul')::timestamptz, false, 'pink', null, null),
    (v_couple, v_jiwoo, '성수 카페 투어',
      ((v_today - 3)::text || ' 13:00 Asia/Seoul')::timestamptz,
      ((v_today - 3)::text || ' 18:00 Asia/Seoul')::timestamptz, false, 'lime',
      (pf||'000000000002')::uuid, null),
    (v_couple, v_seoyeon, '엄마 생신',
      ((v_today - 9)::text || ' 00:00 Asia/Seoul')::timestamptz,
      ((v_today - 9)::text || ' 23:59:59 Asia/Seoul')::timestamptz, true, 'coral', null, null),
    (v_couple, v_jiwoo, '책방 모임',
      ((v_today + 12)::text || ' 19:30 Asia/Seoul')::timestamptz,
      ((v_today + 12)::text || ' 21:30 Asia/Seoul')::timestamptz, false, 'blue',
      (pf||'000000000012')::uuid, null),
    (v_couple, v_seoyeon, '건강검진',
      ((v_today + 33)::text || ' 08:30 Asia/Seoul')::timestamptz,
      ((v_today + 33)::text || ' 11:00 Asia/Seoul')::timestamptz, false, 'green', null, null),
    (v_couple, v_jiwoo, '지우 생일',
      ((v_today + 40)::text || ' 00:00 Asia/Seoul')::timestamptz,
      ((v_today + 40)::text || ' 23:59:59 Asia/Seoul')::timestamptz, true, 'amber', null, null);

  -- ---------- 기념일 ----------
  insert into anniversaries (couple_id, type, label, date, repeat_yearly) values
    (v_couple, 'd100',   '100일',  v_start + 100,  false),
    (v_couple, 'd200',   '200일',  v_start + 200,  false),
    (v_couple, 'd300',   '300일',  v_start + 300,  false),
    (v_couple, 'yearly', '1주년',  v_start + 365,  true),
    (v_couple, 'yearly', '2주년',  v_start + 730,  true),
    (v_couple, 'custom', '1000일', v_start + 1000, false);

  -- ---------- 게시물 ----------
  insert into posts (id, couple_id, author_id, caption, created_at) values
    (p1, v_couple, v_seoyeon, '성수 카페 투어 3차전. 오늘은 진짜 커피만 마셨다.',                now() - interval '3 days'),
    (p2, v_couple, v_jiwoo,   '소금집 파스타는 실패가 없다',                                    now() - interval '3 days 2 hours'),
    (p3, v_couple, v_seoyeon, '한강 노을. 여기 앉아서 한 시간 아무 말도 안 했다.',              now() - interval '17 days'),
    (p4, v_couple, v_jiwoo,   '전시 두 개 연달아 보면 다리가 아프다는 걸 배웠음',              now() - interval '38 days'),
    (p5, v_couple, v_seoyeon, '강릉 첫날 아침. 커피 들고 바다 앞까지 걸어감',                   now() - interval '72 days'),
    (p6, v_couple, v_jiwoo,   '오죽헌 조용해서 좋았다',                                          now() - interval '71 days'),
    (p7, v_couple, v_seoyeon, '남산 케이블카 줄이 40분… 그래도 야경은 봤다',                    now() - interval '110 days'),
    (p8, v_couple, v_jiwoo,   '연남동 골목 헤매다 발견한 서점. 다음에 또 가자',                 now() - interval '158 days'),
    (p9, v_couple, v_jiwoo,   '우리 처음 만난 날. 서울숲 세 바퀴 돌았던 거 기억나?',           now() - interval '986 days');

  insert into post_reactions (post_id, user_id, emoji) values
    (p1, v_jiwoo, '❤️'), (p3, v_jiwoo, '❤️'), (p5, v_jiwoo, '😍'),
    (p2, v_seoyeon, '❤️'), (p4, v_seoyeon, '😂'), (p8, v_seoyeon, '❤️'), (p9, v_seoyeon, '🥹');

  insert into post_comments (id, post_id, author_id, body, created_at) values
    (c1,                p1, v_jiwoo,   '세 번째 잔은 좀 무리였다',        now() - interval '2 days 20 hours'),
    (gen_random_uuid(), p1, v_seoyeon, '그래놓고 또 시켰잖아',            now() - interval '2 days 19 hours'),
    (gen_random_uuid(), p3, v_jiwoo,   '이 사진 배경화면 함',              now() - interval '16 days'),
    (gen_random_uuid(), p5, v_jiwoo,   '그날 커피 이름이 뭐였지',          now() - interval '71 days'),
    (gen_random_uuid(), p9, v_seoyeon, '기억나지 그럼. 너 엄청 긴장했었어', now() - interval '985 days');

  -- 대댓글 (parent_id) — 피드의 대댓글 표시를 데모에서도 보여준다
  insert into post_comments (post_id, author_id, body, parent_id, created_at) values
    (p1, v_seoyeon, '내일은 디카페인으로 가자', c1, now() - interval '2 days 18 hours');

  -- ---------- 스토리 ----------
  -- 스토리는 24시간이 지나면 홈 링에서 내려간다 (lib/stories.ts: STORY_TTL_MS).
  -- 초기화는 04:00에 한 번뿐이라, "9시간 전"처럼 심으면 그날 저녁엔 이미 링에서 사라진다.
  -- 그래서 전부 초기화 직후로 몰아 다음 초기화까지 살아 있게 하고,
  -- 문구도 시간대를 못 박지 않는다 ('출근길'은 오후에 보면 어색하다).
  insert into stories (id, couple_id, author_id, caption, created_at) values
    (s1, v_couple, v_seoyeon, '오늘은 좀 걷고 싶은 날',   now() - interval '2 hours'),
    (s2, v_couple, v_jiwoo,   '늦은 점심',               now() - interval '80 minutes'),
    (s3, v_couple, v_seoyeon, '집 가는 길',              now() - interval '40 minutes'),
    (s4, v_couple, v_jiwoo,   '디저트는 배가 따로 있음', now() - interval '10 minutes');

  -- ---------- 사진 ----------
  -- 파일은 Storage에 미리 올려두었고 초기화해도 지우지 않는다 — 여기서는 행만 다시 심는다.
  -- 경로 규칙은 lib/media.ts 그대로: 본체 {name}.jpg, 목록 {name}_360.jpg (renditions=true).
  -- width/height/bytes는 실제 파일에서 잰 값이다. bytes가 틀리면 용량 표시가 어긋난다.
  with meta(slot, w, h, b) as (values
    ('alley1',1080,608,165530), ('beach1',1080,720,87978),  ('beach2',1080,720,180355),
    ('book1',1080,720,269039),  ('cafe1',1080,720,245785),  ('cafe2',1080,1080,410492),
    ('cafe3',1080,720,202473),  ('cover1',1080,720,49655),  ('food1',1080,720,79087),
    ('food2',1080,720,255545),  ('hanok1',1080,720,231879), ('museum1',1080,810,103255),
    ('museum2',1080,721,72346), ('night1',1080,721,183777), ('night2',1080,720,132867),
    ('park1',1080,810,364175),  ('park2',1080,720,153468),  ('river1',1080,720,238174),
    ('river2',1080,720,214447), ('story1',1080,608,144310), ('story2',1080,1080,258693),
    ('story3',1080,720,136986), ('story4',1080,720,133185)
  ), plan(kind, pid, slot, uploader, ago) as (values
    -- 앨범 사진 (각 앨범의 첫 줄이 커버가 된다)
    ('track', t1, 'cafe1',   v_seoyeon, '3 days'),
    ('track', t1, 'cafe3',   v_seoyeon, '3 days'),
    ('track', t1, 'cover1',  v_jiwoo,   '3 days'),
    ('track', t2, 'river1',  v_jiwoo,   '17 days'),
    ('track', t2, 'river2',  v_jiwoo,   '17 days'),
    ('track', t3, 'museum1', v_seoyeon, '38 days'),
    ('track', t3, 'museum2', v_seoyeon, '38 days'),
    ('track', t4, 'beach1',  v_jiwoo,   '72 days'),
    ('track', t4, 'beach2',  v_jiwoo,   '72 days'),
    ('track', t5, 'night1',  v_seoyeon, '110 days'),
    ('track', t5, 'night2',  v_seoyeon, '110 days'),
    ('track', t6, 'book1',   v_jiwoo,   '158 days'),
    ('track', t6, 'alley1',  v_jiwoo,   '158 days'),
    ('track', t7, 'park2',   v_jiwoo,   '986 days'),
    ('track', t7, 'park1',   v_jiwoo,   '986 days'),
    -- 게시물 사진 (일부는 앨범과 같은 파일을 가리킨다 — 앨범에도 올리고 피드에도 올린 사진)
    ('post',  p1, 'cafe2',   v_seoyeon, '3 days'),
    ('post',  p2, 'food1',   v_jiwoo,   '3 days'),
    ('post',  p2, 'food2',   v_jiwoo,   '3 days'),
    ('post',  p3, 'river1',  v_seoyeon, '17 days'),
    ('post',  p4, 'museum2', v_jiwoo,   '38 days'),
    ('post',  p5, 'beach1',  v_seoyeon, '72 days'),
    ('post',  p6, 'hanok1',  v_jiwoo,   '71 days'),
    ('post',  p7, 'night1',  v_seoyeon, '110 days'),
    ('post',  p8, 'book1',   v_jiwoo,   '158 days'),
    ('post',  p9, 'park2',   v_jiwoo,   '986 days'),
    -- 스토리
    ('story', s1, 'story1',  v_seoyeon, '2 hours'),
    ('story', s2, 'story2',  v_jiwoo,   '80 minutes'),
    ('story', s3, 'story3',  v_seoyeon, '40 minutes'),
    ('story', s4, 'story4',  v_jiwoo,   '10 minutes')
  )
  insert into photos (couple_id, track_id, post_id, story_id, uploader_id,
                      storage_path, width, height, taken_at, created_at, renditions, bytes)
  select v_couple,
         case when pl.kind = 'track' then pl.pid end,
         case when pl.kind = 'post'  then pl.pid end,
         case when pl.kind = 'story' then pl.pid end,
         pl.uploader,
         v_couple || '/demo-' || pl.slot || '.jpg',
         m.w, m.h,
         now() - pl.ago::interval,
         now() - pl.ago::interval,
         true, m.b
    from plan pl join meta m on m.slot = pl.slot;

  -- 앨범 커버 — 위 목록에서 각 앨범의 첫 줄로 지정한 사진
  update tracks tr set cover_photo_id = (
    select ph.id from photos ph
     where ph.track_id = tr.id
       and ph.storage_path = v_couple || '/demo-' || x.slot || '.jpg')
    from (values (t1,'cafe1'), (t2,'river1'), (t3,'museum1'), (t4,'beach1'),
                 (t5,'night1'), (t6,'book1'), (t7,'park2')) as x(tid, slot)
   where tr.id = x.tid;

  -- ---------- 오늘의 주제 ----------
  -- 규칙은 lib/topics.ts와 같다: 커플 생성일로부터 지난 일수 % 주제수 + 1.
  -- 서연은 이미 투표했고 지우는 아직이다 — 방문자가 직접 투표해야 상대 답이 열리는
  -- 이 앱의 핵심 인터랙션을 데모에서 실제로 겪게 하려는 것이다. 다 열어두면 안 보인다.
  select count(*) into v_topic_cnt from topics;
  if v_topic_cnt > 0 then
    v_topic_seq := ((v_today - v_created) % v_topic_cnt) + 1;
    select id into v_topic from topics where seq = v_topic_seq;
    if v_topic is not null then
      insert into topic_votes (couple_id, topic_id, user_id, choice)
        values (v_couple, v_topic, v_seoyeon, 'b');
      insert into topic_comments (couple_id, topic_id, author_id, body)
        values (v_couple, v_topic, v_seoyeon, '너는 뭐 골랐는지 궁금하다');
    end if;

    -- 지난 주제 히스토리 — 둘 다 투표한 날들 (오늘 이전 seq만 히스토리에 뜬다)
    insert into topic_votes (couple_id, topic_id, user_id, choice, created_at)
    select v_couple, t.id, u.uid,
           (array['a','b','c','d'])[1 + ((t.seq + case when u.uid = v_jiwoo then 0 else 2 end) % 4)],
           now() - ((v_topic_seq - t.seq) || ' days')::interval
      from topics t
      cross join (select v_jiwoo as uid union all select v_seoyeon) u
     where t.seq < v_topic_seq and t.seq >= greatest(1, v_topic_seq - 12);
  end if;

  -- ---------- 오늘의 게임 ----------
  -- 종목은 요일 고정(lib/games.ts: epochDay+3 → 월=0). 서연만 3판을 마쳤고 지우는 안 했다.
  select key, hib into v_game_key, v_game_high from (
    select key, hib, idx from (values
      ('reaction', false, 0), ('whack',  true, 1), ('oddcolor', true, 2),
      ('tensec',   false, 3), ('taprush', true, 4), ('stroop',  true, 5),
      ('sequence', false, 6)
    ) as g(key, hib, idx)
  ) c where idx = (((v_today - date '1970-01-01') + 3) % 7 + 7) % 7;

  insert into game_scores (couple_id, game_date, user_id, game_key, best_score, attempts, higher_is_better, scores)
  values (
    v_couple, v_today, v_seoyeon, v_game_key,
    case when v_game_high then 24 else 312 end, 3, v_game_high,
    case when v_game_high then array[18, 21, 24]::numeric[] else array[366, 341, 312]::numeric[] end
  );

  raise notice '데모 시드 완료 — 오늘 %, 시작일 %, 주제 seq %, 게임 %', v_today, v_start, v_topic_seq, v_game_key;
end;
$fn$;

-- ---------- 초기화 ----------

create or replace function public.reset_demo_couple()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_couple uuid := public.demo_couple_id();
  pf       text := public.demo_place_prefix();
begin
  -- 가드: 데모 커플이 실재하지 않으면 아무것도 지우지 않는다.
  -- 이 함수는 cron이 매일 자동으로 돌린다 — 아무도 보고 있지 않을 때 도는 DELETE라
  -- 범위가 어긋나면 실제 사용자 데이터가 사라진다. 모든 삭제에 couple_id 조건이 붙는다.
  if not exists (select 1 from couples where id = v_couple) then
    raise notice 'demo couple % 없음 — 초기화 건너뜀', v_couple;
    return;
  end if;

  -- 알림 트리거를 잠시 끈다. 켜둔 채로 시드하면 게시물·스토리·댓글 수십 행이
  -- 그만큼의 알림을 만들고 pg_net으로 워커까지 두드린다(매일 새벽에).
  alter table posts          disable trigger posts_enqueue_notification;
  alter table stories        disable trigger stories_enqueue_notification;
  alter table post_comments  disable trigger post_comments_enqueue_notification;
  alter table story_comments disable trigger story_comments_enqueue_notification;

  -- 삭제 — 자식은 대부분 cascade로 함께 사라진다
  delete from topic_votes    where couple_id = v_couple;
  delete from topic_comments where couple_id = v_couple;
  delete from game_scores    where couple_id = v_couple;
  delete from game_comments  where couple_id = v_couple;
  delete from notifications  where couple_id = v_couple;
  delete from posts          where couple_id = v_couple;
  delete from stories        where couple_id = v_couple;
  delete from photos         where couple_id = v_couple;
  delete from tracks         where couple_id = v_couple;
  delete from events         where couple_id = v_couple;
  delete from anniversaries  where couple_id = v_couple;

  -- 찜(saved)은 삭제가 트리거로 금지돼 있다 — 지우면 매일 밤 예외가 나서
  -- 초기화 트랜잭션 전체가 실패한다. 커스텀 리스트만 지우고 찜은 내용만 비운다.
  delete from playlist_places
   where playlist_id in (select id from playlists where couple_id = v_couple);
  delete from playlists where couple_id = v_couple and kind = 'custom';

  -- places에는 couple_id가 없다 — 데모가 심은 고정 UUID만 정확히 지운다
  delete from places where id::text like pf || '%';

  perform public.seed_demo_couple();

  alter table posts          enable trigger posts_enqueue_notification;
  alter table stories        enable trigger stories_enqueue_notification;
  alter table post_comments  enable trigger post_comments_enqueue_notification;
  alter table story_comments enable trigger story_comments_enqueue_notification;
end;
$fn$;

-- 클라이언트에서 부를 수 있으면 방문자가 남의 화면을 초기화할 수 있다
revoke execute on function public.seed_demo_couple()  from anon, authenticated, public;
revoke execute on function public.reset_demo_couple() from anon, authenticated, public;

-- ---------- cron ----------
-- 19:00 UTC = 04:00 KST. daily-release(00:05 KST)가 새 날짜를 자리잡은 뒤에 돈다.
select cron.unschedule('reset-demo') where exists (select 1 from cron.job where jobname = 'reset-demo');
select cron.schedule('reset-demo', '0 19 * * *', 'select public.reset_demo_couple()');
