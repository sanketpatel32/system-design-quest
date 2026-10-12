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
- **Springy, and used only where it carries meaning:**
  - Pop-in for results and popovers.
  - Bob for the Start bubble and the loading Byte.
  - Wiggle for sad Byte.
  - The sheet slides up.
  - Progress bars fill with a spring.
  - Buttons press down.
- **Reduced motion.** `prefers-reduced-motion` and the in-app "Reduce motion" switch both cut animations to ~0ms, and confetti is skipped.

## Region motifs
Each region still has a line-drawn landmark (`RegionMotif.tsx`) for compact uses: 24px grid, 1.6 stroke, round caps, stroked in the region colour.

## Question checklist
- Every topic has 5–8 questions, with at least 3 types where they fit.
- Each question has a `concept` that a card teaches (`teaches`), either in the topic itself or in its prerequisites.
- Distractors must be misconceptions a learner might actually hold. Not allowed: joke options, "none of the above", irrelevant tech, or answers that repeat the correct one.
- `npm run audit` enforces these rules (`scripts/audit/quiz-quality.mjs`).
