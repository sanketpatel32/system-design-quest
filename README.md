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
| `npm run content:build` | Regenerate `scripts/authored/*.json` from authoring pipeline |
| `npm run e2e` | Playwright tests |
| `npm run build` | Production build to `dist/` |

Regenerate topic JSON from authored shards:

```bash
npm run content:build
# or manually:
python3 scripts/authoring/build-authored-content.py
node scripts/assemble-authored.mjs
npm run audit
```

Authoring sources live in `scripts/authoring/`; committed shards in `scripts/authored/`.

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
