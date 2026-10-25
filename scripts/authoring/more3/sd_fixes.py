"""Quality fixes to existing System Design lessons (topics 1-120).

Each fix is an exact, asserted replacement on the authored JSON, so the script
fails loudly if the source has drifted and is safe to re-run (already-applied
fixes are skipped). Formatting of the JSON files is preserved byte for byte
apart from the edited values.
"""
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'authored')


def js(s):
    """A Python string as it appears inside a JSON string literal in these files."""
    return json.dumps(s, ensure_ascii=False)[1:-1]


# (file, old text, new text[, expected matches]). Text fixes are applied as raw replacements.
TEXT = [
    # t15-a4: replace a distractor nobody would pick with a real misconception, and explain every option
    ('lessons-01-20.json', 'In-process caches cannot store strings', 'Cache hits now need a network round trip each'),
    ('lessons-01-20.json', 'Local caches are the fastest hit but the hardest to keep consistent.',
     'Fifty private copies mean an update must be invalidated in all 50, or some instances serve stale data. '
     'In-process hits are the fastest, with no network hop, so neither the round-trip option nor the "slower than Redis" option is a downside; '
     'local caches also do not need their own database.'),
    # t20 interactive: the reveal contradicted card t20-c2 (split a hot board by player id)
    ('interactive/r1-r4.json', 'For very large contests, shard by contest, not by player.',
     'Separate contests can live on different nodes; if one board outgrows a node, split it by player id and merge each shard’s top 10.'),
    # t28: semi-synchronous replication guarantees the follower received the write, not that it applied it
    ('lessons-21-40.json',
     'With semi-synchronous replication to one follower, the lag for acknowledged writes on that follower is zero,',
     'With semi-synchronous replication to one follower, every acknowledged write has already reached that follower’s log (received, though not necessarily applied), so failing over to it loses no acknowledged writes,'),
    ('deep/r5-databases.json',
     'With semi-synchronous replication to one follower, the lag for acknowledged writes on that follower is zero,',
     'With semi-synchronous replication to one follower, every acknowledged write has already reached that follower’s log (received, though not necessarily applied), so failing over to it loses no acknowledged writes,'),
    # t35-c1: hedge an absolute
    ('lessons-21-40.json', 'Many systems never need sharding. First fix',
     'Many systems can go a long way without sharding. First fix'),
    # t54 flashcard: percentile definition
    ('lessons-41-60.json', '99% of requests are faster than this.', '99% of requests are at or below this latency.'),
    # t61: durability is a design target, and "infinitely" is not a property
    ('lessons-61-80.json', 'Object stores are durable (11 nines), cheap and scale infinitely.',
     'Object stores are designed for very high durability (S3 quotes 11 nines a year), are cheap per GB and hold a practically unlimited number of objects.'),
    ('lessons-61-80.json', '"back": "~99.999999999% (11 nines)."',
     '"back": "S3 is designed for ~99.999999999% (11 nines) a year: a design target, not a guarantee against deletes or bugs."'),
    # t74: thin Interview Playbook cards
    ('tutorial-74.json',
     'Label sync vs async paths, data stores, and queues. Narrate failure modes while you draw—not after.',
     'Draw the hot path left to right: client, edge, services, data stores. Mark each arrow sync or async and label each store with its key and access pattern. '
     'Keep a corner for the numbers (peak QPS, storage, latency budget) and point at them when you pick a component. '
     'Narrate one failure per box as you draw it, such as “if this cache is cold, reads fall back to the database”, rather than saving failures for the end.'),
    ('tutorial-74.json',
     'Clear scope, realistic math, idempotent writes, observability, and explicit consistency/latency choices.',
     'Interviewers score how you reason, not the final picture. Scope: ask before drawing and say what is out of scope. '
     'Numbers: one or two estimates that change a decision, such as whether one primary can take the write rate. '
     'Trade-offs: name what each choice costs, for example “async replication: faster commits, a few seconds of possible loss”. '
     'Failures: timeouts, retries with idempotency keys, behaviour when a dependency is down. '
     'Operations: the metrics and alerts you would add. “I would measure X before deciding” beats a confident guess.'),
    ('tutorial-74.json',
     'Summarize bottlenecks, metrics, and what you would prototype in week one.',
     'Keep the last 3–5 minutes for a short close: restate the design in two sentences; name the top two bottlenecks and what changes at 10× load; '
     'list the three signals you would alert on (for example error rate, p99 latency, queue lag); mention one simplification you made on purpose; '
     'and say what you would build or load-test first. A crisp close shows judgement and hands the interviewer easy follow-ups.'),
    # reviewer: t15-a4's correct option was far longer than every distractor, a length giveaway
    ('lessons-01-20.json', 'Each instance has its own copy, so a change must be invalidated in all 50',
     'A change must be invalidated in all 50 copies'),
    # t115-a5: refresh the UPI anchor to the NPCI-reported August 2025 volume
    ('lessons-101-120.json', 'UPI handles about 15B transactions a month. Roughly what is the average per second?',
     'UPI crossed 20B transactions in a month in August 2025 (publicly reported by NPCI). Roughly what is the average per second?'),
    ('lessons-101-120.json', 'A month is about 2.6M seconds; 15B ÷ 2.6M ≈ 5,800 per second.',
     'A month is about 2.6M seconds; 20B ÷ 2.6M ≈ 7,700 per second.', 2),  # formula and workedAnswer
    ('lessons-101-120.json', 'Sanity check: 5,800/s is only the average.', 'Sanity check: 7,700/s is only the average.'),
    # t119-c2: was inconsistent with t35 (about 10,000 simple writes/s on one primary)
    ('lessons-101-120.json', 'a single Postgres primary a few thousand writes/s;',
     'a single Postgres primary from a few thousand to tens of thousands of simple writes/s, depending on hardware, indexes and fsync settings;'),
    # t119-a5: the explanation now covers every option
    ('lessons-101-120.json', '"explanation": "Distance sets a floor that caching cannot remove."',
     '"explanation": "India to the US East coast is roughly 13,000 km each way; light in fibre covers about 200 km per ms, so the round trip is at least about 130 ms and about 200 ms in practice. '
     '2 ms is a same-region round trip, 20 ms is a within-India hop such as Mumbai to Hyderabad, and 2 s would mean heavy congestion or many round trips. Distance sets a floor that caching cannot remove."'),
]

# Estimation questions whose default ±50% tolerance accepted the classic mistake.
# qid -> (expected target, tolerance, trap answers)
ESTIMATES = {
    't4-a5': (400, 0.2, [600, 200]),       # 3 RTTs (TLS 1.2) or 1 RTT
    't7-a4': (180, 0.15, [120, 240]),
    't23-a5': (4, 0, [5, 3]),
    't29-a2': (3, 0, [2]),                 # R > N − W, not R = N − W
    't31-a2': (20, 0.1, [25, 80]),         # 1/4 or the share that stays
    't33-a4': (58, 0.03, [60, 62]),
    't36-a5': (30000, 0.2, [90000, 60000]),
    't41-a2': (40, 0, [20, 25]),           # forgetting the initial bucket
    't45-a2': (7, 0, [6, 4]),
    't46-a2': (2, 0, [1]),
    't53-a2': (27, 0, [9, 3]),
    't62-a5': (24, 0, [8, 3]),
    't115-a5': (7700, 0.15, [770, 77000]),  # target refreshed above
    't119-a2': (16, 0.05, [12, 17]),
}
NEW_TARGET = {'t115-a5': (5800, 7700)}


def apply_text(path, text):
    changed = False
    for f, old, new, *cnt in TEXT:
        want = cnt[0] if cnt else 1
        if os.path.join(ROOT, f) != path:
            continue
        o = old if old.startswith('"') else js(old)
        n = new if new.startswith('"') else js(new)
        if text.count(n) and not text.count(o):
            continue  # already applied
        assert text.count(o) == want, f'{f}: expected {want} match(es) for {old[:60]!r}, found {text.count(o)}'
        text = text.replace(o, n)
        changed = True
    return text, changed


def walk(x):
    if isinstance(x, dict):
        yield x
        for v in x.values():
            yield from walk(v)
    elif isinstance(x, list):
        for v in x:
            yield from walk(v)


def apply_estimates(path, text):
    data = json.loads(text)
    indent = 2
    if json.dumps(data, ensure_ascii=False, indent=indent) + '\n' != text and json.dumps(data, ensure_ascii=False, indent=indent) != text:
        return text, False, set()
    seen, changed = set(), False
    for q in walk(data):
        qid = q.get('id')
        if qid in ESTIMATES and q.get('type') == 'estimation':
            target, tol, traps = ESTIMATES[qid]
            if qid in NEW_TARGET and q['target'] == NEW_TARGET[qid][0]:
                q['target'] = NEW_TARGET[qid][1]
            assert q['target'] == target, f'{qid}: target {q["target"]} != {target}'
            for t in traps:
                assert abs(t - target) / target > tol, f'{qid}: trap {t} inside tolerance'
            if q.get('tolerance') != tol or q.get('trapAnswers') != traps:
                q['tolerance'], q['trapAnswers'] = tol, traps
                changed = True
            seen.add(qid)
    out = json.dumps(data, ensure_ascii=False, indent=indent) + ('\n' if text.endswith('\n') else '')
    return out, changed, seen


def main():
    files = sorted({e[0] for e in TEXT} | {f for f in os.listdir(ROOT) if f.startswith('lessons-')})
    seen_all = set()
    for f in files:
        path = os.path.join(ROOT, f)
        text = open(path, encoding='utf-8').read()
        text, c1 = apply_text(path, text)
        text, c2, seen = apply_estimates(path, text)
        seen_all |= seen
        if c1 or c2:
            open(path, 'w', encoding='utf-8').write(text)
            print('updated', f)
    missing = set(ESTIMATES) - seen_all
    if missing:
        sys.exit(f'estimation questions not found: {sorted(missing)}')
    print('ok:', len(TEXT), 'text fixes,', len(ESTIMATES), 'estimation fixes')


if __name__ == '__main__':
    main()
