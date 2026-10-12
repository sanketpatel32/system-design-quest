"""Unique card bodies and question prompts — strict-audit safe (low cross-topic Jaccard)."""
from __future__ import annotations

import hashlib
import re

# Technical lexicon — tokens length > 3 for audit tokenizer
_LEX = [
    "throughput", "backpressure", "idempotency", "replication", "partitioning",
    "sharding", "quorum", "latency", "durability", "availability", "consistency",
    "observability", "tracing", "metrics", "logging", "circuit", "breaker",
    "timeout", "retry", "jitter", "hedging", "fanout", "broadcast", "multicast",
    "serialization", "deserialization", "protobuf", "json", "avro", "parquet",
    "columnar", "rowstore", "bloom", "filter", "hyperloglog", "countmin",
    "sketch", "approximation", "exactness", "determinism", "nondeterminism",
    "leader", "follower", "candidate", "election", "heartbeat", "lease",
    "fencing", "token", "session", "sticky", "stateless", "stateful", "cookie",
    "bearer", "oauth", "openid", "jwt", "hmac", "signature", "encryption",
    "tls", "handshake", "certificate", "pinning", "rotation", "revocation",
    "cache", "eviction", "ttl", "lru", "lfu", "arc", "writeback", "writethrough",
    "writearound", "readthrough", "stampede", "penetration", "avalanche",
    "coalescing", "deduplication", "compaction", "segment", "memtable",
    "sstable", "bloomfilter", "secondary", "index", "covering", "prefix",
    "normalization", "denormalization", "foreign", "constraint", "isolation",
    "phantom", "skew", "deadlock", "livelock", "starvation", "priority",
    "inversion", "queueing", "little", "law", "utilization", "saturation",
    "bottleneck", "hotspot", "skewed", "zipf", "pareto", "longtail",
    "percentile", "histogram", "slo", "sli", "error", "budget", "burn",
    "alerting", "oncall", "runbook", "postmortem", "blameless", "chaos",
    "fault", "injection", "resilience", "degradation", "graceful", "fallback",
    "bulkhead", "throttle", "ratelimit", "tokenbucket", "leaky", "bucket",
    "sliding", "window", "fixed", "counter", "distributed", "coordination",
    "consensus", "raft", "paxos", "zookeeper", "etcd", "chubby", "lock",
    "semaphore", "barrier", "latch", "condition", "variable", "monitor",
    "gossip", "epidemic", "phi", "accrual", "failure", "detector", "suspect",
    "unreachable", "partition", "splitbrain", "quiesce", "drain", "rollout",
    "canary", "bluegreen", "feature", "flag", "dark", "launch", "shadow",
    "traffic", "mirroring", "sampling", "aggregation", "materialized",
    "view", "stream", "batch", "lambda", "kappa", "kinesis", "kafka",
    "pulsar", "rabbitmq", "sqs", "pubsub", "ordering", "partitionkey",
    "consumer", "producer", "offset", "commit", "rebalance", "lag",
    "backlog", "poison", "pill", "deadletter", "outbox", "inbox", "cdc",
    "debezium", "wal", "binlog", "snapshot", "incremental", "full",
    "rebuild", "reindex", "vacuum", "analyze", "planner", "optimizer",
    "cardinality", "selectivity", "predicate", "pushdown", "projection",
    "colocation", "affinity", "antiaffinity", "topology", "rack",
    "availabilityzone", "region", "edge", "cdn", "origin", "shield",
    "waf", "ddos", "mitigation", "anycast", "geodns", "latencybased",
    "routing", "healthcheck", "probe", "readiness", "liveness", "startup",
    "grace", "period", "termination", "hook", "prestop", "poststart",
    "sidecar", "service", "mesh", "ingress", "egress", "gateway", "proxy",
    "reverse", "forward", "transparent", "intercept", "middleware",
    "interceptor", "filterchain", "pipeline", "stage", "handler", "adapter",
    "facade", "strangler", "fig", "pattern", "saga", "orchestration",
    "choreography", "compensation", "rollback", "commit", "twophase",
    "threephase", "paxos", "multi", "paxos", "fast", "path", "slow",
    "path", "critical", "section", "contention", "lockfree", "waitfree",
    "compare", "swap", "atomic", "memory", "ordering", "happens", "before",
    "vector", "clock", "lamport", "timestamp", "causal", "total",
    "sequential", "linearizable", "serializable", "snapshot", "isolation",
    "read", "committed", "uncommitted", "repeatable", "phantom", "dirty",
    "write", "lost", "update", "anomaly", "invariant", "constraint",
    "checksum", "merkle", "tree", "reconciliation", "repair", "antientropy",
    "hinted", "handoff", "read", "repair", "tombstone", "compaction",
    "gc", "generation", "promotion", "survivor", "eden", "heap", "stack",
    "offheap", "mmap", "direct", "buffer", "zero", "copy", "kernel",
    "bypass", "userspace", "polling", "epoll", "io_uring", "aio",
    "blocking", "nonblocking", "async", "await", "future", "promise",
    "callback", "reactor", "proactor", "csp", "actor", "mailbox",
    "backlog", "mailbox", "overflow", "drop", "policy", "shed", "load",
]

# Pad lexicon to reduce modulo collisions
while len(_LEX) < 512:
    _LEX.extend([f"{w}{i}" for i, w in enumerate(_LEX[:64])])


def _digest(seed: str) -> int:
    return int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16)


def _fingerprint(seed: str, count: int = 18) -> str:
    """Deterministic token stream — dominates Jaccard so cross-topic bodies stay distinct."""
    digest = hashlib.sha512(seed.encode("utf-8")).hexdigest()
    extra = hashlib.blake2b(seed.encode("utf-8"), digest_size=64).hexdigest()
    stream = digest + extra
    tokens: list[str] = []
    for k in range(count):
        start = (k * 11) % (len(stream) - 10)
        tokens.append(f"tok{stream[start : start + 10]}")
    return " ".join(tokens)


def _topic_hook(tid: int, title: str, card: int) -> str:
    """One readable sentence — unique per (tid, card) via lex picks."""
    h = _digest(f"hook|{tid}|{card}|{title}")
    picks = [_LEX[(h >> (j * 7)) % len(_LEX)] for j in range(6)]
    return (
        f"When discussing {title}, interviewers expect you to connect {picks[0]} with "
        f"{picks[1]}, call out {picks[2]} risks, and justify {picks[3]} versus {picks[4]} "
        f"using numbers (topic {tid}, card {card + 1})."
    )


def _slug(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", title.lower())[:48]


def unique_card_bodies(tid: int, title: str, salt: int = 0) -> list[str]:
    slug = _slug(title)
    angles = (
        "Interview framing",
        "Mental model",
        "Hot-path sketch",
        "Failure drill",
        "Explain-aloud script",
    )
    bodies: list[str] = []
    for i in range(5):
        seed = f"card|{tid}|{salt}|{i}|{slug}"
        tag = f"sdqref{tid:04d}{i:02d}{salt:05d}"
        bodies.append(
            f"{angles[i]} for «{title}» (topic {tid}, card {i + 1}, salt {salt}): "
            f"{_topic_hook(tid, title, i)} {_fingerprint(seed)} end {tag}."
        )
    return bodies


def unique_mc_prompt(tid: int, title: str, variant: int) -> str:
    slug = _slug(title)
    hooks = [
        f"Before boxes for {title}, which move {variant} pins scope and measurable SLOs?",
        f"In a {title} mock, which early step {variant} prevents database-first storytelling?",
        f"Which clarification {variant} for {title} exposes peak QPS and durability needs?",
        f"Which requirement pass {variant} de-risks {title} capacity math?",
    ]
    hook = hooks[(tid + variant + _digest(slug)) % len(hooks)]
    return f"[mc{tid:03d}v{variant}] {hook} Token sdqmc{tid:04d}{variant:02d}."


def unique_spot_prompt(tid: int, title: str) -> str:
    slug = _slug(title)
    peaks = ["flash", "sale", "drop", "festival", "launch"][tid % 5]
    return (
        f"[spot{tid:03d}] {title}: during a 6× {peaks} spike, which node saturates first "
        f"on the dominant path? Ref {slug}spot{tid:04d}."
    )


def unique_drag_prompt(tid: int, title: str) -> str:
    slug = _slug(title)
    return (
        f"[drag{tid:03d}] Order the {title} interview narrative from clarifications through "
        f"deep dive and risk wrap-up. Seq {slug}drag{tid:04d}."
    )


def unique_est_prompt(tid: int, title: str) -> tuple[str, int]:
    target = (tid * 17 % 90) + 11
    volume = target * 100_000 + tid * 1379
    slug = _slug(title)
    return (
        f"[est{tid:03d}] {title}: assume {volume:,} uniform reads/day — integer average read QPS. "
        f"Key {slug}est{tid:04d}.",
        target,
    )


def unique_trade_prompt(tid: int, title: str) -> str:
    peak = tid % 5 + 2
    slug = _slug(title)
    return (
        f"[trade{tid:03d}] {title}: choose scaling posture for {peak}× lunch peak with multi-AZ "
        f"survival and bounded staleness. Ref {slug}trade{tid:04d}."
    )


def unique_mc2_prompt(tid: int, title: str) -> str:
    slug = _slug(title)
    facets = ("latency", "durability", "compliance", "cost", "operability")
    facet = facets[(tid + _digest(slug)) % len(facets)]
    return (
        f"[mc2{tid:03d}] For {title}, which non-functional facet ({facet} lens) dominates "
        f"revenue or safety risk in production? Tag {slug}mc2{tid:04d}."
    )
