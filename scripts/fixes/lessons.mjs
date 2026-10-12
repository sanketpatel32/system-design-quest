// Hand-written replacements for lessons whose imported content was template filler.
// Each: objectives, cards (title/body, `flow` makes a request-flow card), flashcards, questions.
const mc = (id, prompt, choices, correct, explanation) => ({
  id, type: 'multiple_choice', prompt,
  choices: choices.map((label, i) => ({ id: 'abcdef'[i], label })),
  correctChoiceIds: [correct], explanation,
})
const order = (id, prompt, labels, explanation) => ({
  id, type: 'drag_order', prompt,
  items: labels.map((label, i) => ({ id: `s${i + 1}`, label })),
  correctOrder: labels.map((_, i) => `s${i + 1}`), explanation,
})

export const LESSONS = {
  4: {
    objectives: ['Place HTTP, TLS, TCP/UDP and IP in the right layer', 'Explain what a TCP handshake costs a request', 'Choose TCP or UDP for a given workload'],
    cards: [
      ['Why layers matter', 'Interviewers rarely ask for all seven OSI layers. They ask which layer a component works at: an L4 load balancer sees IPs and ports, an L7 one sees HTTP paths and headers. Knowing the layer tells you what a box can and cannot do.'],
      ['The four layers you actually use', 'Application (HTTP, gRPC, DNS) → Transport (TCP, UDP) → Internet (IP) → Link (Ethernet, Wi-Fi). TCP gives ordered, reliable byte streams with retransmits; UDP gives fire-and-forget datagrams with no ordering.'],
      ['A new HTTPS connection', null, ['DNS lookup', 'TCP handshake (1 RTT)', 'TLS handshake (1 RTT on TLS 1.3)', 'HTTP request', 'Response']],
      ['Common trap', 'Ignoring round trips. From Mumbai to a us-east server one RTT is roughly 200 ms, so a cold HTTPS connection spends about 400 ms before the first byte. Keep-alive, connection pooling and edge termination exist to avoid paying that on every request.'],
    ],
    flashcards: [['Which transport gives ordered, reliable delivery?', 'TCP. UDP gives unordered datagrams with no retransmits.'], ['What does an L4 load balancer see?', 'IP addresses and ports, not HTTP paths or headers.'], ['Why reuse connections?', 'Each new HTTPS connection pays TCP + TLS round trips before the first byte.']],
    questions: [
      mc('t4-q1', 'A live cricket score widget sends tiny updates every second; a lost update is fine because the next one replaces it. Which transport fits best?', ['UDP (or a UDP-based protocol like QUIC)', 'TCP, because every packet must arrive in order', 'Raw IP with no transport', 'SMTP'], 'a', 'Stale updates are worthless, so retransmitting them adds latency for nothing. UDP-based transports avoid head-of-line blocking. TCP would work, but it is not the best fit.'),
      mc('t4-q2', 'Where does TLS sit in a typical HTTPS request?', ['Between TCP and HTTP: it encrypts the byte stream TCP carries', 'Below IP, inside the network card', 'Inside DNS resolution', 'It replaces TCP'], 'a', 'TLS runs on top of TCP and below HTTP. QUIC (HTTP/3) folds transport and TLS together over UDP.'),
      order('t4-q3', 'Order what happens before the first byte of a brand-new HTTPS request.', ['DNS lookup', 'TCP handshake', 'TLS handshake', 'HTTP request sent'], 'Name resolution, then the transport connection, then encryption, then the request itself.'),
    ],
  },
  7: {
    objectives: ['Describe what TLS adds to HTTP', 'Count the round trips for a new HTTPS connection', 'Decide where to terminate TLS'],
    cards: [
      ['HTTPS in one sentence', 'HTTPS is HTTP sent over a TLS-encrypted connection. TLS gives confidentiality (nobody can read it), integrity (nobody can change it unnoticed) and server authentication via a certificate chain.'],
      ['The handshake', null, ['Client hello (supported ciphers, key share)', 'Server hello + certificate', 'Client verifies certificate chain', 'Both derive session keys', 'Encrypted HTTP flows']],
      ['Where to terminate TLS', 'Usually at the edge: a CDN or L7 load balancer decrypts, routes on the path, and talks to services over a private network (optionally re-encrypted with mTLS). Terminating close to the user cuts handshake latency.'],
      ['Common trap', 'Saying HTTPS makes an API secure. It protects data in transit only. You still need authentication, authorization, input validation and rate limiting.'],
    ],
    flashcards: [['What three things does TLS provide?', 'Confidentiality, integrity and server authentication.'], ['Why terminate TLS at the edge?', 'Shorter handshakes for users, and the L7 balancer can route on HTTP paths.'], ['Does HTTPS replace authentication?', 'No. It protects data in transit; you still need AuthN and AuthZ.']],
    questions: [
      mc('t7-q1', 'Your L7 load balancer must route /payments and /catalog to different services. Where should TLS terminate?', ['At the load balancer (or edge), so it can read the HTTP path', 'Only inside each database', 'Nowhere: send plain HTTP over the internet', 'In the user\u2019s DNS resolver'], 'a', 'An L7 balancer can only route on paths it can read. Re-encrypt to services with mTLS if the internal network is not trusted.'),
      mc('t7-q2', 'Which statement about HTTPS is accurate?', ['It protects data in transit but does not decide who may call your API', 'It makes SQL injection impossible', 'It removes the need for rate limiting', 'It guarantees the server is fast'], 'a', 'Transport security and application security are separate concerns.'),
      mc('t7-q3', 'A user in Chennai hits an origin in Singapore with about 60 ms RTT. Roughly how long before the first byte on a fresh TLS 1.3 connection (ignore DNS and server time)?', ['About 120 ms: one RTT for TCP, one for TLS', 'About 6 ms', 'About 600 ms', 'Zero: TLS is free'], 'a', 'TCP handshake (1 RTT) + TLS 1.3 handshake (1 RTT) = about 2 × 60 ms before the request goes out.'),
    ],
  },
  24: {
    objectives: ['Explain what normalization buys you', 'Recognise when to denormalize for reads', 'Name the cost of keeping copies in sync'],
    cards: [
      ['Normalize first', 'Normalization stores each fact once: a customer\u2019s address lives in one row, orders point to it by ID. Updates touch one place, so data cannot disagree with itself.'],
      ['Denormalize for hot reads', 'If the order page must show product name and seller name, a normalized schema needs three joins on every view. Copying those names into the order row makes the read a single lookup, at the cost of extra writes when a name changes.'],
      ['Read path, before and after', null, ['Order page request', 'Normalized: join orders + products + sellers', 'Denormalized: read one order row', 'Render page']],
      ['Common trap', 'Denormalizing everything up front. Start normalized, measure the hot query, then denormalize that path and decide how copies stay in sync (same transaction, events, or accepted staleness).'],
    ],
    flashcards: [['What does normalization prevent?', 'Update anomalies: the same fact stored in two places disagreeing.'], ['What does denormalization trade?', 'Faster reads for extra writes and the work of keeping copies in sync.'], ['When should you denormalize?', 'After a measured hot read path, with a clear sync strategy.']],
    questions: [
      mc('t24-q1', 'Flipkart\u2019s order history page joins orders, products and sellers on every view and is now the slowest query. What is the most reasonable first change?', ['Copy product and seller names into the order row at purchase time', 'Move every table into one giant JSON blob', 'Drop the foreign keys and hope', 'Add more joins'], 'a', 'Snapshotting names at purchase time is also semantically right: the invoice should show the name as it was when bought.'),
      mc('t24-q2', 'What is the main cost of denormalizing a seller name into 10 million order rows?', ['Renaming the seller means updating or accepting stale copies', 'Reads become slower', 'You can no longer index the table', 'It breaks TLS'], 'a', 'Every copy must be updated, or you decide staleness is acceptable for that field.'),
      mc('t24-q3', 'Which data is the best candidate to stay normalized?', ['A bank account balance', 'A product name shown on an old invoice', 'A precomputed follower count shown on a profile', 'A cached homepage feed'], 'a', 'Balances must have one source of truth; copies that can drift are unacceptable.'),
    ],
  },
  34: {
    objectives: ['Distinguish strong, read-your-writes and eventual consistency', 'Pick a consistency level per feature, not per system', 'Explain what a user sees under each model'],
    cards: [
      ['Consistency is per feature', 'One app can need several models. A UPI balance needs strong consistency; a like counter can be eventual; a user editing their profile should at least see their own write.'],
      ['The ladder', 'Strong (linearizable): every read sees the latest write. Read-your-writes: you always see your own updates. Monotonic reads: you never go back in time. Eventual: replicas converge if writes stop.'],
      ['Read after a write', null, ['User updates profile on primary', 'Replica lags 500 ms', 'Eventual: next read may show old profile', 'Read-your-writes: route this user\u2019s reads to primary briefly']],
      ['Common trap', 'Choosing strong consistency everywhere. It costs latency (cross-replica coordination) and availability during partitions. Spend it only where stale data causes real harm.'],
    ],
    flashcards: [['What does read-your-writes guarantee?', 'A user always sees their own updates, even if others may see them later.'], ['Where is eventual consistency fine?', 'Counters, feeds, recommendations: places where brief staleness is harmless.'], ['What does strong consistency cost?', 'Higher latency and lower availability during partitions.']],
    questions: [
      mc('t34-q1', 'A user changes their display name and refreshes; the old name appears because the read hit a lagging replica. Which guarantee fixes this with the least cost?', ['Read-your-writes, for example by reading that user\u2019s data from the primary for a few seconds', 'Strong consistency for every read in the system', 'Turning off replication', 'A longer cache TTL'], 'a', 'Only the writer needs to see the change immediately, so a targeted guarantee is enough.'),
      mc('t34-q2', 'Which feature most needs strong consistency?', ['Deducting money from a wallet', 'The view count on a YouTube video', 'Trending hashtags', 'A recommended-products row'], 'a', 'Double spending is real harm; a slightly stale view count is not.'),
      mc('t34-q3', 'Under eventual consistency, what is guaranteed?', ['Replicas converge to the same value if writes stop', 'Every read returns the latest write', 'Reads never go backwards in time', 'Writes are never lost even with no replication'], 'a', 'Eventual consistency only promises convergence; other guarantees must be added explicitly.'),
    ],
  },
  38: {
    objectives: ['Explain publish/subscribe and when to use it', 'Compare fan-out on write vs fan-out on read', 'Handle celebrity accounts in a feed'],
    cards: [
      ['Pub/sub decouples producers', 'A publisher emits an event once (OrderPlaced); any number of subscribers (email, analytics, inventory) consume it independently. Adding a consumer does not change the producer.'],
      ['Fan-out on write vs read', 'Fan-out on write pushes a new post into every follower\u2019s feed at post time: fast reads, expensive writes. Fan-out on read assembles the feed when it is opened: cheap writes, slower reads.'],
      ['Posting with a hybrid feed', null, ['User posts', 'Event published to topic', 'Workers push into normal followers\u2019 feeds', 'Celebrity posts skipped at write time', 'Feed read merges celebrity posts on demand']],
      ['Common trap', 'Fan-out on write for everyone. A cricketer with 50 million followers turns one post into 50 million writes. Hybrid feeds treat high-follower accounts differently.'],
    ],
    flashcards: [['What does pub/sub decouple?', 'Producers from consumers: new subscribers need no producer changes.'], ['Fan-out on write is good for?', 'Fast feed reads for accounts with modest follower counts.'], ['How do feeds handle celebrities?', 'Skip write fan-out for them and merge their posts at read time.']],
    questions: [
      mc('t38-q1', 'An account with 50M followers posts. Why is pure fan-out on write a problem?', ['One post becomes ~50M feed writes, creating a huge write spike', 'Followers will never see the post', 'Pub/sub cannot carry text', 'Reads become slower'], 'a', 'That is why hybrid feeds pull celebrity posts at read time.'),
      mc('t38-q2', 'Order service publishes OrderPlaced. Analytics wants it too. What changes in the order service?', ['Nothing: analytics subscribes to the existing topic', 'It must call analytics synchronously', 'It must write to the analytics database', 'It must publish a second, separate event'], 'a', 'Decoupling is the main benefit of pub/sub.'),
      order('t38-q3', 'Order the steps of a hybrid feed post.', ['User posts', 'Event published', 'Workers push to normal followers\u2019 feeds', 'Readers merge celebrity posts at read time'], 'Write-time fan-out handles most followers; read-time merge handles the heavy accounts.'),
    ],
  },
  40: {
    objectives: ['Explain why retries cause duplicates', 'Design an idempotency key flow', 'Apply it to payments and message consumers'],
    cards: [
      ['Retries create duplicates', 'Networks time out after the server already did the work. The client retries, and without protection a UPI payment is charged twice. At-least-once queues redeliver the same way.'],
      ['Idempotency keys', 'The client sends a unique key (Idempotency-Key header). The server stores key → result. A retry with the same key returns the stored result instead of repeating the action.'],
      ['A retried payment', null, ['Client sends POST /pay with key K', 'Server charges, stores K → success', 'Response lost, client times out', 'Client retries with key K', 'Server finds K, returns stored success']],
      ['Common trap', 'Checking for the key and then writing in two separate steps. Two concurrent retries can both pass the check. Make the key insert and the action atomic, for example with a unique constraint.'],
    ],
    flashcards: [['What does an idempotency key do?', 'Lets the server return the stored result for a retried request instead of repeating it.'], ['Why do consumers need idempotency?', 'At-least-once delivery means the same message can arrive twice.'], ['How do you stop two concurrent retries both running?', 'Make the key insert atomic, e.g. a unique constraint in the same transaction.']],
    questions: [
      mc('t40-q1', 'A payment request timed out on the client, but the server had already charged the card. The client retries. What prevents a double charge?', ['The retry carries the same idempotency key, so the server returns the stored result', 'A longer client timeout', 'Using GET instead of POST', 'TCP retransmission deduplicates it'], 'a', 'Only an application-level key identifies the retry as the same logical request.'),
      mc('t40-q2', 'Two identical retries arrive at the same millisecond. Which design is safe?', ['Insert the key under a unique constraint in the same transaction as the charge', 'Read the key, then write it if missing, in separate steps', 'Store keys only in the client\u2019s memory', 'Ignore keys for requests under 1 second apart'], 'a', 'Check-then-write races; an atomic unique insert does not.'),
      order('t40-q3', 'Order the server-side steps for a request with an idempotency key.', ['Look up the key', 'If found, return the stored result', 'If not, do the action and store key \u2192 result atomically', 'Return the result'], 'Lookup first; the action and the key are stored together.'),
    ],
  },
  49: {
    objectives: ['Choose the right probabilistic structure for a question', 'State the error each one makes', 'Size memory savings at scale'],
    cards: [
      ['Answers that are almost right', 'At billions of items exact answers get expensive. Probabilistic structures trade a small, known error for tiny memory: kilobytes instead of gigabytes.'],
      ['Which one when', 'Bloom filter: \u201chave I seen this?\u201d (false positives possible, no false negatives). HyperLogLog: \u201chow many distinct?\u201d (about 1% error in ~12 KB). Count-Min Sketch: \u201chow often?\u201d (may overcount, never undercounts).'],
      ['Crawler deduplication', null, ['New URL found', 'Check Bloom filter', 'Probably seen: skip', 'Definitely new: fetch and add to filter']],
      ['Common trap', 'Using a Bloom filter where a false positive is harmful, such as deciding a username is taken. A false positive there blocks a real user; confirm against the database.'],
    ],
    flashcards: [['Which error can a Bloom filter make?', 'False positives (says seen when not). Never false negatives.'], ['What does HyperLogLog estimate?', 'The number of distinct items, with about 1% error in kilobytes.'], ['What is Count-Min Sketch for?', 'Approximate frequencies; it may overcount but never undercounts.']],
    questions: [
      mc('t49-q1', 'You need daily unique visitors across 500M events with little memory. Which structure fits?', ['HyperLogLog', 'Bloom filter', 'Count-Min Sketch', 'A sorted array of all visitor IDs'], 'a', 'HyperLogLog estimates cardinality in about 12 KB per counter.'),
      mc('t49-q2', 'A Bloom filter says a URL is not present. What do you know?', ['It is definitely not present', 'It is probably present', 'It is present with 99% probability', 'Nothing'], 'a', 'Bloom filters have no false negatives.'),
      mc('t49-q3', 'Which use of a Bloom filter is risky without a second check?', ['Rejecting a signup because the username \u201cmay exist\u201d', 'Skipping a disk read for keys that are definitely absent', 'Skipping crawl of URLs probably seen', 'Avoiding cache lookups for absent keys'], 'a', 'A false positive would block a real user, so confirm in the database.'),
    ],
  },
  59: {
    objectives: ['Explain what a JWT contains and who can read it', 'Weigh stateless tokens against revocation', 'Pick sensible token lifetimes'],
    cards: [
      ['Signed, not secret', 'A JWT is header.payload.signature, base64-encoded. Anyone holding it can read the claims; the signature only proves they were not changed. Never put secrets in the payload.'],
      ['Why services like it', 'Any service with the public key can verify a token without calling the auth server, so verification scales horizontally and survives an auth outage.'],
      ['Verifying a request', null, ['Client sends Authorization: Bearer token', 'Gateway checks signature with public key', 'Checks exp, aud, iss', 'Passes user claims to service']],
      ['Common trap', 'Week-long access tokens. A stateless token cannot be easily revoked, so keep access tokens short (minutes) and use refresh tokens, which can be revoked server-side.'],
    ],
    flashcards: [['Can anyone read a JWT payload?', 'Yes. It is signed, not encrypted.'], ['Why are JWTs easy to scale?', 'Services verify them locally with a public key, no auth-server call.'], ['How do you limit damage from a stolen JWT?', 'Short expiry plus revocable refresh tokens.']],
    questions: [
      mc('t59-q1', 'A teammate wants to put the user\u2019s PAN number in the JWT payload \u201cbecause it is signed\u201d. What is wrong?', ['Signing does not hide data; anyone with the token can decode it', 'Nothing, signatures encrypt the payload', 'JWTs cannot hold strings', 'It makes verification slower'], 'a', 'Use opaque IDs in tokens; keep sensitive data server-side.'),
      mc('t59-q2', 'A user logs out but their access token is valid for 7 more days. Which design limits this best?', ['5\u201315 minute access tokens with revocable refresh tokens', 'Make tokens valid for 30 days instead', 'Store the token in localStorage', 'Remove the exp claim'], 'a', 'Short-lived access tokens bound the damage; refresh tokens can be revoked.'),
      mc('t59-q3', 'Why can 20 microservices verify JWTs without overloading the auth server?', ['Each verifies the signature locally with the public key', 'They share one database session table', 'They call the auth server on every request', 'JWTs are never verified'], 'a', 'Local verification is the main scaling benefit.'),
    ],
  },
  62: {
    objectives: ['Describe the NameNode/DataNode split', 'Explain block replication and rack awareness', 'Know where HDFS fits and where it does not'],
    cards: [
      ['Big files, big blocks', 'HDFS stores huge files split into large blocks (128 MB by default) across many DataNodes. One NameNode keeps the metadata: which blocks make up a file and where they live.'],
      ['Replication', 'Each block is stored three times by default, with copies on different racks so a rack power failure does not lose data. Lost replicas are re-copied automatically.'],
      ['Reading a file', null, ['Client asks NameNode for block locations', 'NameNode returns DataNodes per block', 'Client streams blocks directly from DataNodes', 'NameNode never touches the data']],
      ['Common trap', 'Using HDFS for millions of tiny files or low-latency lookups. Each file costs NameNode memory, and HDFS is built for large sequential scans, not serving user requests.'],
    ],
    flashcards: [['What does the NameNode store?', 'Metadata: file to block mapping and block locations, not the data.'], ['Default HDFS replication?', 'Three copies, spread across racks.'], ['What workload suits HDFS?', 'Large sequential batch reads, not tiny files or low-latency lookups.']],
    questions: [
      mc('t62-q1', 'Why are HDFS replicas placed on different racks?', ['So a rack-level failure does not lose every copy', 'To make writes faster', 'Because racks cannot hold more than one block', 'To avoid needing a NameNode'], 'a', 'Rack awareness protects against correlated failures.'),
      mc('t62-q2', 'Which workload is a poor fit for HDFS?', ['Serving 50 million 2 KB profile images to users with low latency', 'Nightly batch analytics over 10 TB of logs', 'Storing large Parquet files for Spark', 'Archiving raw clickstream for reprocessing'], 'a', 'Tiny files overload NameNode memory and HDFS is not built for low-latency serving.'),
      order('t62-q3', 'Order an HDFS read.', ['Client asks NameNode for block locations', 'NameNode returns DataNodes', 'Client reads blocks from DataNodes'], 'Metadata from the NameNode, data straight from DataNodes.'),
    ],
  },
  65: {
    objectives: ['Contrast stream and batch processing', 'Explain windows and event time vs processing time', 'Handle late and duplicate events'],
    cards: [
      ['Results while data flows', 'Batch jobs answer questions about yesterday. Stream processors (Flink, Kafka Streams, Spark Structured Streaming) update answers continuously, such as fraud scores within seconds of a UPI transaction.'],
      ['Windows', 'Streams are unbounded, so you aggregate over windows: tumbling (fixed, non-overlapping), sliding (overlapping) or session (gaps of inactivity). Use event time, when it happened, not processing time, when it arrived.'],
      ['Counting clicks per minute', null, ['Clicks land in Kafka', 'Processor groups by ad and 1-minute event-time window', 'Watermark decides when a window closes', 'Results written to a store for dashboards']],
      ['Common trap', 'Assuming events arrive in order and exactly once. Mobile clients send late events and brokers redeliver, so use watermarks for lateness and idempotent or transactional sinks for duplicates.'],
    ],
    flashcards: [['Event time vs processing time?', 'When the event happened vs when the system saw it.'], ['What is a tumbling window?', 'Fixed-size, non-overlapping time buckets.'], ['What do watermarks handle?', 'How long to wait for late events before closing a window.']],
    questions: [
      mc('t65-q1', 'Phones go offline and upload clicks 10 minutes late. Which time should per-minute click counts use?', ['Event time, with a watermark that allows some lateness', 'Processing time, so late clicks count in the minute they arrive', 'Server boot time', 'Ignore timestamps'], 'a', 'Event time puts each click in the minute it actually happened.'),
      mc('t65-q2', 'Which is a good fit for stream processing rather than a nightly batch?', ['Flagging a suspicious UPI transaction within seconds', 'Monthly GST report', 'Yearly churn analysis', 'Rebuilding a search index once a week'], 'a', 'Fraud decisions lose value with every second of delay.'),
      mc('t65-q3', 'The broker redelivers some messages after a consumer restart. What keeps counts correct?', ['Idempotent or transactional writes to the sink', 'Assuming redelivery never happens', 'Increasing the window size', 'Using processing time'], 'a', 'At-least-once delivery needs deduplication or transactions at the sink.'),
    ],
  },
  67: {
    objectives: ['Explain geohash and quadtree indexing', 'Answer \u201cnearby\u201d queries without scanning every row', 'Handle cell boundaries and dense cities'],
    cards: [
      ['Nearby without a full scan', 'Computing distance to every restaurant in India per request is too slow. Geospatial indexes bucket locations into cells so a query only checks nearby cells.'],
      ['Geohash and quadtrees', 'Geohash encodes lat/long into a string; a shared prefix means nearby. Quadtrees split space into four until each cell holds few points, so dense Mumbai gets small cells and rural areas get big ones.'],
      ['Finding restaurants within 2 km', null, ['Get user\u2019s geohash cell', 'Add the 8 neighbouring cells', 'Fetch candidates from those cells', 'Compute exact distance and sort']],
      ['Common trap', 'Searching only the user\u2019s own cell. A restaurant 50 m away can sit across a cell boundary, so always include neighbouring cells.'],
    ],
    flashcards: [['What does a shared geohash prefix mean?', 'The points are close (with edge cases at cell boundaries).'], ['Why do quadtrees suit uneven density?', 'They split dense areas into smaller cells.'], ['Why query neighbouring cells?', 'Nearby points can fall just across a cell boundary.']],
    questions: [
      mc('t67-q1', 'A user stands at the edge of a geohash cell. Why also search the neighbouring cells?', ['Close results may sit just across the boundary', 'Neighbouring cells are always empty', 'It makes the index smaller', 'Geohash requires it to decode'], 'a', 'Prefix matching misses close points across boundaries.'),
      mc('t67-q2', 'Why might a quadtree beat fixed-size grid cells for India?', ['It adapts: small cells in dense cities, large ones in sparse areas', 'It needs no memory', 'It works without coordinates', 'It is always exact with no distance check'], 'a', 'Adaptive cells keep the number of points per cell manageable.'),
      order('t67-q3', 'Order a \u201cnearby within 2 km\u201d query.', ['Find user\u2019s cell', 'Add neighbouring cells', 'Fetch candidates', 'Exact distance filter and sort'], 'Coarse cell filter first, exact distance last.'),
    ],
  },
  68: {
    objectives: ['Recognise time-series workloads', 'Explain downsampling and retention', 'Avoid high-cardinality labels'],
    cards: [
      ['Append-heavy, time-ordered', 'Metrics, sensor readings and prices arrive as timestamped points, mostly appended and read as ranges (last hour, last week). Time-series databases compress and index for exactly that.'],
      ['Retention and rollups', 'Raw 10-second points for 7 days, 1-minute averages for 90 days, hourly for years. Downsampling keeps dashboards fast and storage bounded.'],
      ['A metric\u2019s life', null, ['Agent emits cpu{host=web-12}', 'Ingest appends to the current time block', 'Compaction compresses old blocks', 'Rollup job writes 1-minute averages', 'Raw data expires after retention']],
      ['Common trap', 'Putting user IDs or request IDs in labels. Every unique label combination is a new series, so cardinality explodes and memory with it.'],
    ],
    flashcards: [['What is downsampling?', 'Replacing old raw points with coarser aggregates like 1-minute averages.'], ['What causes cardinality explosion?', 'Unbounded label values such as user or request IDs.'], ['Typical time-series read?', 'A range scan over a time window for a series.']],
    questions: [
      mc('t68-q1', 'Metrics memory jumped 50× after a deploy. The new label is user_id. Why?', ['Each user creates a separate series, exploding cardinality', 'Time-series databases cannot store integers', 'The retention period doubled', 'Downsampling stopped'], 'a', 'Put high-cardinality values in logs or traces, not metric labels.'),
      mc('t68-q2', 'Dashboards over 1 year of 10-second data are slow and storage is growing. What helps most?', ['Downsample old data to coarser rollups with tiered retention', 'Store every point forever at full resolution', 'Add more labels', 'Query raw data more often'], 'a', 'Rollups shrink both storage and query work.'),
      mc('t68-q3', 'Which workload is most time-series shaped?', ['Server CPU readings every 10 seconds', 'A user\u2019s profile record', 'Product catalog descriptions', 'A social graph of follows'], 'a', 'Timestamped, append-only, read by range.'),
    ],
  },
  70: {
    objectives: ['Explain what a container packages', 'Describe what Kubernetes schedules and heals', 'Use readiness vs liveness probes correctly'],
    cards: [
      ['Containers package the process', 'A container image bundles your app and its dependencies, so it runs the same on a laptop and in production. It shares the host kernel, so it starts in seconds rather than minutes like a VM.'],
      ['Kubernetes runs the fleet', 'You declare the desired state (5 replicas of checkout, 512 MB each). Kubernetes schedules pods onto nodes, restarts crashed ones and replaces pods when a node dies.'],
      ['A rolling deploy', null, ['New image pushed', 'Deployment creates a new pod', 'Readiness probe passes', 'Service starts sending traffic', 'One old pod is removed, repeat']],
      ['Common trap', 'Using the liveness probe to check the database. If the DB blips, every pod fails liveness and gets restarted at once. Dependency checks belong in readiness, which only stops traffic.'],
    ],
    flashcards: [['Container vs VM startup?', 'Containers share the host kernel and start in seconds.'], ['Readiness probe effect?', 'Failing it removes the pod from traffic without restarting it.'], ['Liveness probe effect?', 'Failing it restarts the container.']],
    questions: [
      mc('t70-q1', 'The database is briefly unavailable and every pod restarts in a loop. Which probe is misconfigured?', ['Liveness checks the database; it should only check the process itself', 'Readiness is too lenient', 'There are too few replicas', 'The image is too large'], 'a', 'Use readiness for dependencies: it stops traffic without killing pods.'),
      mc('t70-q2', 'What does Kubernetes do when a node with 3 checkout pods dies?', ['Schedules replacement pods on healthy nodes to restore the replica count', 'Nothing until an engineer acts', 'Deletes the deployment', 'Moves the node\u2019s disk to another rack'], 'a', 'Controllers reconcile actual state to the declared state.'),
      order('t70-q3', 'Order a rolling deploy step.', ['Start new pod', 'Readiness probe passes', 'Traffic sent to new pod', 'Remove an old pod'], 'Never remove old capacity before new pods are ready.'),
    ],
  },
  72: {
    objectives: ['Contrast optimistic and pessimistic locking', 'Pick one based on contention', 'Implement version checks'],
    cards: [
      ['Two ways to stop lost updates', 'Pessimistic locking takes a lock before reading (SELECT \u2026 FOR UPDATE), so others wait. Optimistic locking reads freely and checks a version at write time; if someone changed it, retry.'],
      ['Pick by contention', 'Low contention (editing your own profile): optimistic, no waiting. High contention on one row (the last Tatkal seat): pessimistic or atomic updates, because optimistic retries would mostly fail.'],
      ['Optimistic update', null, ['Read row with version 7', 'Compute new value', 'UPDATE \u2026 WHERE id = ? AND version = 7', '0 rows updated: someone else won, re-read and retry']],
      ['Common trap', 'Holding a pessimistic lock while calling an external payment API. The lock lives for seconds and everything else queues behind it. Keep lock scopes short.'],
    ],
    flashcards: [['How does optimistic locking detect conflicts?', 'A version check in the UPDATE; 0 rows updated means retry.'], ['When is pessimistic locking better?', 'High contention on the same rows.'], ['What should never happen inside a lock?', 'Slow external calls like payment APIs.']],
    questions: [
      mc('t72-q1', 'Thousands of users race for the last 10 seats on one train at 10:00. Which approach suits the seat row?', ['Pessimistic locking or an atomic conditional update', 'Optimistic locking with unlimited retries', 'No locking at all', 'A daily batch job'], 'a', 'Under heavy contention optimistic retries mostly fail and waste work.'),
      mc('t72-q2', 'An optimistic UPDATE ... WHERE version = 7 changes 0 rows. What happened?', ['Another writer changed the row first; re-read and retry or report a conflict', 'The database is down', 'The row was locked forever', 'The write succeeded'], 'a', '0 affected rows is the conflict signal.'),
      mc('t72-q3', 'Users edit their own address once in a while. Which approach fits?', ['Optimistic locking', 'A table-wide lock', 'Pessimistic locks held for the whole session', 'Two-phase commit across services'], 'a', 'Conflicts are rare, so avoid waiting on locks.'),
    ],
  },
  73: {
    objectives: ['Explain why collaborative editing needs conflict resolution', 'Contrast OT and CRDTs', 'Know which needs a central server'],
    cards: [
      ['Concurrent edits collide', 'Two people type into the same Google Doc paragraph at once. If each simply applies the other\u2019s edit at the original position, their copies diverge.'],
      ['OT vs CRDT', 'Operational Transformation rewrites incoming operations against concurrent ones, usually through a central server that orders them. CRDTs design data types whose merges always converge, so peers can sync in any order, even offline.'],
      ['Two users insert at once', null, ['A inserts \u201cX\u201d at position 5', 'B deletes position 2', 'Server transforms A\u2019s insert to position 4', 'Both copies converge']],
      ['Common trap', 'Using last-write-wins on whole documents. One user\u2019s entire edit disappears. Merge at the operation or character level.'],
    ],
    flashcards: [['What does OT usually rely on?', 'A central server that orders and transforms operations.'], ['Main CRDT advantage?', 'Replicas converge regardless of merge order, so offline sync works.'], ['Why not last-write-wins for documents?', 'It silently discards concurrent edits.']],
    questions: [
      mc('t73-q1', 'An app must let users edit notes offline on flights and merge later without a central server. Which fits better?', ['CRDTs', 'Operational Transformation with a single ordering server', 'Last-write-wins on the whole note', 'Pessimistic locking'], 'a', 'CRDT merges are order-independent, which suits offline and peer-to-peer sync.'),
      mc('t73-q2', 'What goes wrong with last-write-wins on the whole document?', ['One person\u2019s concurrent edits are silently lost', 'Documents get larger', 'It needs a CRDT library', 'Nothing'], 'a', 'Merging at operation level preserves both edits.'),
      mc('t73-q3', 'Why does classic OT usually have a central server?', ['To give every operation a single order to transform against', 'To store fonts', 'Because OT cannot run in browsers', 'To compress documents'], 'a', 'A single order makes transformation tractable.'),
    ],
  },
  74: {
    objectives: ['Run a 45-minute interview in six stages', 'Ask clarifying questions before designing', 'Close with risks and next steps'],
    questions: [
      order('t74-q1', 'Order the stages of a 45-minute design interview.', ['Requirements', 'Estimation', 'API', 'High-level design', 'Deep dive', 'Wrap-up'], 'Clarify first, size it, define the contract, sketch, go deep on one risk, then summarise.'),
      mc('t74-q2', 'The interviewer says \u201cDesign BookMyShow.\u201d What is the best first move?', ['Ask which flows matter (browse, seat lock, payment) and the peak load, e.g. a big film release', 'Start drawing Kafka and microservices', 'Pick Cassandra immediately', 'Write the SQL schema in full'], 'a', 'Scope and scale drive every later choice.'),
      mc('t74-q3', 'Ten minutes are left and you are deep in one component. What should you do?', ['Summarise the design, name the biggest risk and what you would do next', 'Keep adding components silently', 'Start over with a new design', 'Ask to skip the wrap-up'], 'a', 'A clear close shows judgment and time management.'),
    ],
  },
}

// Topics whose questions were real but whose cards/flashcards were template filler
export const CARDS_ONLY = {
  26: {
    objectives: ['Name the anomalies each isolation level prevents', 'Pick a level for money vs analytics', 'Explain why stronger isolation costs throughput'],
    cards: [
      ['What isolation protects', 'Concurrent transactions can see each other\u2019s half-done work. Isolation levels decide which anomalies you accept: dirty reads, non-repeatable reads, phantoms and write skew.'],
      ['The levels', 'Read committed: no dirty reads (Postgres default). Repeatable read / snapshot: a stable view for the whole transaction. Serializable: as if transactions ran one at a time, at the cost of more aborts and retries.'],
      ['Two doctors go off call', null, ['Both read: 2 doctors on call', 'Each removes themselves', 'Snapshot isolation lets both commit: 0 on call', 'Serializable aborts one transaction']],
      ['Common trap', 'Assuming the default level is serializable. Most databases default to read committed, so check what you are getting before relying on it for money.'],
    ],
    flashcards: [['Postgres default isolation level?', 'Read committed.'], ['What anomaly can snapshot isolation still allow?', 'Write skew.'], ['Cost of serializable?', 'More aborts and retries, lower throughput under contention.']],
  },
  29: {
    objectives: ['Use R + W > N to reason about reading the latest write', 'Tune N, R, W for read- or write-heavy loads', 'Explain sloppy quorums and hinted handoff'],
    cards: [
      ['Quorums in one line', 'With N replicas, a write waits for W acknowledgements and a read asks R replicas. If R + W > N, every read set overlaps the latest write set, so at least one replica returns the newest value.'],
      ['Tuning', 'N=3, W=2, R=2 is the balanced default. W=1, R=3 makes writes fast and reads slow; W=3, R=1 does the opposite but any replica outage blocks writes.'],
      ['A quorum read', null, ['Client reads key from 2 of 3 replicas', 'Replica A has v5, replica B has v4', 'Coordinator returns v5', 'Read repair updates B to v5']],
      ['Common trap', 'Treating R + W > N as full linearizability. Sloppy quorums, clock-based conflict resolution and concurrent writes can still return surprising results.'],
    ],
    flashcards: [['Condition for read/write overlap?', 'R + W > N.'], ['Effect of W = N?', 'Strong write durability, but any replica outage blocks writes.'], ['What is read repair?', 'Updating stale replicas discovered during a read.']],
  },
  58: {
    objectives: ['Separate OAuth 2.0 (authorization) from OIDC (authentication)', 'Walk through the authorization code flow with PKCE', 'Choose token types for web and mobile'],
    cards: [
      ['Two jobs, two specs', 'OAuth 2.0 lets an app act on your behalf with limited scopes (\u201cread my Google Drive files\u201d). OpenID Connect adds an ID token on top so the app also learns who you are: \u201cSign in with Google\u201d.'],
      ['Code flow with PKCE', 'The app redirects to the identity provider, gets a short-lived code back, and exchanges it, plus a PKCE verifier, for tokens over a back channel. PKCE stops a stolen code being redeemed by another app.'],
      ['Sign in with Google', null, ['App redirects to Google with code_challenge', 'User logs in and consents', 'Google redirects back with a code', 'App exchanges code + verifier for ID and access tokens']],
      ['Common trap', 'Using an OAuth access token as proof of identity. It says what the app may do, not who the user is. Use the OIDC ID token for login.'],
    ],
    flashcards: [['OAuth 2.0 vs OIDC?', 'OAuth grants delegated access; OIDC adds identity via an ID token.'], ['What does PKCE prevent?', 'An intercepted authorization code being redeemed by another app.'], ['Which token proves who logged in?', 'The OIDC ID token.']],
  },
}

// Extra cards appended to existing lessons (worked examples)
export const EXTRA_CARDS = {
  1: [
    ['Worked example: the first five minutes', 'Interviewer: “Design a URL shortener.” Good clarifying questions: Who creates links, and roughly how many per day? Do links expire? Custom aliases? Is click analytics in scope? A strong opening answer: “I’ll assume 100M new links a month, about 100 reads per write, redirects under 50 ms, links never expire, analytics out of scope. Let me size that before drawing anything.”'],
  ],
}

// Wording fixes inside existing lesson text
export const TEXT_FIXES = [
  [
    'Horizontal scaling needs stateless services, a load balancer and partitioned data, but grows almost linearly.',
    'Horizontal scaling needs stateless services, a load balancer and partitioned data. It adds capacity, and it only adds availability if the copies fail independently and traffic is routed away from dead ones (health checks, no shared single database). Gains are rarely linear: shared state, coordination and hot keys eat into them.',
  ],
  ['Always spend the first 5 minutes on requirements.', 'Spend roughly the first five minutes on requirements; the interviewer may steer you sooner.'],
]

/** Template card titles replaced with plain-language ones learners can scan */
export const TITLE_FIXES = {
  'Trade-off or failure mode': 'Watch out for',
  'Request flow sketch': 'How a request flows',
  'Mental model': 'The core idea',
  'Why this matters in interviews': 'Why interviewers ask',
}
