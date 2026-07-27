# -*- coding: utf-8 -*-
"""docs/topics.json 을 편집한 뒤 실행하면 마이그레이션을 생성한다.
   실행: python scripts/build-topics-migration.py [출력.sql]

   항목: {"seq": 1, "question": "...", "options": ["A", "B"]}
   선택지는 2~5개 (topic_votes.choice가 a~e 한 글자라 5가 상한).

   seq 유니크 기준 upsert 한 방이라 신규·수정 구분이 필요 없다.
   이미 적용된 마이그레이션은 다시 돌지 않으므로, 문항을 고쳤으면
   새 날짜의 파일명을 인자로 넘겨 새 마이그레이션을 만들 것."""
import json, io, sys

SRC = 'docs/topics.json'
DEFAULT_SQL = 'supabase/migrations/20260727000003_topics_seed.sql'
MAX_OPTIONS = 5

HEADER = """-- 오늘의 주제 — docs/topics.json 에서 생성 (scripts/build-topics-migration.py).
-- 손으로 고치지 말고 JSON을 고친 뒤 스크립트를 다시 돌릴 것.
--
-- seq 기준 upsert다. topicSeqForDay()가 (elapsed % count) + 1이라
-- seq는 1..N이 비는 곳 없이 연속이어야 한다 (스크립트가 검사한다).
"""


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SQL
    rows = json.load(io.open(SRC, encoding='utf-8'))

    seen = {}
    for r in rows:
        seq = r['seq']
        if not str(r.get('question', '')).strip():
            sys.exit('빈 질문: seq %s' % seq)
        opts = r.get('options') or []
        if not 2 <= len(opts) <= MAX_OPTIONS:
            sys.exit('선택지는 2~%d개여야 함: seq %s (%d개)' % (MAX_OPTIONS, seq, len(opts)))
        if any(not str(o).strip() for o in opts):
            sys.exit('빈 선택지: seq %s' % seq)
        if seq in seen:
            sys.exit('seq 중복: %s' % seq)
        seen[seq] = r
    seqs = sorted(seen)
    if seqs != list(range(1, len(seqs) + 1)):
        sys.exit('seq가 1..N 연속이 아님 (총 %d개)' % len(seqs))

    out = [HEADER, '', 'insert into public.topics (seq, question, options) values']
    for i, s in enumerate(seqs):
        r = seen[s]
        tail = ',' if i < len(seqs) - 1 else ''
        opts = json.dumps(r['options'], ensure_ascii=False)
        out.append('  (%s, %s, %s::jsonb)%s' % (r['seq'], q(r['question']), q(opts), tail))
    out += ['on conflict (seq) do update',
            '  set question = excluded.question,',
            '      options = excluded.options;']

    io.open(out_path, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    dist = {}
    for s in seqs:
        n = len(seen[s]['options'])
        dist[n] = dist.get(n, 0) + 1
    print('생성 완료: %s (%d개, 선택지 분포 %s)'
          % (out_path, len(seqs), ', '.join('%d지선다 %d' % (k, dist[k]) for k in sorted(dist))))


if __name__ == '__main__':
    main()
