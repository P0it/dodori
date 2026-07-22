# -*- coding: utf-8 -*-
"""docs/topics-160.json 을 편집한 뒤 실행하면 마이그레이션을 다시 생성한다.
   실행: python scripts/build-topics-migration.py
   seq 1~120은 제자리 UPDATE, 121 이상은 INSERT 로 나간다."""
import json, sys

SRC = 'docs/topics-160.json'
SQL = 'supabase/migrations/20260714000001_topics_reseed.sql'

HEADER = """-- 오늘의 주제 전면 개편 — 소재를 갈아엎고 40개 추가 (총 160개).
-- 이 파일은 docs/topics-160.json 에서 생성된다 (scripts/build-topics-migration.py).
-- 손으로 고치지 말고 JSON을 고친 뒤 스크립트를 다시 돌릴 것.
--
-- 지킬 것 (원본 제외 목록에 빠져 있던 세 축):
--   * 신뢰·감시  * 공개 요구  * 자백형(상대 앞에서 아무도 못 고르는 B)
--
-- 1~120은 삭제가 아니라 제자리 update다: topicSeqForDay()가 (elapsed % count) + 1이라
-- seq는 1..N이 비는 곳 없이 연속이어야 한다. 121부터는 insert.

-- 주제 대부분이 다른 질문이 됐다. 기존 투표·댓글은 이제 엉뚱한 답이다 (베타 전 테스트 데이터).
delete from public.topic_comments;
delete from public.topic_votes;
"""


def q(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    rows = json.load(open(SRC, encoding='utf-8'))

    seen = {}
    for r in rows:
        seq = r['seq']
        for col in ('question', 'a', 'b'):
            if not str(r.get(col, '')).strip():
                sys.exit('빈 칸: seq %s %s' % (seq, col))
        if seq in seen:
            sys.exit('seq 중복: %s' % seq)
        seen[seq] = r
    seqs = sorted(seen)
    if seqs != list(range(1, len(seqs) + 1)):
        sys.exit('seq가 1..N 연속이 아님: %s' % seqs)

    upd = [seen[s] for s in seqs if s <= 120]
    ins = [seen[s] for s in seqs if s > 120]

    out = [HEADER, '', 'update public.topics as t',
           'set question = v.question, option_a = v.option_a, option_b = v.option_b',
           'from (values']
    for i, r in enumerate(upd):
        tail = ',' if i < len(upd) - 1 else ''
        out.append('  (%s, %s, %s, %s)%s'
                   % (r['seq'], q(r['question']), q(r['a']), q(r['b']), tail))
    out.append(') as v (seq, question, option_a, option_b)')
    out.append('where t.seq = v.seq;')

    if ins:
        out += ['', '-- 121~ · 신규',
                'insert into public.topics (seq, question, option_a, option_b) values']
        for i, r in enumerate(ins):
            tail = ',' if i < len(ins) - 1 else ';'
            out.append('  (%s, %s, %s, %s)%s'
                       % (r['seq'], q(r['question']), q(r['a']), q(r['b']), tail))

    open(SQL, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('생성 완료: %s (update %d, insert %d)' % (SQL, len(upd), len(ins)))


if __name__ == '__main__':
    main()
