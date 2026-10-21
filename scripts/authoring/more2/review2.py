"""Fixes from the independent review (/workspace/review/more2-review.md): M1-M6 and m1-m22.
Applied to the topic dicts after they are built, so each change is traceable to a finding."""

def _t(T, i):
    return next(t for t in T if t['id'] == i)

def _card(t, n):
    return next(c for c in t['cards'] if c['id'] == f"t{t['id']}-c{n}")

def _q(t, qid):
    return next(q for q in t['questions'] if q['id'] == qid)

def _sub(s, a, b):
    assert a in s, a[:60]
    return s.replace(a, b)

def apply_frontend(T):
    # M1 + m1: 341 - regenerate on change, age as a backstop; fix the garbled worked example
    t = _t(T, 341)
    _card(t, 2)['body'] = ('Product pages are public and change a few times a day, which suits static HTML. Rebuilding 50,000 pages at 20 ms each '
        'takes 1,000 s, about 17 minutes, too slow for every price change. Instead, regenerate just the affected page when its price '
        'changes, and keep a maximum age of a few minutes as a backstop in case a change event is missed. The cart is personal, so it renders on the client.')
    q = _q(t, 't341-a2')
    q['choices'][0]['label'] = 'Static pages regenerated when their price changes'
    q['explanation'] = 'Regenerating a page when its data changes keeps it cached and correct; an age limit is the backstop.'
    d = t['deep']
    d['mechanism']['steps'][1] += (' Age alone gives no freshness bound for rarely visited pages: the first visitor after hours still gets the old copy, '
        'so pages whose data must be correct are also regenerated on demand when that data changes.')
    d['tradeoffs']['rows'][1] = ['Static, regenerated on change', 'Fresh soon after each change', 'A change event per update, plus an age backstop']
    n = d['numbers']
    n['steps'][2] = 'Regenerating a page when its price changes renders only changed pages, within seconds of the change.'
    n['steps'][3] = 'Age-based revalidation alone would let a page nobody visited for 3 hours show a 3-hour-old price to the next shopper.'
    n['result'] = 'Regenerate on change with a short age as a backstop: large catalogues stay correct without full rebuilds or per-request rendering.'
    it = t['interactive']
    it['choices'][0] = {'id': 'a', 'label': 'Static pages regenerated when a price changes, with a 5-minute age as a backstop',
        'feedback': 'Right: shared content is served from cache, each page is rebuilt when its price changes, and the age catches a missed update.'}
    it['choices'][1]['label'] = 'Render each page on the server for every request, without a cache'
    it['choices'][2]['label'] = 'Render on the client from a product API once the script has loaded'
    it['reveal'] = ('Age-based revalidation alone is not enough here: a rarely viewed page keeps its old price until someone visits after it goes stale, '
        'and that visitor still sees the old copy. Regenerating on change gives the 10-minute bound. The cart and account sections are personal, '
        'so they render on the client or per request. One site, several strategies.')

    # m2, m3: 342 - roll back to the confirmed state; unambiguous order
    t = _t(T, 342)
    _card(t, 2)['body'] = _sub(_card(t, 2)['body'], 'so it rolls back to Asha’s title and offers to apply his change again.',
        'so it rolls back, refetches the card, shows Asha’s title and offers to apply his change again.')
    _card(t, 3)['steps'][4] = 'On failure or conflict, restore the confirmed state (refetch on conflict) and explain'
    q = _q(t, 't342-a5')
    for it_ in q['items']:
        if it_['id'] == 's2': it_['label'] = 'Show the change at once, before sending'
        if it_['id'] == 's3': it_['label'] = 'Send it with the version it was based on'
    q['explanation'] = 'Snapshot first so there is something to restore, show the change, then send it with its version.'

    # m4, m5: 344 - partial rows; content-visibility as a pointer plus the contrast; see also 201
    t = _t(T, 344)
    _card(t, 2)['body'] = _sub(_card(t, 2)['body'], 'so 17 rows are visible.', 'so about 17 rows are visible (18 when scrolled mid-row).')
    _card(t, 4)['title'] = 'Variable heights, and a lighter option'
    _card(t, 4)['body'] = ('If rows differ in height, estimate them, measure each row once it renders, and correct the offsets. For mostly static '
        'long pages, content-visibility (see How Browsers Render a Page) skips rendering work off screen while keeping the content findable '
        'and accessible, which virtualization does not.')
    t['seeAlso'].append({'topicId': 201, 'why': 'Rendering cost per element and content-visibility'})

    # m7: 345 - recap forced layout from 201 instead of restating it
    t = _t(T, 345)
    _card(t, 1)['title'] = 'Recap: a read after a write forces layout'
    _card(t, 1)['body'] = ('How Browsers Render a Page explained forced synchronous layout. The pattern to spot here is the loop: write a style, '
        'read a size, repeat. Each pass forces a fresh layout, so the cost grows with the number of items: layout thrashing.')

    # m9, m10, m11: 346 - long-task source, a decision question, see also 203
    t = _t(T, 346)
    t['sources'].append({'title': 'web.dev: Optimize long tasks', 'url': 'https://web.dev/articles/optimize-long-tasks'})
    q = _q(t, 't346-a6')
    q.update({'concept': 'inp', 'prompt': 'Good INP is 200 ms. A tap’s handler and the next paint take 80 ms together. If a tap can arrive just as a main-thread chunk starts, what is the longest chunk that still meets 200 ms?',
        'unit': 'ms', 'target': 120, 'assumptions': ['The tap waits for one whole chunk', 'Handler and paint take 80 ms'],
        'formula': '200 − 80', 'workedAnswer': '200 − 80 = 120 ms per chunk at most',
        'explanation': 'Sanity check: 120 ms is the ceiling, not a target; 50 ms chunks leave margin for slower phones.', 'tolerance': 0.05, 'trapAnswers': [200, 280]})
    q3 = _q(t, 't346-a3')
    q3['choices'][1]['label'] = 'How far visible content moves while the page is loading'
    t['seeAlso'].append({'topicId': 203, 'why': 'The event loop and task queues behind long tasks'})


def apply_backend(T):
    # M3, M5, m22: 351 - right sources, real per-machine limits in the Try-it, no tautology
    t = _t(T, 351)
    t['sources'] = [{'title': 'Google SRE book: Introduction (Demand Forecasting and Capacity Planning)', 'url': 'https://sre.google/sre-book/introduction/'},
                    {'title': 'Redis: Key eviction', 'url': 'https://redis.io/docs/latest/develop/reference/eviction/'}]
    t['deep']['india'] = {'title': 'How capacity planning is described', 'label': 'Official documentation',
        'body': ('The Google SRE book’s introduction treats demand forecasting and capacity planning as a core SRE responsibility. It lists the '
                 'steps it considers mandatory: an organic demand forecast that extends beyond the lead time for acquiring capacity, inorganic '
                 'demand such as launches and marketing pushes, and regular load testing to map raw resources, such as servers and disks, to '
                 'service capacity. The Redis documentation on key eviction describes LRU and LFU policies that keep the most used keys when memory is full.')}
    it = t['interactive']
    it['prompt'] = ('Each user reads 40 items and posts 2 a day at 1 KB; the peak is 3x and the last 7 days are hot. Assume one database node serves '
                    '10K reads/s or 5K writes/s and holds 10 TB, and one cache node holds 48 GB (illustrative). Slide daily active users and see which resource needs the most machines.')
    it['params'] = {'readsPerUser': 40, 'writesPerUser': 2, 'payloadKb': 1, 'peakFactor': 3, 'hotDays': 7, 'cacheGb': 48,
                    'readsPerNode': 10000, 'writesPerNode': 5000, 'diskTbPerNode': 10}
    it['takeaway'] = ('At 10M users, uncached reads would need 2 database nodes while writes and a year of data fit on one; a 3-node cache holding '
                      'the 140 GB hot set takes the reads off the database. Writes and storage only become the bottleneck at much larger sizes.')
    t['deep']['takeaways'][2] = 'The read:write ratio decides between caching and write scaling; check which resource needs the most machines.'

    # m12, m13, m14: 352 - PostgreSQL MVCC wording, Cassandra source, plausible distractors
    t = _t(T, 352)
    _card(t, 2)['body'] = _sub(_card(t, 2)['body'], 'Changing a 100-byte row in a B-tree rewrites', 'Changing a 100-byte row in a B-tree-organised table (a clustered index) rewrites')
    t['deep']['mechanism']['steps'][0] += (' PostgreSQL differs for tables: they are heap files and an update writes a new row version (MVCC) rather than '
        'changing the old one, and full-page images in the WAL after each checkpoint add further write amplification.')
    t['deep']['india']['body'] = _sub(t['deep']['india']['body'], 'with each page holding row pointers and tuples.',
        'with each page holding row pointers and tuples; an update writes a new tuple version rather than overwriting the old one.')
    t['sources'].append({'title': 'Apache Cassandra: Storage engine', 'url': 'https://cassandra.apache.org/doc/latest/cassandra/architecture/storage-engine.html'})
    q = _q(t, 't352-a4')
    q['choices'][1]['label'] = 'A B-tree, since reads are mostly range scans'
    q['choices'][3]['label'] = 'A hash index, for constant-time point writes'
    q['explanation'] = 'High-volume small appends suit LSM-trees, which still serve recent ranges from sorted files; hash indexes cannot serve range scans.'

    # M6, m15, m16, m17: 353 - conditional update as its own category, aligned with topic 72
    t = _t(T, 353)
    _card(t, 3)['title'] = 'Five ways to make the check stick'
    _card(t, 3)['steps'] = ['Unique constraint on (flight, seat): the second insert fails',
        'Keep one row per seat and lock it first: the second request waits, then sees it taken',
        'Conditional update: book the seat only where it is still free; zero rows means it is gone',
        'Serializable isolation: the database aborts one transaction',
        'Turn the failure into a clear “seat just taken” reply']
    _card(t, 4)['title'] = 'Lock, conditional update or optimistic'
    _card(t, 4)['body'] = ('A row lock (pessimistic) makes contenders wait. A single conditional update holds no lock across user think time and '
        'needs no retry: the loser learns the seat is gone. Optimistic concurrency reads a version and retries on a mismatch; it suits rare conflicts, not hot seats.')
    d = t['deep']
    d['mechanism']['steps'][3] = ('Keep one row per seat or room-night so there is something to lock or update. A row lock, taken by reading that row '
        '“for update” before checking, makes the second transaction wait until the first commits, then re-check. A conditional update is a separate, '
        'lock-free option: one statement sets the seat to booked only where it is still free, and zero rows updated means the seat is gone, with no retry loop. '
        'Optimistic concurrency, in contrast, reads a version, writes only if it is unchanged and retries on a mismatch; it suits edits that rarely collide.')
    d['tradeoffs']['rows'][2] = ['Conditional update', 'Loser learns at once', 'Rule must fit one row’s state']
    d['tradeoffs']['rows'].insert(3, ['Optimistic version and retry', 'Losers re-read and retry', 'Wasted work under heavy contention'])
    d['india']['body'] = _sub(d['india']['body'], 'It describes serialization anomalies such as write skew and states',
        'It describes serialization anomalies (write skew is one kind) and states')
    t['interactive']['choices'][2]['feedback'] = ('It prevents duplicates, but each retry re-reads and loses again, adding a round of reads and writes per buyer; '
        'a single conditional update settles it in one statement.')
    q = _q(t, 't353-a5')
    for it_ in q['items']:
        if it_['id'] == 's2': it_['label'] = 'Lock the seat’s own row'
        if it_['id'] == 's4': it_['label'] = 'Mark the seat booked and commit'
    q['explanation'] = 'Lock the seat row before the check, so the check stays true until commit.'

    # M4, m18: 354 - operating the dead-letter queue, not re-teaching 36 and 227
    t = _t(T, 354)
    t['title'] = 'Operating a Dead-Letter Queue'
    t['objectives'] = ['Decide which failures skip retries and go straight to the dead-letter queue',
        'Keep enough context and retention to fix and replay parked messages',
        'Alert on, inspect and redrive a dead-letter queue safely']
    _card(t, 1)['title'] = 'Recap, then the hard part'
    _card(t, 1)['body'] = ('Message Queues and Background Jobs introduced poison messages and dead-letter queues. This lesson is about running one: '
        'what goes there, what to keep with it, who is alerted, and how to replay safely.')
    _card(t, 4)['title'] = 'Keep enough to act on'
    _card(t, 4)['body'] = ('Park each message with its error, attempt count, consumer version and first-failure time. Set the queue’s retention longer '
        'than your worst time to fix, or parked messages expire before anyone replays them.')
    q = _q(t, 't354-a3')
    q.update({'concept': 'retry-limit', 'prompt': 'Which failure should skip retries and go straight to the dead-letter queue?',
        'choices': [{'id': 'a', 'label': 'A timeout calling the payments service'}, {'id': 'b', 'label': 'A message that fails schema validation'},
                    {'id': 'c', 'label': 'A database deadlock that aborted the transaction'}, {'id': 'd', 'label': 'A 503 from a dependency that is shedding load'}],
        'correctChoiceIds': ['b'], 'explanation': 'Invalid content fails the same way every time; the others are transient and worth a few spaced retries.'})
    t['interactive']['choices'][1]['feedback'] = 'Nothing skips it: the consumer keeps re-reading it until a retry limit or the consumer moves it aside.'

    # M2, m19: 355 - timeout fires late; replace the duplicate LWW question; two-sided skew estimate
    t = _t(T, 355)
    _card(t, 5)['body'] = ('If a timeout is computed as “now minus start” with the wall clock and the clock steps back 2 seconds, the elapsed time '
        'can go negative and the timeout fires late by the size of the step; a step forward fires it early. Durations belong to the monotonic clock.')
    q = _q(t, 't355-a2')
    q.update({'concept': 'wall-vs-monotonic', 'prompt': 'A service records latency as wall-clock end minus start. Mid-request, time sync steps the clock back 2 s. What does that sample show?',
        'choices': [{'id': 'a', 'label': 'A latency about 2 s too low, maybe negative'}, {'id': 'b', 'label': 'The true latency, as steps are rare'},
                    {'id': 'c', 'label': 'A latency about 2 s too high'}, {'id': 'd', 'label': 'No value, as the system drops that one sample'}],
        'correctChoiceIds': ['a'], 'explanation': 'The end time moved back 2 s, so the difference shrinks by 2 s; a monotonic clock avoids this.'})
    q = _q(t, 't355-a6')
    q.update({'prompt': 'Server A’s clock is 300 ms fast and server B’s is 100 ms slow. With last-write-wins on timestamps, for how many milliseconds after a write on A can a real later write on B still lose?',
        'target': 400, 'assumptions': ['A is 300 ms ahead of true time, B is 100 ms behind', 'Network delays ignored'],
        'formula': '300 + 100', 'workedAnswer': '300 + 100 = 400 ms of skew between A and B',
        'explanation': 'Sanity check: the window is the skew between the two clocks, not either clock’s error alone.', 'tolerance': 0, 'trapAnswers': [300, 200]})

    # m20, m21: 356 - Little's law only in steady state
    t = _t(T, 356)
    t['deep']['mechanism']['steps'][0] = _sub(t['deep']['mechanism']['steps'][0],
        'Little’s law ties them together: items in the system equal arrival rate times time in the system.',
        'In a growing queue, a new request waits about queue length ÷ service rate. Little’s law, items equal arrival rate times time in the system, holds only once a queue is stable.')
