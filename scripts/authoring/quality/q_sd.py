"""Quality pass, System Design: thin cards get numbers and follow-ups; give-away longest answers are rebalanced;
recall questions become scenarios. Applied by apply.py."""

P = {
 116: {
  'cards': {
   't116-c1': {'body': 'Pick the part most likely to break at your numbers. For IRCTC Tatkal booking that is the 10:00 a.m. burst on a few thousand seats per train, not the login page. Or ask which part the interviewer wants. Spend 10–15 minutes deep on one area rather than shallow on five.'},
   't116-c2': {'body': 'Use: “A or B. I choose A because requirement X; the cost is Y; I’ll mitigate with Z.” For example: “Async replication, because checkout writes must finish in under 50 ms; the cost is losing a few seconds of writes on failover; payment records take a synchronous path.” It shows judgement instead of memorised answers.'},
   't116-c4': {'body': 'Avoid “always” and “never”. Say “for this read-heavy feed I’d cache with a short TTL”, not “caching is always right”. An interviewer can break an absolute with one counterexample (“even for a write-heavy ledger?”), and you spend the next five minutes retreating.'},
   't116-c5': {'body': 'Presenting one option as obviously correct with no downside. Interviewers push back until you name the cost; naming it first earns the point. Have the next answer ready too: “what breaks first if traffic grows 10×?”'},
  },
  'q': {
   't116-a1': {'choices': [('b', 'Async replication, since it is faster than sync and simpler to run'), ('a', 'Async, for fast writes; failover may lose seconds, so payments go sync'), ('c', 'Kafka, since most large companies already run it in production'), ('d', 'Either works; I would go with whatever the team knows best')],
    'correct': 'a',
    'explanation': 'It names the requirement (fast writes), the cost (seconds of writes lost on failover) and a mitigation (a synchronous path for payments). “Faster and simpler” names no cost, popularity is not a requirement, and “either works” skips the decision the interviewer asked you to make.'},
   't116-a3': {'prompt': 'Design IRCTC Tatkal booking: sales open at 10:00 a.m., a train has a few thousand seats, and requests in the first minute far exceed them. You have 15 minutes for one deep dive. Which?',
    'choices': [('d', 'The login page and its OTP flow'), ('c', 'The admin tool for adding new trains'), ('a', 'Seat inventory under the opening burst'), ('b', 'The PNR status page and its caching')],
    'correct': 'a',
    'explanation': 'A burst on a small, contended seat inventory is where the design breaks: double-booked seats or a melted database. PNR status is read-heavy but easy to cache, the admin tool has a handful of users, and login matters but is a solved problem worth one sentence.'},
   't116-a4': {'choices': [('b', 'Caching is always the right answer for reads'), ('d', 'Microservices always beat a monolith at scale'), ('a', 'For this read-heavy feed, I’d cache with a short TTL'), ('c', 'Never use SQL once traffic gets large')],
    'correct': 'a',
    'explanation': 'It scopes the claim to this workload and names a choice with a limit (a short TTL). The others are absolutes an interviewer can break with one counterexample: a write-heavy ledger where a cache adds staleness, a small team for whom a monolith is simpler, or the many large systems that run on SQL.'},
   't116-d1': {'explanation': 'It names the cost (a hot row), puts a number on the load, and then decides. The others are absolutes with no cost: no database is best for every system, Redis does not scale without limit and is a weak sole system of record, and microservices bring network and operational costs of their own.'},
  },
 },
 117: {
  'cards': {
   't117-c1': {'body': 'Drawing boxes before knowing scale or features. Ask three or four questions first: daily users, the read/write ratio, the latency target and what is out of scope. A chat app for 50 people and one for 50 million share a name, not a design.'},
   't117-c2': {'body': 'Kafka, microservices and sharding for 1,000 users. A single database on a modest server handles thousands of indexed queries a second, far more than 1,000 users generate. Start simple, add a component when a number forces you, and say which number would.'},
   't117-c3': {'body': 'Estimating, then never using the estimate. If you computed 50K read QPS, say what it means: one cache node can serve that, you would run a few for headroom and failover, and at a 90% hit rate the database sees about 5K QPS.'},
   't117-c5': {'body': 'Long silences leave the interviewer guessing. Think aloud, check in (“should I go deeper here?”) and take hints. Interviewers often hint on purpose to see how you use help, so a hint picked up well works in your favour.'},
  },
  'q': {
   't117-a1': {'choices': [('c', 'Cassandra sharded across three regions'), ('d', 'Kubernetes with a service mesh'), ('b', 'Kafka and twelve microservices'), ('a', 'One app server and a managed database')],
    'correct': 'a',
    'explanation': '1,000 daily users is well under one request a second on average; one server and a managed database, with backups and a tested restore, carry that easily. Cross-region Cassandra, a service mesh and twelve microservices each add operational work that no number asks for.'},
   't117-a2': {'choices': [('a', 'Use it to size the cache and app servers'), ('b', 'Move on; estimation is only a warm-up phase'), ('c', 'Re-estimate it more precisely, with exact figures'), ('d', 'Ask whether 50K is right, then stop there')],
    'correct': 'a',
    'explanation': 'An estimate earns credit only when it changes the design: 50K reads a second means a cache in front of the database and several app servers. Treating it as a warm-up wastes it, more precision rarely changes a decision, and checking the number without using it stops halfway.'},
   't117-a3': {'explanation': 'Reasoning out loud lets the interviewer follow, correct or hint, and earns credit even when you are unsure. Silence hides your thinking, changing the subject looks like avoidance, and a quick unexplained pick gives them nothing to assess.'},
   't117-a5': {'choices': [('b', 'Early on, you asked about the read/write ratio'), ('d', 'Early on, you asked what is out of scope'), ('c', 'You stated your traffic assumptions aloud'), ('a', 'Halfway in, you learn it gets 10 writes a day')],
    'correct': 'a',
    'explanation': 'Learning the write rate halfway through means the first half was built on guesses, and probably sized for far more traffic. Asking about the read/write ratio and the scope, and stating your assumptions aloud, are what scoping looks like.'},
   't117-d1': {'choices': [('a', 'Overkill: a table or managed queue is enough'), ('b', 'Kafka is needed for any event-driven design'), ('c', 'Use five brokers instead, to leave room to grow'), ('d', 'Fine, because Kafka is popular and widely known')],
    'correct': 'a',
    'explanation': 'At 1–12 events a second, a database table polled by a worker, or a managed queue, is plenty, while a three-broker cluster adds brokers to run, monitor and upgrade. Nothing ties events to Kafka, more brokers make it worse, and popularity is not a requirement. Have the follow-up ready: switch when the rate reaches thousands a second, or when many consumers need to replay history.'},
  },
 },
 43: {
  'cards': {
   't43-c1': {'body': 'A coordinator asks every participant to prepare (lock and promise), then tells all to commit or all to abort. It gives atomicity across databases, but each commit costs at least two round trips plus a forced log write at every participant, participants hold locks while waiting, and if the coordinator dies after prepare they are stuck.'},
   't43-c5': {'body': 'Defaulting to 2PC across microservices. It ties every service’s availability together and holds locks across network calls. Prefer sagas unless you truly need atomic commit. Expect the follow-up “what does the user see while the saga is half done?”: show “payment pending”, not a confirmed booking.'},
  },
  'q': {
   't43-a1': {'prompt': 'Checkout uses two-phase commit across the order, payment and inventory databases. During a sale the inventory database is slow for 30 seconds. What happens to checkout?',
    'choices': [('b', 'Orders and payments commit; stock catches up later'), ('c', 'Checkout skips inventory and uses a cached count'), ('d', 'Only stock updates slow down, not payments'), ('a', 'Every checkout waits, holding locks in all three')],
    'correct': 'a',
    'explanation': 'Under 2PC nothing commits until every participant has voted, so one slow database stalls every checkout while the other two hold their locks, slowing other work on those rows too. Committing without inventory is what a saga would do, and 2PC has no cached fallback.'},
   't43-a3': {'explanation': 'Each completed step is undone by a new action, in reverse order: cancel the hotel, then the flight. There is no cross-service transaction to roll back, leaving the reservations holds rooms and seats the user did not pay for, and retrying a declined card forever never ends. Compensations must be idempotent, because they can be retried too.'},
   't43-a4': {'choices': [('c', 'The services share one database transaction'), ('a', 'A coordinator calls flight, hotel and payment, then compensates'), ('d', 'The client calls each service itself'), ('b', 'Each service reacts to the previous service’s event')],
    'correct': 'a',
    'explanation': 'Orchestration means one coordinator owns the flow: it calls each step and decides when to compensate. Services reacting to each other’s events is choreography, a shared transaction is not a saga at all, and a client calling services itself leaves compensation to an app that may close halfway.'},
  },
 },
 24: {
  'cards': {
   't24-c2': {'body': 'If the order page must show product name and seller name, a normalized schema joins three tables on every view. At 5,000 order-page views a second during a sale, copying those names into the order row makes each view a single-row read; the cost is that a seller rename must now update every one of their order rows.'},
  },
  'q': {
   't24-a1': {'choices': [('a', 'Copy product and seller names into those order rows'), ('c', 'Move all the data to a document store instead'), ('d', 'Drop the foreign keys so the joins run faster'), ('b', 'Denormalise every table in the schema at once')],
    'correct': 'a',
    'explanation': 'Fix the measured hot path and keep the rest normalised; the copies cost a little on rare renames. Moving everything to a document store, or denormalising the whole schema, is a rewrite for one query, and foreign keys are checked on writes; they do not slow down reads that join.'},
   't24-a2': {'explanation': 'With 10M copies, one seller rename updates every row that seller has, possibly millions, so it belongs in a background job. Reads need fewer joins, not more, and ACID guarantees and indexing are unaffected.'},
   't24-a3': {'prompt': 'A wallet app shows the user’s balance on 6 different screens. Which data should stay in one normalised place?',
    'choices': [('c', 'The display name on a cached profile card'), ('a', 'The balance used to approve payments'), ('b', 'The merchant name on past transactions'), ('d', 'The product name printed on old invoices')],
    'correct': 'a',
    'explanation': 'The balance decides whether a payment goes through, so two copies that disagree mean approving money that is not there; keep one authoritative row, updated in a transaction, and have the screens read it. Merchant names on past transactions and product names on invoices are snapshots that should not change, and a cached display name can be a little stale.'},
   't24-d1': {'choices': [('a', 'The order must keep the address it went to'), ('b', 'SQL does not allow joining orders and customers'), ('c', 'It makes editing a saved address much faster'), ('d', 'It removes the need for a customers table')],
    'correct': 'a',
    'explanation': 'It is a snapshot of a historical fact: the parcel went to that address even if the profile changes later, so it never needs syncing. SQL joins those tables fine, editing a saved address is unaffected, and customers still need their own table.'},
  },
 },
 71: {
  'cards': {
   't71-c4': {'body': 'Cursors need a unique, ordered key. created_at alone can tie: at lunch peak a food-delivery feed may get 40 orders in the same second, and a cursor on the timestamp alone skips or repeats the ones on the boundary. Use (created_at, id), with an index on that pair.'},
  },
  'q': {
   't71-a1': {'choices': [('a', 'It reads and discards 100,000 rows first'), ('c', 'The response holds 100,000 rows'), ('d', 'It locks the table while paging through'), ('b', 'OFFSET stops the index being used')],
    'correct': 'a',
    'explanation': 'The database still reads and throws away 100,000 rows before returning 20, so each deeper page costs more. The response is still 20 rows, OFFSET takes no table lock, and an index can still supply the order; it just cannot skip ahead by a count.'},
   't71-a2': {'choices': [('d', 'The new posts appended at the bottom of the feed'), ('a', 'Repeats, as earlier items shift down a page'), ('b', 'No change, since each page is fixed'), ('c', 'An error once the offsets go stale')],
    'correct': 'a',
    'explanation': 'With newest-first offsets, each new post pushes everything down one place, so the last items of page 1 reappear at the top of page 2. New posts are not appended at the bottom, pages are not fixed, and offsets do not raise errors; they just point at different rows.'},
   't71-a3': {'prompt': 'A feed pages with WHERE (created_at, id) < cursor, newest first, 20 at a time. Which index makes each page a single seek?',
    'choices': [('b', 'Two indexes: one on created_at, one on id'), ('a', 'One composite index on (created_at, id)'), ('c', 'One index on id alone'), ('d', 'No index; the cursor already skips rows')],
    'correct': 'a',
    'explanation': 'A composite index on (created_at, id) lets the database seek straight to the cursor and read the next 20 entries in order. Two separate indexes cannot give that order in one seek, an index on id alone ignores the time order, and without an index every page scans and sorts the table.'},
  },
 },
 61: {
  'cards': {
   't61-c4': {'body': 'Storing images as BLOBs in the relational database. At 3 MB a photo, 1M photos is 3 TB inside the tables, every backup and every replica, so restores and new replicas take hours longer. Keep the bytes in object storage and the key, owner and size in a row.'},
  },
  'q': {
   't61-a1': {'prompt': 'A presigned PUT URL for one photo upload ends up in a shared log. What limits the damage?',
    'choices': [('c', 'Only the user who asked for it can use it'), ('d', 'The bucket rejects a second upload to it'), ('b', 'Storage rejects uploads from a new IP'), ('a', 'It expires soon and covers one object key')],
    'correct': 'a',
    'explanation': 'The signature covers the method, the bucket, the object key and an expiry, so a leaked URL can only write that one object until it expires, often within 5–15 minutes. Anyone holding it can use it, as many times as they like before expiry; storage checks no identity or IP address unless a policy adds conditions.'},
   't61-a3': {'choices': [('d', 'Postgres limits each row to 1 MB of data'), ('a', 'It bloats the database, backups and replicas'), ('b', 'Postgres cannot store binary data in a column'), ('c', 'BLOB columns cannot be backed up or replicated')],
    'correct': 'a',
    'explanation': 'Every image byte then sits in the tables, the backups and each replica, while object storage is cheaper per GB and serves through a CDN. Postgres can store binary data (bytea, up to 1 GB a value) and does back it up and replicate it, which is exactly the cost.'},
   't61-a5': {'explanation': 'A database row (owner, caption, object key, size) is what you filter, join and check permissions on; the object holds only bytes. One bucket per photo runs into account bucket limits, CDN configuration is for routing and caching, and metadata inside the image file cannot be queried.'},
  },
 },
}
