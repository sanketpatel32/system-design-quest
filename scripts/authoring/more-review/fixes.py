"""Review fixes for Frontend 215-220 and Backend 235-240 (review: fe-be-more-review.md).
fe-more/build.py applies the Frontend half to freshly generated topics. The Backend half is already in
fund-backend-more.json and is not idempotent; do not re-run it. Edits the authored JSON in place."""
import json, os, re
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'authored')
FE, BE = os.path.join(ROOT, 'fund-frontend-more.json'), os.path.join(ROOT, 'fund-backend-more.json')

def _walk(v, old, new, hits):
    if isinstance(v, str):
        if old in v:
            hits[0] += v.count(old); return v.replace(old, new)
        return v
    if isinstance(v, list): return [_walk(x, old, new, hits) for x in v]
    if isinstance(v, dict): return {k: (x if k == 'id' else _walk(x, old, new, hits)) for k, x in v.items()}
    return v

def fix(t, old, new):
    """Replace text in a topic; skip when already applied, fail loudly when the old text is missing."""
    if old in json.dumps(t, ensure_ascii=False):
        hits = [0]; out = _walk(t, old, new, hits); t.clear(); t.update(out); return
    assert new in json.dumps(t, ensure_ascii=False), f"t{t['id']}: neither old nor new text found: {old[:70]!r}"

def card(t, n, title, body, steps=None, teaches=None):
    c = {'id': f"t{t['id']}-c{n}", 'kind': 'diagram' if steps else 'text', 'title': title, 'body': body, 'teaches': teaches or t['deep']['teaches'][:1]}
    if steps: c['steps'] = steps
    t['cards'][n - 1] = c

def mc(t, qid, concept, prompt, choices, right, why):
    """choices: labels in display order; right: the correct label."""
    ids = 'abcd'
    q = {'id': qid, 'concept': concept, 'type': 'multiple_choice', 'prompt': prompt, 'choices': [{'id': ids[i], 'label': l} for i, l in enumerate(choices)],
         'correctChoiceIds': [ids[choices.index(right)]], 'explanation': why}
    put(t, q)

def order(t, qid, concept, prompt, steps, shown, why):
    items = {f's{i+1}': s for i, s in enumerate(steps)}
    put(t, {'id': qid, 'concept': concept, 'type': 'drag_order', 'prompt': prompt, 'items': [{'id': k, 'label': items[k]} for k in shown],
            'correctOrder': list(items), 'explanation': why})

def est(t, qid, concept, prompt, unit, target, tol, traps, assumptions, formula, worked, why):
    put(t, {'id': qid, 'concept': concept, 'type': 'estimation', 'prompt': prompt, 'unit': unit, 'target': target, 'tolerance': tol, 'trapAnswers': traps,
            'assumptions': assumptions, 'formula': formula, 'workedAnswer': worked, 'explanation': why})

def put(t, q):
    i = next(i for i, x in enumerate(t['questions']) if x['id'] == q['id'])
    t['questions'][i] = q

def see(t, tid, why):
    s = t.setdefault('seeAlso', [])
    for x in s:
        if x['topicId'] == tid: x['why'] = why; return
    s.append({'topicId': tid, 'why': why})

def predict(title, prompt, choices, reveal):
    return {'kind': 'predict', 'title': title, 'prompt': prompt, 'choices': [{'id': 'abcd'[i], 'label': l, 'feedback': f} for i, (l, f) in enumerate(choices)], 'correctId': 'a', 'reveal': reveal}

# ───────────────────────────── Frontend ─────────────────────────────
def frontend(T):
    # n1: the real propagation path includes tbody and the cell
    fix(T[215], 'Capture: window, document, html, body, table, row (top down)', 'Capture: window, document, html, body, table, tbody, row, cell (top down)')
    fix(T[215], 'Bubble: row, table, body, html, document, window (bottom up)', 'Bubble: cell, row, tbody, table, body, html, document, window (bottom up)')
    # m13: keep Fundamentals language-agnostic (no JavaScript/DOM method names)
    fix(T[215], 'Cancelling the default (preventDefault) stops', 'Cancelling the default action stops')
    fix(T[215], "A link's click listener calls stopPropagation but not preventDefault.", "A link's click listener stops propagation but does not cancel the default action.")
    fix(T[215], 'stopPropagation vs preventDefault?', 'Stopping propagation vs cancelling the default action?')
    fix(T[215], '“stopPropagation will stop the link from navigating.', '“Stopping propagation will stop the link from navigating.')
    fix(T[215], 'That would happen without stopPropagation,', 'That would happen if propagation were not stopped,')
    for t in (T[215],):
        for old, new in [('stopPropagation', 'stopping propagation'), ('preventDefault', 'cancelling the default action')]:
            if old in json.dumps(t): fix(t, old, new)
    fix(T[219], 'A WeakMap holds its keys weakly', 'A weak-keyed map holds its keys weakly')
    fix(T[219], 'A WeakMap keyed by element', 'A weak-keyed map keyed by element')
    fix(T[219], 'A WeakMap does not keep its keys alive', 'A weak-keyed map does not keep its keys alive')
    fix(T[219], 'Map vs WeakMap for element metadata?', 'Plain map vs weak-keyed map for element metadata?')
    fix(T[219], 'WeakMap: it does not keep the element alive.', 'The weak-keyed map: it does not keep the element alive.')
    fix(T[219], 'WeakMap and WeakSet keys do not keep their objects alive.', 'Weak-keyed maps and weak sets do not keep their keys alive.')
    fix(T[219], 'WeakRef and FinalizationRegistry exist too,', 'Weak references and finalisation callbacks exist too,')
    fix(T[219], 'Avoid WeakRef-based logic', 'Avoid weak-reference logic')
    fix(T[219], 'WeakMap keyed by object', 'Weak-keyed map keyed by object')
    # M1: a baseline snapshot must come after the warm-up
    order(T[219], 't219-a5', T[219]['questions'][4]['concept'], 'Order the steps for confirming a suspected leak with heap snapshots.',
          ['Load the page', 'Do the action once to warm up caches', 'Take a baseline snapshot', 'Repeat the suspect action several times', 'Force garbage collection, take a snapshot and compare'],
          ['s4', 's1', 's5', 's3', 's2'], 'Warm up before the baseline so one-time caches are not counted as growth, then compare after repeats and a forced collection.')
    # n8: a field agent on a tablet, matching the low-memory budget
    for old, new in [('support agent', 'field agent'), ('Support agent', 'Field agent')]:
        if old in json.dumps(T[219]): fix(T[219], old, new)
    fix(T[219], 'Budget: 150 MB before low-memory phones and tablets struggle', 'Budget: 150 MB before the agent’s low-memory tablet starts discarding tabs')
    fix(T[219], 'passes any quick test', 'passes a quick test')
    # m9: attribute the automatic minimum to the spec; the fix is common practice
    fix(T[216], "which is why MDN's grid guides recommend minmax(0, 1fr) when columns must stay equal.", "(a bare 1fr means minmax(auto, 1fr)), so a common fix when columns must stay equal is minmax(0, 1fr).")
    # n2, n7
    fix(T[217], 'The picture element with source media conditions is for art direction, such as a tighter crop on phones, and for offering newer formats with a fallback.',
        'The picture element is for art direction, through media conditions on its sources (such as a tighter crop on phones), and, through the type attribute, for offering newer formats with a fallback.')
    fix(T[217], 'The viewport is 1,280 px or more on desktop, so the sidebar card never stacks.', 'On a desktop the viewport is usually far wider than 400 px, so the narrow sidebar card would not stack.')
    # m3: 218 keeps its client-side depth; replace questions and the card that repeat System Design topic 10
    t = T[218]
    card(t, 2, 'Worked example: seven tabs over HTTP/1.1', 'Browsers open at most about six connections per host over HTTP/1.1, and each SSE stream holds one open for as long as the page lives.',
         ['A user opens the same dashboard in seven tabs; each tab opens its own SSE stream', 'Six streams take all six connections to that host', 'The seventh stream, and every fetch the pages make to that host, waits for a free connection', 'Over HTTP/2 all streams share one connection (the server negotiates how many, often 100), so the limit disappears', 'Alternatives: one shared stream for all tabs of the site, or serve the stream over HTTP/2'])
    mc(t, 't218-a1', t['questions'][0]['concept'], 'An SSE stream drops and the browser reconnects on its own. What does it send so the server can resume?',
       ['A Last-Event-ID header with the last id it saw', 'The full list of events it has already received', 'A WebSocket upgrade request for the same URL', 'A new random session token in the query string'],
       'A Last-Event-ID header with the last id it saw', 'The browser remembers the last event id and sends it on reconnect; the server replays what came after it.')
    est(t, 't218-a6', t['questions'][5]['concept'], 'After a server restart, 50,000 clients reconnect, each after a random delay spread evenly over 0–20 seconds. About how many reconnects per second reach the server?',
        'reconnects/s', 2500, 0.05, [50000, 1000], ['Delays are uniform over 20 s', 'Every client reconnects once'], 'clients ÷ spread in seconds', '50,000 ÷ 20 = 2,500 reconnects per second',
        'Design implication: without jitter all 50,000 arrive in the same second; spreading over 20 s cuts the peak 20 times.')
    t['interactive'] = predict('What happens to the seventh tab?', 'A user opens the same dashboard in seven tabs. Each tab opens its own server-sent events stream to the site over HTTP/1.1, and the pages also fetch data from the same host.',
        [('The seventh stream and later fetches wait for a free connection', 'Right: six long-lived streams use all six connections the browser allows per host over HTTP/1.1.'),
         ('All seven streams share one connection automatically', 'That is how HTTP/2 behaves, not HTTP/1.1.'),
         ('The server rejects the seventh stream with 429', 'The request never reaches the server; it waits in the browser.')],
        'Share one stream across tabs, or serve the site over HTTP/2, where streams share one connection.')
    # M3 + m7 + m8: 220 keeps will-change, layer memory, layer explosion and reduced motion
    t = T[220]
    card(t, 2, 'Worked example: promote only while animating', 'A grid has 400 cards of 300 × 200 CSS px on a DPR 2 laptop, and any card can lift on hover.',
         ['Promoting every card in advance: each layer is up to (600 × 400) device px × 4 B ≈ 0.96 MB, so about 384 MB for 400 cards', 'Instead, add will-change: transform to a card only when the pointer enters it', 'Animate transform on that one card', 'Remove the hint when the animation ends', 'At most a few layers exist at once: a few MB instead of hundreds'])
    card(t, 5, 'Trap: forced layout inside an animation loop', 'Reading a size or position right after changing styles forces layout immediately, and doing it per element is layout thrashing (covered in How Browsers Render a Page). In animation code, read every measurement first, then make every write.')
    mc(t, 't220-a1', t['questions'][0]['concept'], 'A 1,000 × 800 CSS px panel gets its own layer on a DPR 2 laptop. At 4 bytes per pixel, about how much memory can that layer take?',
       ['3.2 MB', '6.4 MB', '12.8 MB', '25.6 MB'], '12.8 MB', '(1,000 × 2) × (800 × 2) × 4 B = 12.8 MB: DPR 2 quadruples the 3.2 MB of a DPR 1 layer.')
    mc(t, 't220-a3', t['questions'][2]['concept'], 'A spinner is rotated by a script that sets its transform on every animation frame. The main thread then runs a 300 ms task. What happens to the spinner?',
       ['It keeps turning on the compositor thread', 'It freezes until the task finishes', 'It speeds up later to catch up', 'It switches to a CSS animation'], 'It freezes until the task finishes',
       'Script-driven frames need the main thread; only animations handed to the compositor keep running while it is busy.')
    fix(t, 'Spinner A animates transform: rotate; spinner B animates its margin to fake rotation.', 'Spinner A is a CSS animation of transform: rotate; spinner B is a CSS animation of left and top that moves it around a small circle.')
    t['deep']['numbers'] = {'title': 'The memory bill for promoted layers (illustrative, upper bound)', 'assumptions': ['A page promotes 12 cards with will-change: transform', 'Each card is 360 × 240 CSS px', 'Phone with DPR 3', '4 bytes per pixel; browsers may rasterise only tiles near the viewport, so this is an upper bound'],
        'steps': ['Device pixels per card: (360 × 3) × (240 × 3) = 1,080 × 720 = 777,600.', 'Memory per card layer: 777,600 × 4 B = 3,110,400 B ≈ 3.1 MB.', 'Twelve cards: 12 × 3.1 MB ≈ 37 MB of layer memory before anything moves.', 'Promoting only the card being animated keeps it near 3 MB.'],
        'result': 'Layer memory scales with area × DPR²; promote only what is about to animate.'}

# ───────────────────────────── Backend ─────────────────────────────
def backend(T):
    # M2: 235 refocused on the server and shared caches; browser basics live in 205
    t = T[235]
    t['prereqIds'] = [p for p in t['prereqIds'] if p != 205]  # prereqs stay within a section; 205 is linked via seeAlso
    see(t, 205, 'Browser caching basics: freshness, no-cache vs no-store and 304 revalidation')
    card(t, 1, 'From the browser cache to shared caches', 'Browser Caching (205) covers freshness, no-cache versus no-store and 304 revalidation from the browser’s side. This lesson is about the server and shared caches such as CDNs and reverse proxies: which directives they obey, how they key responses, and how writes stay safe.')
    card(t, 2, 'max-age vs s-maxage, private vs public', 'max-age sets freshness for every cache; s-maxage overrides it for shared caches only, so a CDN can keep a copy for 10 minutes while browsers revalidate after 1. private forbids shared caches from storing a response at all; public lets them store it even when they otherwise would not, for example on an authenticated request.')
    card(t, 3, 'Worked example: an API behind a CDN', 'One service, three kinds of response, each with headers chosen for shared caches.',
         ['Product list, same for everyone: Cache-Control: public, max-age=60, s-maxage=600', 'Responses compressed per client: add Vary: Accept-Encoding so each encoding is cached separately', 'Per-user cart: Cache-Control: private, so the CDN never stores it', 'When a product changes, purge it from the CDN by URL, or by a tag that many CDNs let you attach to responses', 'Writes to a product use If-Match with its ETag, so concurrent edits fail with 412 instead of overwriting'])
    card(t, 4, 'The Authorization rule', 'RFC 9111 says a shared cache must not reuse a response to a request that carried an Authorization header unless the response explicitly allows it with public, s-maxage or must-revalidate. Adding any of those to an authenticated response is a decision to share it across users, so it is only safe when the content really is the same for everyone.')
    mc(t, 't235-a1', 'cache-control', 'A response has Cache-Control: max-age=60, s-maxage=600. How long may a CDN serve it without revalidating?',
       ['60 seconds', '600 seconds', '660 seconds', 'Until it is purged by hand'], '600 seconds', 's-maxage overrides max-age for shared caches; browsers still use 60 seconds.')
    mc(t, 't235-a2', 'cache-control', 'A GET request carries an Authorization header and the response has only Cache-Control: max-age=300. May a CDN store and reuse it?',
       ['Yes: max-age alone allows any cache to store it', 'No: it needs public, s-maxage or must-revalidate', 'Yes, but only for requests from the same address', 'Only if the response also carries an ETag'], 'No: it needs public, s-maxage or must-revalidate',
       'RFC 9111 §3.5 forbids shared caches from reusing authenticated responses unless the response explicitly allows it.')
    order(t, 't235-a5', 'conditional-requests', 'Order a safe update that uses an ETag precondition.',
          ['GET the resource and note its ETag', 'Edit the representation locally', 'PUT it with If-Match set to that ETag', 'On 412, fetch again, reapply the edit and retry'],
          ['s3', 's1', 's4', 's2'], 'If-Match makes the server refuse a write based on an old version, so the client must re-read before retrying.')
    for q in t['questions']:
        if q['id'] in ('t235-a1', 't235-a2', 't235-a5') and q['concept'] not in t['deep']['teaches']: q['concept'] = t['deep']['teaches'][0]
    steps = t['deep']['mechanism']['steps']
    steps[5] = 'When content changes before it expires, shared caches must be told. CDNs accept purges by URL, and many also by tags attached to responses, so updating one product can purge every page that shows it. Versioned URLs avoid purging for static files altogether.'
    # M4: 236 assumes the offset/cursor basics from topic 71 and covers the API contract
    t = T[236]
    see(t, 71, 'The offset-versus-cursor basics this lesson builds on')
    card(t, 1, 'Recap: offset versus cursor', 'Offset vs Cursor Pagination (71) covers why OFFSET slows down with depth and how a keyset cursor continues after the last row seen, with a unique tiebreaker. This lesson assumes that and covers the contract around a list endpoint: filters, cursor integrity, page-size caps, links and counts.')
    card(t, 2, 'Worked example: a cursor bound to its filters', 'A list of orders filtered by status, sorted by creation time.',
         ['Request: ?status=paid&sort=created_at&limit=500', 'Server clamps limit to its documented maximum of 100 and checks sort is on the allowlist', 'Next cursor = the last (created_at, id), the sort and a hash of the filters, signed with a server key and base64url-encoded', 'Response: 100 rows, has_more: true, and Link: <…?cursor=…>; rel="next"', 'A request that reuses the cursor with status=refunded fails the filter-hash check and gets 400'])
    card(t, 3, 'Counts, has_more and going backwards', 'An exact total needs every matching row counted, which can cost more than the page itself. Fetching limit + 1 rows tells you whether another page exists (has_more) for free; if a total is shown, label it as an estimate. Backward paging uses a previous cursor with the comparison and sort order reversed, then reverses the page before returning it.')
    card(t, 5, 'Trap: cursors clients can edit', 'A cursor that is plain base64 JSON can be decoded and edited: a client can change the stored filter, jump to another tenant’s ids or force an expensive scan. Sign cursors or keep their state on the server, and still apply authorisation to every page, not just the first.')
    mc(t, 't236-a1', t['questions'][0]['concept'], 'A client reuses a next-page cursor but changes the status filter from paid to refunded. What should the server do?',
       ['Reject the cursor with 400', 'Apply the new filter from that position', 'Ignore the new filter and continue the old list', 'Restart from the first page silently'], 'Reject the cursor with 400', 'A cursor is only valid for the filters and sort it was made for; mixing them returns a list that matches neither.')
    mc(t, 't236-a2', t['questions'][1]['concept'], 'How can an endpoint tell the client whether another page exists without counting every match?',
       ['Run COUNT(*) on each request', 'Fetch limit + 1 rows and report has_more', 'Return an empty page at the end', 'Estimate it from the page number'], 'Fetch limit + 1 rows and report has_more', 'One extra row answers “is there more?” at the cost of a single row.')
    mc(t, 't236-a3', t['questions'][2]['concept'], 'Where can an API put the next page’s URL so generic HTTP clients can follow it?',
       ['A Location header on the 200 response', 'A Retry-After header carrying the URL', 'A Link header with rel="next"', 'A cookie named next_page'], 'A Link header with rel="next"', 'RFC 8288 web links with rel="next" are the standard way to point at the next page.')
    est(t, 't236-a6', t['questions'][5]['concept'], 'An endpoint returns 50 items per page and fetches limit + 1 rows to set has_more. A client reads 7 full pages, then a final page of 12 items. How many rows does the database return across the 8 requests?',
        'rows', 369, 0, [362, 400], ['Each full page fetches 51 rows', 'The last page returns all 12 remaining rows'], '7 × (50 + 1) + 12', '7 × 51 = 357, plus 12 = 369 rows',
        'Sanity check: the extra row adds only 7 rows over 8 requests, far cheaper than counting the full result each time.')
    t['deep']['mechanism']['steps'][1] = 'Keyset (cursor) pagination sorts by a unique, stable key and asks for rows after the last key seen: WHERE (created_at, id) > (:t, :id) ORDER BY created_at, id LIMIT 20. Engines without row-value comparison (or that do not use the index for it) need the expanded form: created_at > :t OR (created_at = :t AND id > :id). With a matching index the database seeks directly to the start.'
    t['deep']['numbers'] = {'title': 'The cost of an exact total (illustrative)', 'assumptions': ['A filtered list with 2,000,000 matching rows', 'An index scan reads about 500,000 entries a second', 'Pages of 50 rows'],
        'steps': ['An exact count reads all 2,000,000 matching entries: about 4 s per request.', 'A page with limit + 1 reads 51 rows: a few milliseconds.', 'So the count costs on the order of a thousand times more than the page.', 'has_more, or a cached estimate labelled as such, keeps every page fast.'],
        'result': 'Exact totals on large filtered lists can cost more than the data; prefer has_more or labelled estimates.'}
    t['deep']['takeaways'] = ['Cap page size and allowlist filter and sort fields.', 'Bind cursors to their filters and sort; sign them or keep them opaque.', 'Use Link rel="next" and has_more instead of costly exact counts.', 'Keyset cursors need a unique, stable sort and a matching index.']
    t['interactive']['control'] = {'label': 'Page number', 'min': 50, 'max': 10000, 'step': 50, 'initial': 50, 'unit': 'page'}
    # M5: 238 assumes the outbox from topic 44 and remote calls from 266; covers what is left to application code
    t = T[238]
    see(t, 266, 'Why remote calls stay out of open transactions')
    see(t, 44, 'The outbox pattern and change data capture this lesson builds on')
    card(t, 2, 'Recap: dual writes and the outbox', 'Commit-then-publish can lose events and publish-then-commit can invent them; the outbox (Outbox Pattern & CDC, 44) writes the event in the same transaction and relays it later, at least once. Keep remote calls out of open transactions too (Transactions in Practice, 266). What remains is the consumer side and side effects that are not messages.')
    card(t, 3, 'Worked example: the consumer’s inbox table', 'Make “have I handled this event?” and the effect commit together.',
         ['Begin a transaction in the consumer’s own database', 'Insert the event id into processed_events, which has a unique key on it', 'If the insert conflicts, the event was handled: commit and acknowledge', 'Otherwise apply the state change', 'Commit: the id and the effect are stored together or not at all'])
    card(t, 4, 'Side effects outside any database', 'Emails and payment calls cannot join a transaction. Record the intent as a row with the change, then let a worker perform it with an idempotency key derived from the event id. Payment providers that support idempotency keys return the original result for a repeated key; for email, record the send against the event id before acknowledging.')
    card(t, 5, 'Trap: polling the outbox by id', 'A relay that polls WHERE id > last_seen can skip rows for good. Ids are assigned when a row is inserted, but transactions commit in a different order: if id 101 commits after id 102 has been read, the watermark has already moved past it. Read the change log (CDC), track a sent flag per row, or re-scan a recent window.')
    t['cards'] = t['cards'][:5] + [{'id': 't238-c6', 'kind': 'text', 'title': 'Ordering and cleanup', 'body': 'Events for one entity should be applied in order: carry a per-entity sequence number and route all events for an entity through one partition or queue key. Sent outbox rows are only needed briefly; delete or archive them on a schedule so the table and its index stay small.', 'teaches': t['deep']['teaches'][:1]}]
    mc(t, 't238-a1', t['questions'][0]['concept'], 'A consumer records handled event ids in a separate cache and updates its database separately. It crashes after the database commit, before recording the id. What happens on redelivery?',
       ['The broker skips the redelivered event', 'The effect is applied a second time', 'The database rolls back the first change', 'The event id is recorded automatically'], 'The effect is applied a second time', 'Dedupe and effect must commit together, or a crash between them causes a repeat.')
    mc(t, 't238-a3', t['questions'][2]['concept'], 'A relay polls WHERE id > last_seen. Transaction A gets id 101 but commits after transaction B, which has id 102. What can go wrong?',
       ['Row 101 is skipped for good', 'Row 102 is published twice', 'Both rows wait for a restart', 'The relay locks the whole table'], 'Row 101 is skipped for good', 'The watermark moved past 101 before it was visible.')
    mc(t, 't238-a4', t['questions'][3]['concept'], 'A worker sends a confirmation email for each OrderPlaced event and may see the same event twice. What makes the email go out once?',
       ['Record the send in a table keyed by event id', 'Send only when the broker queue is idle', 'Add a random delay before each send', 'Turn on the broker’s exactly-once mode'], 'Record the send in a table keyed by event id', 'An idempotency record keyed by the event id turns a repeat into a no-op.')
    t['deep']['mechanism']['steps'][2] = 'Polling relays must not rely on a monotonically advancing id: ids are assigned at insert time, transactions commit in another order, so a row can become visible behind the watermark. Change data capture reads the commit log in commit order; pollers can track a sent flag or re-scan a recent window instead.'
    # m4, m5, m6: 237 links Security, avoids repeating it, and closes DNS rebinding
    t = T[237]
    see(t, 302, 'The HMAC and constant-time comparison behind webhook signatures')
    see(t, 308, 'Server-side request forgery, which customer-supplied URLs invite')
    order(t, 't237-a5', t['questions'][4]['concept'], 'Order a signing-secret rotation that does not break deliveries.',
          ['Generate a new secret for the subscription', 'Sign each delivery with both secrets, sending two signatures', 'The receiver switches to verifying with the new secret', 'Stop signing with the old secret and delete it'],
          ['s3', 's1', 's4', 's2'], 'Overlap first, switch the receiver, then retire the old secret.')
    mc(t, 't237-a4', t['questions'][3]['concept'], 'An endpoint has failed every delivery for three days. What should the sender do?',
       ['Keep retrying each event every minute', 'Drop events silently but keep it enabled', 'Disable it and notify its owner', 'Switch it to plain HTTP to save time'], 'Disable it and notify its owner', 'Endless retries waste capacity; disabling with a notice lets the owner fix it and replay.')
    fix(t, 'most other 4xx responses are not retried because repeating them will not help.', 'whether other 4xx responses are retried is a design choice: many senders treat them as permanent, while others retry every non-2xx because a receiver’s 4xx is often a temporary misconfiguration.')
    fix(t, 'resolve the name, reject private, loopback and link-local addresses, do not follow redirects to such addresses, and send from a network segment with no route to internal services.',
        'resolve the name, reject private, loopback and link-local addresses (including IPv6 and IPv4-mapped forms), connect to the address that was validated so a second DNS answer cannot change it (DNS rebinding), do not follow redirects or re-check every hop, and send from a network segment with no route to internal services.')
    fix(t, 'Resolve the host, block private and link-local ranges, and send from an isolated network.', 'Resolve the host, block private and link-local ranges in IPv4 and IPv6, connect to the address you checked, refuse redirects, and send from an isolated network.')
    # stem audit: 238-a5 duplicated 44-a3 (producer flow); test the consumer side instead
    t = T[238]
    order(t, 't238-a5', 'outbox', 'Order what a consumer does with one event so a redelivery changes nothing.',
          ['Receive the event from the broker', 'Begin a local transaction', 'Insert the event id into the inbox table (unique key)', 'Apply the change to its own tables', 'Commit, then acknowledge the broker'],
          ['s3', 's5', 's1', 's4', 's2'],
          'The inbox insert and the change commit together; acknowledging only after commit means a crash leads to redelivery, and the unique key turns that redelivery into a no-op.')
    # m10: 240 reveal no longer contradicts forward compatibility
    t = T[240]
    t['interactive']['reveal'] = 'Readers first is the safe default, because some readers are strict about unknown fields or must act on the new one. With tolerant readers, either order works for an optional field.'
    # n3
    fix(t, 'RFC 8259 notes that numbers beyond the range of IEEE 754 doubles may not be handled interoperably.', 'RFC 8259 notes that numbers beyond the range or precision of IEEE 754 doubles may not be handled interoperably; integers are exact only up to 2^53 − 1.')

def run_frontend():
    fe = json.load(open(FE)); T = {t['id']: t for t in fe}; frontend(T)
    json.dump(fe, open(FE, 'w'), indent=1, ensure_ascii=False); open(FE, 'a').write('\n')


def run_backend():
    be = json.load(open(BE)); T = {t['id']: t for t in be}; backend(T)
    json.dump(be, open(BE, 'w'), indent=1, ensure_ascii=False); open(BE, 'a').write('\n')


if __name__ == '__main__':
    # The Frontend half runs on freshly generated topics (fe-more/build.py calls run_frontend).
    # The Backend half is already baked into fund-backend-more.json (its generator is not in the repo)
    # and is not idempotent, so it only runs on request.
    import sys
    if '--backend' not in sys.argv:
        raise SystemExit('Run scripts/authoring/rebuild.py (npm run content:build) instead; '
                         'the Backend fixes are already in fund-backend-more.json (pass --backend only on a freshly generated file).')
    run_backend(); print('backend review fixes applied')
