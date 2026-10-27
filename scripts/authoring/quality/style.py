"""House-style pass: spelling, terminology, punctuation and small per-topic fixes.

Runs last in rebuild.py (after apply.py) and rewrites scripts/authored/** in place. Every rule is idempotent,
so a second run changes nothing. Rules touch prose fields only (see PROSE); code samples (api, exampleApi,
diagram), ids, grading kinds and published source titles are left alone. The same rules are applied to the
labels stored in scripts/option-balance.json, so its entries keep matching the authored choices.

The rules mirror docs/style-guide.md; scripts/audit/style.mjs checks the assembled output against them.
"""
import glob, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', 'authored'))
BALANCE = os.path.normpath(os.path.join(HERE, '..', '..', 'option-balance.json'))

PROSE = set('''label steps title rows prompt explanation body assumptions takeaways columns front back objectives feedback
trap say useWhen avoidWhen why description constraints result formula workedAnswer reveal outOfScope rubric r3 r4
functionalRequirements nonFunctionalRequirements reliabilityChecks functional nonFunctional note exclusions
requirementDistractors deepDivePrompts deepDiveAnswers alternativeArchitectures takeaway setup estimationScenario
apiPrompt tradeoffPrompt referenceNotes workedEstimate tradeoffAnalysis pitch tradeoff noun text'''.split())
# Anything under these keys is code, an identifier or a published title, never house-styled
BLOCK = set('''id url slug region kind type sources api exampleApi diagram excalidraw svg requiredKinds requiredCapabilities
paths model gradingProfile acceptableAlternatives alternativeOrders source tags concept teaches correctChoiceIds
correctOrder correctNodeIds from to unit icon accent types params'''.split())


OAUTH_TERMS = r'(?! (?:code|server|endpoint|request|grant|header)s?\b)'
RULES = [
    # --- British spelling (the dominant form across the course) ---
    (re.compile(r'(?<![.\w])(?:de)?[Nn]ormaliz(?=e|ed|es|ing|ation)(?!e\()'), lambda m: m.group(0)[:-1] + 's'),
    (re.compile(r'(?<![.\w])[Vv]irtualiz(?=e|ed|es|ing|ation)'), lambda m: m.group(0)[:-1] + 's'),
    (re.compile(r'\b[Mm]aterializ(?=e|ed|es|ing|ation)'), lambda m: m.group(0)[:-1] + 's'),
    (re.compile(r'\bauthoriz(?=e|ed|es|ing|ation)(?:e|ed|es|ing|ation)' + OAUTH_TERMS), lambda m: 'authoris' + m.group(0)[8:]),
    (re.compile(r'\b([Tt])oward\b'), lambda m: m.group(1) + 'owards'),
    (re.compile(r'\b([Ll])eveled\b'), lambda m: m.group(1) + 'evelled'),
    (re.compile(r'\b([Tt])unneling\b'), lambda m: m.group(1) + 'unnelling'),
    (re.compile(r'\b([Qq])ueuing\b'), lambda m: m.group(1) + 'ueueing'),
    # --- Terminology ---
    (re.compile(r'\bPostgres\b(?!QL)'), lambda m: 'PostgreSQL'),
    (re.compile(r'\b([Bb])ack-pressure\b'), lambda m: m.group(1) + 'ackpressure'),
    (re.compile(r'(?<!Wi-Fi )\b([Hh])otspot(s?)\b'), lambda m: m.group(1) + 'ot spot' + m.group(2)),
    (re.compile(r'\b([Dd])atacentre(s?)\b'), lambda m: m.group(1) + 'ata centre' + m.group(2)),
    (re.compile(r'\bLSM tree(s?)\b'), lambda m: 'LSM-tree' + m.group(1)),
    (re.compile(r'\b([Pp])re-signed\b'), lambda m: m.group(1) + 'resigned'),
    (re.compile(r'\b([Tt])radeoff(s?)\b'), lambda m: m.group(1) + 'rade-off' + m.group(2)),
    (re.compile(r'\b([Ll])ife cycle(s?)\b'), lambda m: m.group(1) + 'ifecycle' + m.group(2)),
    (re.compile(r'\b([Uu])ser name(s?)\b'), lambda m: m.group(1) + 'sername' + m.group(2)),
    (re.compile(r'\b([Cc])ool-down(s?)\b'), lambda m: m.group(1) + 'ooldown' + m.group(2)),
    (re.compile(r'\btatkal\b'), lambda m: 'Tatkal'),
    (re.compile(r'(?<![\w./:-])websocket(s?)\b(?![\w./-])'), lambda m: 'WebSocket' + m.group(1)),
    (re.compile(r'(?<![\w./:-])cdn(s?)\b(?![\w./-])'), lambda m: 'CDN' + m.group(1)),
    # --- Punctuation ---
    (re.compile(r'\.\.\.'), lambda m: '…'),
    (re.compile(r' — '), lambda m: ': '),
    (re.compile(r'(?<=\S)  +(?=\S)'), lambda m: ' '),
]

CODE_SIGNAL = re.compile(r'''\{"|":|="|\\"|\bW/"|: "|If-(?:None-)?Match|ETag|\b(?:SELECT|WHERE|UPDATE|INSERT|DELETE|SET|LIKE|VALUES|FROM)\b|'\)|\('|' \+|\+ '|::|->>?|\$\d|\b[a-z_]+\s?=\s?'|'\s?=|<[!A-Za-z/]''')


def curl_quotes(s):
    """Straight quotes to curly in prose. Strings that look like code (JSON, SQL, HTTP headers, HTML attributes) are left alone."""
    if ("'" not in s and '"' not in s) or CODE_SIGNAL.search(s):
        return s
    s = re.sub(r"(?<=[A-Za-z0-9])'(?=[A-Za-z])", '’', s)        # it's, user's
    s = re.sub(r'(?<![\w"])"([^"\n]+?)"(?![\w"])', r'“\1”', s)   # "span"
    inner = '‘\\1’' if '“' in s else '“\\1”'
    s = re.sub(r"(?<![\w'])'([^'\n]+?)'(?![\w'])", inner, s)      # 'span'
    s = re.sub(r"(?<=s)'(?=\s|[,.;:)]|$)", '’', s)               # users' (plural possessive)
    return s


def style(s):
    for pat, fn in RULES:
        s = pat.sub(fn, s)
    return curl_quotes(s)


# --- Per-topic edits: exact (old, new) replacements inside that topic's strings (all authored files) ---
FIX = {
    75: [('(7 chars ≈ 3.5T ids)', '(7 characters ≈ 3.5 trillion IDs)')],
    1: [('Structured thinking, trade-offs, communication — not a single perfect diagram.', 'Structured thinking, trade-offs and communication, not a single perfect diagram.')],
    10: [('full-duplex connection — needed for chat', 'full-duplex connection, needed for chat')],
    30: [('Split data across nodes by key — range, hash or directory — to scale writes and storage.', 'Split data across nodes by key (range, hash or directory) to scale writes and storage.')],
    41: [('each request spends one — allows bursts.', 'each request spends one, so bursts are allowed.')],
    57: [('Authentication vs authorization', 'Authentication vs authorisation'), ('Authorization answers what you may do', 'Authorisation answers what you may do'),
         ('authorize on every request', 'authorise on every request')],
    60: [('Authorize this action', 'Authorise this action')],
    237: [('Both of the above', 'Public endpoint plus a stored cursor')],
    559: [('123450 paise', '123,450 paise')],
}
TITLE = {  # card id -> new title (vague or bare one-word headings)
    't5-c4': 'Which protocol for which job', 't29-c2': 'Tuning R and W for reads or writes', 't52-c1': 'Why instance addresses keep changing',
    't52-c2': 'Registries and heartbeats', 't56-c2': 'Four DR strategies, cheapest to fastest', 't65-c2': 'Windows over an unbounded stream',
    't60-c2': 'Injection: never concatenate input', 't60-c3': 'Keeping secrets out of code and images', 't62-c2': 'Three replicas across racks',
    't120-c1': 'Read-heavy workloads', 't120-c3': 'Real-time push to clients',
}
# exact label strings that must change (choice labels or items); applied where the label equals the key
LABEL = {
    57: {'Authorization': 'Authorisation'},
    60: {'Authorize': 'Authorise'},
    # stems that leaked the answer's wording
    75: {'302, so every click reaches the service and is counted': '302, so each visit passes through the service first'},
    578: {'The 7.2 gateway flaw, which is exploited and exposed': 'The 7.2 gateway flaw, despite its lower base score'},
    687: {'Shards are balanced by count, so one holds the slowest tests': 'Test durations vary, so one shard holds most slow tests'},
    228: {'Refuse to start and name the missing setting': 'Refuse to start and log which value is absent'},
    329: {'Reference the app servers’ security group': 'Name the app tier’s group as the allowed source'},
    501: {'Return the 48 results, marked as partial': 'Return the 48 replies now, flagged as incomplete'},
    603: {'The public resolver it now uses': 'The DoH provider it now sends queries to',
          'The public resolver cannot see the company’s internal zone': 'That outside server has no copy of the company’s internal zone'},
    683: {'A private endpoint for object storage inside the network': 'A private endpoint so storage traffic skips the NAT'},
}
# explanations that only restated the keyed answer, rewritten to give the reason
EXPLAIN = {
    17: {'Least recently used.': 'LRU (least recently used) tracks access order and drops the entry at the cold end; LFU counts uses instead, and FIFO ignores access entirely.',
         'FIFO ignores access entirely.': 'FIFO keeps a queue in insertion order, so a key read a million times is evicted as soon as it is the oldest; that is why LRU usually beats it.'},
    20: {'Critical caches need replicas.': 'With no replica the whole hot set vanishes on restart, every read misses, and the database takes the full load until the cache warms again.'},
    25: {'All or nothing.': 'Atomicity: the database undoes the debit during recovery because the transaction never committed, so money is neither lost nor created.'},
    26: {'It only hides uncommitted data.': 'READ COMMITTED hides other transactions’ uncommitted writes, but a row read twice can still change between reads (non-repeatable read).'},
    27: {'Convergence, with no time bound.': 'Eventual consistency promises only convergence once writes stop; it says nothing about how long that takes or what a read returns meanwhile.'},
    50: {'Boundaries in code, one deployable.': 'A modular monolith enforces module boundaries in code while keeping one deployable, so a team gets structure without network calls or distributed data.'},
    54: {'Spans show time spent per hop.': 'A trace links one span per hop under a shared trace id, so you can see which service took the time; logs and metrics cannot join hops like that.'},
    63: {'Term → posting list.': 'An inverted index maps each term to its posting list of document ids, so a query looks up a few terms instead of scanning every document.'},
    65: {'Fixed, non-overlapping.': 'Tumbling windows are fixed-size and do not overlap, so each event lands in exactly one window; sliding windows overlap and session windows close after a gap.'},
    66: {'Fewer bytes scanned.': 'A query touching 3 of 50 columns reads only those 3, and similar values stored together compress far better, so the scan reads a fraction of the bytes.'},
    101: {'Choose based on search needs and budget.': 'Full-text indexing lets on-call search any word but costs CPU and storage on every line; indexing labels only is cheap, but free-text search then scans raw logs.'},
    104: {'The brief allows updates within hours.': 'Places change rarely and the brief accepts hours of delay, so a periodic rebuild is simpler and cheaper than updating the index on every write.'},
    107: {'Two numbers, two purposes.': 'Dashboards tolerate small drift from late or duplicate clicks; billing uses the reconciled batch numbers, so money never depends on the fast path.'},
    108: {'No locks, exact ordering.': 'One thread per symbol processes orders strictly in sequence, so there are no locks to contend on and replaying the journal gives the same fills.'},
    110: {'A real trade-off.': 'Each segment adds request and header overhead, so longer segments are cheaper; but a player buffers whole segments, so shorter ones cut live delay.'},
    111: {'Latency versus cost.': 'A warm sandbox skips container start-up on each submission, but the pool’s idle machines cost money even when nobody is submitting.'},
    112: {'Latency versus protection.': 'Filtering before delivery keeps spam out of inboxes entirely, at the cost of scanning delay on every inbound message; filtering afterwards lets users see spam first.'},
    114: {'Small staleness, big savings.': 'Counts that are a second old are fine for a like counter, and caching them for a second collapses thousands of identical reads into one.'},
    118: {'Natural break points.': 'Checking in at transitions lets the interviewer redirect you before you spend ten minutes on the wrong part, without interrupting your train of thought.'},
}
SEEALSO = {  # topic -> {old target: (new target, why)}: weak matches swapped for closer lessons
    210: {119: (55, 'Field thresholds such as p75 LCP work like the percentile targets behind SLOs')},
    282: {119: (644, 'Sizing thread pools so runnable threads do not swamp the cores')},
    284: {4: (289, 'write() and fsync(), the system calls behind durable file writes')},
}
LINKS = {  # dead source -> allowlisted replacement (checked with curl; see docs/style-guide.md)
    'https://brewer.cs.berkeley.edu/CAP-FAQ.html': ('https://dl.acm.org/doi/10.1145/564585.564601', 'Gilbert and Lynch, Brewer’s Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services (ACM SIGACT News)'),
    'https://learn.microsoft.com/en-us/visualstudio/profiling/false-sharing': ('https://docs.kernel.org/kernel-hacking/false-sharing.html', 'False Sharing, Linux kernel documentation'),
}
# Bosses whose lessons teach direct uploads to object storage with presigned URLs: a client → object storage edge is the
# taught design there, so it must not be graded as an unsafe flow
DIRECT_UPLOAD_BOSSES = {85, 86, 91}

hits = {'rules': 0, 'fix': 0, 'title': 0, 'label': 0, 'explain': 0, 'seeAlso': 0, 'links': 0, 'objectives': 0, 'unsafe': 0}
found = {'fix': set(), 'title': set(), 'label': set(), 'explain': set(), 'seeAlso': set(), 'links': set()}


PROPER = {'Redis', 'Kafka', 'Snowflake', 'Elasticsearch', 'Cassandra', 'PostgreSQL', 'Lua', 'Flink', 'Spark', 'Raft', 'Paxos', 'ZooKeeper', 'Bloom'}


def lcfirst(s):
    # lowercase a leading ordinary word so it reads mid-sentence; keep acronyms, CamelCase and product names
    w = re.match(r'[A-Za-z]+', s)
    if not w or w.group(0) in PROPER or any(c.isupper() for c in w.group(0)[1:]):
        return s
    return s[0].lower() + s[1:]


def walk(v, tid, keys, prose):
    if isinstance(v, str):
        out = v
        for old, new in FIX.get(tid, []):
            if old in out:
                out = out.replace(old, new); found['fix'].add((tid, old))
            elif new in out:
                found['fix'].add((tid, old))
        if prose:
            k = keys[-1] if keys else None
            if k == 'explanation' and out in EXPLAIN.get(tid, {}):
                out = EXPLAIN[tid][out]; found['explain'].add((tid, v))
            if out in EXPLAIN.get(tid, {}).values():
                found['explain'].add((tid, [o for o, n in EXPLAIN[tid].items() if n == out][0]))
            if k == 'label' and out in LABEL.get(tid, {}):
                out = LABEL[tid][out]
            for o, n in LABEL.get(tid, {}).items():
                if out == n:
                    found['label'].add((tid, o))
            out = style(out)
        if out != v:
            hits['rules'] += 1
        return out
    if isinstance(v, list):
        return [walk(x, tid, keys, prose) for x in v]
    if isinstance(v, dict):
        out = {}
        for k, x in v.items():
            out[k] = x if k in BLOCK else walk(x, tid, keys + [k], k in PROSE)
        if 'id' in out and out.get('id') in TITLE and 'title' in out:
            out['title'] = TITLE[out['id']]; found['title'].add(out['id'])
        return out
    return v


def topic_extras(t):
    tid = t['id']
    for s in t.get('sources', []) or []:
        if s.get('url') in LINKS:
            s['url'], s['title'] = LINKS[s['url']]
        if s.get('url') in [u for u, _ in LINKS.values()]:
            found['links'].add([o for o, (u, _) in LINKS.items() if u == s['url']][0])
    for old, (new, why) in SEEALSO.get(tid, {}).items():
        for s in t.get('seeAlso', []) or []:
            if s['topicId'] == old:
                s['topicId'], s['why'] = new, why
            if s['topicId'] == new and s['why'] == why:
                found['seeAlso'].add((tid, old))
    b = t.get('boss')
    if b and t.get('objectives') and len(t['objectives']) == 3:
        fr, checks = b['functionalRequirements'], b['rubric']['reliabilityChecks']
        o = list(t['objectives'])
        o[0] = f"Scope {t['title']}: " + ', '.join(lcfirst(x) for x in fr[:2])
        o[2] = 'Defend the design: ' + lcfirst(checks[0].rstrip('.'))
        if o != t['objectives']:
            hits['objectives'] += 1
        t['objectives'] = o
    if b and tid in DIRECT_UPLOAD_BOSSES:
        flows = b['rubric']['unsafeFlows']
        keep = [f for f in flows if not (f['from'] == 'client' and f['to'] == 'blob_storage')]
        if len(keep) != len(flows):
            hits['unsafe'] += 1
        b['rubric']['unsafeFlows'] = keep


def dump(path, obj):
    raw = open(path).read()
    second = raw.split('\n', 2)[1]
    indent = len(second) - len(second.lstrip(' '))
    text = json.dumps(obj, ensure_ascii=False, indent=indent) + ('\n' if raw.endswith('\n') else '')
    if text != raw:
        open(path, 'w').write(text)
        return True
    return False


def main():
    changed = []
    for path in sorted(glob.glob(os.path.join(ROOT, '**', '*.json'), recursive=True)):
        data = json.load(open(path))
        if isinstance(data, list):
            new = []
            for t in data:
                t = walk(t, t['id'], [], False)
                topic_extras(t)
                new.append(t)
        else:
            new = {k: walk(v, int(k), [], False) for k, v in data.items()}
        if dump(path, new):
            changed.append(os.path.relpath(path, ROOT))
    # option-balance.json: [[authored label, balanced label]] per question id; style both sides the same way
    bal = json.load(open(BALANCE))
    nb = {}
    for qid, pairs in bal.items():
        tid = int(re.match(r'[tb](\d+)-', qid).group(1))
        L = LABEL.get(tid, {})
        for a, b in pairs:
            for o, n in L.items():
                if o in (a, b) or n in (a, b):
                    found['label'].add((tid, o))
        nb[qid] = [[style(L.get(a, a)), style(L.get(b, b))] for a, b in pairs]
    if dump(BALANCE, nb):
        changed.append('option-balance.json')
    # every manual edit must have landed somewhere (or already be in place)
    missing = [('fix', k) for tid, L in FIX.items() for k in [(tid, o) for o, _ in L] if k not in found['fix']]
    missing += [('title', k) for k in TITLE if k not in found['title']]
    missing += [('label', (tid, o)) for tid, L in LABEL.items() for o in L if (tid, o) not in found['label']]
    missing += [('explain', (tid, o)) for tid, L in EXPLAIN.items() for o in L if (tid, o) not in found['explain']]
    missing += [('seeAlso', (tid, o)) for tid, L in SEEALSO.items() for o in L if (tid, o) not in found['seeAlso']]
    missing += [('links', u) for u in LINKS if u not in found['links']]
    assert not missing, f'style.py: edits that matched nothing: {missing}'
    print(f'style: {len(changed)} files changed' + (f' ({", ".join(changed)})' if changed else ''))


if __name__ == '__main__':
    main()
