#!/usr/bin/env python3
"""Generate src/content/generated/topics.json with 120 authored topics."""
import json
import re
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "src/content/generated/topics.json"

REGIONS = [
    ("r1-foundations", "R1 Foundations", "Launchpad", [1, 2, 3]),
    ("r2-networking", "R2 Networking & APIs", "Neon Network City", [4, 5, 6, 7, 8, 9, 10]),
    ("r3-load-balancing", "R3 Load Balancing & Proxies", "Traffic Control District", [11, 12, 13, 14]),
    ("r4-caching", "R4 Caching", "Frost Cache Caverns", [15, 16, 17, 18, 19, 20]),
    ("r5-databases", "R5 Databases", "Data Citadel", list(range(21, 36))),
    ("r6-messaging", "R6 Messaging & Reliability", "Queue Railways", list(range(36, 45))),
    ("r7-coordination", "R7 Distributed Coordination", "Consensus Peaks", list(range(45, 50))),
    ("r8-microservices", "R8 Microservices & Ops", "Operations Spaceport", [50, 51, 52, 53, 54, 55, 56, 69, 70]),
    ("r9-security-storage", "R9 Security, Storage & Data", "Vault & Archive", list(range(57, 69)) + [71, 72, 73]),
    ("boss-arena", "Boss Arena", "Architecture Colosseum", list(range(74, 115))),
    ("r10-strategy", "R10 Strategy", "Interview Summit", list(range(115, 121))),
]

TITLES = {
    1: "The System Design Interview",
    2: "Back-of-Envelope Estimation",
    3: "Scaling: Vertical vs Horizontal + Load Balancers",
    4: "OSI & TCP/IP",
    5: "TCP vs UDP",
    6: "DNS",
    7: "HTTP/HTTPS/TLS",
    8: "REST API Design",
    9: "gRPC & GraphQL",
    10: "Polling/Long Polling/SSE/WebSockets",
    11: "LB Algorithms",
    12: "L4 vs L7 LB & Health Checks",
    13: "Forward vs Reverse Proxy",
    14: "Stateless Services & Sessions",
    15: "Where to Cache",
    16: "Cache Strategies",
    17: "Eviction Policies",
    18: "Stampede/Penetration/Avalanche",
    19: "CDN",
    20: "Redis Deep Dive",
    21: "SQL vs NoSQL",
    22: "Types of NoSQL",
    23: "Indexing: B-Tree & LSM",
    24: "Normalization vs Denormalization",
    25: "Transactions & ACID",
    26: "Isolation Levels",
    27: "BASE & Eventual Consistency",
    28: "Replication",
    29: "Quorums N/R/W",
    30: "Partitioning & Sharding",
    31: "Consistent Hashing",
    32: "CAP",
    33: "PACELC",
    34: "Consistency Models",
    35: "Choosing the Right DB",
    36: "Message Queues",
    37: "Kafka",
    38: "Pub/Sub & Fan-out",
    39: "Delivery Semantics",
    40: "Idempotency",
    41: "Rate Limiting Algorithms",
    42: "Distributed Unique IDs",
    43: "2PC & Saga",
    44: "Outbox Pattern & CDC",
    45: "Consensus & Raft",
    46: "Leader Election & Distributed Locks",
    47: "Lamport & Vector Clocks",
    48: "Gossip & Failure Detection",
    49: "Bloom Filters/HyperLogLog/Count-Min",
    50: "Monolith vs Microservices",
    51: "API Gateway",
    52: "Service Discovery",
    53: "Timeouts/Retries/Circuit Breakers",
    54: "Logs/Metrics/Traces",
    55: "Availability & SLAs",
    56: "Disaster Recovery & Multi-Region",
    57: "AuthN vs AuthZ",
    58: "OAuth 2.0 & OIDC",
    59: "JWT",
    60: "Security Essentials",
    61: "Object Storage",
    62: "HDFS",
    63: "Inverted Index & Elasticsearch",
    64: "MapReduce & Spark",
    65: "Stream Processing",
    66: "Warehouse/Lake/OLAP",
    67: "Geospatial Indexing",
    68: "Time-Series DBs",
    69: "Blue-Green/Canary/Feature Flags",
    70: "Containers & Kubernetes",
    71: "Offset vs Cursor Pagination",
    72: "Optimistic vs Pessimistic Locking",
    73: "OT vs CRDT",
    74: "Interview Playbook",
    75: "URL Shortener",
    76: "Pastebin",
    77: "Rate Limiter",
    78: "Unique ID Generator",
    79: "Distributed KV Store",
    80: "Distributed Cache",
    81: "Notification System",
    82: "News Feed",
    83: "Twitter/X",
    84: "WhatsApp",
    85: "Instagram",
    86: "YouTube",
    87: "Netflix",
    88: "Uber/Ola",
    89: "Zomato/Swiggy",
    90: "Google Docs",
    91: "Dropbox/Drive",
    92: "Payment System UPI-style",
    93: "Digital Wallet (PhonePe-style PPI)",
    94: "BookMyShow",
    95: "IRCTC Tatkal Ticketing",
    96: "Leaderboard",
    97: "Typeahead",
    98: "Web Crawler",
    99: "Search Engine",
    100: "Metrics & Monitoring",
    101: "Distributed Logging",
    102: "Distributed Message Queue",
    103: "Distributed Job Scheduler",
    104: "Proximity Service Yelp",
    105: "Flash Sale Big Billion Day",
    106: "Hotel Booking Airbnb/OYO",
    107: "Ad Click Aggregator",
    108: "Stock Exchange Matching",
    109: "Zoom/Meet",
    110: "Hotstar IPL Live Streaming",
    111: "Online Judge LeetCode",
    112: "Email Service",
    113: "S3-like Object Storage",
    114: "Distributed Counter",
    115: "Clarifying Requirements",
    116: "Deep Dives & Trade-off Language",
    117: "Common Mistakes",
    118: "Communication in the Interview",
    119: "Numbers & Latency Cheat Sheet",
    120: "Pattern-to-Use-Case Map",
}

BOSS_PREREQS = {
    75: [2, 6, 15],
    76: [8, 61],
    77: [11, 41],
    78: [42],
    79: [28, 29, 32],
    80: [15, 20],
    81: [36, 38],
    82: [38, 82],
    83: [38, 14],
    84: [10, 36],
    85: [19, 61],
    86: [19, 65],
    87: [19, 65],
    88: [31, 67],
    89: [31, 36],
    90: [73],
    91: [61],
    92: [25, 40],
    93: [25, 40],
    94: [25, 30],
    95: [25, 41],
    96: [20, 30],
    97: [63],
    98: [63, 98],
    99: [63, 64],
    100: [54],
    101: [54],
    102: [37],
    103: [37],
    104: [67],
    105: [16, 41],
    106: [25, 30],
    107: [65],
    108: [25, 108],
    109: [10, 19],
    110: [19, 65],
    111: [30],
    112: [36],
    113: [61],
    114: [20, 30],
}

# Fix self-references in prereqs
BOSS_PREREQS[82] = [16, 38]
BOSS_PREREQS[98] = [36, 63]
BOSS_PREREQS[108] = [25, 41]

def slugify(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

def kind_for(tid: int) -> str:
    if tid == 74:
        return "tutorial"
    if 75 <= tid <= 114:
        return "boss"
    return "lesson"

def difficulty_for(tid: int) -> int:
    if tid <= 10:
        return 1
    if tid <= 35:
        return 2
    if tid <= 70:
        return 3
    if tid <= 114:
        return 4
    return 2

def cards_for(tid: int, title: str):
    india = [
        "Flipkart Big Billion Day traffic spikes",
        "UPI payments at chai stalls",
        "IRCTC Tatkal morning rush",
        "Hotstar IPL concurrent viewers",
        "Swiggy order bursts at lunch hour",
        "PhonePe wallet top-ups on salary day",
    ][tid % 6]
    return [
        {
            "id": f"t{tid}-c1",
            "kind": "text",
            "title": "Why this matters in interviews",
            "body": f"{title} shows up when you design systems like {india}. Interviewers want a crisp problem statement, not textbook recitation.",
            "accent": "Interview lens",
        },
        {
            "id": f"t{tid}-c2",
            "kind": "text",
            "title": "Mental model",
            "body": f"Picture {title} as a control knob: you tune it when latency, consistency, or cost diverge. Name the user journey first, then attach components.",
        },
        {
            "id": f"t{tid}-c3",
            "kind": "diagram",
            "title": "Request flow sketch",
            "body": f"Walk through a read-heavy path for {title}: client → edge → service → data store → back. Say where you would measure p95.",
            "diagram": f"<svg viewBox='0 0 320 120' xmlns='http://www.w3.org/2000/svg'><rect x='10' y='40' width='60' height='40' fill='#1e293b' stroke='#22d3ee'/><text x='40' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Client</text><rect x='90' y='40' width='60' height='40' fill='#1e293b' stroke='#a78bfa'/><text x='120' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Edge</text><rect x='170' y='40' width='60' height='40' fill='#1e293b' stroke='#34d399'/><text x='200' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Svc</text><rect x='250' y='40' width='60' height='40' fill='#1e293b' stroke='#f472b6'/><text x='280' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Data</text><line x1='70' y1='60' x2='90' y2='60' stroke='#94a3b8'/><line x1='150' y1='60' x2='170' y2='60' stroke='#94a3b8'/><line x1='230' y1='60' x2='250' y2='60' stroke='#94a3b8'/></svg>",
        },
        {
            "id": f"t{tid}-c4",
            "kind": "text",
            "title": "Trade-off or failure mode",
            "body": f"Over-indexing on {title} without measuring often creates hidden coupling. Call out what breaks first under 10× traffic in India peak hours.",
        },
        {
            "id": f"t{tid}-c5",
            "kind": "animation",
            "title": "How to explain it aloud",
            "body": f"Use a 3-step script: (1) user goal, (2) where {title} sits in the diagram, (3) one metric + one failure you'd alert on.",
            "accent": "Say this",
        },
    ]

def questions_for(tid: int, title: str):
    est_target = 12 if tid % 2 == 0 else 116
    return [
        {
            "id": f"t{tid}-q1",
            "type": "multiple_choice",
            "prompt": f"When discussing {title}, which opening line best frames functional scope?",
            "choices": [
                {"id": "a", "label": "List every technology you know"},
                {"id": "b", "label": "State primary user actions and success metrics"},
                {"id": "c", "label": "Start with database schema"},
                {"id": "d", "label": "Draw boxes without requirements"},
            ],
            "correctChoiceIds": ["b"],
            "explanation": "Interviewers reward clarity on who does what before components.",
        },
        {
            "id": f"t{tid}-q2",
            "type": "spot_bottleneck",
            "prompt": f"In a naive {title} design, click the first bottleneck under sudden traffic.",
            "diagramNodes": [
                {"id": "n1", "label": "Client", "x": 20, "y": 50},
                {"id": "n2", "label": "Monolith API", "x": 120, "y": 50},
                {"id": "n3", "label": "Single DB", "x": 220, "y": 50},
            ],
            "diagramEdges": [
                {"from": "n1", "to": "n2"},
                {"from": "n2", "to": "n3"},
            ],
            "correctNodeIds": ["n3"] if tid % 3 == 0 else ["n2"],
            "explanation": "Single-instance paths saturate before well-sharded edges.",
        },
        {
            "id": f"t{tid}-q3",
            "type": "drag_order",
            "prompt": f"Order the interview flow for {title} from requirements to deep dive.",
            "items": [
                {"id": "1", "label": "Clarify requirements"},
                {"id": "2", "label": "Estimate scale"},
                {"id": "3", "label": "Draw HLD"},
                {"id": "4", "label": "Deep dive hot path"},
            ],
            "correctOrder": ["1", "2", "3", "4"],
            "explanation": "This sequencing keeps trade-offs grounded in numbers.",
        },
        {
            "id": f"t{tid}-q4",
            "type": "estimation",
            "prompt": f"Assuming 1M requests/day for a feature using {title}, estimate average QPS (round to nearest whole number).",
            "unit": "QPS",
            "target": float(est_target),
            "assumptions": ["1 day ≈ 10^5 seconds", "1M / 10^5 ≈ 10 QPS average", "Peak ≈ 5× average for India lunch spikes"],
            "formula": "QPS_avg ≈ requests_per_day / 86400 ≈ requests_per_day / 10^5",
            "workedAnswer": "1M/day ≈ 11.6 QPS; peak planning often uses ~12–60 QPS depending on burst factor.",
            "explanation": "Back-of-envelope converts daily volume to per-second capacity.",
        },
        {
            "id": f"t{tid}-q5",
            "type": "tradeoff",
            "prompt": f"Pick an approach for scaling {title} under tight latency SLOs.",
            "constraints": ["p95 < 200ms", "Limited ops headcount", "Must survive 3× diurnal peak"],
            "approaches": [
                {"id": "scale_up", "label": "Scale up single node", "description": "Bigger machine, minimal code change"},
                {"id": "scale_out", "label": "Scale out stateless tier", "description": "Horizontal pods behind LB"},
                {"id": "ignore", "label": "Defer capacity planning", "description": "Ship and hope"},
            ],
            "correctApproachId": "scale_out",
            "rationaleKeywords": ["stateless", "horizontal", "load"],
            "sampleRationale": "Stateless horizontal scaling behind a load balancer handles diurnal 3× peaks without a single choke point.",
            "explanation": "Horizontal scaling matches variable Indian peak patterns.",
        },
        {
            "id": f"t{tid}-q6",
            "type": "multiple_choice",
            "prompt": f"Which NON-functional requirement is most aligned with {title}?",
            "choices": [
                {"id": "a", "label": "Font choice in mobile app"},
                {"id": "b", "label": "Durability and correctness under retries"},
                {"id": "c", "label": "Office seating plan"},
                {"id": "d", "label": "IDE theme"},
            ],
            "correctChoiceIds": ["b"],
            "explanation": "Reliability properties dominate system design discussions.",
        },
    ]

def flashcards_for(tid: int, title: str):
    return [
        {"id": f"t{tid}-f1", "front": f"One-line definition: {title}", "back": f"Core idea behind {title} in production systems and interviews."},
        {"id": f"t{tid}-f2", "front": f"Common pitfall with {title}", "back": "Skipping measurement and mixing concerns across layers."},
    ]

def sources_for(tid: int):
    base = [
        {"title": "AWS Architecture Center", "url": "https://aws.amazon.com/architecture/"},
        {"title": "Google SRE Book", "url": "https://sre.google/sre-book/table-of-contents/"},
    ]
    if tid in (7, 8):
        base.append({"title": "RFC 9110 HTTP Semantics", "url": "https://www.rfc-editor.org/rfc/rfc9110"})
    if tid in (32, 33, 34):
        base.append({"title": "Brewer CAP FAQ", "url": "https://brewer.cs.berkeley.edu/CAP-FAQ.html"})
    if tid in (58, 59):
        base.append({"title": "OAuth 2.0 RFC 6749", "url": "https://www.rfc-editor.org/rfc/rfc6749"})
    if tid == 37:
        base.append({"title": "Kafka Documentation", "url": "https://kafka.apache.org/documentation/"})
    return base

def boss_content(tid: int, title: str):
    caps = ["client", "load_balancer", "service", "cache", "sql_db", "nosql_db", "queue", "cdn"]
    if tid in (86, 87, 110):
        caps.append("blob_storage")
    if tid in (97, 99):
        caps.append("search")
    prereq = [p for p in BOSS_PREREQS.get(tid, [2, 8]) if p != tid]
    return {
        "functionalRequirements": [
            f"Users can perform core actions for {title} with clear IDs",
            "Reads and writes are auditable",
            "API supports pagination for list endpoints",
        ],
        "nonFunctionalRequirements": [
            "99.9% availability target (interview assumption)",
            "p95 read latency < 300ms in metro India",
            "Idempotent writes for retry-safe clients",
        ],
        "exclusions": ["Building a mobile OS", "On-prem mainframe integration"],
        "requirementDistractors": ["Must use blockchain for all rows", "Zero network hops allowed"],
        "estimationScenario": f"Assume 50M DAU, 5 actions/day each, 20% read-heavy for {title}. Peak factor 5×.",
        "apiPrompt": f"Design REST endpoints for {title} including auth, idempotency keys on writes, and cursor pagination.",
        "deepDivePrompts": [
            "How do you shard hot keys?",
            "What cache invalidation strategy avoids stale reads?",
        ],
        "tradeoffPrompt": "SQL vs NoSQL for primary metadata — justify with consistency needs.",
        "rubric": {
            "requiredCapabilities": caps[:6],
            "acceptableAlternatives": {"sql_db": ["nosql_db"], "nosql_db": ["sql_db"], "cache": ["cdn"]},
            "requiredPaths": [
                {"from": "client", "to": "load_balancer"},
                {"from": "load_balancer", "to": "service"},
                {"from": "service", "to": "sql_db"},
            ],
            "unsafeFlows": [{"from": "client", "to": "sql_db"}],
            "minSeparation": [{"types": ["service", "sql_db"], "reason": "Keep data access behind services"}],
            "reliabilityChecks": ["No direct client DB access", "Write path tolerates retries"],
        },
        "referenceNodes": [
            {"id": "c1", "type": "client", "label": "Mobile/Web"},
            {"id": "dns1", "type": "dns"},
            {"id": "lb1", "type": "load_balancer"},
            {"id": "svc1", "type": "service", "label": "API"},
            {"id": "cache1", "type": "cache"},
            {"id": "db1", "type": "sql_db"},
        ],
        "referenceEdges": [
            {"from": "c1", "to": "dns1"},
            {"from": "dns1", "to": "lb1"},
            {"from": "lb1", "to": "svc1"},
            {"from": "svc1", "to": "cache1"},
            {"from": "svc1", "to": "db1"},
        ],
        "referenceNotes": f"Reference layout for {title}; alternatives valid if paths and constraints are met.",
        "workedEstimate": "5 actions * 50M = 250M ops/day ≈ 2.9k QPS avg; peak ≈ 14.5k QPS with 5× factor.",
        "exampleApi": "POST /v1/resources Idempotency-Key; GET /v1/resources?cursor=...",
        "deepDiveAnswers": [
            "Shard by user_id hash; redirect hot keys to dedicated partition.",
            "TTL + event-driven invalidation on writes.",
        ],
        "tradeoffAnalysis": "Pick SQL when strong invariants matter; augment with cache and async workers.",
        "alternativeArchitectures": ["Event-sourced write path", "CQRS read models"],
        "prerequisiteTopicIds": prereq,
    }

def boss_stages(tid: int, title: str, questions):
    tagged = []
    for q in questions:
        qq = dict(q)
        if q["id"].endswith("q1"):
            qq["tags"] = ["requirements"]
        elif q["id"].endswith("q4"):
            qq["tags"] = ["estimation"]
        elif q["id"].endswith("q6"):
            qq["tags"] = ["api"]
        elif q["id"].endswith("q2"):
            qq["tags"] = ["deep_dive"]
        elif q["id"].endswith("q5"):
            qq["tags"] = ["tradeoffs"]
        tagged.append(qq)
    return [
        {"id": f"b{tid}-s1", "title": "Requirements", "kind": "requirements", "prompt": f"Select valid requirements for {title}", "questions": [tagged[0], tagged[5]]},
        {"id": f"b{tid}-s2", "title": "Estimation", "kind": "estimation", "prompt": "Estimate QPS and storage", "questions": [tagged[3]]},
        {"id": f"b{tid}-s3", "title": "API Design", "kind": "api", "prompt": "Shape public APIs", "questions": [tagged[5]]},
        {"id": f"b{tid}-s4", "title": "High-level architecture", "kind": "architecture", "prompt": "Build on canvas", "questions": []},
        {"id": f"b{tid}-s5", "title": "Deep dive", "kind": "deep_dive", "prompt": "Hot path & failures", "questions": [tagged[1], tagged[2]]},
        {"id": f"b{tid}-s6", "title": "Trade-offs", "kind": "tradeoffs", "prompt": "Justify choices", "questions": [tagged[4]]},
    ]

topics = []
region_order_map = {}
for rid, name, subtitle, ids in REGIONS:
    for order_idx, tid in enumerate(ids, start=1):
        region_order_map[tid] = (rid, order_idx)

for tid in range(1, 121):
    title = TITLES[tid]
    region, order = region_order_map[tid]
    k = kind_for(tid)
    topic = {
        "id": tid,
        "slug": slugify(title),
        "region": region,
        "order": order,
        "title": title,
        "kind": k,
        "objectives": [f"Explain {title} in interview terms", f"Apply {title} to an India-scale example"],
        "difficulty": difficulty_for(tid),
        "durationMinutes": 12 if k == "lesson" else 45,
        "prereqIds": BOSS_PREREQS.get(tid, []) if k == "boss" else [],
        "cards": cards_for(tid, title),
        "questions": questions_for(tid, title),
        "flashcards": flashcards_for(tid, title),
        "sources": sources_for(tid),
    }
    if k in ("boss", "tutorial") and tid >= 74:
        if k == "boss":
            topic["boss"] = boss_content(tid, title)
            topic["bossStages"] = boss_stages(tid, title, topic["questions"])
        elif tid == 74:
            topic["bossStages"] = boss_stages(tid, title, topic["questions"])
    topics.append(topic)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(topics, indent=2))
print(f"Wrote {len(topics)} topics to {OUT}")
