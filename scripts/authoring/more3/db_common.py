"""Shared helpers for the third Databases round (topics 551-558). Reuses the more2 builders."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'more2'))
from common import mc, order, est, text, diagram, flash, src, see, topic, deep  # noqa: F401

REGION = 'f4-databases'

def tq(id, concept, prompt, constraints, approaches, correct, rationales, right, wrong, conflicts, expl):
    """Tradeoff question. approaches: [(id, label, description)], rationales: [(id, label)]."""
    return {"id": id, "concept": concept, "type": "tradeoff", "prompt": prompt, "constraints": constraints,
            "approaches": [{"id": i, "label": l, "description": d} for i, l, d in approaches],
            "correctApproachId": correct,
            "rationaleOptions": [{"id": i, "label": l} for i, l in rationales],
            "correctRationaleIds": right, "distractorRationaleIds": wrong,
            "rationaleConflicts": conflicts, "explanation": expl}

def predict(title, prompt, choices, correct, reveal, kind='predict', setup=None):
    d = {"kind": kind, "title": title, "prompt": prompt}
    if setup:
        d["setup"] = setup
    d.update({"choices": [{"id": i, "label": l, "feedback": f} for i, l, f in choices],
              "correctId": correct, "reveal": reveal})
    return d
