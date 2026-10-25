"""Build the third Databases round: topics 551-558 -> scripts/authored/fund-databases-more.json.

Run: python3 scripts/authoring/more3/db.py   (then: npm run audit)
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import db_a, db_b, db_c, db_d

topics = db_a.T + db_b.T + db_c.T + db_d.T

# Steps whose relative order does not matter get alternative orders.
for t in topics:
    for q in t['questions']:
        if q['id'] == 't555-a6':
            q['alternativeOrders'] = [['s1', 's3', 's2', 's4', 's5']]

# 551 also links to the system-design inverted index lesson.
next(t for t in topics if t['id'] == 551)['seeAlso'].append(
    {'topicId': 63, 'why': 'Inverted indexes at search-engine scale, the next step after in-database full text'})

# Map order follows the catalog list for f4-databases (src/content/catalog.ts).
MAP = [559, 552, 560, 553, 555, 557, 551, 558, 625, 621, 624, 626, 622, 554, 556, 623]
for t in topics:
    t['order'] = 15 + MAP.index(t['id'])

ids = [t['id'] for t in topics]
assert len(set(ids)) == len(ids) and all(i in MAP for i in ids), ids
root = os.path.join(os.path.dirname(__file__), '..', '..', 'authored')
with open(os.path.join(root, 'fund-databases-more.json'), 'w') as f:
    json.dump(topics, f, ensure_ascii=False, indent=1); f.write('\n')
print('fund-databases-more.json', ids)
