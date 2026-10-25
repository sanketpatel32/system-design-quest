"""Integration-round fixes that span sections (third content round).

Idempotent: edits scripts/authored/*.json in place by topic id. Re-run after any section
builder (more3/fe.py, be.py, net.py, sd.py) regenerates its file, otherwise these are lost.
- 528 card 1: say plainly that the cascade compares in order and the later declaration only wins ties.
- Cross-section seeAlso links that became possible once all branches merged.
- Round 4 (Security): CA/B Forum source on 662; 666-a6 and 669's federation example and
  question no longer duplicate Cloud 582; a database-trigger audit card on 575.
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
    # Round 3 (Databases, OS, Cloud merged)
    (644, 507, 'Little’s Law and utilisation: the queueing maths behind pool and queue sizes'),
    (322, 565, 'cgroups are how the orchestrator’s CPU and memory limits are enforced on the node'),
    (589, 565, 'Requests and limits the scheduler places by become cgroup CPU shares, quotas and memory caps'),
    (321, 649, 'Namespaces are the kernel feature that gives each container its own view of the system'),
    (683, 549, 'The IPsec and WireGuard tunnels that site-to-site VPNs and hybrid links are built from'),
    (683, 541, 'BGP is how routes are exchanged over hybrid links, transit hubs and direct connections'),
    (590, 606, 'Network policies and service routing sit on the kernel’s connection tracking and stateful filtering'),
    (587, 507, 'Little’s Law and utilisation explain why latency climbs steeply at the knee'),
    (587, 501, 'Tail latency and fan-out: why load tests must report p99, not the average'),
    (581, 506, 'Cells shrink the blast radius further than zones and regions alone'),
    (586, 506, 'Cell boundaries are what a game day checks: does a failure stay inside one cell?'),
    (690, 525, 'Real user monitoring supplies the user-facing signals worth alerting on'),
    (687, 536, 'The unit, integration and contract tests a service’s CI pipeline runs'),
    (687, 527, 'The front-end test mix whose speed and flakiness CI has to manage'),
    (688, 309, 'Signed, scanned images are the supply-chain side of building infrastructure once'),
    (540, 566, 'Every live connection holds a file descriptor, so the open-files limit caps a gateway'),
]
for a, b, why in LINKS:
    sa = T[a].setdefault('seeAlso', [])
    if not any(s['topicId'] == b for s in sa):
        sa.append({'topicId': b, 'why': why}); log.append(f'{a} -> {b}: seeAlso')

# Round 4 (Security merged)
def edit(tid, done, apply, what):
    """Run apply() unless done() already holds; record the topic as changed."""
    if not done():
        apply(); log.append(f'{tid}: {what}'); edited.add(tid)
edited = set()

def card(tid, cid):
    return next(x for x in T[tid]['cards'] if x['id'] == cid)

def question(tid, qid):
    return next(x for x in T[tid]['questions'] if x['id'] == qid)

SC081 = {'title': 'CA/Browser Forum Ballot SC-081v3: Introduce Schedule of Reducing Validity and Data Reuse Periods',
         'url': 'https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/'}
edit(662, lambda: any(x['url'] == SC081['url'] for x in T[662]['sources']),
     lambda: T[662]['sources'].append(dict(SC081)), 'CA/B Forum SC-081v3 source')

# 666-a6 asked the explicit-deny question Cloud 582 already teaches; ask about policy conditions instead
A6 = {
    'id': 't666-a6', 'concept': 'policy-scoping', 'type': 'multiple_choice',
    'prompt': ('An internal support tool’s role can read customer records, and its credentials could leak from a '
               'support laptop. Which policy condition most limits what a thief could do with them?'),
    'choices': [
        {'id': 'a', 'label': 'Allow requests only from the tool’s private network'},
        {'id': 'b', 'label': 'Allow requests only when they are sent over HTTPS'},
        {'id': 'c', 'label': 'Allow requests only during the support team’s hours'},
        {'id': 'd', 'label': 'Allow requests only when the user agent is the tool’s'},
    ],
    'correctChoiceIds': ['a'],
    'explanation': ('A network condition means a copied credential fails when it is used from the thief’s own machine. '
                    'HTTPS is expected anyway and says nothing about who is sending. Office hours still leave the thief '
                    'hours every day. The user agent is a header the caller chooses, so anyone can copy it.'),
}
def set_a6():
    qs = T[666]['questions']; qs[[q['id'] for q in qs].index('t666-a6')] = A6
edit(666, lambda: question(666, 't666-a6') == A6, set_a6, 't666-a6 replaced (policy conditions, not explicit deny)')

# 669: Cloud 582 owns the federation walk-through and the "why federate" question; 669 teaches pinning instead
C3 = {
    'id': 't669-c3', 'kind': 'diagram', 'title': 'Worked example: a third-party step whose tag moved',
    'body': 'A build job pulls in a popular third-party step to list the files a pull request changed.',
    'teaches': ['step-pinning'],
    'steps': ['The workflow refers to the step by a version tag, such as v45',
              'A tag is a movable pointer: whoever controls that repository can point it at new code',
              'In March 2025 the tags of tj-actions/changed-files were moved to a commit that printed runner secrets into build logs',
              'Fix: refer to the step by its full commit hash, which cannot be moved, and review each proposed update',
              'Give the job only the token permissions it needs, so a step that turns malicious has little to steal'],
}
A2 = {
    'id': 't669-a2', 'concept': 'step-pinning', 'type': 'multiple_choice',
    'prompt': ('A workflow uses a third-party step as some-org/scan@v2, and the job holds a registry write token. '
               'Which change best stops a hijacked release of that step from stealing the token?'),
    'choices': [
        {'id': 'a', 'label': 'Refer to the step by its full commit hash, and review updates'},
        {'id': 'b', 'label': 'Refer to the step by its latest tag, so fixes arrive sooner'},
        {'id': 'c', 'label': 'Turn on log masking for the registry token in that job'},
        {'id': 'd', 'label': 'Run the step only after the unit tests have passed in the job'},
    ],
    'correctChoiceIds': ['a'],
    'explanation': ('A commit hash names exact code that cannot be swapped later, so a moved tag changes nothing until '
                    'someone reviews an update. The latest tag pulls in whatever the tag now points at. Masking hides exact '
                    'strings in logs, not network calls. Running after the tests does not change what the step’s code can do.'),
}
OLD_C4 = 'and making it short-lived so a stolen copy expires.'
NEW_C4 = 'and making it short-lived, by federating the job to the cloud for credentials that expire within minutes, so a stolen copy soon stops working.'
def set_669():
    t = T[669]; cs = t['cards']; cs[[c['id'] for c in cs].index('t669-c3')] = C3
    qs = t['questions']; qs[[q['id'] for q in qs].index('t669-a2')] = A2
    c4 = card(669, 't669-c4'); c4['body'] = c4['body'].replace(OLD_C4, NEW_C4)
    if 'oidc-federation' not in c4['teaches']: c4['teaches'].append('oidc-federation')
    if 'step-pinning' not in t['deep']['teaches']: t['deep']['teaches'].append('step-pinning')
    src = {'title': 'GitHub Docs: Secure use reference for GitHub Actions', 'url': 'https://docs.github.com/en/actions/reference/security/secure-use'}
    if not any(x['url'] == src['url'] for x in t['sources']): t['sources'].append(src)
edit(669, lambda: card(669, 't669-c3') == C3 and question(669, 't669-a2') == A2 and NEW_C4 in card(669, 't669-c4')['body'],
     set_669, 'pinning worked example and question replace the federation ones Cloud 582 owns')

# 575: database-side audit rows, written in the same transaction by a trigger
C6 = {
    'id': 't575-c6', 'kind': 'text', 'title': 'Edge case: changes that skip the application',
    'body': ('Audit records written by application code miss changes made straight in the database, such as a migration, '
             'a support script or an attacker with a database login. A trigger on the sensitive tables can insert an audit row '
             'in the same transaction as each change, so the change and its audit row commit or roll back together. Record '
             'the database role, and the acting user when the application sets one, for example with SET LOCAL app.actor_id '
             'in PostgreSQL. A table owner can still disable the trigger or edit the audit table, so the application role '
             'should only be able to insert into it, and its rows should be shipped off the database like other security events.'),
    'teaches': ['audit-integrity'],
}
def set_575():
    cs = T[575]['cards']; ids = [c['id'] for c in cs]
    if 't575-c6' in ids: cs[ids.index('t575-c6')] = C6
    else: cs.insert(ids.index('t575-c5'), C6)
edit(575, lambda: any(c == C6 for c in T[575]['cards']), set_575, 'database trigger audit card')

LINKS4 = [
    (577, 547, 'Network-level floods and amplification, which bot defences at the application layer sit behind'),
    (662, 603, 'DNSSEC and CAA records, which decide who may issue certificates for a domain'),
    (663, 713, 'Mass assignment and over-exposed response fields, the field-level side of object authorisation'),
    (576, 508, 'Noisy neighbours: the performance side of sharing infrastructure between tenants'),
    (576, 557, 'Tenant ids in the schema and row-level security policies that enforce them in the database'),
    (575, 539, 'Product audit trails in code: actor context, impersonation and customer activity logs'),
    (539, 575, 'Making audit records tamper-evident and turning security events into detections'),
    (579, 537, 'Deleting personal data across a service: cascades, tombstones and deletion workflows'),
    (537, 579, 'Minimising and pseudonymising the personal data that deletion workflows have to find'),
    (666, 582, 'Roles, trust policies, federation and explicit deny in cloud IAM'),
    (582, 666, 'Designing the permission policies a role’s sessions run with, and reviewing them over time'),
    (582, 571, 'Workload identity and mTLS between services, beyond calls to the cloud’s own APIs'),
    (588, 571, 'Service-to-service authentication with mTLS and workload identity, which a mesh automates'),
    (685, 666, 'Least privilege inside each account, under the organisation’s guardrails'),
    (685, 580, 'Secure defaults and hardening baselines that guardrails enforce'),
    (686, 661, 'SAST, DAST and dependency scanning, the other automated checks before deploy'),
    (687, 661, 'Security scans that run in the same pipeline and add to its duration'),
    (669, 582, 'Federating CI jobs to the cloud for short-lived credentials, step by step'),
    (575, 555, 'History tables and the triggers that record row changes inside the database'),
    (555, 575, 'Tamper-evident security logging, including audit rows written by database triggers'),
]
for a, b, why in LINKS4:
    sa = T[a].setdefault('seeAlso', [])
    if not any(s['topicId'] == b for s in sa):
        sa.append({'topicId': b, 'why': why}); log.append(f'{a} -> {b}: seeAlso'); edited.add(a)

changed = set() if not log else {f for f in FILES for t in data[f] if t['id'] in {528} | {a for a, _, _ in LINKS} | edited}
for f in changed:
    # Only the files holding edited topics, so files written with other JSON layouts are left byte for byte
    with open(f, 'w', encoding='utf-8') as fh:
        json.dump(data[f], fh, ensure_ascii=False, indent=1); fh.write('\n')
print('\n'.join(log) or 'integrate_fixes: nothing left to apply')
