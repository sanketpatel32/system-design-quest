#!/usr/bin/env python3
"""Regenerate every generated lesson file in scripts/authored/, then re-apply all fixes, in order.

    python3 scripts/authoring/rebuild.py      (npm run content:build / content:fix call this)

Order matters: generators first, then each generator's *_fixes, then integrate_fixes (cross-section links),
then quality/apply.py, so the quality edits always win, then quality/style.py (house style) last. On a clean checkout this reproduces the
committed JSON exactly (no git diff); any step that fails stops the build.

Hand-maintained files (lessons-*.json, bosses-75-114.json, tutorial-74.json, fund-*.json without a
generator, deep/, boss-deep/, interactive/) are edited in place and never regenerated here. The legacy
seed (build-authored-content.py + fix-content.mjs) would overwrite them; see `npm run content:seed`.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

STEPS = [
    ('fe-more', 'build.py'),            # fund-frontend-more.json (+ Frontend review fixes)
    ('more2', 'build.py'),              # fund-backend-extra.json, fund-frontend-extra.json
    *[('more3', f'{s}.py') for s in ['sd', 'fe', 'be', 'net', 'os', 'os2', 'sec', 'db', 'cloud']],
    *[('more3', f'{s}_fixes.py') for s in ['sd', 'fe', 'be', 'net', 'os', 'sec', 'db', 'cloud']],
    ('more3', 'integrate_fixes.py'),
    ('quality', 'apply.py'),            # quality edits win over every generator and fix
    ('quality', 'style.py'),            # house style (spelling, terms, quotes), always last; see docs/style-guide.md
]


def main() -> None:
    for folder, script in STEPS:
        cwd = os.path.join(HERE, folder)
        r = subprocess.run([sys.executable, script], cwd=cwd, capture_output=True, text=True)
        if r.returncode:
            sys.stderr.write(r.stdout[-2000:] + r.stderr[-4000:])
            raise SystemExit(f'rebuild: {folder}/{script} failed')
        if folder == 'quality':
            print(r.stdout.strip())
    print(f'rebuild: {len(STEPS)} steps OK')


if __name__ == '__main__':
    main()
