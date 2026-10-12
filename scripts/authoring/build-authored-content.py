#!/usr/bin/env python3
"""Build scripts/authored/*.json from hand-authored curriculum data."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUTHORED = ROOT / "scripts" / "authored"
sys.path.insert(0, str(Path(__file__).resolve().parent))

from curriculum import build_boss_topic, build_lesson_topic, build_tutorial_topic  # noqa: E402
from meta import BOSS_PREREQS, TITLES, region_order_for  # noqa: E402

SVG_FLOW = (
    "<svg viewBox='0 0 320 120' xmlns='http://www.w3.org/2000/svg'>"
    "<rect x='10' y='40' width='60' height='40' fill='#1e293b' stroke='#22d3ee'/>"
    "<text x='40' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Client</text>"
    "<rect x='90' y='40' width='60' height='40' fill='#1e293b' stroke='#a78bfa'/>"
    "<text x='120' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Edge</text>"
    "<rect x='170' y='40' width='60' height='40' fill='#1e293b' stroke='#34d399'/>"
    "<text x='200' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Svc</text>"
    "<rect x='250' y='40' width='60' height='40' fill='#1e293b' stroke='#f472b6'/>"
    "<text x='280' y='65' fill='#e2e8f0' font-size='10' text-anchor='middle'>Data</text>"
    "<line x1='70' y1='60' x2='90' y2='60' stroke='#94a3b8'/>"
    "<line x1='150' y1='60' x2='170' y2='60' stroke='#94a3b8'/>"
    "<line x1='230' y1='60' x2='250' y2='60' stroke='#94a3b8'/>"
    "</svg>"
)


def slugify(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def write_json(name: str, topics: list[dict]) -> None:
    path = AUTHORED / name
    path.write_text(json.dumps(topics, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {path} ({len(topics)} topics, {path.stat().st_size} bytes)")


def validate_unique(topics: list[dict]) -> None:
    card_bodies: set[str] = set()
    prompts: set[str] = set()
    for t in topics:
        for c in t["cards"]:
            b = c["body"]
            if b in card_bodies:
                raise SystemExit(f"Duplicate card body in topic {t['id']}")
            card_bodies.add(b)
        for q in t["questions"]:
            p = q["prompt"]
            if p in prompts:
                raise SystemExit(f"Duplicate question prompt in topic {t['id']}: {p[:60]}")
            prompts.add(p)
        for q in t["questions"]:
            if q["type"] == "tradeoff" and "rationaleKeywords" in q:
                raise SystemExit(f"Topic {t['id']} tradeoff uses rationaleKeywords")
            if q["type"] == "tradeoff" and not q.get("rationaleOptions"):
                raise SystemExit(f"Topic {t['id']} tradeoff missing rationaleOptions")


def main() -> None:
    AUTHORED.mkdir(parents=True, exist_ok=True)

    from generate_all_specs import OUT as SPECS_PATH, write_specs  # noqa: WPS433
    from local_import import patch_specs  # noqa: WPS433

    write_specs()
    specs = json.loads(SPECS_PATH.read_text())
    patch_specs(specs)
    SPECS_PATH.write_text(json.dumps(specs, indent=2) + "\n")
    import curriculum  # noqa: WPS433

    curriculum.SPECS = json.loads(SPECS_PATH.read_text())

    def pack_lessons(ids: list[int]) -> list[dict]:
        out = []
        for tid in ids:
            title = TITLES[tid]
            region, order = region_order_for(tid)
            out.append(build_lesson_topic(tid, title, region, order, slugify(title), SVG_FLOW))
        return out

    write_json("lessons-01-20.json", pack_lessons(list(range(1, 21))))
    write_json("lessons-21-40.json", pack_lessons(list(range(21, 41))))
    write_json("lessons-41-60.json", pack_lessons(list(range(41, 61))))
    write_json("lessons-61-80.json", pack_lessons(sorted({*range(61, 74), 69, 70})))
    write_json("lessons-81-100.json", [])  # bosses 81-100 live in bosses file
    write_json("lessons-101-120.json", pack_lessons(list(range(115, 121))))

    bosses = [build_boss_topic(
        tid,
        TITLES[tid],
        *region_order_for(tid),
        slugify(TITLES[tid]),
        SVG_FLOW,
        BOSS_PREREQS.get(tid, []),
    ) for tid in range(75, 115)]
    write_json("bosses-75-114.json", bosses)

    tutorial = [build_tutorial_topic(74, TITLES[74], *region_order_for(74), slugify(TITLES[74]), SVG_FLOW)]
    write_json("tutorial-74.json", tutorial)

    combined = []
    for fname in sorted(AUTHORED.glob("*.json")):
        combined.extend(json.loads(fname.read_text()))
    validate_unique(combined)
    print(f"Validated {len(combined)} topics for unique card bodies and prompts")


if __name__ == "__main__":
    main()
