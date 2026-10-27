"""Quality pass, Cloud: two definition questions become team and incident scenarios. Applied by apply.py."""

P = {
 323: {
  'q': {
   't323-a1': {'prompt': 'Team A’s passing builds wait for a release manager to click Deploy. Team B’s go to production automatically behind canaries. Which practice is each following?',
    'choices': [('a', 'A: continuous delivery; B: continuous deployment'), ('b', 'A: continuous deployment; B: continuous delivery'), ('c', 'A: continuous integration only; B: delivery'), ('d', 'Both continuous deployment, with other gates')],
    'correct': 'a',
    'explanation': 'Both keep main releasable; the difference is the manual approval before production. Team A has it (continuous delivery) and team B removed it (continuous deployment). A team that merges and tests but cannot release on demand is doing integration only, and a human click is exactly what continuous deployment removes.'},
  },
 },
 327: {
  'q': {
   't327-a2': {'prompt': 'During a payments outage, the incident commander starts logging into servers to try fixes. Why is that a problem?',
    'choices': [('a', 'Commanders lack production access by policy'), ('b', 'Nobody is coordinating or deciding meanwhile'), ('c', 'Fixes are allowed only after the postmortem'), ('d', 'Customers must be told before any change')],
    'correct': 'b',
    'explanation': 'The commander’s job is to coordinate people, hold the overall picture and make calls such as “roll back now”; with hands on the keyboard they lose that view and nobody is steering. Access policies vary, fixes do not wait for the postmortem, and customer updates run in parallel through the communications lead.'},
  },
 },
 325: {'q': {
   't325-a2': {
     'prompt': 'The IaC plan wants to remove a port 22 rule from a production security group, though nobody changed the code. What most likely happened?',
     'choices': [('a', 'The provider plugin was upgraded overnight'),
                 ('b', 'Someone added the rule by hand: drift'),
                 ('c', 'The state lock expired and reset the rule'),
                 ('d', 'The plan is cached from an earlier branch')],
     'correct': 'b',
     'explanation': 'The plan compares the code with what really exists. A rule that exists but is not in the code was almost certainly added in the console, which is drift, and applying would remove it. Decide whether to delete it or add it to the code. Provider upgrades rarely invent rules, a lock only blocks concurrent applies, and each plan is computed fresh.'},
   't325-a5': {'explanation': 'Change the code in a branch, let CI produce the plan, have reviewers approve both, then apply exactly that saved plan under a state lock. Applying the reviewed plan file, rather than planning again at apply time, guarantees that what runs is what was approved.'},
   't325-a6': {'explanation': 'Importing what exists into code captures the real settings once; the second region is then an apply of the same code, and future changes go to both. Clicking through again or following a document copies hundreds of settings by hand, misses some, and drifts as production changes.'},
 }},
 321: {'q': {
   't321-a5': {'explanation': 'Copy the manifest and install first so that layer stays cached, then copy the source and compile, then start a slim runtime stage and copy in only the built artefact, run as a non-root user. Compilers and build caches stay behind in the build stage, so the runtime image is smaller and has less to attack.'},
   't321-a6': {'explanation': 'Plain containers share the host kernel, so one kernel bug lets a tenant’s code escape to every other tenant on the host; bare processes share even more. A lightweight VM or sandboxed runtime gives each tenant its own kernel boundary and still starts in well under a second.'},
 }},
 324: {'q': {
   't324-a3': {'explanation': 'During a rollout both versions read and write the same database, so the schema must work for both: add columns before code uses them and drop them only after no version does. Zones do not matter, and separate databases or private cache copies would split the data that users share.'},
   't324-a5': {'explanation': 'Send a small share of traffic to the new version, compare its errors and latency with the current version over the same period, widen in steps while they stay healthy, and finish or roll back automatically when a check fails.'},
   't324-a6': {'explanation': 'An update that crashes machines does the most damage when it reaches all of them at once, as the July 2024 security-agent outage showed. Rings (internal, then a small customer share, then wider) catch a crash on a few machines first and cost hours, not days. A global push stakes millions of machines on one test, and leaving testing to each customer means most never do, so the risk is unchanged.'},
 }},
 329: {'q': {
   't329-a5': {'explanation': 'A request enters the load balancer in a public subnet, which forwards it to an app server in a private subnet, which queries the database in a data subnet; the response returns along the same connections. Only the load balancer is reachable from the internet.'},
   't329-a6': {'explanation': 'A managed session service, or a bastion with identity-based, logged access, satisfies the audit requirement and needs no public IPs on servers. SSH open to the internet invites constant scanning, and a shared key on a wiki leaves no record of who did what and cannot be revoked for one person.'},
 }},
 330: {'q': {
   't330-a5': {'explanation': 'Backup and restore rebuilds everything (hours), pilot light keeps data replicated and core pieces ready (tens of minutes), warm standby runs a scaled-down copy (minutes), and active-active already serves traffic (near zero). Each step faster costs more to keep running.'},
   't330-a6': {'explanation': 'The reporting tool tolerates a day of downtime and data loss, so nightly backups are enough; payments need RTO under 15 minutes and RPO near zero, which needs replication and a warm standby. Active-active everywhere spends the budget on a tool that does not need it, and nightly backups for payments could lose a day of transactions.'},
 }},
 326: {'q': {
   't326-a5': {'explanation': 'Pick the user journey that matters, define the SLI as good events over valid events, set the target and window (say 99.9% over 30 days), and alert on how fast the error budget burns. Alerting before the SLO exists has nothing to measure against.'},
   't326-a6': {'explanation': 'Multi-window burn-rate alerts page only when errors would spend a meaningful share of the budget, for example 2% of a 30-day budget within an hour, so brief self-healing spikes stop paging while real outages still do. Stricter thresholds add pages, and no paging misses outages entirely.'},
 }},
}
