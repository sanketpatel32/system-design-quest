"""Quality fixes for existing Frontend topics (201-220, 341-346).

Idempotent: edits scripts/authored/fund-frontend*.json in place by id.
Rerun after rebuilding those files with more2/build.py or the fe-more builder,
otherwise these fixes are overwritten.
"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'authored')
FILES = ['fund-frontend.json', 'fund-frontend-more.json', 'fund-frontend-extra.json']
data = {f: json.load(open(os.path.join(ROOT, f), encoding='utf-8')) for f in FILES}
T = {t['id']: t for f in FILES for t in data[f]}
log = []


def card(tid, cid):
    return next(c for c in T[tid]['cards'] if c['id'] == cid)


def q(tid, qid):
    return next(x for x in T[tid]['questions'] if x['id'] == qid)


def set_card(tid, cid, **kw):
    c = card(tid, cid)
    if any(c.get(k) != v for k, v in kw.items()):
        c.update(kw); log.append(f'{cid}: updated {",".join(kw)}')


def add_card(tid, c):
    if not any(x['id'] == c['id'] for x in T[tid]['cards']):
        T[tid]['cards'].append(c); log.append(f'{c["id"]}: added')


def set_labels(tid, qid, labels, explanation=None):
    x = q(tid, qid)
    for ch in x['choices']:
        if ch['id'] in labels and ch['label'] != labels[ch['id']]:
            ch['label'] = labels[ch['id']]; log.append(f'{qid}.{ch["id"]}: relabelled')
    if explanation and x['explanation'] != explanation:
        x['explanation'] = explanation; log.append(f'{qid}: explanation')


def add_see(tid, other, why):
    sa = T[tid].get('seeAlso') or []
    if not any(s['topicId'] == other for s in sa):
        sa.append({'topicId': other, 'why': why}); log.append(f'{tid}: seeAlso +{other}')
    T[tid]['seeAlso'] = sa


def replace_str(tid, old, new):
    """Replace a string anywhere in a topic (cards, deep, etc.)."""
    def walk(v):
        if isinstance(v, str):
            return v.replace(old, new)
        if isinstance(v, list):
            return [walk(x) for x in v]
        if isinstance(v, dict):
            return {k: walk(x) for k, x in v.items()}
        return v
    before = json.dumps(T[tid], ensure_ascii=False)
    if old in before:
        new_t = walk(T[tid]); T[tid].clear(); T[tid].update(new_t); log.append(f'{tid}: "{old}" -> "{new}"')


# 203: c2 pointed at an example that is not next to it; c6 repeated c5 word for word in meaning.
set_card(203, 't203-c2', body='A timer with a 0 ms delay only queues a task. It runs after the current script finishes and after all microtasks, such as resolved promise callbacks. So a script that logs a line, schedules a zero-delay timer and then resolves a promise prints: the log line, then the promise callback, then the timer.')
set_card(203, 't203-c6', title='Edge case: timers in background tabs',
         body='Browsers throttle timers in hidden tabs to save battery, typically to at most about one run per second. Chromium goes further for pages hidden for around five minutes, batching chained timers to about once a minute. A countdown or clock that adds one second per timer tick therefore drifts badly in a background tab. Compute elapsed time from the clock on each tick instead of counting ticks, and refresh the display when the page becomes visible again.',
         teaches=['callback-order'])

# 204: c6 repeated c5 (hydration mismatch); weak distractor in a3.
set_card(204, 't204-c6', title='Edge case: the hidden cost of hydration',
         body='Server rendering with hydration sends the content twice: once as HTML, and again as serialised data the script needs to rebuild the same state. The page also looks ready before it can respond. A click in the gap between first paint and hydration may do nothing, or be replayed later, depending on the framework. Measure that gap on a mid-range phone, keep the serialised state small, and make key links and forms work as plain HTML so early clicks still go somewhere.',
         teaches=['hydration'])
set_labels(204, 't204-a3', {'a': 'Static generation with pages rebuilt each hour'},
           'Per-user data that changes every few seconds cannot be built once for everyone, so it needs rendering at request time, on the server or in the browser. Build-time generation, hourly rebuilds and a weekly file all serve the same stale page to every visitor.')

# 206: "At least 4 KB each" read as if cookies are big; 4,096 bytes is the minimum browsers must support, and most cap near it.
replace_str(206, 'Browsers keep at least 4 KB per cookie (RFC 6265 sets that as a minimum to support).',
            'Each cookie is limited to about 4 KB: RFC 6265 asks browsers to support at least 4,096 bytes per cookie, and most cap it close to that.')
replace_str(206, 'At least 4 KB each', 'About 4 KB each')

# 208: the distractor "It blocks all cross-site requests" is rewritten by the shared
# scripts/option-balance.json. Its old target, "It blocks requests to other origins from the page",
# was partly true (connect-src does that), so the overlay now targets a clearly false CSRF-style
# claim. The label must stay as-is here or that overlay fails the build. The explanation covers every option.
set_labels(208, 't208-a4', {},
           'CSP limits which scripts the page will execute, which reduces the impact of an injection that slips past encoding. It does not encrypt anything, cannot replace server-side validation, and cannot stop other sites from sending requests to your server; that is what CSRF defences are for.')

# 216: correct answer was the only long option.
set_labels(216, 't216-a3', {'a': 'Change both tracks to 50% widths so they match',
                            'c': 'Turn the grid into a flex row that wraps when full',
                            'd': 'Add a larger gap between the two tracks to absorb it'},
           'A plain 1fr has an automatic minimum equal to its content; minmax(0, 1fr) removes that floor so the tracks stay equal and the URL wraps or scrolls. 50% tracks plus a gap overflow, a wrapping flex row just moves the URL to its own line, and a gap adds space without changing the content minimum.')

# 220: interactive feedback said "margin" but the spinner animates left and top.
x = T[220]['interactive']
for ch in x['choices']:
    if ch['id'] == 'b' and ch['feedback'].startswith('Margin changes'):
        ch['feedback'] = 'Changes to left and top need layout on the main thread, which is busy with the filter for 300 ms.'
        log.append('220 interactive b: feedback names left and top')

# 215-220 had five cards each: add a practical edge case.
add_card(215, {'id': 't215-c6', 'kind': 'text', 'title': 'Edge case: the target is often a child of what you want',
               'body': 'With delegation, the event target is the innermost element clicked, which may be an icon or a text span inside the button. Comparing the target directly with the button misses those clicks. Walk up from the target to the nearest ancestor that matches the button selector, and stop at the element that owns the listener so a match outside the widget is ignored.',
               'teaches': ['delegation']})
add_card(216, {'id': 't216-c6', 'kind': 'text', 'title': 'Edge case: percentage heights need a definite parent',
               'body': 'A child with a height of 50% only works when the parent’s height is known without looking at its children. If the parent’s height comes from its content, the percentage usually behaves as automatic height and the child collapses to its content. Give the parent an explicit height, or let a grid or flex container stretch the child, instead of chaining percentages up the tree.',
               'teaches': ['normal-flow']})
add_card(217, {'id': 't217-c6', 'kind': 'text', 'title': 'Edge case: srcset widths without sizes',
               'body': 'When candidates are listed by width but the sizes attribute is missing, the browser assumes the image fills the viewport width. A 300 px thumbnail on a 1,280 px wide screen at 2× density then picks a candidate of about 2,560 px, many times the bytes needed. Always describe the slot with sizes when using width descriptors.',
               'teaches': ['responsive-images']})
add_card(218, {'id': 't218-c6', 'kind': 'text', 'title': 'Edge case: quiet connections get cut',
               'body': 'Proxies, load balancers and mobile networks close connections that carry no data for a while; idle timeouts of about a minute are common defaults. A live feed that only speaks when there is news can die silently in a quiet hour. Send a small heartbeat more often than the shortest idle timeout on the path, for example every 25 to 30 seconds, and treat a missing heartbeat as a reason to reconnect.',
               'teaches': ['reconnect']})
add_card(219, {'id': 't219-c6', 'kind': 'text', 'title': 'Edge case: one node keeps its whole tree',
               'body': 'Nodes in a document link to their parent, children and siblings. Keeping a reference to a single removed row therefore keeps the entire removed table reachable, with every row, listener and piece of data attached to it. A snapshot then shows thousands of detached nodes held by one small reference. Find that reference and clear it, instead of hunting for each node.',
               'teaches': ['detached']})
add_card(220, {'id': 't220-c6', 'kind': 'text', 'title': 'Edge case: users who ask for less motion',
               'body': 'Operating systems let users ask for reduced motion, and pages can read that preference through a media query. Large movements, parallax and zooming transitions can cause dizziness or nausea for some people. When the preference is set, replace movement with a short fade or an instant change, and keep animations that carry meaning, such as a progress indicator, small and slow.',
               'teaches': ['property-cost']})

# See also: link older topics to the new deeper ones.
add_see(201, 528, 'How the cascade, specificity and layers decide which rule wins')
add_see(204, 523, 'Client-side routing for the pages rendered here')
add_see(208, 521, 'Content Security Policy and Subresource Integrity in depth')
add_see(209, 526, 'Focus management for dialogs, menus and live regions')
add_see(209, 524, 'Right-to-left layouts and locale-aware text for all users')
add_see(210, 525, 'Measuring these metrics from real users in the field')
add_see(211, 522, 'Loading web fonts without blocking or shifting text')
add_see(211, 529, 'Third-party scripts, often the biggest source of extra bytes')
add_see(212, 524, 'Locale formats, plural rules and dates in messages')
add_see(213, 530, 'State machines that make UI states explicit')

for f in FILES:
    with open(os.path.join(ROOT, f), 'w', encoding='utf-8') as fh:
        json.dump(data[f], fh, ensure_ascii=False, indent=1); fh.write('\n')
print('\n'.join(log) if log else 'no changes (already applied)')
