# Design plan: bright, playful, game-like

DesignQuest should feel like a friendly learning game: a warm light page, saturated cheerful colour, chunky tactile controls, and a mascot who reacts to how you're doing. The dark "transit ink" theme is retired.

## Colour
- **Page** `#FFF9F0` (soft warm white). **Cards** `#FFFFFF` with a 2px `#E6E0D6` outline and a 4px solid "floor" shadow in the same colour.
- **Text** `#29303D`; secondary `#5B6472` (5.7:1 on the page).
- **Hero green** for every primary action: button fill `#2F7D00` (white text 5.4:1), floor `#1F5600`. Bright `#58CC02` is used only for fills that carry no text (progress bars, the mascot, correct-answer accents).
- **Feedback.** Correct uses `#D7FFB8` with `#235C00` text. Wrong uses `#FFDFE0` with `#8E1F26` text. Hearts are `#FF4B4B`, gems `#1CB0F6`, the streak flame `#FF9600`, gold/boss `#FFC800`.
- **One cheerful colour per region** (`src/lib/design/transitTheme.ts`):
  - `bright` is for path nodes and illustrations.
  - `deep` is for banners and text; it passes 4.5:1 against white.
  - `soft` is for tints; `shadow` is for button floors.
- **The Colosseum and boss pages use a gold banner.** It carries dark ink `#3D2A00`, because white on gold fails contrast.
- **Contrast check.** Every page is checked with axe-core (WCAG 2 A/AA) at 1366px and 390px.

## Type
- **Nunito** (600–900) everywhere, loaded through `@fontsource/nunito`. Headings and buttons use weight 900. Body text is 600 at 16–18px.
- Buttons, chips and eyebrows are uppercase with letter-spacing of 0.04–0.05em.

## Shape and controls
- **Corners.** 16px on buttons and tiles, 20px on cards and banners, and pills for chips.
- **Chunky 3D buttons** (`.btn-cta`, `.btn-quiet`, `.btn-sky`, `.btn-danger`):
  - A solid 4px bottom floor. On `:active` the button moves down 4px and the floor disappears, so it looks pressed.
  - Minimum height 48px, generous padding.
- **Answer tiles** (`.choice-row`):
  - The whole tile is the hit target (a transparent radio covers it), at least 56px tall, with a numbered key chip.
  - Selected is sky blue, correct is green, wrong is red. Each state has a matching floor.
- **Focus.** A 3px `#1CB0F6` ring on everything, including tiles (`:has(input:focus-visible)`) and path nodes.

## Map
- **A vertical winding path** of 72px round nodes, offset in a sine-like pattern (`WIND`).
- **Node states:**
  - Done shows a check.
  - Open shows a star, or a book on a unit's first lesson.
  - Locked is a grey lock.
  - The current node has a soft halo and a bouncing **Start** bubble.
- **Clicking a node** opens a region-coloured popover with the title, status, time and a chunky Start button. Locked nodes show the unlock hint instead.
- **Node titles** sit beside every node, so the path stays readable.
- **Each region is a unit** with a banner showing the unit number, region name, progress bar and its illustration.
- **The Colosseum is the final unit.** Bosses are larger gold castle nodes.
- **Other controls:** Continue card on top, search, and a Path/List toggle (the list view is the full curriculum).

## Mascot: "Byte"
- An original server-bot drawn in SVG (`src/components/art/Mascot.tsx`): a green body, a face screen, server slots on the belly and an antenna LED.
- **Moods:** `idle`, `happy` (arms up, closed-eye smile), `sad` (drooping antenna, frown, tear) and `think`.
- **Where Byte appears:**
  - Onboarding.
  - Quiz feedback sheets (happy or sad) and the celebration screen.
  - The pep talk before a quiz.
  - Empty states: review queue, boss canvas, 404, loading.
  - The boss score card.

## Illustrations and icons
- **One scene per region** (`src/components/art/RegionArt.tsx`), drawn in white and pastel shapes with the region's bright colour and a touch of gold, to sit on the deep banner:
  - Launchpad: rocket.
  - Neon Network City: skyline with signal.
  - Traffic Control: traffic light.
  - Frost Cache Caverns: ice crystal cave.
  - Data Citadel: castle with database towers.
  - Queue Railways: train.
  - Consensus Peaks: flagged peaks.
  - Operations Spaceport: dish and planet.
  - Vault & Archive: vault door and coins.
  - Interview Summit: trophy summit.
  - Colosseum: arches.
- **Icons are filled custom SVG** (`HudIcons.tsx`): heart, flame, gem, badge, lock, star, check, book, chest, castle and the nav icons. No emoji are used as icons, and there is no stock art.
- **Small line motifs** (`RegionMotif.tsx`) remain available for compact spots.

## Quiz
- **Top bar.** A close X, a thick green progress bar, and heart icons that shake when you lose one.
- **The question takes the full width**, with a large prompt and big answer tiles.
- **A fixed white bottom bar holds Submit.**
- **After you submit, a feedback sheet slides up from the bottom.** It is green or red, with Byte, the result, a "Why" explanation and a chunky Continue button (red when you were wrong). It also offers a practice retry.
- **Celebration screen.** Happy Byte pops in, three stat tiles (Total XP, Accuracy, Streak) appear, and colourful confetti fires, followed by Continue and Back to map buttons.

## Layout
- **Desktop (≥1024px):** a fixed left sidebar with the logo and big labelled nav icons. The top bar holds the HUD chips (streak flame, XP gem, badges) and the help button.
- **Mobile:** a bottom tab bar with 5 icon tabs, 60px tall. It is hidden during a quiz so the Submit bar and feedback sheet own the bottom of the screen.
- **No nested scroll areas.** Only the page scrolls; diagrams can scroll sideways.

## Boss canvas
- Nodes are soft pastel pills coloured by role, each with a glyph:
  - Edge (client, DNS, CDN): sky.
  - Traffic (load balancer, gateway): lilac.
  - Compute (service, worker): green.
  - Cache: teal.
  - Data (SQL, NoSQL, blob, search): peach.
  - Queue: pink.
- A light dotted grid, thick grey edges, and the same glyphs in the palette.

## Motion
See **Motion system** at the end of this file for the presets, rules, reduced-motion policy and the full catalogue.

## Region motifs
Each region still has a line-drawn landmark (`RegionMotif.tsx`) for compact uses: 24px grid, 1.6 stroke, round caps, stroked in the region colour.

## Question checklist
- Every topic has 5–8 questions, with at least 3 types where they fit.
- Each question has a `concept` that a card teaches (`teaches`), either in the topic itself or in its prerequisites.
- Distractors must be misconceptions a learner might actually hold. Not allowed: joke options, "none of the above", irrelevant tech, or answers that repeat the correct one.
- `npm run audit` enforces these rules (`scripts/audit/quiz-quality.mjs`).

## Motion system

Motion is there to give feedback and a bit of joy, never to make anyone wait. We use the `motion` package (`motion/react`) for springs, enter/exit and in-view effects, and plain CSS keyframes for small loops (Byte, flame, sparkles).

**Spring presets** (`src/lib/motion/index.ts`, always import from there):

| Preset | Stiffness / damping | Use for |
| --- | --- | --- |
| `pop` | 520 / 22, mass 0.8 | Things appearing: map nodes, check marks, popovers, badges, combo burst, level-up |
| `snappy` | 700 / 30 | Presses and bumps: node squash, HUD chip bumps |
| `gentle` | 260 / 30 | Page, question and lesson-card transitions |
| `sheet` | 420 / 30 | Big panels sliding in |
| `bar` | 160 / 14 | Progress and score fills (slight overshoot) |

**Rules**
- Animate `transform` and `opacity` only. Bars fill by translating a full-width fill inside an `overflow: hidden` track, not by animating `width`. The one exception is the flowing dashes on diagram and canvas edges (`stroke-dashoffset` on a few thin SVG lines).
- Never animate a clickable element forever. Idle loops go on a wrapper or decoration (the Start bubble, the pulse ring), so the target stays still for pointers and tests.
- Transitions run on enter only: no exit animation delays a route or a question change. Decorative overlays (combo burst, gems, level-up) are `pointer-events: none` and `aria-hidden` or a polite live region, and they never take focus.
- A transformed ancestor breaks `position: fixed`. Route and question wrappers settle to `transform: none`, so the fixed quiz bar and sheet keep working.

**Reduced motion.** `useCalm()` is true when the OS asks for reduced motion or the in-app setting is on. When it's true, `Layout` sets `<MotionConfig reducedMotion="always">`, components skip their `initial` state, and CSS (`@media (prefers-reduced-motion)` and `html.reduce-motion`) switches off loops, the pulse ring, shine, heart crack and confetti. Feedback that carries meaning (colours, icons, text) stays.

**Tests.** `playwright.config.ts` sets `reducedMotion: 'reduce'`, so e2e runs with no animation and no extra waits. The demo recording (`anim-demo.mp4`) uses `no-preference` to show the full motion.

**Catalogue.**
- Map: nodes pop in with a stagger, the trail draws itself, the current node has a pulse ring and a bobbing Start bubble, completed checks pop, a tapped node squashes, the popover springs open, and the banners idle (flame, train, sparkles).
- Byte: blinks and floats, jumps when happy, droops when sad, waves in onboarding.
- Quiz: tiles lift and press, the bar springs with a shine sweep, a lost heart cracks and drops, the wrong tile shakes and the right one glows, the sheet springs up, questions slide in, and a combo burst fires at 3 or more in a row.
- Celebration: XP counts up, gems fly into the HUD XP chip, the flame flickers, the badge flips with a shine, and there's a level-up moment.
- Lessons: cards swipe and flip, flow steps stagger in with a travelling packet, and diagram edges flow.
- Boss: nodes pop in, edges show direction with flowing dashes, and the score bars fill in sequence.
- Routes fade and slide in; HUD chips bump when their values change.
