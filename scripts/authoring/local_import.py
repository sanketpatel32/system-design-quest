"""Import hand-written lesson prose from scripts/local-source (transit-map build)."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
MAP_PATH = Path(__file__).resolve().parent / "local_id_map.json"

KIND_TO_CANVAS: dict[str, str] = {
    "client": "client",
    "lb": "load_balancer",
    "gateway": "api_gateway",
    "service": "service",
    "cache": "cache",
    "sql": "sql_db",
    "nosql": "nosql_db",
    "queue": "queue",
    "cdn": "cdn",
    "blob": "blob_storage",
    "search": "search",
    "worker": "worker",
    "ratelimiter": "api_gateway",
    "websocket": "service",
    "notify": "worker",
    "scheduler": "worker",
    "stream": "queue",
    "analytics": "search",
}

CARD_LAYOUT = [
    ("Why this matters in interviews", "text", "Interview lens"),
    ("Mental model", "text", None),
    ("Request flow sketch", "diagram", None),
    ("Trade-off or failure mode", "text", None),
    ("How to explain it aloud", "animation", "Say this"),
]

LOCAL_KIND_TO_BLOCK = {
    "concept": 0,
    "visual": 2,
    "example": 2,
    "pitfall": 3,
}


def load_local_export() -> dict[str, Any]:
    raw = subprocess.check_output(
        ["npx", "tsx", str(ROOT / "scripts/local-export-topics.ts")],
        text=True,
        cwd=str(ROOT),
    )
    return json.loads(raw)


def _local_by_id(data: dict[str, Any]) -> dict[int, dict]:
    out: dict[int, dict] = {}
    for t in data["learning"]:
        out[int(t["id"])] = t
    return out


def _boss_by_id(data: dict[str, Any]) -> dict[int, dict]:
    return {int(b["id"]): b for b in data["bosses"]}


def cards_from_local(tid: int, ws_title: str, local: dict) -> list[dict[str, Any]]:
    lc = local.get("cards", [])
    concept = lc[0]["body"].strip() if len(lc) > 0 else local.get("summary", ws_title)
    visual_body = lc[1]["body"].strip() if len(lc) > 1 else concept
    if len(lc) > 1 and lc[1].get("visual"):
        visual_body += "\n\nFlow: " + " → ".join(lc[1]["visual"])
    example = lc[2]["body"].strip() if len(lc) > 2 else local.get("summary", "")
    pitfall = lc[3]["body"].strip() if len(lc) > 3 else "Name one failure mode and how you would detect it in metrics."
    closing = (
        f"Close by restating scope, numbers, and the main risk for {ws_title}. "
        f"{(local.get('cheat') or [local.get('summary', '')])[0]}"
    )
    mental = local.get("summary", concept)
    if mental.strip() == concept.strip():
        mental = example or pitfall
    bodies = [concept, mental, visual_body, pitfall, closing]
    seen: set[str] = set()
    for i, b in enumerate(bodies):
        if b in seen:
            bodies[i] = f"{b} (angle {i + 1} for {ws_title})"
        seen.add(bodies[i])
    cards: list[dict[str, Any]] = []
    for i, (kind_label, card_type, accent) in enumerate(CARD_LAYOUT, start=1):
        card: dict[str, Any] = {
            "kind": kind_label,
            "title": card_type,
            "body": bodies[i - 1],
        }
        if accent:
            card["accent"] = accent
        cards.append(card)
    return cards


def _mcq(q: dict, qid: str) -> dict:
    opts = q["options"]
    letters = ["a", "b", "c", "d", "e", "f"][: len(opts)]
    choices = [{"id": letters[i], "label": opts[i]} for i in range(len(opts))]
    correct = letters[q["answer"]]
    return {
        "id": qid,
        "type": "multiple_choice",
        "prompt": q["prompt"],
        "choices": choices,
        "correctChoiceIds": [correct],
        "explanation": q["explanation"],
    }


def _multi(q: dict, qid: str) -> dict:
    opts = q["options"]
    letters = ["a", "b", "c", "d", "e", "f"][: len(opts)]
    choices = [{"id": letters[i], "label": opts[i]} for i in range(len(opts))]
    correct = [letters[i] for i in q["answers"]]
    return {
        "id": qid,
        "type": "multiple_choice",
        "prompt": q["prompt"],
        "choices": choices,
        "correctChoiceIds": correct,
        "explanation": q["explanation"],
    }


def _order(q: dict, qid: str) -> dict:
    items = [{"id": f"i{k}", "label": label} for k, label in enumerate(q["items"])]
    order = [f"i{k}" for k in range(len(q["items"]))]
    return {
        "id": qid,
        "type": "drag_order",
        "prompt": q["prompt"],
        "items": items,
        "correctOrder": order,
        "explanation": q["explanation"],
    }


def _estimate(q: dict, qid: str) -> dict:
    target = float(q["answer"])
    unit = q.get("unit", "count")
    unit_map = {
        "k_per_s": "requests/sec (thousands)",
        "hours": "hours",
        "count": "count",
    }
    return {
        "id": qid,
        "type": "estimation",
        "prompt": q["prompt"],
        "unit": unit_map.get(unit, unit),
        "target": target,
        "assumptions": ["Use rounded daily volume ÷ 86,400 unless stated otherwise."],
        "formula": "See explanation",
        "workedAnswer": q["explanation"],
        "explanation": q["explanation"],
    }


def questions_from_local(tid: int, local: dict, fallback: list[dict]) -> list[dict]:
    converted: list[dict] = []
    for i, q in enumerate(local.get("questions", [])[:2], start=1):
        qid = f"t{tid}-q{i}"
        t = q["type"]
        if t == "mcq":
            converted.append(_mcq(q, qid))
        elif t == "multi":
            converted.append(_multi(q, qid))
        elif t == "order":
            converted.append(_order(q, qid))
        elif t == "match":
            pairs = q.get("pairs") or []
            prompt = f"Topic {tid}: {q['prompt']}"
            opts = [f"{a} → {b}" for a, b in pairs[:4]]
            if len(opts) < 2:
                continue
            converted.append(
                {
                    "id": qid,
                    "type": "multiple_choice",
                    "prompt": prompt,
                    "choices": [{"id": "a", "label": opts[0]}, {"id": "b", "label": opts[1]}],
                    "correctChoiceIds": ["a"],
                    "explanation": q["explanation"],
                }
            )
        elif t == "estimate":
            converted.append(_estimate(q, qid))
    seen_ids = {q["id"] for q in converted}
    for q in fallback:
        if q["id"] in seen_ids:
            continue
        converted.append(q)
        if len(converted) >= 6:
            break
    return converted[:8]


def flashcards_from_local(tid: int, local: dict, fallback: list[dict]) -> list[dict]:
    fc = local.get("flashcards") or []
    if len(fc) >= 2:
        return [
            {"id": f["id"] if "id" in f else f"t{tid}-f{i}", "front": f["front"], "back": f["back"]}
            for i, f in enumerate(fc)
        ]
    return fallback


def rubric_from_local_boss(boss: dict) -> dict[str, Any]:
    required = [KIND_TO_CANVAS[k] for k in boss["required"] if k in KIND_TO_CANVAS]
    paths = [
        {"from": KIND_TO_CANVAS[f], "to": KIND_TO_CANVAS[t]}
        for f, t in boss["paths"]
        if f in KIND_TO_CANVAS and t in KIND_TO_CANVAS
    ]
    stores = ["sql_db", "nosql_db", "blob_storage", "search"]
    return {
        "requiredCapabilities": list(dict.fromkeys(required)),
        "acceptableAlternatives": {
            "sql_db": ["nosql_db"],
            "nosql_db": ["sql_db"],
            "cache": [],
        },
        "requiredPaths": paths,
        "unsafeFlows": [
            {"from": "client", "to": s} for s in stores
        ],
        "minSeparation": [],
        "reliabilityChecks": boss.get("reference", [])[:3],
    }


def patch_specs(specs: dict[str, Any]) -> None:
    data = load_local_export()
    local_topics = _local_by_id(data)
    bosses = _boss_by_id(data)
    mapping = {int(k): int(v) for k, v in json.loads(MAP_PATH.read_text()).items() if not k.startswith("_")}

    used_local: set[int] = set()
    for key, lesson in specs.get("lessons", {}).items():
        tid = int(key)
        local_id = mapping.get(tid)
        if local_id is None or local_id not in local_topics:
            continue
        if local_id in used_local:
            continue
        used_local.add(local_id)
        local = local_topics[local_id]
        ws_title = lesson.get("_title") or lesson  # patched below
        from meta import TITLES  # noqa: WPS433

        ws_title = TITLES[tid]
        lesson["cards"] = cards_from_local(tid, ws_title, local)
        lesson["questions"] = questions_from_local(tid, local, lesson["questions"])
        lesson["flashcards"] = flashcards_from_local(tid, local, lesson["flashcards"])
        if local.get("cheat"):
            lesson.setdefault("objectives", [])
        summary = local.get("summary", "")
        if summary and len(summary) > 20:
            lesson["objectives"] = [
                f"Explain {ws_title} with measurable requirements and failure modes",
                summary,
            ]

    for key, boss_lesson in specs.get("bosses", {}).items():
        bid = int(key)
        b = bosses.get(bid)
        if not b:
            continue
        from meta import TITLES  # noqa: WPS433

        title = TITLES[bid]
        boss_lesson["cards"] = [
            {
                "kind": "The brief",
                "title": "text",
                "body": f"Boss {bid} · {title}: {b['context']} In scope: {'; '.join(b['functional'])}.",
                "accent": "Interview lens",
            },
            {
                "kind": "Quality bar",
                "title": "text",
                "body": f"Boss {bid} non-functionals: " + ". ".join(b["nonFunctional"]) + ".",
            },
            {
                "kind": "Reference sketch",
                "title": "diagram",
                "body": f"Boss {bid} reference path: " + " → ".join(b["reference"][:4]),
            },
            {
                "kind": "Failure modes",
                "title": "text",
                "body": f"Boss {bid} risks: {b['reference'][-1] if b['reference'] else 'Cache cold start, queue backlog, primary failover.'}",
            },
            {
                "kind": "Say aloud",
                "title": "animation",
                "body": f"Boss {bid} close: peak QPS for {title}, required components {', '.join(b['required'][:5])}, and one mitigation.",
                "accent": "Say this",
            },
        ]
        boss = boss_lesson["boss"]
        boss["functionalRequirements"] = list(b["functional"])
        boss["nonFunctionalRequirements"] = list(b["nonFunctional"])
        boss["requirementDistractors"] = list(b.get("requirementQ", {}).get("options", [])[len(b["functional"]) :])
        est = b["estimate"]
        boss["estimationScenario"] = (
            f"{title}: {est['dau']:,} DAU, {est['actionsPerUser']} actions/user/day, "
            f"peak factor {est['peakFactor']}× — estimate peak {est['label']} QPS."
        )
        boss["rubric"] = rubric_from_local_boss(b)
        boss["gradingProfile"] = {
            "expectedPeakQps": (est["dau"] * est["actionsPerUser"] / 86400) * est["peakFactor"],
            "requiredKinds": b["required"],
            "paths": b["paths"],
        }


def strip_fingerprint_text(text: str) -> str:
    return re.sub(r"\btok[a-f0-9]{6,}\b", "", text or "").strip()
