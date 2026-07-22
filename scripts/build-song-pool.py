# -*- coding: utf-8 -*-
"""docs/song-candidates.json(LLM이 발굴한 후보)을 iTunes로 검증·보강해 시드를 생성한다.
   실행: python scripts/build-song-pool.py

   iTunes는 아무 쿼리에나 fuzzy 결과를 돌려준다 ("싸이 강남스타일" → Kenny Rogers).
   그래서 "결과 있음 = 존재"가 아니다. 아티스트와 제목이 **둘 다** 일치하는 결과만
   채택한다 — 이 매칭이 곧 LLM 환각 필터다.

   한글 제목은 iTunes가 영문/로마자로 색인하는 경우가 많아(강남스타일 → Gangnam Style)
   후보에 title_en 과 title_kr 을 모두 두고 어느 쪽이든 맞으면 통과시킨다."""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

SRC = 'docs/song-candidates.json'
SQL = 'supabase/migrations/20260716000004_song_pool_seed.sql'

HEADER = """-- 오늘의 추천곡 풀 시드 — 이 파일은 docs/song-candidates.json 에서 생성된다
-- (scripts/build-song-pool.py). 손으로 고치지 말고 JSON을 고친 뒤 스크립트를 다시 돌릴 것.
--
-- 모든 곡은 iTunes 검색으로 실재가 확인된 것만 들어온다 (아티스트+제목 동시 일치).
-- artwork/preview/apple_url 은 그때 함께 받아온 값이라 런타임엔 외부 호출이 없다.
-- seq 는 0..N-1 연속 — pickTodaySong()이 (epochDay % count)로 인덱싱한다.

delete from public.song_pool;
"""


def q(s):
    return "'" + s.replace("'", "''") + "'"


def norm(s):
    return re.sub(r'[^a-z0-9가-힣]', '', (s or '').lower())


def search(term):
    """iTunes는 약 20회/분으로 제한한다 — 간격을 지키고, 429면 물러섰다 다시 친다."""
    params = urllib.parse.urlencode({
        'term': term, 'country': 'KR', 'media': 'music', 'entity': 'song', 'limit': 25,
    })
    url = 'https://itunes.apple.com/search?%s' % params
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                time.sleep(3.2)  # 다음 호출까지의 간격 (≈19회/분)
                return json.load(r).get('results', [])
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            back = 20 * (attempt + 1)
            print('  429 — %d초 대기 후 재시도' % back)
            time.sleep(back)
    raise RuntimeError('429가 계속된다: %s' % term)


def hit(needle, hay):
    """짧은 이름(IU, PSY, TT)은 부분일치가 오탐을 낳는다 — 4자 미만은 완전일치만."""
    if not needle or not hay:
        return False
    if needle == hay:
        return True
    return len(needle) >= 4 and (needle in hay or hay in needle)


"""원곡이 아니라는 표식 — 괄호 안에 붙는다. 단어 경계로 봐야 Alive·Believer가 안 걸린다.
   feat.은 원곡 제목에도 흔해서(작은 것들을 위한 시 [feat. Halsey]) 표식이 아니다."""
VARIANT = re.compile(r'\b(live|remix|instrumental|inst|acoustic|karaoke|cover|version|ver)\b', re.I)


def queries_for(cand):
    """아티스트×제목 교차 — 'IU eight'는 KR 스토어에서 안 잡혀도 '아이유 eight'는 잡힌다."""
    artists = [a for a in (cand.get('artist_en'), cand.get('artist_kr')) if a]
    titles = [t for t in (cand.get('title_en'), cand.get('title_kr')) if t]
    seen, out = set(), []
    for a in artists:
        for t in titles:
            term = '%s %s' % (a, t)
            if term not in seen:
                seen.add(term)
                out.append(term)
    return out


def match(cand, results):
    artists = [norm(a) for a in (cand.get('artist_en'), cand.get('artist_kr')) if a]
    titles = [norm(t) for t in (cand.get('title_en'), cand.get('title_kr')) if t]
    found = []
    for r in results:
        if not r.get('previewUrl') or not r.get('artworkUrl100') or not r.get('trackViewUrl'):
            continue
        raw = r.get('trackName') or ''
        ra, rt = norm(r.get('artistName')), norm(raw)
        if not any(hit(a, ra) for a in artists):
            continue
        if not any(hit(t, rt) for t in titles):
            continue
        # 원곡을 고르려고: 제목 완전일치 → 라이브/리믹스 아님 → 짧은 제목 순.
        # 감점일 뿐 배제가 아니다 — 변형판밖에 없으면 그거라도 쓴다.
        found.append((0 if rt in titles else 1, 1 if VARIANT.search(raw) else 0, len(rt), r))
    if not found:
        return None
    found.sort(key=lambda x: (x[0], x[1], x[2]))
    return found[0][3]


def main():
    cands = json.load(open(SRC, encoding='utf-8'))
    kept, dropped, by_id = [], [], {}

    for c in cands:
        label = '%s - %s' % (c.get('artist_en'), c.get('title_en'))

        found = None
        for term in queries_for(c):
            try:
                found = match(c, search(term))
            except Exception as e:  # 네트워크 실패는 후보 탈락이 아니라 중단 사유
                sys.exit('iTunes 호출 실패 (%s): %s' % (term, e))
            if found:
                break

        if not found:
            dropped.append(label)
            continue
        tid = found['trackId']
        if tid in by_id:  # 같은 곡이 두 후보로 들어온 경우
            continue
        by_id[tid] = True
        kept.append({
            'itunes_id': tid,
            'title': found['trackName'],
            'artist': found['artistName'],
            'artwork_url': found['artworkUrl100'].replace('100x100bb', '600x600bb'),
            'preview_url': found['previewUrl'],
            'apple_url': found['trackViewUrl'],
            'mood': c.get('mood'),
        })

    if not kept:
        sys.exit('통과한 곡이 없다 — 후보나 매칭을 확인할 것')

    out = [HEADER, '',
           'insert into public.song_pool (seq, itunes_id, title, artist, artwork_url, preview_url, apple_url, mood) values']
    for i, s in enumerate(kept):
        tail = ',' if i < len(kept) - 1 else ';'
        out.append('  (%d, %d, %s, %s, %s, %s, %s, %s)%s' % (
            i, s['itunes_id'], q(s['title']), q(s['artist']), q(s['artwork_url']),
            q(s['preview_url']), q(s['apple_url']),
            q(s['mood']) if s['mood'] else 'null', tail))

    open(SQL, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('생성 완료: %s' % SQL)
    print('  통과 %d곡 / 탈락 %d곡' % (len(kept), len(dropped)))
    for d in dropped:
        print('  DROP: %s' % d)


if __name__ == '__main__':
    main()
