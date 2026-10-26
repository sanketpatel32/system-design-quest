"""Quality fixes for the original Cloud & DevOps lessons 321-330 (scripts/authored/fund-cloud.json).
Idempotent: each fix sets a value, and asserts that the question, choice or text it targets exists.
Run from the repo root: python3 scripts/authoring/more3/cloud_fixes.py"""
import json, os

P = os.path.join(os.path.dirname(__file__), '..', '..', 'authored', 'fund-cloud.json')
T = json.load(open(P))
BY = {t['id']: t for t in T}
LOG = []

# qid -> (new choice labels by id or None, new explanation, new prompt or None)
Q = {
 't321-a1': (None, 'Containers share the host kernel, and namespaces only give each one its own view. Each container gets its own network namespace and address, its own filesystem view and its own process ids, so the other options describe the isolation containers do have.', None),
 't321-a2': ({'a': 'So the source files are left out of the final image', 'c': 'So the dependencies are pinned to exact versions', 'd': 'So the build steps can run in parallel'},
   'Layers are cached in order, and the first changed layer invalidates everything after it. Source changes often and the manifest rarely, so installing first keeps the slow dependency layer cached. Leaving source out of the image is what a multi-stage build does, pinning comes from the lock file, and layer order does not make steps parallel.', None),
 't321-a3': (None, 'A digest is a hash of the image content, so it always names the same bytes. Tags, including latest and version tags like v2, are movable pointers that can be re-pushed, and a bare repository name resolves to the latest tag.', None),
 't321-a4': ({'a': 'It gives the container its own kernel instead of the host one', 'b': 'It lets the image be pulled without registry credentials', 'c': 'It stops the container using more memory than its limit'},
   'If an attacker escapes a non-root process, they land with an unprivileged user rather than one that may map to root on the host. The kernel is shared whatever the user, pulls depend on registry auth, and memory limits come from control groups, not the user id.', None),
 't322-a1': ({'a': 'Liveness and readiness together'},
   'Readiness failing removes the pod from service endpoints without restarting it, which is right for a temporary inability to serve. Liveness failing restarts the container, which is wrong for a pod that will recover on its own, so failing both adds a needless restart. Startup probes only gate the first start.', None),
 't322-a2': ({'a': 'Pods are marked unready and keep running'},
   'A liveness probe that checks a dependency fails for every pod at once, so the kubelet restarts them all while the database is slow, adding cold starts and reconnect load. Unready-but-running is what a readiness probe would cause. Kubernetes does not fail over regions, and the probe failure stops cached serving by restarting the process.', None),
 't322-a3': (None, 'Memory cannot be taken back from a process, so exceeding the limit gets the container OOM-killed and restarted. Slowing down is what happens at a CPU limit (throttling), swap is normally off for Kubernetes nodes, and the scheduler never moves a running pod to another node.', None),
 't322-a4': (None, 'The controller compares desired with actual replicas and creates new pods, which the scheduler places on healthy nodes. It cannot touch the failed node’s kernel, needs no approval, and never lowers the desired count; only a person or an autoscaler changes that.', None),
 # t323-a1 superseded by quality/q_cloud.py
 't323-a2': ({'a': 'Staging tests can then run in parallel with the production deploy', 'd': 'Each environment can build from its own branch'},
   'Promoting one artefact means production runs the exact bytes that passed the tests; rebuilding can pull different dependencies. Configuration still differs per environment and is injected at deploy time. Running staging tests in parallel with production defeats the gate, and per-environment branches are the drift this practice prevents.', None),
 't323-a3': (None, 'Long-lived branches drift apart, so integration problems surface late as big merges and test failures. Monthly merges mean fewer builds and slower feedback, not more, and branches use little build-server disk.', None),
 't323-a4': ({'a': 'Test coverage of the main branch', 'b': 'Mean time between failures', 'd': 'Story points completed per sprint'},
   'Change fail rate is one of DORA’s software delivery metrics, with deployment frequency, change lead time, failed deployment recovery time and deployment rework rate. Coverage is a code metric, mean time between failures is a hardware-style reliability measure that DORA does not use, and story points measure planning, not delivery.',
   'Which is one of DORA’s software delivery metrics?'),
 't324-a1': (None, 'Blue-green keeps the old environment running, so rollback is a traffic switch. A rolling update must roll every instance back, recreate has to restart the old version from scratch, and manual patching is slow in both directions.', None),
 't324-a2': (None, 'At 1% of a low-traffic service, ten minutes may see only a handful of requests, too few to show a bad error rate or latency. The baseline is not slowed and the canary takes little capacity; users noticing the change is not the risk the test is about.', None),
 't324-a3': ({'b': 'They run in the same availability zone', 'd': 'The canary gets its own copy of the cache'},
   'Both versions read and write the same data, so the schema must be compatible both ways during the rollout. They can run in any zones, separate databases or cache copies would split the data, and the code differs by definition.', None),
 't324-a4': (None, 'Comparing with the current version over the same minutes removes time-of-day and traffic-mix effects. Last month’s average and a yearly budget are not like-for-like, and staging results do not show production behaviour.', None),
 't325-a1': (None, 'The plan shows what will really happen, including replacements and destroys that a small diff can hide. Commit message, author experience and diff size do not tell you whether a database will be replaced.', None),
 't325-a2': (None, 'Drift is live infrastructure that no longer matches the declared configuration, often from console edits. Provisioning creates resources, promotion moves an artefact between environments, and rollback returns to a previous version.', None),
 't325-a3': ({'a': 'To make the apply reversible if it fails halfway', 'b': 'To stop the provider changing resources during the apply', 'd': 'To keep the plan from going stale after review'},
   'The lock stops two applies writing state or changing the same resources at once. It does not make a failed apply reversible, cannot stop the cloud provider or anyone in the console from changing things, and a plan goes stale whenever the code or real resources change.', None),
 't325-a4': ({'a': 'Running plan and apply in a single CI step', 'b': 'One shared state covering all environments together', 'c': 'Pinning provider versions in every module'},
   'Splitting state by environment and component means one apply can only touch that slice. One shared state puts everything in reach of every apply, merging plan and apply skips review, and pinning providers improves repeatability without limiting what an apply can change.', None),
 't326-a1': (None, 'An SLI should measure what users experience, here checkout requests that succeed fast enough. Server count, CPU and database size are internal signals that can look fine while checkouts fail.', None),
 't326-a3': ({'d': 'Lower the SLO so the budget is no longer spent'},
   'A typical policy pauses risky launches and spends effort on reliability until the budget recovers. Shipping as planned ignores the budget, raising the SLO makes it harder still, and lowering the SLO to clear the budget breaks the agreement it exists to protect.', None),
 't326-a4': (None, 'Burn rate is how fast the budget is spent relative to the even rate that lasts the whole window, so 10 means 30 days ÷ 10 = 3 days. It is not a percentage used, a count of incidents, or a longer-lasting budget.', None),
 't327-a1': (None, 'When errors follow a deploy, rolling back is usually the fastest way to stop the harm; diagnosis can follow. Reading the diff or adding logging extends the outage, and the postmortem comes after recovery.', None),
 # t327-a2 superseded by quality/q_cloud.py
 't327-a3': ({'d': 'Retrain the operator on the tool before they use it again'},
   'A guard in the tool prevents the same mistake by anyone. Recording an operator error, reminding people to be careful and retraining one person rely on humans never slipping, so the same failure can recur.', None),
 't327-a4': ({'a': 'So the postmortem can be finished within a day', 'b': 'So the incident does not count against the error budget', 'c': 'So no one has to own the action items afterwards'},
   'When people are not punished they share what they saw and did, which exposes the system causes. Blamelessness does not make a review faster, does not change the error budget, and action items still need named owners.', None),
 't328-a2': ({'a': 'The autoscaler waits for the scale-down window first', 'c': 'Scale-up is limited to one new instance per minute'},
   'Even a fast decision needs minutes of boot, image pull and warm-up before new capacity serves. Scale-down windows only delay removing instances, scale-up rates are configurable rather than one a minute, and load balancers send traffic to new instances once their health checks pass.', None),
 't328-a3': (None, 'When work waits on I/O, CPU stays low while the backlog grows; queue depth per worker measures the waiting work directly. Memory and network bytes may not change with backlog, and CPU is the signal that is misleading here.', None),
 't328-a4': ({'b': 'Scale-down needs a manual approval in most autoscalers', 'c': 'The metric is only collected every few minutes when load is low'},
   'A stabilisation window avoids removing instances on a brief dip and adding them back moments later. Scale-down is automatic, metric collection does not slow at low load, and removing instances saves money rather than costing more.', None),
 't329-a1': ({'b': 'Its network ACL allows all inbound traffic', 'c': 'It hosts the NAT gateway', 'd': 'Its instances get public DNS names'},
   'A subnet is public when its route table sends internet traffic to an internet gateway. An open network ACL still leaves no route out, a NAT gateway sits in a public subnet because it needs that route, and DNS names do not create reachability.', None),
 't329-a2': ({'a': 'Yes, unless the network ACL already allows it', 'd': 'Only for responses to IPv6 clients'},
   'Security groups are stateful: return traffic for an allowed connection is permitted without an outbound rule. Network ACLs are stateless and do need return rules, but that is a separate layer, and the behaviour is the same for IPv4 and IPv6.', None),
 't329-a3': (None, 'A NAT gateway in a public subnet lets private servers start outbound connections while staying unreachable from outside. Public IPs, a move to the public subnet or an open security group all expose the servers to inbound traffic.', None),
 't329-a4': (None, 'Referencing the app servers’ security group allows exactly those instances, even as they scale. 0.0.0.0/0 and the whole VPC range admit far more than the app tier, and the NAT gateway’s address is for outbound internet traffic, not internal calls.', None),
 't330-a1': (None, 'The recovery point objective is the most data, measured in time, you can afford to lose. The recovery time objective is how long recovery may take, mean time between failures measures failure frequency, and an SLI measures service quality.', None),
 't330-a2': (None, 'Replicas copy every committed change, so the drop reaches the synchronous replica too; only a backup or point-in-time restore lets you go back. Replicas do not keep, reject or pause on valid statements.', None),
 't330-a3': ({'c': 'Encrypting the backups with a key in the production account'},
   'Immutable copies in a separate account cannot be deleted with the production admin credentials an attacker holds. Compression changes nothing, and backups or keys in the same account are within the attacker’s reach.', None),
 't330-a4': ({'c': 'Warm standby scaled down in a second region'},
   'Active-active already serves traffic in both regions, so recovery is mostly shifting load. Warm standby must scale up, pilot light must start most services, and backup and restore must rebuild everything, each with a longer RTO.', None),
}

TEXT = [
 (321, ['cards', 0, 'body'], 'which is why containers start in milliseconds', 'which is why containers usually start in well under a second'),
 (329, ['cards', 0, 'body'], 'You divide it into subnets, usually per availability zone, and attach route tables that decide where traffic goes.',
  'You divide it into subnets and attach route tables that decide where traffic goes. On AWS and Azure a subnet lives in one availability zone, so you create one per zone; on Google Cloud subnets are regional and span its zones.'),
 (322, ['deep', 'mechanism', 'steps', 5], 'then SIGKILL after the grace period.', 'then SIGKILL after the grace period, 30 seconds by default.'),
 (323, ['objectives', 2], 'Use the four DORA metrics to judge delivery performance', 'Use DORA’s software delivery metrics to judge delivery performance'),
 (323, ['deep', 'mechanism', 'steps', 5],
  'Measure: DORA’s four keys, deployment frequency, lead time for changes, change failure rate and time to restore, show',
  'Measure: DORA’s software delivery metrics, deployment frequency, change lead time, change fail rate, failed deployment recovery time and deployment rework rate, show'),
 (323, ['deep', 'india', 'title'], 'DORA’s four keys', 'DORA’s software delivery metrics'),
 (323, ['deep', 'india', 'body'],
  'It measures software delivery performance with four metrics: deployment frequency, lead time for changes, change failure rate and time to restore service.',
  'For years it measured delivery with four keys: deployment frequency, lead time for changes, change failure rate and time to restore service. It now uses five metrics in two groups, throughput (change lead time, deployment frequency, failed deployment recovery time) and instability (change fail rate, deployment rework rate), where rework rate counts unplanned deployments made to fix problems in production.'),
 (323, ['deep', 'takeaways', 3], 'Track the four DORA metrics.', 'Track DORA’s delivery metrics for both speed and stability.'),
 (323, ['flashcards', 2, 'front'], 'Four DORA metrics?', 'DORA’s delivery metrics?'),
 (323, ['flashcards', 2, 'back'], 'Deployment frequency, lead time for changes, change failure rate, time to restore service.',
  'Deployment frequency, change lead time, failed deployment recovery time, change fail rate and deployment rework rate.'),
 (322, ['deep', 'mechanism', 'steps', 3], 'Pods with requests equal to limits get the highest quality-of-service class and are evicted last under node pressure.',
  'A pod is in the Guaranteed quality-of-service class only when every container sets requests equal to limits for both CPU and memory. Under node memory pressure the kubelet first evicts pods using more memory than they requested, so BestEffort and over-request Burstable pods go before Guaranteed ones.'),
]


def get(o, path):
    for k in path:
        o = o[k]
    return o


def put(o, path, v):
    for k in path[:-1]:
        o = o[k]
    o[path[-1]] = v


for qid, (labels, expl, prompt) in Q.items():
    tid = int(qid[1:4])
    q = next(x for x in BY[tid]['questions'] if x['id'] == qid)
    ids = {c['id'] for c in q['choices']}
    if labels:
        assert not (set(labels) & set(q['correctChoiceIds'])), qid + ': never relabel the correct choice'
        assert set(labels) <= ids, qid
        for c in q['choices']:
            if c['id'] in labels and c['label'] != labels[c['id']]:
                LOG.append(f'{qid} choice {c["id"]}: {c["label"]!r} -> {labels[c["id"]]!r}')
                c['label'] = labels[c['id']]
    if q['explanation'] != expl:
        LOG.append(f'{qid} explanation now covers every option')
        q['explanation'] = expl
    if prompt and q['prompt'] != prompt:
        LOG.append(f'{qid} prompt: {prompt!r}')
        q['prompt'] = prompt

TEXT_REVIEW = [
 (323, ['deep', 'india', 'body'], 'It now uses five metrics in two groups,', 'Its current guidance on dora.dev uses five metrics in two groups,'),
]


def reviewed(tid, path, text):
    # TEXT_REVIEW (below) rewords part of some TEXT results, so on a rerun the TEXT fix is already in, in its reviewed form
    for rt, rp, ro, rn in TEXT_REVIEW:
        if rt == tid and rp == path:
            text = text.replace(ro, rn)
    return text


for tid, path, old, new in TEXT:
    cur = get(BY[tid], path)
    if new in cur or reviewed(tid, path, new) in cur:
        continue
    assert old in cur, (tid, path, old)
    put(BY[tid], path, cur.replace(old, new))
    LOG.append(f'{tid} {".".join(map(str, path))}: {old[:50]!r} -> {new[:60]!r}')

# Review fixes (review/cloud): the correct choice of t323-a4 was the shortest option by far, and the DORA
# source pointed at the State of DevOps landing page rather than the metrics definition.
REVIEW_CORRECT_LABELS = {'t323-a4': ('c', 'Change fail rate of deployments')}
for qid, (cid, label) in REVIEW_CORRECT_LABELS.items():
    q = next(x for x in BY[int(qid[1:4])]['questions'] if x['id'] == qid)
    c = next(x for x in q['choices'] if x['id'] == cid)
    if c['label'] != label:
        LOG.append(f'{qid} correct choice {cid}: {c["label"]!r} -> {label!r}')
        c['label'] = label
for s in BY[323]['sources']:
    if s['url'] == 'https://cloud.google.com/devops/state-of-devops':
        s['title'] = 'DORA: Software delivery performance metrics'
        s['url'] = 'https://dora.dev/guides/dora-metrics/'
        LOG.append('323 DORA source -> dora.dev metrics guide')
for tid, path, old, new in TEXT_REVIEW:
    cur = get(BY[tid], path)
    if new in cur:
        continue
    assert old in cur, (tid, path, old)
    put(BY[tid], path, cur.replace(old, new))
    LOG.append(f'{tid} {".".join(map(str, path))}: {old[:50]!r} -> {new[:60]!r}')

with open(P, 'w') as f:
    json.dump(T, f, ensure_ascii=False, indent=1)
    f.write('\n')
print('\n'.join(LOG) if LOG else 'no changes (already applied)')
