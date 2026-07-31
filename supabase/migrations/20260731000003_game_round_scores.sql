-- ============================================================
-- 회차별 기록 — 최고점만으로는 "1차보다 3차가 나아졌다"가 안 보인다.
-- best_score는 그대로 두고(비교·정렬이 이미 여기 붙어 있다) 원점수 배열을 곁들인다.
-- 공개 규칙은 행 단위 RLS라 배열도 같이 가려진다 — 정책은 손대지 않는다.
-- ============================================================

alter table public.game_scores
  add column scores numeric[] not null default '{}';

-- 이미 쌓인 행은 최고점 한 판만 친 것으로 채운다 (원점수를 되살릴 방법이 없다)
update public.game_scores set scores = array[best_score] where scores = '{}';

-- 매 판 원점수를 이어붙인다. 나머지 동작(best 갱신·3판 상한)은 그대로.
create or replace function public.submit_game_round(
  p_game_key text, p_score numeric, p_higher_is_better boolean, p_date date
) returns public.game_scores
language plpgsql security definer set search_path = public as $$
declare
  result public.game_scores;
  cid uuid := public.my_couple_id();
begin
  if cid is null then raise exception '커플 없음'; end if;

  insert into public.game_scores
    (couple_id, game_date, user_id, game_key, best_score, attempts, higher_is_better, scores)
  values (cid, p_date, auth.uid(), p_game_key, p_score, 1, p_higher_is_better, array[p_score])
  on conflict (couple_id, game_date, user_id) do update set
    attempts   = game_scores.attempts + 1,
    best_score = case when game_scores.higher_is_better
                      then greatest(game_scores.best_score, excluded.best_score)
                      else least(game_scores.best_score, excluded.best_score) end,
    scores     = game_scores.scores || excluded.scores,
    updated_at = now()
  where game_scores.attempts < 3
  returning * into result;

  return result; -- 3판 도달 시 update 0행 → result는 null
end;
$$;
