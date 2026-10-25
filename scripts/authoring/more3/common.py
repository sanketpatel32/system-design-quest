"""Helpers for the third content round (Security topics 571-579). Same shapes as more2/common.py."""
import importlib.util, os
_spec = importlib.util.spec_from_file_location('more2_common', os.path.join(os.path.dirname(__file__), '..', 'more2', 'common.py'))
_m = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_m)
mc, order, est, text, diagram, flash, src, see, topic, deep = (_m.mc, _m.order, _m.est, _m.text, _m.diagram, _m.flash,
                                                              _m.src, _m.see, _m.topic, _m.deep)


def trade(id, concept, prompt, constraints, approaches, correct, rationales, right, wrong, conflicts, expl):
    return {"id": id, "concept": concept, "type": "tradeoff", "prompt": prompt, "constraints": constraints,
            "approaches": [{"id": i, "label": l, "description": d} for i, l, d in approaches],
            "correctApproachId": correct,
            "rationaleOptions": [{"id": i, "label": l} for i, l in rationales],
            "correctRationaleIds": right, "distractorRationaleIds": wrong,
            "rationaleConflicts": conflicts, "explanation": expl}


def predict(title, prompt, choices, correct, reveal, kind="predict", setup=None):
    out = {"kind": kind, "title": title, "prompt": prompt,
           "choices": [{"id": i, "label": l, "feedback": f} for i, l, f in choices],
           "correctId": correct, "reveal": reveal}
    if setup:
        out["setup"] = setup
    return out
