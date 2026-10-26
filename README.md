# System Design Quest

Interactive, game-style system design practice for SDE interviews — India-market examples, deterministic grading, no backend.

## Setup

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:43123`.

## Commands

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run typecheck` | `tsc -b` strict |
| `npm run test` | Vitest unit tests |
| `npm run audit` | Assemble shards + integrity (exact dupes fail; near-dupes warn) |
| `npm run audit:strict` | Fail on near-duplicate card/prompt text (Jaccard ≥ 0.82) |
| `npm run content:build` | Re-run every lesson generator and fix script, then `quality/apply.py` and `quality/style.py`, assemble and audit (incl. house style) |
| `npm run e2e` | Playwright tests |
| `npm run build` | Production build to `dist/` |

### Content pipeline

`scripts/authored/*.json` is the source of truth. `npm run content:build` runs `scripts/authoring/rebuild.py`, which
regenerates the generated lesson files (fe-more, more2, more3), re-applies each section's `*_fixes.py`,
`integrate_fixes.py`, `quality/apply.py` and finally `quality/style.py` (house style, see
[docs/style-guide.md](docs/style-guide.md)), then assembles `src/content/generated/topics.json` and audits it.
On a clean checkout it leaves no git diff. To change generated lessons, edit the generator or a fix script (quality edits
go in `scripts/authoring/quality/q_*.py`), never only the JSON; hand-maintained files (lessons 1-120, bosses, tutorial,
`deep/`, `boss-deep/`, `interactive/`) are edited in place.

```bash
npm run content:build   # rebuild.py + assemble + audit
npm run content:fix     # rebuild.py + assemble (no audit)
```

The original seed (`build-authored-content.py` + `fix-content.mjs`) no longer reproduces the curated lessons 1-120 and
bosses: it re-templates boss questions and re-shuffles choices, which is why `option-balance.json` then fails on
`b77-dd2`. Both scripts refuse to run unless `CONTENT_SEED=1` is set; only use that to start over from specs.

## Architecture

- **UI**: React 19 + TypeScript (strict) + Tailwind 4 + React Router SPA (`vercel.json` + `public/_redirects` for direct loads).
- **Content**: `src/content/generated/topics.json` (120 fixed IDs), typed in `src/content/types.ts`, indexed by `src/content/catalog.ts`.
- **Scoring**: `src/lib/scoring/*` — MCQ, bottleneck, ordering, estimation (±50%), trade-off, boss rubric + graph semantics (`src/lib/scoring/graph.ts`).
- **Progression**: hearts, 70% pass, XP, badges, region unlocks — `src/lib/progression/*` + `src/stores/gameStore.ts`.
- **Persistence**: versioned schema v3 in `src/lib/storage/schema.ts`, migrations, localStorage + IndexedDB (`idb`), export/import/reset on Settings.
- **Boss canvas**: `@xyflow/react` in `src/components/BossCanvas.tsx`.
- **Interview mode**: wall-clock timers in `src/lib/interview/timer.ts` (45 min staged mock).
- **SRS**: `src/lib/srs/scheduler.ts` + Revision page.

## Assumptions

- Single-player, one browser profile; no auth.
- Boss and topic prose for IDs 1–120 are generated from `scripts/generate-content.py` with per-ID titles and India-flavored prompts; editorial deep-dives for CAP/OAuth/etc. should be extended in that script over time.
- Interview wrap-up uses self-assessment rubric only (no AI grading).

## Add or revise a topic

1. Edit metadata in `scripts/generate-content.py` (`TITLES`, `BOSS_PREREQS`, or per-topic helpers).
2. Run `python3 scripts/generate-content.py`.
3. Run `npm run audit`.
4. Adjust unlock order in `src/content/catalog.ts` if region membership changes (IDs are fixed 1–120).

## Deployment

Static `dist/` — any static host (Vercel, Netlify, Render static site, S3+CloudFront).

```bash
npm run build
# publish dist/
```

From this cloud agent environment we did not run a live deploy to Vercel (no project token / site linked in-session). Build artifacts are valid for manual or CI deploy.

## Known limitations

- Content generator uses structured templates; not every topic has hand-crafted diagram uniqueness beyond the shared SVG sketch.
- Graph grading is capability/path based, not pixel-perfect layout matching.
- Sound uses a short WebAudio beep after explicit user gesture.

See `CHECKLIST.md` for delivery status.
