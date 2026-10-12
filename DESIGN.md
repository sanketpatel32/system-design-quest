# Design plan

Concept: system design as a city transit network. Each learning region is a metro line with its own colour, topics are stations, and the Boss Arena is the terminal interchange. The map is the one bold element; everything else stays quiet.

Palette
- Night ink `#0D1B2A`: base background, a blue ink rather than black
- Platform `#14283D`: raised surfaces
- Chalk `#EDE6D6`: primary text, station fills
- Signal amber `#F2B33D`: the single action colour (buttons, current station)
- Fault red `#FF5A4E`: hearts, errors, the Boss line
- Clear green `#6FD38B`: correct answers
- Line colours, one per region (see `src/content/index.ts`)

Type: Bricolage Grotesque for display (station names, headings, big numbers), Atkinson Hyperlegible for body text, chosen because it was designed for legibility. Sentence case everywhere. No all-caps eyebrows, no monospace labels.

Layout: asymmetric. The map takes the wide left column and a narrow right rail works as the departure board (HUD, selected station, next stop). Lessons use one tall card with a coloured line running down its left edge, like a route strip.

Motion: only the next available station pulses. Other motion responds to what the learner does: hearts shake when lost, the route segment fills on clear, cards slide when you page through. `prefers-reduced-motion` is respected.

Rejected defaults: purple gradients, glass-card grids, emoji icons, Inter, identical rounded cards, arrows appended to buttons.

Content audit (`npm run audit:strict`): exact duplicate card bodies or prompts always fail; `tok*` fingerprint tokens are rejected. Near-duplicate Jaccard (≥ 0.82) applies to **lesson card bodies** only (with fingerprint tokens stripped). Quiz prompts may reuse the same question shape across topics when the stem names the topic; strict mode does not near-match prompts.

## Region motifs
Each region has one line-drawn landmark (src/components/map/RegionMotif.tsx): rocket gantry, skyline, signal head, ice crystal, keep, locomotive, summits, dish, vault door, flagged peak, arena arches. 24px grid, 1.6 stroke, round caps, stroked in the region's line colour only: no fills, gradients or emoji. Shown beside the line label on the map, in the curriculum list and in lesson headers.

## Question checklist
Every topic has 5–8 questions, at least 3 types where they fit, and each question has a `concept` taught by a card (`teaches`) in the topic or its prerequisites. Distractors must be misconceptions a learner might actually hold: no joke options, "none of the above", irrelevant tech or answers that repeat the correct one. `npm run audit` enforces this (scripts/audit/quiz-quality.mjs).
