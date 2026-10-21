"""Helpers for the second Backend/Frontend content round (topics 341-346, 351-356)."""

def mc(id, concept, prompt, choices, correct, expl):
    return {"id": id, "concept": concept, "type": "multiple_choice", "prompt": prompt,
            "choices": [{"id": k, "label": v} for k, v in choices], "correctChoiceIds": [correct], "explanation": expl}

def order(id, concept, prompt, steps, shown, expl):
    items = {f"s{i+1}": s for i, s in enumerate(steps)}
    return {"id": id, "concept": concept, "type": "drag_order", "prompt": prompt,
            "items": [{"id": k, "label": items[k]} for k in shown], "correctOrder": list(items), "explanation": expl}

def est(id, concept, prompt, unit, target, assumptions, formula, worked, expl, tol, traps):
    return {"id": id, "concept": concept, "type": "estimation", "prompt": prompt, "unit": unit, "target": target,
            "assumptions": assumptions, "formula": formula, "workedAnswer": worked, "explanation": expl,
            "tolerance": tol, "trapAnswers": traps}

def text(tid, n, title, body, teaches):
    return {"id": f"t{tid}-c{n}", "kind": "text", "title": title, "body": body, "teaches": teaches}

def diagram(tid, n, title, body, teaches, steps):
    return {"id": f"t{tid}-c{n}", "kind": "diagram", "title": title, "body": body, "teaches": teaches, "steps": steps}

def flash(tid, pairs):
    return [{"id": f"t{tid}-f{i+1}", "front": f, "back": b} for i, (f, b) in enumerate(pairs)]

def src(pairs):
    return [{"title": t, "url": u} for t, u in pairs]

def see(pairs):
    return [{"topicId": i, "why": w} for i, w in pairs]

def topic(id, slug, region, order_, title, objectives, difficulty, minutes, prereqs, cards, questions, flashcards,
          sources, deep, interactive, seeAlso):
    return {"id": id, "slug": slug, "region": region, "order": order_, "title": title, "kind": "lesson",
            "objectives": objectives, "difficulty": difficulty, "durationMinutes": minutes, "prereqIds": prereqs,
            "cards": cards, "questions": questions, "flashcards": flashcards, "sources": sources, "deep": deep,
            "interactive": interactive, "seeAlso": seeAlso}

def deep(teaches, mech_title, steps, use, avoid, cols, rows, num_title, assumptions, num_steps, result,
         ex_title, ex_label, ex_body, pitfalls, takeaways):
    return {"teaches": teaches, "mechanism": {"title": mech_title, "steps": steps}, "useWhen": use, "avoidWhen": avoid,
            "tradeoffs": {"columns": cols, "rows": rows},
            "numbers": {"title": num_title, "assumptions": assumptions, "steps": num_steps, "result": result},
            "india": {"title": ex_title, "label": ex_label, "body": ex_body},
            "pitfalls": [{"trap": t, "say": s} for t, s in pitfalls], "takeaways": takeaways}
