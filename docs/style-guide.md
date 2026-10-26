# Content style guide

House style for every lesson, boss, card, question and diagram in System Design Quest.
`scripts/authoring/quality/style.py` applies the mechanical rules on every `npm run content:build`
(it runs last in `rebuild.py`), and `scripts/audit/style.mjs` fails the audit if a rule is broken in the
assembled `topics.json`. The judgement rules at the end are reported as warnings
(`AUDIT_NOTES=1 npm run audit` lists them).

## Spelling: British English

The course is written in British English, so keep it consistent.

| Write | Not |
| --- | --- |
| normalise, normalisation, denormalised | normalize, normalization |
| virtualisation, materialised view | virtualization, materialized |
| authorise, authorisation | authorize, authorization |
| towards, levelled, tunnelling, queueing | toward, leveled, tunneling, queuing |
| organise, optimise, analyse, behaviour, centre, product catalogue | -ize, -yze, behavior, center (the database system catalog keeps its name) |

Exceptions keep their published form: OAuth and HTTP terms (`authorization code`, `authorization server`,
the `Authorization` header), OWASP category names, SQL and API identifiers (`normalize()`, `TimeZone`),
product names, and the titles of cited sources.

## Terms

| Write | Not |
| --- | --- |
| PostgreSQL | Postgres |
| trade-off | tradeoff |
| backpressure | back-pressure |
| hot spot (load), Wi-Fi hotspot | hotspot (load) |
| data centre | datacentre |
| LSM-tree | LSM tree |
| presigned URL | pre-signed URL |
| lifecycle, username, cooldown | life cycle, user name, cool-down |
| WebSocket, CDN, Tatkal | websocket, cdn, tatkal |

Latency percentiles are lower case (p50, p99). Units take a space (`200 ms`, `5 GB`, `40 ms`), except CSS
values (`16px`, `1.5rem`). Numbers of four digits or more take
international commas (`2,000`, `120,000`). Rupee amounts are written `₹8,000`; in diagrams, where the hand-drawn font has no ₹ glyph, write `Rs`.

## Punctuation

- Curly quotes and apostrophes in prose: `it’s`, `the user’s`, `“load more”`. Use ‘single’ quotes only inside
  “double” ones. Code, JSON, SQL, headers and HTML keep straight quotes.
- No spaced em dash ( — ). Use a colon, a comma or a new sentence.
- The ellipsis character `…`, not three full stops.
- One space between sentences and words.

## Cards and questions

- Card titles are unique within a lesson and say what the card teaches (`Tuning R and W for reads or writes`,
  not `Quorums`). One-word titles are flagged.
- Options in a question share grammar: all noun phrases or all clauses, of similar length. Never use
  “all of the above”, “none of the above” or “both of the above”; write the concrete answer.
- The prompt must not give the answer away: if two distinctive words appear in the prompt and only in the
  correct option, reword the option (warning).
- An explanation says why, not just what: it must add more than the words of the correct option (warning).
- Lessons stay between 600 and 1,800 words of reading (cards plus deep dive); outliers are flagged.

## Sources and links

- Cite only hosts on the allowlist in `scripts/audit/fund.mjs` (`FUND_SOURCE_HOSTS`).
- Every source URL must resolve. Replace a dead link with an allowlisted primary source (an RFC, the
  vendor’s documentation, the paper on dl.acm.org), not a blog mirror.
- “See also” links point at a lesson that teaches the related idea, with a `why` that names the connection.

## Diagrams

`scripts/diagrams/specs.txt` holds every diagram. Use `×` for multiplication, `…` for an ellipsis and
curly apostrophes in labels and alt text; the Virgil font has these glyphs but not `≈`, `→` or `₹`
(the grading audit checks glyph coverage). Run `npm run diagrams` after editing a spec.

## Adding a rule

1. Add the regex to `RULES` in `scripts/authoring/quality/style.py` (prose keys only; check it skips code).
2. Add the matching check to `STYLE_RULES` in `scripts/audit/style.mjs` and a row to this guide.
3. Run `npm run content:build` twice: the second run must leave `git status` clean.
