import json, sys
sys.path.insert(0, '.')
import t215_217, t218_220
out = t215_217.T + t218_220.T
json.dump(out, open('../../authored/fund-frontend-more.json', 'w'), indent=1, ensure_ascii=False)
print(len(out))
