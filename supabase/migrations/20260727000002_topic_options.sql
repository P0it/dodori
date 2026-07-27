-- 오늘의 주제 — 2지선다 고정에서 N지선다(2~5)로.
-- option_a/option_b 두 칼럼이 DB부터 UI까지 박혀 있어 4~5지선다 문항을 넣을 수 없었다.

alter table public.topics add column options jsonb;
update public.topics set options = jsonb_build_array(option_a, option_b);
alter table public.topics alter column options set not null;

-- 상한 5 — topic_votes.choice가 a~e 한 글자다 (아래 제약과 짝).
alter table public.topics
  add constraint topics_options_len
  check (jsonb_array_length(options) between 2 and 5);

alter table public.topics drop column option_a;
alter table public.topics drop column option_b;

-- 기존 표('a','b')는 그대로 유효하다 — 넓히기만 한다.
alter table public.topic_votes drop constraint if exists topic_votes_choice_check;
alter table public.topic_votes
  add constraint topic_votes_choice_check
  check (choice in ('a', 'b', 'c', 'd', 'e'));
