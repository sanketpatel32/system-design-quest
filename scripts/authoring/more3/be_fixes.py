"""Quality fixes for the existing Backend topics (221-240, 351-356), third content round.

Idempotent: edits scripts/authored/fund-backend*.json in place and can be rerun at any time,
including after scripts/authoring/more2/build.py regenerates fund-backend-extra.json.
Each fix either applies, is already applied, or fails loudly.
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'authored')
FILES = ['fund-backend.json', 'fund-backend-more.json', 'fund-backend-extra.json']


def _walk(v, old, new, hits):
    if isinstance(v, str):
        if old in v:
            hits[0] += v.count(old); return v.replace(old, new)
        return v
    if isinstance(v, list): return [_walk(x, old, new, hits) for x in v]
    if isinstance(v, dict): return {k: (x if k == 'id' else _walk(x, old, new, hits)) for k, x in v.items()}
    return v


def fix(t, old, new):
    """Replace text inside a topic; skip if already applied, fail if neither text is present."""
    blob = json.dumps(t, ensure_ascii=False)
    if old in blob:
        out = _walk(t, old, new, [0]); t.clear(); t.update(out); return
    assert new in blob, f"t{t['id']}: neither old nor new text found: {old[:70]!r}"


def put_question(t, q):
    for i, x in enumerate(t['questions']):
        if x['id'] == q['id']:
            t['questions'][i] = q; return
    raise AssertionError(f"t{t['id']}: question {q['id']} not found")


def set_approaches(t, qid, labels):
    """labels: {approach id: (label, description)}; keeps ids, order and correct answer."""
    q = next(x for x in t['questions'] if x['id'] == qid)
    for a in q['approaches']:
        a['label'], a['description'] = labels[a['id']]


def see_also(t, topic_id, why):
    if not any(s['topicId'] == topic_id for s in t['seeAlso']):
        t['seeAlso'].append({'topicId': topic_id, 'why': why})


def apply(topics):
    by = {t['id']: t for t in topics}
    log = []
    def has(i): return i in by

    if has(221):
        t = by[221]
        q = next(x for x in t['questions'] if x['id'] == 't221-a3')
        labels = {c['id']: c['label'] for c in q['choices']}
        labels['b'] = 'Use a faster serialiser for the response'
        labels['c'] = 'Move the handler to a server with more cores'
        for c in q['choices']: c['label'] = labels[c['id']]
        q['explanation'] = ('a: a bigger pool helps concurrent requests, but these queries run one after another. '
                            'b: serialising the response is a small part of the time next to 12 × 35 ms = 420 ms of round trips. '
                            'c: the handler is waiting on the network, not the CPU, so more cores change nothing. '
                            'd: correct, one or two queries remove most of the 420 ms of sequential round trips.')
        log.append('221 t221-a3: replaced two throwaway distractors (“Compress the response”, “Add more middleware logging”) with plausible ones and explained every option')

    if has(223):
        t = by[223]
        steps = ['Did the server itself fail? Pick a 5xx',
                 'Is the caller unauthenticated or not allowed? 401 or 403',
                 'Does the resource not exist? 404',
                 'Is the request malformed, invalid or conflicting? 400, 422 or 409']
        items = {f's{i+1}': s for i, s in enumerate(steps)}
        put_question(t, {'id': 't223-a5', 'concept': 'status-classes', 'type': 'drag_order',
                         'prompt': 'A request did not succeed. Order the questions to ask when picking its status code.',
                         'items': [{'id': k, 'label': items[k]} for k in ['s3', 's1', 's4', 's2']], 'correctOrder': list(items),
                         'explanation': 'Stop at the first match. A server fault is never reported as the client’s mistake; access is checked before existence so callers without access cannot probe which ids exist; validation and conflicts come last because they concern a resource the caller may use.'})
        ch = t['interactive']['choices']
        b = next(c for c in ch if c['id'] == 'b')
        b['label'] = '409 Conflict'
        b['feedback'] = 'Nothing clashes with the stored state; the request’s own dates break a rule, which is a validation error.'
        see_also(t, 535, 'When work outlasts a request, 202 Accepted and a status URL take over')
        log.append('223 t223-a5: replaced the trivial “order the status classes by first digit” drag with ordering the status-choice questions from the lesson’s decision diagram')
        log.append('223 interactive: the “400 Bad Request” choice was marked “also acceptable” yet scored wrong; replaced with a clearly wrong 409 Conflict and new feedback')

    if has(224):
        t = by[224]
        set_approaches(t, 't224-a6', {
            'p1': ('Client-chosen idempotency key, response stored 24 h', 'Replay the first result'),
            'p2': ('Unique constraint on (user, amount, minute)', 'Database rejects duplicates'),
            'p3': ('Turn off client retries; refund any duplicates', 'No retry logic to build')})
        see_also(t, 531, 'Money postings are where idempotent writes matter most')
        log.append('224 t224-a6: correct approach was by far the longest and one distractor (“Tell clients never to retry”) was a strawman; rebalanced the labels')

    if has(225):
        set_approaches(by[225], 't225-a6', {
            'p1': ('Per-person accounts with roles, a refund limit and an audit log', 'Least privilege'),
            'p2': ('One shared admin login, with refunds noted against ticket numbers', 'Simple to set up'),
            'p3': ('Everyone gets admin; a manager reviews refunds each week', 'No friction')})
        log.append('225 t225-a6: correct approach was 3× longer than the others; rebalanced labels so the choice turns on least privilege, not length')

    if has(227):
        t = by[227]
        set_approaches(t, 't227-a6', {
            'p1': ('Queued job: backoff retries, per-invoice message id, dead-letter queue', 'Retry safely'),
            'p2': ('Send inline in the request; show the user a retry button on error', 'Simple'),
            'p3': ('Queued job retried at once, in a loop, until the provider accepts', 'Fast recovery')})
        see_also(t, 535, 'Clients learn how a queued job is going through a status resource')
        log.append('227 t227-a6: rebalanced approach lengths (correct one was nearly twice the others) and made both distractors realistic designs')

    if has(229):
        see_also(by[229], 534, 'Percentiles matter most when one request fans out to many servers')
    if has(230):
        set_approaches(by[230], 't230-a6', {
            'p1': ('Up to 2 jittered backoff retries at checkout only, within the deadline', 'Bounded and spread out'),
            'p2': ('Up to 10 immediate retries at checkout, no backoff', 'Recovers quickly from blips'),
            'p3': ('Retry at checkout, inventory and the database client', 'Maximum resilience')})
        log.append('230 t230-a6: shortened the 96-character correct approach and lengthened a 32-character distractor so length no longer gives it away')

    if has(233):
        t = by[233]
        set_approaches(t, 't233-a6', {
            'p1': ('Shared atomic counters; fail open on local limits, closed for login', 'Correct and resilient'),
            'p2': ('Local counters on each server, each allowing the limit ÷ 12', 'No shared dependency'),
            'p3': ('Shared atomic counters; reject every request while the store is down', 'Strict')})
        fix(t, 'Each server still sees only a share, so the effective limit multiplies.',
            'A key’s traffic is rarely spread evenly, so it is blocked early on one server while getting extra room on others.')
        log.append('233 t233-a6: correct approach was 113 characters against 34–46; rebalanced, made “local counters” a real design (limit ÷ 12) and updated the rationale feedback to match')

    if has(236):
        see_also(by[236], 538, 'Batch jobs walk big tables with the same keyset idea')
    if has(238):
        t = by[238]
        st = t['deep']['mechanism']['steps']
        if st[2].startswith('Polling relays must not') and st[3].startswith('A relay moves outbox rows'):
            st[2], st[3] = st[3], st[2]
            log.append('238 deep mechanism: the watermark caveat for polling relays came before the step that introduces relays; swapped them so the relay is explained first')
        else:
            assert st[2].startswith('A relay moves outbox rows') and st[3].startswith('Polling relays must not'), 't238: mechanism steps changed'
        see_also(t, 532, 'Event sourcing makes the event log itself the source of truth')
    if has(239):
        see_also(by[239], 534, 'Per-call deadlines are one of the main tools against fan-out tail latency')
    if has(240):
        see_also(by[240], 536, 'Contract tests check that consumers and producers still agree')
    return log


if __name__ == '__main__':
    log = []
    for name in FILES:
        path = os.path.join(ROOT, name)
        topics = json.load(open(path))
        log += apply(topics)
        with open(path, 'w') as f:
            json.dump(topics, f, ensure_ascii=False, indent=1); f.write('\n')
    print('\n'.join(log) or 'all fixes already applied')
