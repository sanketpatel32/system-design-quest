"""Factory helpers for authored assessment items."""

from __future__ import annotations

from typing import Any


def mc(qid: str, prompt: str, choices: list[tuple[str, str]], correct: str, explanation: str) -> dict[str, Any]:
    return {
        "id": qid,
        "type": "multiple_choice",
        "prompt": prompt,
        "choices": [{"id": cid, "label": label} for cid, label in choices],
        "correctChoiceIds": [correct],
        "explanation": explanation,
    }


def spot(
    qid: str,
    prompt: str,
    nodes: list[tuple[str, str, int, int]],
    edges: list[tuple[str, str]],
    correct: list[str],
    explanation: str,
) -> dict[str, Any]:
    return {
        "id": qid,
        "type": "spot_bottleneck",
        "prompt": prompt,
        "diagramNodes": [{"id": n[0], "label": n[1], "x": n[2], "y": n[3]} for n in nodes],
        "diagramEdges": [{"from": a, "to": b} for a, b in edges],
        "correctNodeIds": correct,
        "explanation": explanation,
    }


def drag(qid: str, prompt: str, items: list[tuple[str, str]], order: list[str], explanation: str) -> dict[str, Any]:
    return {
        "id": qid,
        "type": "drag_order",
        "prompt": prompt,
        "items": [{"id": i, "label": lbl} for i, lbl in items],
        "correctOrder": order,
        "explanation": explanation,
    }


def estimate(
    qid: str,
    prompt: str,
    unit: str,
    target: float,
    assumptions: list[str],
    formula: str,
    worked: str,
    explanation: str,
) -> dict[str, Any]:
    return {
        "id": qid,
        "type": "estimation",
        "prompt": prompt,
        "unit": unit,
        "target": target,
        "assumptions": assumptions,
        "formula": formula,
        "workedAnswer": worked,
        "explanation": explanation,
    }


def tradeoff(
    qid: str,
    prompt: str,
    constraints: list[str],
    approaches: list[tuple[str, str, str]],
    correct_approach: str,
    rationales: list[tuple[str, str]],
    correct_rationale_ids: list[str],
    distractor_ids: list[str] | None,
    explanation: str,
) -> dict[str, Any]:
    return {
        "id": qid,
        "type": "tradeoff",
        "prompt": prompt,
        "constraints": constraints,
        "approaches": [
            {"id": aid, "label": label, "description": desc} for aid, label, desc in approaches
        ],
        "correctApproachId": correct_approach,
        "rationaleOptions": [{"id": rid, "label": label} for rid, label in rationales],
        "correctRationaleIds": correct_rationale_ids,
        "distractorRationaleIds": distractor_ids or [],
        "explanation": explanation,
    }
