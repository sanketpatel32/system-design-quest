"""Quality pass (round 4): structured, idempotent edits to existing lessons.

Each section file (q_fe.py, q_be.py, ...) defines P = {topic_id: {'cards': {card_id: {field: value}},
'q': {question_id: {field: value}}, 'flash': {flashcard_id: {field: value}}, 'interactive': {field: value}}}.
A question edit may give 'choices' as [(id, label), ...] and 'correct' as a choice id; giving new choices drops
that question's entry in scripts/option-balance.json, because the labels here are already balanced.
Fields are set to fixed values, so re-running changes nothing. Edits apply to every authored JSON file
(including deep/*.json extraQuestions) wherever the id is found; each id must be found exactly once.

Run after every generator and *_fixes.py script:
    python3 scripts/authoring/quality/apply.py
"""
import glob, importlib.util, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', 'authored')
BALANCE = os.path.join(HERE, '..', '..', 'option-balance.json')
SECTIONS = ['q_fe', 'q_be', 'q_net', 'q_sec', 'q_os', 'q_cloud', 'q_db', 'q_sd']


def load_patches():
    P = {}
    for name in SECTIONS:
        path = os.path.join(HERE, name + '.py')
        if not os.path.exists(path):
            continue
        spec = importlib.util.spec_from_file_location(name, path)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        for tid, edits in m.P.items():
            assert tid not in P, f'topic {tid} is patched by two section files'
            P[tid] = edits
    return P


def dump(path, obj):
    raw = open(path).read()
    second = raw.split('\n', 2)[1]
    indent = len(second) - len(second.lstrip(' '))
    with open(path, 'w') as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=indent)
        if raw.endswith('\n'):
            fh.write('\n')


def norm_it(edit):
    e = dict(edit)
    if 'choices' in e:
        e['choices'] = [{'id': i, 'label': l, 'feedback': fb} for i, l, fb in e['choices']]
    return e


def norm_q(edit):
    e = dict(edit)
    if 'choices' in e:
        e['choices'] = [{'id': i, 'label': l} for i, l in e['choices']]
    if 'correct' in e:
        c = e.pop('correct')
        e['correctChoiceIds'] = c if isinstance(c, list) else [c]
    if 'items' in e and e['items'] and isinstance(e['items'][0], tuple):
        e['items'] = [{'id': i, 'label': l} for i, l in e['items']]
    return e


def main():
    P = load_patches()
    files = sorted(glob.glob(os.path.join(ROOT, '*.json'))) + sorted(glob.glob(os.path.join(ROOT, 'deep', '*.json')))
    docs = {f: json.load(open(f)) for f in files}
    found = {}
    changed = set()
    new_choice_qids = set()

    def setf(f, obj, key, fields, label):
        found[label] = found.get(label, 0) + 1
        for k, v in fields.items():
            if v is None:  # None removes a field (e.g. alternativeOrders of a replaced drag order)
                if k in obj:
                    del obj[k]
                    changed.add(f)
            elif obj.get(k) != v:
                obj[k] = v
                changed.add(f)

    for f, doc in docs.items():
        topics = doc if isinstance(doc, list) else []
        for t in topics:
            e = P.get(t['id'])
            if not e:
                continue
            for c in t['cards']:
                if c['id'] in e.get('cards', {}):
                    setf(f, c, 'cards', e['cards'][c['id']], c['id'])
            for q in t['questions']:
                if q['id'] in e.get('q', {}):
                    ed = norm_q(e['q'][q['id']])
                    if 'choices' in ed:
                        new_choice_qids.add(q['id'])
                    setf(f, q, 'q', ed, q['id'])
            for fc in t.get('flashcards', []):
                if fc['id'] in e.get('flash', {}):
                    setf(f, fc, 'flash', e['flash'][fc['id']], fc['id'])
            if 'interactive' in e and t.get('interactive'):
                setf(f, t['interactive'], 'it', norm_it(e['interactive']), f'{t["id"]}-interactive')
            if 'deep' in e and t.get('deep'):
                for k, v in e['deep'].items():
                    if t['deep'].get(k) != v:
                        t['deep'][k] = v
                        changed.add(f)
                found[f'{t["id"]}-deep'] = 1
        if isinstance(doc, dict):  # deep/*.json: {"<id>": {..., extraQuestions: [...]}}
            for sid, entry in doc.items():
                e = P.get(int(sid)) if sid.isdigit() else None
                if not e:
                    continue
                for q in entry.get('extraQuestions', []):
                    if q['id'] in e.get('q', {}):
                        ed = norm_q(e['q'][q['id']])
                        if 'choices' in ed:
                            new_choice_qids.add(q['id'])
                        setf(f, q, 'q', ed, q['id'])

    # System Design interactives live in interactive/*.json
    for f in sorted(glob.glob(os.path.join(ROOT, 'interactive', '*.json'))):
        doc = json.load(open(f))
        dirty = False
        for sid, it in doc.items():
            e = P.get(int(sid))
            if e and 'interactive' in e:
                found[f'{sid}-interactive'] = found.get(f'{sid}-interactive', 0) + 1
                for k, v in norm_it(e['interactive']).items():
                    if it.get(k) != v:
                        it[k] = v
                        dirty = True
        if dirty:
            dump(f, doc)

    want = set()
    for tid, e in P.items():
        if 'interactive' in e:
            want.add(f'{tid}-interactive')
        for sect in ('cards', 'q', 'flash'):
            want |= set(e.get(sect, {}))
    missing = [w for w in want if found.get(w, 0) == 0]
    dup = [w for w in want if found.get(w, 0) > 1]
    assert not missing, f'ids not found: {sorted(missing)}'
    assert not dup, f'ids found more than once: {sorted(dup)}'

    bal = json.load(open(BALANCE))
    drop = [k for k in bal if k in new_choice_qids]
    for k in drop:
        del bal[k]
    if drop:
        dump(BALANCE, bal)

    for f in changed:
        dump(f, docs[f])
    print(f'quality: {len(P)} topics, {len(want)} ids; rewrote {len(changed)} files; dropped {len(drop)} option-balance entries')


if __name__ == '__main__':
    main()
