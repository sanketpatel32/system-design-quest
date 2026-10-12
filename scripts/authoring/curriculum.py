"""Assemble Topic objects from generated lesson/boss specs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from meta import BOSS_PREREQS, TITLES, difficulty_for
from question_factory import drag, estimate, mc, spot, tradeoff

_SPECS_PATH = Path(__file__).resolve().parent / "all_specs.json"


def _load_specs() -> dict[str, Any]:
    if not _SPECS_PATH.exists():
        from generate_all_specs import write_specs  # noqa: WPS433

        write_specs()
    return json.loads(_SPECS_PATH.read_text())


SPECS = _load_specs()


def _cards_from_spec(tid: int, spec: dict, svg: str) -> list[dict]:
    cards: list[dict] = []
    for i, block in enumerate(spec["cards"], start=1):
        card = {
            "id": f"t{tid}-c{i}",
            "kind": block["kind"],
            "title": block["title"],
            "body": block["body"],
        }
        if block.get("accent"):
            card["accent"] = block["accent"]
        if block["kind"] == "diagram":
            card["diagram"] = block.get("diagram") or svg
        cards.append(card)
    return cards


def build_lesson_topic(
    tid: int,
    title: str,
    region: str,
    order: int,
    slug: str,
    svg: str,
) -> dict:
    spec = SPECS["lessons"][str(tid)]
    return {
        "id": tid,
        "slug": slug,
        "region": region,
        "order": order,
        "title": title,
        "kind": "lesson",
        "objectives": spec["objectives"],
        "difficulty": difficulty_for(tid),
        "durationMinutes": spec.get("durationMinutes", 12),
        "prereqIds": spec.get("prereqIds", []),
        "cards": _cards_from_spec(tid, spec, svg),
        "questions": spec["questions"],
        "flashcards": spec["flashcards"],
        "sources": spec["sources"],
    }


def build_tutorial_topic(
    tid: int,
    title: str,
    region: str,
    order: int,
    slug: str,
    svg: str,
) -> dict:
    topic = build_lesson_topic(tid, title, region, order, slug, svg)
    topic["kind"] = "tutorial"
    topic["durationMinutes"] = 45
    topic["bossStages"] = boss_stages(tid, title, topic["questions"])
    return topic


def build_boss_topic(
    tid: int,
    title: str,
    region: str,
    order: int,
    slug: str,
    svg: str,
    prereq_ids: list[int],
) -> dict:
    spec = SPECS["bosses"][str(tid)]
    topic = {
        "id": tid,
        "slug": slug,
        "region": region,
        "order": order,
        "title": title,
        "kind": "boss",
        "objectives": spec["objectives"],
        "difficulty": difficulty_for(tid),
        "durationMinutes": 45,
        "prereqIds": prereq_ids,
        "cards": _cards_from_spec(tid, spec, svg),
        "questions": spec["questions"],
        "flashcards": spec["flashcards"],
        "sources": spec["sources"],
    }
    boss = dict(spec["boss"])
    boss["prerequisiteTopicIds"] = prereq_ids
    topic["boss"] = boss
    topic["bossStages"] = boss_stages(tid, title, topic["questions"])
    return topic


def boss_stages(tid: int, title: str, questions: list[dict]) -> list[dict]:
    tagged: list[dict] = []
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
        {
            "id": f"b{tid}-s1",
            "title": "Requirements",
            "kind": "requirements",
            "prompt": f"Select valid requirements for {title}",
            "questions": [tagged[0], tagged[5]],
        },
        {
            "id": f"b{tid}-s2",
            "title": "Estimation",
            "kind": "estimation",
            "prompt": "Estimate QPS and storage",
            "questions": [tagged[3]],
        },
        {
            "id": f"b{tid}-s3",
            "title": "API Design",
            "kind": "api",
            "prompt": "Shape public APIs",
            "questions": [tagged[5]],
        },
        {
            "id": f"b{tid}-s4",
            "title": "High-level architecture",
            "kind": "architecture",
            "prompt": "Build on canvas",
            "questions": [],
        },
        {
            "id": f"b{tid}-s5",
            "title": "Deep dive",
            "kind": "deep_dive",
            "prompt": "Hot path and failure scenarios",
            "questions": [tagged[1], tagged[2]],
        },
        {
            "id": f"b{tid}-s6",
            "title": "Trade-offs",
            "kind": "tradeoffs",
            "prompt": "Justify choices",
            "questions": [tagged[4]],
        },
    ]


# Re-export for build script
__all__ = [
    "BOSS_PREREQS",
    "TITLES",
    "boss_stages",
    "build_boss_topic",
    "build_lesson_topic",
    "build_tutorial_topic",
]
