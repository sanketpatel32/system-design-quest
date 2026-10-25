"""Cloud & DevOps round 3: new topics 581-590 and 681-690 -> scripts/authored/fund-cloud-extra.json.
Run from the repo root: python3 scripts/authoring/more3/cloud.py

MAP_ORDER is the order the new lessons appear on the Cloud & DevOps map, after 321-330.
It must match the f7-cloud topicIds list in src/content/catalog.ts."""
import importlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))

MODULES = ['cloud_a', 'cloud_b', 'cloud_c', 'cloud_d', 'cloud_e', 'cloud_f', 'cloud_g', 'cloud_h', 'cloud_i']
MAP_ORDER = [581, 582, 589, 590, 588, 681, 682, 583, 683, 684, 584, 685, 686, 688, 585, 687, 690, 689, 586, 587]

T = []
for name in MODULES:
    if os.path.exists(os.path.join(os.path.dirname(__file__), name + '.py')):
        T += importlib.import_module(name).T
byid = {t['id']: t for t in T}
assert len(byid) == len(T), 'duplicate topic id'
assert set(byid) <= set(MAP_ORDER), sorted(set(byid) - set(MAP_ORDER))
out_list = []
for pos, tid in enumerate(MAP_ORDER):
    if tid in byid:
        byid[tid]['order'] = 11 + pos
        out_list.append(byid[tid])
out = os.path.join(os.path.dirname(__file__), '..', '..', 'authored', 'fund-cloud-extra.json')
with open(out, 'w') as f:
    json.dump(sorted(out_list, key=lambda t: t['id']), f, ensure_ascii=False, indent=1)
    f.write('\n')
print('fund-cloud-extra.json', sorted(byid), 'missing:', [i for i in MAP_ORDER if i not in byid])
