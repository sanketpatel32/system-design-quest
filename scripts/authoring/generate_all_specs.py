#!/usr/bin/env python3
"""Generate scripts/authoring/all_specs.json with unique lesson and boss specs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from meta import TITLES
from question_factory import drag, estimate, mc, spot, tradeoff
from topic_uniques import (
    unique_card_bodies,
    unique_drag_prompt,
    unique_est_prompt,
    unique_mc2_prompt,
    unique_mc_prompt,
    unique_spot_prompt,
    unique_trade_prompt,
)

OUT = Path(__file__).resolve().parent / "all_specs.json"

# Lessons: 1-73 and 115-120 (74 is tutorial; 75-114 are bosses)
LESSON_IDS = sorted({*range(1, 74), *range(115, 121)})


def blurb_cards(tid: int, title: str, salt: int = 0) -> list[dict[str, Any]]:
    """Five unique lesson cards — bodies from topic_uniques pool (strict-audit safe)."""
    bodies = unique_card_bodies(tid, title, salt=salt)
    kinds = ["text", "text", "diagram", "text", "animation"]
    titles = [
        "Why this matters in interviews",
        "Mental model",
        "Request flow sketch",
        "Trade-off or failure mode",
        "How to explain it aloud",
    ]
    cards = []
    for i, (kind, ct, body) in enumerate(zip(titles, kinds, bodies, strict=True), start=1):
        card: dict[str, Any] = {"kind": kind, "title": ct, "body": body}
        if i == 1:
            card["accent"] = "Interview lens"
        if i == 5:
            card["accent"] = "Say this"
        cards.append(card)
    return cards


def default_objectives(title: str) -> list[str]:
    return [
        f"Explain {title} with measurable requirements and failure modes",
        f"Apply {title} to a high-traffic India-scale scenario in an interview",
    ]


def default_flashcards(tid: int, title: str) -> list[dict[str, str]]:
    return [
        {
            "id": f"t{tid}-f1",
            "front": f"What is the core interview takeaway for {title}?",
            "back": f"Connect user journeys to SLOs, then justify components and trade-offs for {title}.",
        },
        {
            "id": f"t{tid}-f2",
            "front": f"Name one pitfall when discussing {title}.",
            "back": "Skipping scale numbers, ignoring retries/idempotency, or mixing AuthN with AuthZ.",
        },
        {
            "id": f"t{tid}-f3",
            "front": f"Which metric would you cite first for {title}?",
            "back": "p95 latency on the hot path plus error rate on writes/reads that affect revenue or safety.",
        },
    ]


def default_sources(tid: int) -> list[dict[str, str]]:
    sources = [
        {
            "title": "Google SRE Book — Designing Distributed Systems",
            "url": "https://sre.google/sre-book/table-of-contents/",
        },
        {
            "title": "AWS Well-Architected Framework",
            "url": "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
        },
    ]
    extra: dict[int, list[dict[str, str]]] = {
        4: [{"title": "RFC 1122 — Host Requirements", "url": "https://www.rfc-editor.org/rfc/rfc1122"}],
        5: [{"title": "RFC 793 — TCP", "url": "https://www.rfc-editor.org/rfc/rfc793"}],
        6: [{"title": "RFC 1034 — DNS", "url": "https://www.rfc-editor.org/rfc/rfc1034"}],
        7: [
            {"title": "RFC 9110 — HTTP Semantics", "url": "https://www.rfc-editor.org/rfc/rfc9110"},
            {"title": "RFC 8446 — TLS 1.3", "url": "https://www.rfc-editor.org/rfc/rfc8446"},
        ],
        8: [{"title": "RFC 9110 — HTTP Semantics", "url": "https://www.rfc-editor.org/rfc/rfc9110"}],
        9: [
            {"title": "gRPC Concepts", "url": "https://grpc.io/docs/what-is-grpc/core-concepts/"},
            {"title": "GraphQL Specification", "url": "https://spec.graphql.org/"},
        ],
        10: [
            {"title": "RFC 6455 — WebSockets", "url": "https://www.rfc-editor.org/rfc/rfc6455"},
            {"title": "HTML Living Standard — Server-sent events", "url": "https://html.spec.whatwg.org/multipage/server-sent-events.html"},
        ],
        26: [{"title": "PostgreSQL Isolation", "url": "https://www.postgresql.org/docs/current/transaction-iso.html"}],
        29: [{"title": "Dynamo paper", "url": "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"}],
        32: [{"title": "Brewer CAP FAQ", "url": "https://brewer.cs.berkeley.edu/CAP-FAQ.html"}],
        33: [{"title": "Abadi, PACELC, IEEE Computer 2012", "url": "https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf"}],
        37: [{"title": "Kafka Documentation", "url": "https://kafka.apache.org/documentation/"}],
        39: [{"title": "RFC 7231 — HTTP methods (safe/idempotent)", "url": "https://www.rfc-editor.org/rfc/rfc7231"}],
        45: [{"title": "Raft paper", "url": "https://raft.github.io/raft.pdf"}],
        46: [{"title": "Chubby lock service paper", "url": "https://research.google/pubs/pub27897/"}],
        58: [
            {"title": "RFC 6749 — OAuth 2.0", "url": "https://www.rfc-editor.org/rfc/rfc6749"},
            {"title": "OpenID Connect Core", "url": "https://openid.net/specs/openid-connect-core-1_0.html"},
        ],
        59: [{"title": "RFC 7519 — JWT", "url": "https://www.rfc-editor.org/rfc/rfc7519"}],
        92: [
            {"title": "NPCI UPI circulars", "url": "https://www.npci.org.in/what-we-do/upi/product-overview"},
            {"title": "PCI DSS Overview", "url": "https://www.pcisecuritystandards.org/document_library/"},
        ],
    }
    sources.extend(extra.get(tid, []))
    return sources


def default_questions(tid: int, title: str) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    est_prompt, est_target = unique_est_prompt(tid, title)
    return [
        mc(
            f"{q}1",
            unique_mc_prompt(tid, title, 1),
            [
                ("a", "Pick databases before requirements"),
                ("b", "List user actions, scale, and latency/durability targets"),
                ("c", "Draw microservices for every feature"),
                ("d", "Discuss office tooling"),
            ],
            "b",
            "Strong interviews anchor on requirements and SLOs before components.",
        ),
        spot(
            f"{q}2",
            unique_spot_prompt(tid, title),
            [
                ("n1", "Clients", 20, 50),
                ("n2", "API tier", 120, 50),
                ("n3", "Primary database", 220, 50),
            ],
            [("n1", "n2"), ("n2", "n3")],
            ["n3"],
            "Unsharded OLTP primaries usually exhaust connections/IOPS before stateless tiers.",
        ),
        drag(
            f"{q}3",
            unique_drag_prompt(tid, title),
            [
                ("1", "Clarify functional scope and SLAs"),
                ("2", "Estimate QPS, storage, and bandwidth"),
                ("3", "Sketch high-level architecture"),
                ("4", "Deep dive hot path and failures"),
            ],
            ["1", "2", "3", "4"],
            "Numbers before boxes keeps trade-offs honest.",
        ),
        estimate(
            f"{q}4",
            est_prompt,
            "QPS",
            float(est_target),
            [f"86400 s/day", f"{int(est_target * 100_000)} / 86400 ≈ {est_target} QPS"],
            "QPS ≈ requests_per_day / 86400",
            f"≈ {est_target} QPS average before peak multipliers.",
            "Convert daily volume to per-second capacity before sizing caches and DB pools.",
        ),
        tradeoff(
            f"{q}5",
            unique_trade_prompt(tid, title),
            ["p95 read < 250ms", "Small SRE team", "Must survive regional AZ loss"],
            [
                ("scale_up", "Scale up one giant node", "Simple but single choke point"),
                ("scale_out", "Horizontally scale stateless API + cache", "Adds LB and cache complexity"),
                ("nothing", "Disable peak features", "Harms revenue"),
            ],
            "scale_out",
            [
                ("r1", "Stateless tiers absorb burst without one machine ceiling"),
                ("r2", "Caching shifts read load off the primary"),
                ("bad", "Vertical scale cannot survive AZ loss by itself"),
            ],
            ["r1", "r2"],
            ["bad"],
            "Horizontal stateless scaling plus caching is the common interview answer for read-heavy bursts.",
        ),
        mc(
            f"{q}6",
            unique_mc2_prompt(tid, title),
            [
                ("a", "IDE theme"),
                ("b", "Correctness under retries and partial failures"),
                ("c", "Logo color palette"),
                ("d", "Number of standup meetings"),
            ],
            "b",
            "Distributed systems fail partially; interviews probe how you preserve invariants.",
        ),
    ]


# --- Accurate overrides for critical topics ---
QUESTION_OVERRIDES: dict[int, list[dict[str, Any]]] = {}


def _cap_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "During a network partition, what must a CP system sacrifice according to the CAP theorem framing used in interviews?",
            [
                ("a", "Partition tolerance"),
                ("b", "Availability for some requests"),
                ("c", "Durability on disk"),
                ("d", "TLS encryption"),
            ],
            "b",
            "Under partition, CP systems refuse or delay responses to preserve consistency.",
        ),
        spot(
            f"{q}2",
            "Which component is the usual bottleneck when AP caches serve stale reads during a partition?",
            [
                ("n1", "CDN edge", 30, 40),
                ("n2", "App servers", 130, 40),
                ("n3", "Async reconciliation / repair", 230, 40),
            ],
            [("n1", "n2"), ("n2", "n3")],
            ["n3"],
            "Repair pipelines and conflict resolution lag when replicas diverge.",
        ),
        drag(
            f"{q}3",
            "Order the CAP interview explanation.",
            [
                ("1", "Define C, A, P in distributed context"),
                ("2", "State that partitions happen in real networks"),
                ("3", "Explain CP vs AP choice during partition"),
                ("4", "Give a product example (bank ledger vs social feed)"),
            ],
            ["1", "2", "3", "4"],
            "Interviewers want precise definitions before examples.",
        ),
        estimate(
            f"{q}4",
            "A service must remain available during a partition and accepts stale reads. If 40% of replicas are isolated, what fraction of users might see stale data at worst (assume uniform routing)?",
            "percent",
            40.0,
            ["Uniform shard routing", "Isolated replicas cannot receive latest writes"],
            "stale_fraction ≈ isolated_replica_fraction",
            "Up to ~40% of traffic routed to isolated replicas may read stale values until repair.",
            "AP systems expose inconsistency windows tied to replica isolation.",
        ),
        tradeoff(
            f"{q}5",
            "Pick a datastore posture for a social 'like' counter during partitions.",
            ["High write volume", "Counts can be approximate briefly", "Must stay online"],
            [
                ("cp_sql", "CP SQL with global serializability", "May reject writes when minority partition"),
                ("ap_kv", "AP KV with eventual convergence", "Risk temporary divergent counts"),
                ("stop", "Turn off likes", "Always consistent but unavailable feature"),
            ],
            "ap_kv",
            [
                ("r1", "Likes are soft state; convergence beats global locks"),
                ("r2", "Availability matches user expectation during network blips"),
                ("bad", "Global serializability is costly for high fan-out writes"),
            ],
            ["r1", "r2"],
            ["bad"],
            "AP fits high-churn soft state; repair merges counts later.",
        ),
        mc(
            f"{q}6",
            "Which statement about CAP is interview-correct?",
            [
                ("a", "You can pick all three always"),
                ("b", "Partition tolerance is mandatory in WAN systems; choose C vs A during partition"),
                ("c", "CAP bans asynchronous replication"),
                ("d", "CAP only applies to SQL databases"),
            ],
            "b",
            "Real networks partition; design chooses consistency vs availability for that window.",
        ),
    ]


def _pacelc_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "PACELC adds which trade-off when the network is normal (E/L)?",
            [
                ("a", "Encryption vs compression"),
                ("b", "Latency vs consistency"),
                ("c", "IPv4 vs IPv6"),
                ("d", "Batch vs stream only for ETL"),
            ],
            "b",
            "Else (normal operation), choose latency vs consistency (PACELC).",
        ),
        spot(
            f"{q}2",
            "In a PA/EL system, which layer usually hides replication lag first?",
            [
                ("n1", "Leader writer", 20, 50),
                ("n2", "Local quorum reads", 120, 50),
                ("n3", "Async follower reads", 220, 50),
            ],
            [("n1", "n2"), ("n1", "n3")],
            ["n3"],
            "Reading from async followers trades consistency for latency.",
        ),
        drag(
            f"{q}3",
            "Order PACELC explanation steps.",
            [
                ("1", "Start from CAP during partition"),
                ("2", "Introduce Else: normal operation"),
                ("3", "Contrast PA/EL vs PC/EC examples"),
                ("4", "Map to a concrete datastore"),
            ],
            ["1", "2", "3", "4"],
            "PACELC bridges partition behavior and steady-state latency.",
        ),
        estimate(
            f"{q}4",
            "If a quorum read requires contacting 2 of 3 replicas with 8ms RTT each (parallel), what is approximate read latency?",
            "ms",
            8.0,
            ["Parallel RPC to quorum", "Dominant term is max RTT among quorum"],
            "latency ≈ max(RTT_quorum)",
            "Parallel quorum read ≈ 8ms if one replica suffices in same AZ.",
            "Latency math supports EL choices.",
        ),
        tradeoff(
            f"{q}5",
            "Choose read strategy for a product catalog during normal operation.",
            ["p95 < 30ms globally", "Stale price up to 60s acceptable", "Must stay available"],
            [
                ("strong", "Linearizable reads from leader only", "Higher latency cross-region"),
                ("follower", "Read from async replicas with TTL", "Faster, bounded staleness"),
                ("client", "Client-side random guesses", "Invalid"),
            ],
            "follower",
            [
                ("r1", "Catalog is EL-friendly; staleness bounded by TTL"),
                ("r2", "Avoids cross-region leader reads on every request"),
                ("bad", "Linearizable global reads violate latency goal"),
            ],
            ["r1", "r2"],
            ["bad"],
            "PA/EL pattern: accept eventual consistency for latency when business allows.",
        ),
        mc(
            f"{q}6",
            "Dynamo-style systems are often labeled:",
            [
                ("a", "PC/EC"),
                ("b", "PA/EL"),
                ("c", "CA only"),
                ("d", "No consistency model"),
            ],
            "b",
            "Dynamo prioritizes availability/partition tolerance and low latency with eventual consistency.",
        ),
    ]


def _isolation_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "Which anomaly does READ COMMITTED prevent?",
            [
                ("a", "Dirty reads"),
                ("b", "Write skew always"),
                ("c", "Phantom reads always"),
                ("d", "All anomalies"),
            ],
            "a",
            "READ COMMITTED blocks reading uncommitted data.",
        ),
        spot(
            f"{q}2",
            "Two transactions update different rows guarded by the same invariant; which isolation level still allows write skew?",
            [
                ("n1", "SERIALIZABLE", 40, 40),
                ("n2", "REPEATABLE READ", 140, 40),
                ("n3", "READ COMMITTED", 240, 40),
            ],
            [("n1", "n2"), ("n2", "n3")],
            ["n3"],
            "READ COMMITTED permits write skew without additional locking.",
        ),
        drag(
            f"{q}3",
            "Order isolation levels from weakest to strongest (typical SQL).",
            [
                ("1", "READ UNCOMMITTED"),
                ("2", "READ COMMITTED"),
                ("3", "REPEATABLE READ"),
                ("4", "SERIALIZABLE"),
            ],
            ["1", "2", "3", "4"],
            "Stronger levels block more anomalies at higher cost.",
        ),
        estimate(
            f"{q}4",
            "A bank transfer touches 2 rows. How many row locks minimum in two-phase locking for serializability?",
            "locks",
            2.0,
            ["One lock per updated row", "No extra index locks counted"],
            "locks = rows_updated",
            "At least two row locks for two updated accounts.",
            "Lock footprint drives contention estimates.",
        ),
        tradeoff(
            f"{q}5",
            "Pick isolation for a seat booking checkout (IRCTC-style).",
            ["Prevent double booking", "High contention on hot trains", "Short transactions"],
            [
                ("rc", "READ COMMITTED", "May allow races"),
                ("rr", "REPEATABLE READ + explicit row lock", "Balances safety and throughput"),
                ("none", "No transactions", "Unsafe"),
            ],
            "rr",
            [
                ("r1", "Row-level locks protect seat inventory"),
                ("r2", "Stronger than RC for invariant on seat count"),
                ("bad", "RC allows concurrent bookings to pass checks"),
            ],
            ["r1", "r2"],
            ["bad"],
            "Inventory systems need repeatable reads or serializable semantics on hot rows.",
        ),
        mc(
            f"{q}6",
            "Phantom reads are prevented by:",
            [
                ("a", "READ COMMITTED"),
                ("b", "REPEATABLE READ in some engines / SERIALIZABLE"),
                ("c", "Turning off indexes"),
                ("d", "Using UDP"),
            ],
            "b",
            "Phantoms need predicate locking or serializable isolation.",
        ),
    ]


def _quorum_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "With N=5, W=3, R=3, can a read return stale data after a successful write?",
            [
                ("a", "Never"),
                ("b", "Not if R+W > N and versions are compared"),
                ("c", "Only if UDP is used"),
                ("d", "Always stale"),
            ],
            "b",
            "Quorum overlap ensures readers see latest written version when R+W>N.",
        ),
        spot(
            f"{q}2",
            "Which parameter most directly increases write durability latency in Dynamo-style quorums?",
            [
                ("n1", "N replica count", 30, 50),
                ("n2", "W write quorum size", 130, 50),
                ("n3", "Client timeout", 230, 50),
            ],
            [("n1", "n2"), ("n2", "n3")],
            ["n2"],
            "Higher W means more replicas must acknowledge before ack.",
        ),
        drag(
            f"{q}3",
            "Order steps for a quorum write.",
            [
                ("1", "Route to coordinator"),
                ("2", "Send write to N replicas"),
                ("3", "Wait for W acks"),
                ("4", "Ack client"),
            ],
            ["1", "2", "3", "4"],
            "Coordinator manages replica fan-out.",
        ),
        estimate(
            f"{q}4",
            "N=3, R=2, W=2. Does quorum overlap guarantee strong consistency?",
            "boolean",
            1.0,
            ["R+W=4 > N=3"],
            "R+W > N",
            "Yes, overlapping quorums intersect on latest version.",
            "Classic quorum math for interviews.",
        ),
        tradeoff(
            f"{q}5",
            "Tune quorums for read-heavy profile.",
            ["Reads 95% of traffic", "Slight staleness unacceptable", "N=5"],
            [
                ("rw33", "R=3,W=3", "Balanced"),
                ("rw15", "R=1,W=5", "Fast reads but risky if W not met"),
                ("rw51", "R=5,W=1", "Fast writes, stale reads"),
            ],
            "rw33",
            [
                ("r1", "R+W>N with moderate values balances latency"),
                ("r2", "Avoids single-replica reads when staleness forbidden"),
                ("bad", "R=1 breaks strong read guarantee"),
            ],
            ["r1", "r2"],
            ["bad"],
            "When staleness is unacceptable, keep R and W high enough for overlap.",
        ),
        mc(
            f"{q}6",
            "Sloppy quorums are used to:",
            [
                ("a", "Improve availability by writing to fallback nodes"),
                ("b", "Disable replication"),
                ("c", "Remove need for hashing"),
                ("d", "Guarantee linearizability"),
            ],
            "a",
            "Sloppy quorums trade strict membership for write availability.",
        ),
    ]


def _delivery_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "Which delivery guarantee can Kafka consumers achieve with idempotent processing and offsets after processing?",
            [
                ("a", "At-most-once"),
                ("b", "At-least-once"),
                ("c", "Exactly-once end-to-end without transactions"),
                ("d", "No delivery"),
            ],
            "b",
            "Processing then committing offsets yields at-least-once; duplicates possible on crash.",
        ),
        spot(
            f"{q}2",
            "Where do duplicate messages appear in at-least-once pipelines?",
            [
                ("n1", "Producer", 30, 40),
                ("n2", "Consumer retry after crash before offset commit", 150, 40),
                ("n3", "Metrics sink", 270, 40),
            ],
            [("n1", "n2")],
            ["n2"],
            "Crash after processing but before offset commit reprocesses messages.",
        ),
        drag(
            f"{q}3",
            "Order guarantees from weakest to strongest.",
            [
                ("1", "At-most-once"),
                ("2", "At-least-once"),
                ("3", "Effectively exactly-once (idempotent + dedup)"),
            ],
            ["1", "2", "3"],
            "Exactly-once is a composed property with idempotency.",
        ),
        estimate(
            f"{q}4",
            "Consumer processes 1k msgs/s, crash window 5s before offset commit. How many messages may replay?",
            "messages",
            5000.0,
            ["All in-flight since last commit may replay"],
            "replay ≈ rate × window",
            "Up to ~5000 messages could be reprocessed.",
            "Drives need for idempotent sinks.",
        ),
        tradeoff(
            f"{q}5",
            "Choose delivery semantics for payment settlement events.",
            ["Money movement", "Downstream must not miss events", "Duplicates costly"],
            [
                ("aml", "At-most-once", "Risk lost payments"),
                ("al", "At-least-once + idempotent ledger", "Duplicates handled safely"),
                ("none", "Fire-and-forget UDP", "Unsafe"),
            ],
            "al",
            [
                ("r1", "Idempotent ledger entries absorb retries"),
                ("r2", "At-least-once avoids silent loss"),
                ("bad", "At-most-once can drop money events"),
            ],
            ["r1", "r2"],
            ["bad"],
            "Payments combine at-least-once transport with idempotent accounting.",
        ),
        mc(
            f"{q}6",
            "Exactly-once Kafka semantics typically require:",
            [
                ("a", "Idempotent producer + transactions + cooperative consumers"),
                ("b", "Disabling replication"),
                ("c", "Using HTTP polling only"),
                ("d", "No offsets"),
            ],
            "a",
            "EOS in Kafka is bounded to transactional read-process-write patterns.",
        ),
    ]


def _locks_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "Why are distributed locks considered dangerous for correctness?",
            [
                ("a", "They are always faster"),
                ("b", "Clock skew/lease expiry can double-execute critical sections"),
                ("c", "They remove need for databases"),
                ("d", "They guarantee CAP"),
            ],
            "b",
            "Fencing tokens and lease safety matter; processes may outlive locks.",
        ),
        spot(
            f"{q}2",
            "Which failure causes split-brain with naive TTL locks?",
            [
                ("n1", "GC pause longer than lease", 40, 40),
                ("n2", "Metrics lag", 160, 40),
                ("n3", "CDN miss", 280, 40),
            ],
            [("n1", "n2"), ("n2", "n3")],
            ["n1"],
            "Paused process wakes and writes after lease expired elsewhere.",
        ),
        drag(
            f"{q}3",
            "Order safe lock usage pattern.",
            [
                ("1", "Acquire lease with fencing token"),
                ("2", "Perform guarded operation with token passed to storage"),
                ("3", "Renew lease if work continues"),
                ("4", "Release or let lease expire"),
            ],
            ["1", "2", "3", "4"],
            "Fencing prevents stale lock holders from writing.",
        ),
        estimate(
            f"{q}4",
            "Lease TTL 10s, GC pause 12s. How many active writers could exist without fencing?",
            "writers",
            2.0,
            ["Old holder resumes", "New holder acquired after TTL"],
            "writers ≈ 2",
            "Two writers possible briefly—unsafe for inventory.",
            "Motivates fencing tokens (Chubby/ZooKeeper patterns).",
        ),
        tradeoff(
            f"{q}5",
            "Coordinate critical cron job across 50 workers.",
            ["Only one runner", "Rare long tasks", "Network partitions happen"],
            [
                ("db", "Transactional DB advisory lock/lease row", "Slower but strongly guarded"),
                ("ttl", "Redis SETNX TTL only", "Simple but GC-risk"),
                ("none", "Run everywhere", "Duplicates"),
            ],
            "db",
            [
                ("r1", "DB compares fencing version on writes"),
                ("r2", "Survives process pause better than naive TTL"),
                ("bad", "TTL-only locks risk double execution"),
            ],
            ["r1", "r2"],
            ["bad"],
            "Prefer strongly consistent coordination for mutual exclusion.",
        ),
        mc(
            f"{q}6",
            "Leader election differs from a lock because:",
            [
                ("a", "Leaders never fail"),
                ("b", "Leader role is sticky and drives writes; locks guard short sections"),
                ("c", "Locks are only in Kubernetes"),
                ("d", "Election uses UDP only"),
            ],
            "b",
            "Leaders batch responsibility; locks protect smaller critical regions.",
        ),
    ]


def _oauth_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "In OAuth 2.0 authorization code flow with PKCE, where is the client secret kept for public mobile apps?",
            [
                ("a", "Embedded in APK"),
                ("b", "No static secret; PKCE code verifier replaces it"),
                ("c", "In the ID token"),
                ("d", "In refresh tokens logged client-side"),
            ],
            "b",
            "Public clients use PKCE instead of shared secrets.",
        ),
        spot(
            f"{q}2",
            "Which token should a browser SPA never store in localStorage for session management?",
            [
                ("n1", "Opaque session cookie HttpOnly", 30, 40),
                ("n2", "Long-lived refresh token", 150, 40),
                ("n3", "CSRF token in header", 270, 40),
            ],
            [("n1", "n2"), ("n2", "n3")],
            ["n2"],
            "Refresh tokens in JS storage are high-value XSS targets.",
        ),
        drag(
            f"{q}3",
            "Order OIDC login steps (simplified).",
            [
                ("1", "Redirect to authorization endpoint"),
                ("2", "User authenticates at IdP"),
                ("3", "Client exchanges code at token endpoint"),
                ("4", "Validate ID token (issuer, aud, nonce)"),
            ],
            ["1", "2", "3", "4"],
            "OIDC adds identity layer atop OAuth2 code flow.",
        ),
        estimate(
            f"{q}4",
            "Access token TTL 15 minutes, 10M users refresh hourly on average. Rough auth-server token QPS?",
            "QPS",
            2780.0,
            ["10M refreshes/hour", "÷3600"],
            "QPS ≈ 10e6 / 3600",
            "≈2.8k QPS just for refreshes—size token service accordingly.",
            "Token endpoint capacity is easy to underestimate.",
        ),
        tradeoff(
            f"{q}5",
            "Third-party API access for a fintech aggregator (India account aggregator pattern).",
            ["User consent required", "Minimize token scope", "Mobile clients"],
            [
                ("implicit", "Implicit flow in browser", "Deprecated/insecure"),
                ("code_pkce", "Auth code + PKCE + short-lived access tokens", "Industry best practice"),
                ("password", "Resource owner password grant", "Avoid"),
            ],
            "code_pkce",
            [
                ("r1", "PKCE protects mobile code exchange"),
                ("r2", "Short TTL limits breach blast radius"),
                ("bad", "Password grant exposes credentials to client"),
            ],
            ["r1", "r2"],
            ["bad"],
            "Modern OAuth favors code+PKCE with tight scopes.",
        ),
        mc(
            f"{q}6",
            "OIDC ID token is:",
            [
                ("a", "A refresh token for databases"),
                ("b", "A JWT asserting authentication event claims"),
                ("c", "An X.509 certificate"),
                ("d", "A Kafka offset"),
            ],
            "b",
            "ID tokens carry identity claims; access tokens authorize APIs.",
        ),
    ]


def _payment_questions(tid: int) -> list[dict[str, Any]]:
    q = f"t{tid}-q"
    return [
        mc(
            f"{q}1",
            "UPI-style payments need which property for client retries?",
            [
                ("a", "Idempotent collect requests with unique transaction id"),
                ("b", "Random HTTP GET retries"),
                ("c", "No server-side state"),
                ("d", "Only UDP"),
            ],
            "a",
            "Idempotency keys prevent double debit on retries.",
        ),
        spot(
            f"{q}2",
            "Where is double-spend risk highest in a naive wallet transfer API?",
            [
                ("n1", "Ledger DB", 30, 50),
                ("n2", "Client UI", 130, 50),
                ("n3", "Notification worker", 230, 50),
            ],
            [("n1", "n2")],
            ["n1"],
            "Ledger must enforce balance invariants transactionally.",
        ),
        drag(
            f"{q}3",
            "Order a safe payment write path.",
            [
                ("1", "Validate idempotency key"),
                ("2", "Authorize + hold funds"),
                ("3", "Post ledger entries"),
                ("4", "Emit settlement event"),
            ],
            ["1", "2", "3", "4"],
            "Ledger posting follows authorization.",
        ),
        estimate(
            f"{q}4",
            "10k TPS peak, 200 bytes per immutable ledger row. Daily storage growth (TB, 1 decimal)?",
            "TB",
            0.2,
            ["86400 s/day", "10k×86400 rows", "200B each"],
            "TB ≈ rows×200B / 1e12",
            "≈0.17 TB/day—plan compaction and archival tiers.",
            "Immutable logs grow quickly at UPI scale.",
        ),
        tradeoff(
            f"{q}5",
            "Choose consistency for payer debit + payee credit.",
            ["Must not lose money", "Partial outages", "High TPS"],
            [
                ("eventual", "Eventual balance sync without locks", "Risk double spend"),
                ("strong", "Transactional ledger per shard with outbox events", "Safer, needs sharding"),
                ("cache", "Cache-only balances", "Unsafe"),
            ],
            "strong",
            [
                ("r1", "ACID ledger enforces invariants"),
                ("r2", "Outbox publishes after commit"),
                ("bad", "Eventual without guards allows inconsistent balances"),
            ],
            ["r1", "r2"],
            ["bad"],
            "Payments demand strong per-account consistency with reliable egress.",
        ),
        mc(
            f"{q}6",
            "PCI scope reduction typically involves:",
            [
                ("a", "Storing CVV in app logs"),
                ("b", "Tokenizing card data at a hosted vault"),
                ("c", "Disabling TLS"),
                ("d", "Sharing merchant keys in chat"),
            ],
            "b",
            "Tokenization keeps sensitive card data off merchant systems.",
        ),
    ]


QUESTION_OVERRIDES.update(
    {
        26: _isolation_questions(26),
        29: _quorum_questions(29),
        32: _cap_questions(32),
        33: _pacelc_questions(33),
        39: _delivery_questions(39),
        46: _locks_questions(46),
        58: _oauth_questions(58),
        92: _payment_questions(92),
    }
)


CARD_OVERRIDES: dict[int, list[dict[str, Any]]] = {
    74: [
        {
            "kind": "text",
            "title": "45-minute map",
            "body": "Spend ~5m clarifying, ~10m estimation, ~15m high-level design, ~10m deep dive, ~5m trade-offs and wrap-up.",
            "accent": "Interview lens",
        },
        {
            "kind": "text",
            "title": "Drive the whiteboard",
            "body": "Label sync vs async paths, data stores, and queues. Narrate failure modes while you draw—not after.",
        },
        {
            "kind": "diagram",
            "title": "Checklist flow",
            "body": "Requirements → numbers → API sketch → architecture → hot path → risks → trade-offs.",
        },
        {
            "kind": "text",
            "title": "Signals interviewers want",
            "body": "Clear scope, realistic math, idempotent writes, observability, and explicit consistency/latency choices.",
        },
        {
            "kind": "animation",
            "title": "Closing script",
            "body": "Summarize bottlenecks, metrics, and what you would prototype in week one.",
            "accent": "Say this",
        },
    ],
    32: [
        {
            "kind": "text",
            "title": "CAP in one minute",
            "body": "In distributed systems, Partition tolerance is mandatory on WANs. During a network split, you must trade Availability vs Consistency (CP vs AP).",
            "accent": "Interview lens",
        },
        {
            "kind": "text",
            "title": "Not a menu of three",
            "body": "CAP is about behavior during partitions, not steady state. Normal operation still has latency/consistency trade-offs (see PACELC).",
        },
        {
            "kind": "diagram",
            "title": "Split brain sketch",
            "body": "Draw two islands of replicas that cannot talk; decide whether each island keeps serving writes (AP) or stops (CP).",
        },
        {
            "kind": "text",
            "title": "Product mapping",
            "body": "Bank balances lean CP; social feeds lean AP with repair. Call out which user-visible symptom is acceptable during a blip.",
        },
        {
            "kind": "animation",
            "title": "Say aloud",
            "body": "Script: define C/A/P → admit partitions happen → pick CP or AP for the split → give an example.",
            "accent": "Say this",
        },
    ],
    33: [
        {
            "kind": "text",
            "title": "PACELC expands CAP",
            "body": "If Partition: choose Availability vs Consistency. Else (normal network): choose Latency vs Consistency (EL vs EC).",
            "accent": "Interview lens",
        },
        {
            "kind": "text",
            "title": "Label systems",
            "body": "Dynamo/Cassandra are often PA/EL; Spanner-like systems target PC/EC with higher latency budgets.",
        },
        {
            "kind": "diagram",
            "title": "Replica read paths",
            "body": "Show leader writes plus follower reads that may lag; tie lag to business staleness budgets.",
        },
        {
            "kind": "text",
            "title": "Latency math",
            "body": "Cross-region strong reads add RTT; EL reads from local replicas shave milliseconds but allow temporary divergence.",
        },
        {
            "kind": "animation",
            "title": "Say aloud",
            "body": "Explain CAP for partitions, then PACELC for steady state with a catalog pricing example.",
            "accent": "Say this",
        },
    ],
}


def lesson_spec(tid: int) -> dict[str, Any]:
    title = TITLES[tid]
    cards = CARD_OVERRIDES.get(tid, blurb_cards(tid, title))
    questions = QUESTION_OVERRIDES.get(tid, default_questions(tid, title))
    return {
        "objectives": default_objectives(title),
        "cards": cards,
        "questions": questions,
        "flashcards": default_flashcards(tid, title),
        "sources": default_sources(tid),
    }


def boss_spec(tid: int) -> dict[str, Any]:
    title = TITLES[tid]
    lesson = lesson_spec(tid)
    # Boss lesson cards must not reuse generic lesson pool collisions — offset tid
    lesson["cards"] = blurb_cards(tid, title, salt=7919)
    # Unique boss numbers per system
    peak_qps = 5000 + (tid - 75) * 137
    storage_tb = 0.5 + (tid % 7) * 0.3
    boss = {
        "functionalRequirements": [
            f"Core user journeys for {title} are available with stable identifiers",
            f"Support authenticated access with audit trails for {title} mutations",
            "Expose paginated list APIs and idempotent write endpoints",
        ],
        "nonFunctionalRequirements": [
            "99.9% availability (interview assumption)",
            f"p95 read latency < 300ms at {peak_qps//10} QPS average",
            "Writes remain correct under client retries",
        ],
        "exclusions": [
            "Building custom hardware",
            "On-prem mainframe integration",
        ],
        "requirementDistractors": [
            "Must be strongly consistent globally with zero latency",
            "Must never use caching",
        ],
        "estimationScenario": (
            f"Design {title}: 40M DAU, 6 actions/day each, read:write = 4:1, peak factor 6×. "
            f"Estimate hot-path QPS and {storage_tb:.1f} TB/year media/metadata growth."
        ),
        "apiPrompt": (
            f"Draft REST/JSON APIs for {title} including auth, idempotency keys, cursor pagination, "
            "and error codes for rate limits."
        ),
        "deepDivePrompts": [
            f"How do you shard the hottest entities in {title}?",
            "Which failure scenarios (AZ loss, broker lag, cache stampede) do you mitigate first?",
            "How do you observe p95 and error budget burn for this service?",
        ],
        "tradeoffPrompt": f"Justify SQL vs NoSQL (or cache vs source-of-truth) for {title} metadata.",
        "rubric": {
            "requiredCapabilities": [
                "client",
                "load_balancer",
                "service",
                "cache",
                "sql_db",
                "queue",
            ],
            "acceptableAlternatives": {
                "sql_db": ["nosql_db"],
                "nosql_db": ["sql_db"],
                "cache": ["cdn"],
            },
            "requiredPaths": [
                {"from": "client", "to": "load_balancer"},
                {"from": "load_balancer", "to": "service"},
                {"from": "service", "to": "sql_db"},
            ],
            "unsafeFlows": [{"from": "client", "to": "sql_db"}],
            "minSeparation": [
                {
                    "types": ["service", "sql_db"],
                    "reason": "Keep credentials and invariants off the public internet",
                }
            ],
            "reliabilityChecks": [
                "No direct client database access",
                "Retry-safe writes with idempotency",
                "Backpressure on queue consumers",
            ],
        },
        "referenceNodes": [
            {"id": "c1", "type": "client", "label": "Client"},
            {"id": "dns1", "type": "dns"},
            {"id": "lb1", "type": "load_balancer"},
            {"id": "gw1", "type": "api_gateway", "label": "API"},
            {"id": "svc1", "type": "service", "label": "Domain svc"},
            {"id": "cache1", "type": "cache"},
            {"id": "db1", "type": "sql_db"},
            {"id": "q1", "type": "queue"},
            {"id": "w1", "type": "worker"},
        ],
        "referenceEdges": [
            {"from": "c1", "to": "dns1"},
            {"from": "dns1", "to": "lb1"},
            {"from": "lb1", "to": "gw1"},
            {"from": "gw1", "to": "svc1"},
            {"from": "svc1", "to": "cache1"},
            {"from": "svc1", "to": "db1"},
            {"from": "svc1", "to": "q1"},
            {"from": "q1", "to": "w1"},
        ],
        "referenceNotes": (
            f"Reference {title} architecture: sync path through gateway + cache, async side effects via queue. "
            "Failure scenarios: primary DB failover, queue backlog, cache cold start—state mitigations."
        ),
        "workedEstimate": (
            f"40M DAU × 6 actions = 240M ops/day ≈ 2.8k QPS avg; 6× peak ≈ {peak_qps} QPS. "
            f"Metadata/media growth ≈ {storage_tb:.1f} TB/year before compaction."
        ),
        "exampleApi": "POST /v1/items (Idempotency-Key) • GET /v1/items?cursor= • POST /v1/auth/token",
        "deepDiveAnswers": [
            "Hash-partition by user_id; isolate celebrity/hot keys to dedicated shards.",
            "Use cache aside with TTL+jitter; protect DB with circuit breakers and request coalescing.",
            "AZ loss: multi-AZ replicas, rehearsed failover, queue redrive policies.",
        ],
        "tradeoffAnalysis": (
            "Prefer OLTP SQL when invariants matter; add read models/cache for fan-out. "
            "Document consistency window for async consumers."
        ),
        "alternativeArchitectures": [
            "Event-sourced core with materialized views",
            "CQRS read pools fed by CDC",
        ],
        "prerequisiteTopicIds": [],
    }
    # specialize a few iconic bosses
    if tid == 75:
        boss["referenceNodes"].append({"id": "cdn1", "type": "cdn"})
        boss["referenceEdges"].append({"from": "c1", "to": "cdn1", "label": "redirect lookup"})
    if tid in (86, 87, 110):
        boss["referenceNodes"].append({"id": "blob1", "type": "blob_storage"})
        boss["referenceEdges"].append({"from": "w1", "to": "blob1"})
    if tid in (97, 99):
        boss["referenceNodes"].append({"id": "search1", "type": "search"})
        boss["referenceEdges"].append({"from": "svc1", "to": "search1"})
    lesson["boss"] = boss
    lesson["objectives"] = [
        f"Design {title} end-to-end in interview timeboxes",
        f"Quantify capacity and failure handling for {title}",
    ]
    return lesson


def write_specs() -> None:
    lessons = {str(tid): lesson_spec(tid) for tid in LESSON_IDS}
    lessons["74"] = lesson_spec(74)  # tutorial uses lesson-shaped spec
    bosses = {str(tid): boss_spec(tid) for tid in range(75, 115)}
    payload = {"lessons": lessons, "bosses": bosses}
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {OUT} ({len(lessons)} lessons, {len(bosses)} bosses)")


if __name__ == "__main__":
    write_specs()
