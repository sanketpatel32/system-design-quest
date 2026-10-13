import json, sys
sys.path.insert(0, '.')
import t215_217, t218_220
out = t215_217.T + t218_220.T
json.dump(out, open('../../authored/fund-frontend-more.json', 'w'), indent=1, ensure_ascii=False)
print(len(out))
# Review fixes (fe-be-more-review.md) are layered on top of the generated topics
import runpy, os
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'more-review', 'fixes.py'), run_name='__main__')
