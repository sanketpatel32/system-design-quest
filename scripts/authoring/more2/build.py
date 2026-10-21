import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import be_a, be_b, fe_a, fe_b, review2
review2.apply_frontend(fe_a.T + fe_b.T)
review2.apply_backend(be_a.T + be_b.T)
root = os.path.join(os.path.dirname(__file__), '..', '..', 'authored')
for name, mods in [('fund-backend-extra.json', [be_a, be_b]), ('fund-frontend-extra.json', [fe_a, fe_b])]:
    topics = [t for m in mods for t in m.T]
    with open(os.path.join(root, name), 'w') as f:
        json.dump(topics, f, ensure_ascii=False, indent=1); f.write('\n')
    print(name, [t['id'] for t in topics])
