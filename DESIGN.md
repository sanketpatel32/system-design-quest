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
