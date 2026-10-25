"""Shared helpers for the Cloud & DevOps round-3 authoring scripts."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'more2'))
from common import *  # noqa: E402,F401,F403


def tradeoff(id, concept, prompt, constraints, approaches, correct, rationales, right, wrong, conflicts, expl):
    return {"id": id, "concept": concept, "type": "tradeoff", "prompt": prompt, "constraints": constraints,
            "approaches": [{"id": k, "label": l, "description": d} for k, l, d in approaches],
            "correctApproachId": correct, "rationaleOptions": [{"id": k, "label": l} for k, l in rationales],
            "correctRationaleIds": right, "distractorRationaleIds": wrong, "rationaleConflicts": conflicts,
            "explanation": expl}


def predict(title, prompt, choices, correct, reveal):
    return {"kind": "predict", "title": title, "prompt": prompt,
            "choices": [{"id": k, "label": l, "feedback": f} for k, l, f in choices], "correctId": correct, "reveal": reveal}
