-- 일정 색 팔레트 확장 (lime·indigo·coral) — theme/tokens.ts eventColor와 키가 일치해야 한다.
-- CHECK가 열거형이라 팔레트에 색을 더할 때마다 여기도 같이 넓힌다.
-- 기존 키는 그대로 두므로 저장된 값은 손대지 않는다.
alter table public.events drop constraint events_color_check;
alter table public.events add constraint events_color_check
  check (color in ('green', 'lime', 'blue', 'indigo', 'purple', 'pink', 'coral', 'amber', 'red'));
