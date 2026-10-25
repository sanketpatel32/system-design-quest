"""Integration-round fixes that span sections (third content round).

Idempotent: edits scripts/authored/*.json in place by topic id. Re-run after any section
builder (more3/fe.py, be.py, net.py, sd.py) regenerates its file, otherwise these are lost.
- 528 card 1: say plainly that the cascade compares in order and the later declaration only wins ties.
- Cross-section seeAlso links that became possible once all branches merged.
"""
import json, glob, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'authored')
FILES = sorted(glob.glob(os.path.join(ROOT, '*.json')))
data = {f: json.load(open(f, encoding='utf-8')) for f in FILES}
T = {t['id']: t for f in FILES for t in data[f]}
log = []

OLD_528 = 'The cascade sorts the competing declarations and the first one wins. The order is: origin and importance, then cascade layer, then specificity, then order of appearance.'
NEW_528 = ('The cascade compares the competing declarations step by step, moving to the next step only on a tie: '
           'origin and importance, then cascade layer, then specificity, then order of appearance. '
           'So the later declaration wins only when origin, layer and specificity are all equal.')
c = next(x for x in T[528]['cards'] if x['id'] == 't528-c1')
if OLD_528 in c['body']:
    c['body'] = c['body'].replace(OLD_528, NEW_528); log.append('t528-c1: cascade order wording')
else:
    assert NEW_528 in c['body'], 't528-c1: neither old nor new wording found'

LINKS = [
    (531, 504, 'Double-entry ledgers record every money movement as balanced entries, in the minor units this lesson stores'),
    (504, 531, 'Money in code: minor units, rounding and currency, the amounts every ledger entry depends on'),
    (711, 524, 'Formatting those stored instants for each user’s locale and time zone on the front end'),
    (524, 711, 'Storing and scheduling times on the server: zones, daylight saving and local-time jobs'),
    (712, 212, 'Forms are where user text first arrives, with client-side length checks that should match the server'),
    (712, 524, 'Translated and right-to-left text the backend must store and count correctly'),
    (212, 712, 'How the server decodes, normalises and length-checks the text a form submits'),
    (524, 712, 'Unicode normalisation and length limits for translated and user-entered text on the server'),
    (536, 527, 'The front-end side of the same test pyramid: component, integration and end-to-end tests'),
    (527, 536, 'Unit, integration and contract tests for the services the UI calls'),
    (542, 540, 'Servers holding many long-lived connections live by these idle-timeout rules at scale'),
    (540, 542, 'Keep-alive and idle timeouts at each hop decide when a held connection is cut'),
]
for a, b, why in LINKS:
    sa = T[a].setdefault('seeAlso', [])
    if not any(s['topicId'] == b for s in sa):
        sa.append({'topicId': b, 'why': why}); log.append(f'{a} -> {b}: seeAlso')

changed = set() if not log else {f for f in FILES for t in data[f] if t['id'] in {528} | {a for a, _, _ in LINKS}}
for f in changed:
    # Only the files holding edited topics, so files written with other JSON layouts are left byte for byte
    with open(f, 'w', encoding='utf-8') as fh:
        json.dump(data[f], fh, ensure_ascii=False, indent=1); fh.write('\n')
print('\n'.join(log) or 'integrate_fixes: nothing left to apply')
