"""Frontend 215-220: writes scripts/authored/fund-frontend-more.json, then layers the review fixes on top.
Run by scripts/authoring/rebuild.py (npm run content:build); safe to run from any directory."""
import json, os, runpy, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import t215_217, t218_220
out = t215_217.T + t218_220.T
with open(os.path.join(HERE, '..', '..', 'authored', 'fund-frontend-more.json'), 'w') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print(len(out))
# Review fixes (fe-be-more-review.md): only the Frontend half, because only that file was just regenerated
fixes = runpy.run_path(os.path.join(HERE, '..', 'more-review', 'fixes.py'))
fixes['run_frontend']()
