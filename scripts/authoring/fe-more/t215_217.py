T = []

def mc(id, concept, prompt, choices, correct, expl, alt=None):
    q = {"id": id, "concept": concept, "type": "multiple_choice", "prompt": prompt,
         "choices": [{"id": k, "label": v} for k, v in choices], "correctChoiceIds": [correct], "explanation": expl}
    if alt: q["alternativeChoiceIds"] = alt
    return q

def order(id, concept, prompt, items, correct, expl, alts=None):
    q = {"id": id, "concept": concept, "type": "drag_order", "prompt": prompt,
         "items": [{"id": k, "label": v} for k, v in items], "correctOrder": correct, "explanation": expl}
    if alts: q["alternativeOrders"] = alts
    return q

def est(id, concept, prompt, unit, target, assumptions, formula, worked, expl, tol, traps=None):
    q = {"id": id, "concept": concept, "type": "estimation", "prompt": prompt, "unit": unit, "target": target,
         "assumptions": assumptions, "formula": formula, "workedAnswer": worked, "explanation": expl, "tolerance": tol}
    if traps: q["trapAnswers"] = traps
    return q

# ---------------------------------------------------------------- 215 DOM events
T.append({
 "id": 215, "slug": "dom-events-propagation", "region": "f1-frontend", "order": 15,
 "title": "DOM Events: Capture, Bubbling and Delegation", "kind": "lesson",
 "objectives": ["Trace an event through its capture, target and bubble phases",
                "Use one delegated listener instead of one per element",
                "Tell stopping propagation apart from cancelling the default action"],
 "difficulty": 2, "durationMinutes": 11, "prereqIds": [203],
 "cards": [
  {"id": "t215-c1", "kind": "text", "title": "An event travels down the tree, then back up",
   "body": "When you click a button inside a list inside the page, the browser builds a path from the window down to the button. The event first visits each ancestor going down (capture), then the button itself (target), then each ancestor again going up (bubble). A listener on any element on that path can react.",
   "teaches": ["phases"]},
  {"id": "t215-c2", "kind": "text", "title": "Worked example: one listener for a 1,000-row table",
   "body": "A table has 1,000 rows, each with Edit, Delete and Share buttons. One listener per button means 3,000 registrations, plus 3 more for every row added later. One listener on the table can read the event's target, find the nearest button and its row, and act. That is 1 registration, and new rows work with no extra code.",
   "teaches": ["delegation"]},
  {"id": "t215-c3", "kind": "diagram", "title": "The three phases of one click",
   "body": "The path is fixed when dispatch starts, so moving nodes mid-event does not change it.",
   "teaches": ["phases"],
   "steps": ["Capture: window, document, html, body, table, row (top down)",
             "Target: the clicked button runs its own listeners",
             "Bubble: row, table, body, html, document, window (bottom up)",
             "Default action: if nothing cancelled it, the browser does its normal behaviour, such as following a link"]},
  {"id": "t215-c4", "kind": "text", "title": "Stop the journey or stop the default: two separate switches",
   "body": "Stopping propagation ends the trip through ancestors, but the browser still follows the link or submits the form. Cancelling the default (preventDefault) stops the link or submission, but ancestors still hear the event. They are independent; code that needs both must ask for both.",
   "teaches": ["default-vs-propagation"]},
  {"id": "t215-c5", "kind": "text", "title": "Trap: assuming every event bubbles",
   "body": "focus, blur, mouseenter, mouseleave and a resource's load do not bubble, so a delegated listener on a parent never hears them in the bubble phase. Use the bubbling variants focusin and focusout, listen in the capture phase, or attach the listener directly to the element.",
   "teaches": ["non-bubbling"]}
 ],
 "questions": [
  mc("t215-a1", "phases", "A listener registered for the capture phase sits on a table, and the user clicks a button inside one of its rows. When does that listener run?",
     [("a", "Before the button's own listeners, on the way down"), ("b", "After the button's listeners, on the way back up"),
      ("c", "Only if the button's listener lets the event bubble"), ("d", "After the browser has run the click's default action")],
     "a", "Capture listeners run top down before the target phase; bubbling has not started yet, so stopping propagation at the button cannot prevent them."),
  mc("t215-a2", "delegation", "A chat list adds new message rows as they arrive, and each row has a Reply button. Which approach keeps working for rows added later with no extra code?",
     [("a", "Register a click listener on each Reply button once the page has loaded"), ("b", "One listener on the list that finds the closest Reply button to the event target"),
      ("c", "A capture-phase listener on each row, registered when the row is created"), ("d", "Re-register listeners on each button after the whole list re-renders")],
     "b", "The delegated listener lives on an element that already exists, so rows created later are covered by the bubble from their buttons."),
  mc("t215-a3", "default-vs-propagation", "A link's click listener calls stopPropagation but not preventDefault. What happens?",
     [("a", "Neither the parent listeners nor the navigation happen"), ("b", "Parent listeners run, but the browser does not navigate"),
      ("c", "Parent listeners do not run, but the browser still navigates"), ("d", "The browser asks the parent listeners whether to navigate")],
     "c", "Propagation and the default action are separate: stopping one does not stop the other."),
  mc("t215-a4", "non-bubbling", "A form-wide listener on the form element wants to highlight whichever input gains focus. Which event should it listen for in the bubble phase?",
     [("a", "focus"), ("b", "focusin"), ("c", "change"), ("d", "mouseenter")],
     "b", "focus does not bubble, so a parent only hears it in the capture phase; focusin is the bubbling version. change fires on commit, not on focus."),
  order("t215-a5", "phases", "Order the listeners that run when a button inside a card is clicked. The card has a capture listener and a bubble listener; the button has one listener.",
     [("s3", "The card's bubble listener"), ("s1", "The card's capture listener"), ("s2", "The button's own listener")],
     ["s1", "s2", "s3"], "Capture goes down to the target, the target runs, then the event bubbles back up through the card."),
  est("t215-a6", "delegation", "A product grid shows 120 cards, each with 3 clickable controls. Per-element listeners need how many registrations, compared with 1 for delegation?",
      "registrations", 360, ["120 cards", "3 controls per card", "one listener per control"], "120 × 3", "120 × 3 = 360",
      "Sanity check: the count grows with every card loaded by infinite scroll, while the delegated listener stays at 1; delegation also removes the need to unregister listeners when cards are removed.",
      0, [120, 3])
 ],
 "flashcards": [
  {"id": "t215-f1", "front": "Three phases of an event?", "back": "Capture (top down), target, bubble (bottom up)."},
  {"id": "t215-f2", "front": "Event delegation?", "back": "One listener on an ancestor; inspect the target to find which child was used."},
  {"id": "t215-f3", "front": "stopPropagation vs preventDefault?", "back": "One stops the trip through ancestors; the other cancels the browser's default action."},
  {"id": "t215-f4", "front": "Bubbling replacements for focus and blur?", "back": "focusin and focusout."}
 ],
 "sources": [
  {"title": "MDN: Event bubbling", "url": "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling"},
  {"title": "WHATWG DOM Standard: Dispatching events", "url": "https://dom.spec.whatwg.org/#dispatching-events"},
  {"title": "MDN: Event listener options (capture, once, passive)", "url": "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener"}
 ],
 "deep": {
  "teaches": ["phases", "delegation", "default-vs-propagation", "non-bubbling", "passive"],
  "mechanism": {"title": "How the browser dispatches one event", "steps": [
    "Something happens: a click, a key press, a network response. The browser creates an event object with a type, a target (the deepest element involved) and flags saying whether it bubbles and whether it can be cancelled.",
    "Before any listener runs, the browser computes the propagation path: the target, then each parent up to the document and the window. The DOM Standard fixes this path at the start of dispatch, so removing an element from the tree during a listener does not change which ancestors the event visits.",
    "Capture phase: listeners registered for capture run on each ancestor from the window downwards. This is how a container can see an event before its children do, for example to close a menu on any outside click.",
    "Target phase: listeners on the target element run. Then, if the event type bubbles, the bubble phase runs listeners on each ancestor from the parent upwards. Most user-input events bubble; focus, blur, mouseenter, mouseleave and load on an element do not.",
    "At any point a listener can stop propagation, which ends the trip after the current element (or immediately, for the immediate variant, which also skips other listeners on the same element). Separately, a listener can cancel the default action if the event is cancelable.",
    "After dispatch, if no listener cancelled it, the browser performs the default action: following a link, submitting a form, inserting a typed character, scrolling. For touch and wheel events the browser cannot start scrolling until it knows whether some listener will cancel; a listener marked passive promises not to, so scrolling can start straight away."
  ]},
  "useWhen": ["Use delegation for lists, tables and grids whose children are added and removed often.",
              "Use a capture listener when a container must see an event before any child can stop it, such as outside-click detection or focus tracking."],
  "avoidWhen": ["Avoid delegation for high-frequency events such as pointer moves over a large tree when only one small element cares; a listener on that element does less work per event.",
                "Avoid stopping propagation to fix a local bug: it silently breaks analytics, outside-click handlers and delegated listeners higher up."],
  "tradeoffs": {"columns": ["Approach", "Registrations", "Works for children added later", "Main cost"], "rows": [
    ["One listener per element", "One per element", "No: each new element needs its own", "Memory and setup time grow with the list; must unregister on removal"],
    ["Delegated listener on an ancestor", "One", "Yes", "Each event must work out which child was used; fails for events that do not bubble"],
    ["Capture listener on an ancestor", "One", "Yes", "Runs before the target, so it can surprise code that expects to go first"]
  ]},
  "numbers": {"title": "Counting listeners on an infinite-scroll feed (illustrative)", "assumptions": [
    "A feed loads 20 posts per page and the user scrolls through 50 pages",
    "Each post has 4 controls: like, comment, share and a menu"],
   "steps": ["Posts loaded: 20 × 50 = 1,000.",
             "Per-element listeners: 1,000 × 4 = 4,000 registrations, each one also an object the browser must keep.",
             "If old posts are removed without unregistering their listeners and something still references them, those closures stay reachable.",
             "Delegation: 1 listener on the feed container, whatever the number of posts."],
   "result": "Delegation turns a cost that grows with content into a constant, and removes a whole class of forgotten-cleanup bugs."},
  "india": {"title": "Edge case: passive listeners and scroll start", "label": "Official documentation",
   "body": "MDN's documentation of listener options explains that when a wheel or touch listener might cancel scrolling, the browser generally cannot start scrolling until that listener finishes, so a slow listener delays the scroll. Marking the listener passive promises it will not cancel, and the browser can scroll at once. To get this benefit in old code, the DOM specification makes passive the default for wheel, mousewheel, touchstart and touchmove listeners on the window, the document, the root element and the body, so cancelling scrolling there needs passive set to false explicitly."},
  "pitfalls": [
   {"trap": "“I'll attach a click listener to each row as I render it.”", "say": "“I'd put one delegated listener on the table and find the row from the event target, so added rows work and nothing needs unregistering.”"},
   {"trap": "“stopPropagation will stop the link from navigating.”", "say": "“That only stops ancestors hearing it; I'd cancel the default action to stop navigation.”"},
   {"trap": "“A delegated focus listener on the form will catch every field.”", "say": "“focus doesn't bubble; I'd use focusin or a capture-phase listener.”"}
  ],
  "takeaways": ["Events go down (capture), hit the target, then come back up (bubble).",
                "One delegated listener on an ancestor handles any number of children, including future ones.",
                "Stopping propagation and cancelling the default action are separate switches.",
                "Check whether an event bubbles before delegating it; mark scroll-related listeners passive."]
 },
 "interactive": {"kind": "predict", "title": "Who hears this click?",
  "prompt": "A modal has a backdrop with a click listener that closes the modal. Inside it, a Save button's listener stops propagation. The user clicks Save. Predict what happens.",
  "choices": [
   {"id": "a", "label": "Save runs and the modal stays open", "feedback": "Right: the event never bubbles from the button up to the backdrop's listener."},
   {"id": "b", "label": "Save runs, then the modal closes", "feedback": "That would happen without stopPropagation, because the click bubbles to the backdrop."},
   {"id": "c", "label": "The modal closes before Save runs", "feedback": "Only a capture-phase listener on the backdrop would run before the button."}],
  "correctId": "a",
  "reveal": "Stopping propagation at the button ends the bubble phase there, so the backdrop's bubble listener never runs. A cleaner fix is to have the backdrop check whether the target is the backdrop itself, which keeps the event visible to analytics and other ancestors."},
 "seeAlso": [{"topicId": 203, "why": "Listeners run as tasks on the event loop, so slow handlers delay rendering"}]
})

# ---------------------------------------------------------------- 216 Layout
T.append({
 "id": 216, "slug": "css-layout-flow-flex-grid", "region": "f1-frontend", "order": 16,
 "title": "Layout Systems: Normal Flow, Flexbox and Grid", "kind": "lesson",
 "objectives": ["Explain how normal flow places block and inline boxes",
                "Choose between flexbox (one dimension) and grid (two dimensions)",
                "Calculate how fr units share the free space"],
 "difficulty": 2, "durationMinutes": 12, "prereqIds": [201],
 "cards": [
  {"id": "t216-c1", "kind": "text", "title": "Normal flow comes first",
   "body": "Before any layout system is chosen, boxes follow normal flow. Block boxes stack vertically and take the full available width; inline boxes sit side by side on a line and wrap. Flexbox and grid are opted into on a container, and only that container's direct children become flex or grid items.",
   "teaches": ["normal-flow"]},
  {"id": "t216-c2", "kind": "text", "title": "Misconception: grid replaces flexbox",
   "body": "Flexbox lays items out along one axis at a time and lets content size drive the result, which suits toolbars, tag lists and centring. Grid defines rows and columns together, so items line up in both directions, which suits page layouts and card galleries. Real pages mix both: a grid of cards, each card using flexbox inside.",
   "teaches": ["flex-vs-grid"]},
  {"id": "t216-c3", "kind": "diagram", "title": "How a grid shares 1,000 px across 200px 1fr 2fr",
   "body": "fr units divide only the space left after fixed tracks and gaps.",
   "teaches": ["fr-units"],
   "steps": ["Container: 1,000 px wide, columns 200px 1fr 2fr, gap 20 px",
             "Fixed: 200 px track + 2 gaps × 20 px = 240 px",
             "Free space: 1,000 − 240 = 760 px, shared over 3 fr",
             "1fr ≈ 253.3 px and 2fr ≈ 506.7 px"]},
  {"id": "t216-c4", "kind": "text", "title": "Content can still win against fr",
   "body": "A plain 1fr track has a minimum of auto, so a long unbreakable word or a wide image can force its column wider than its share. Writing minmax(0, 1fr) lets the track shrink below its content, and the content then needs wrapping or overflow handling. The same idea applies to flex items, whose default minimum width is their content size.",
   "teaches": ["min-content"]},
  {"id": "t216-c5", "kind": "text", "title": "Trap: four 25% columns plus gaps",
   "body": "Percentages are taken from the container's width, and gaps are added on top. Four 25% columns with three 16 px gaps need 100% + 48 px, so the grid overflows its container. fr units, or flex-grow, share the space after gaps instead.",
   "teaches": ["fr-units"]}
 ],
 "questions": [
  mc("t216-a1", "flex-vs-grid", "A page gallery must line cards up in both rows and columns as the window resizes. Which layout system is the natural fit?",
     [("a", "Flexbox with wrapping, sizing each card by its content"), ("b", "Grid, defining columns that every row shares"),
      ("c", "Normal flow, with every card set to an inline box"), ("d", "Absolute positioning, computing each card's offset")],
     "b", "Grid aligns items in two dimensions at once; wrapped flex lines are sized independently, so columns do not line up from row to row."),
  mc("t216-a2", "fr-units", "A grid container is 900 px wide with columns 1fr 2fr and a 30 px gap. How wide is the 2fr column?",
     [("a", "600 px"), ("b", "580 px"), ("c", "570 px"), ("d", "435 px")],
     "b", "Free space is 900 − 30 = 870 px over 3 fr, so 1fr is 290 px and 2fr is 580 px; 600 px forgets to subtract the gap."),
  mc("t216-a3", "min-content", "In a 1fr 1fr grid, one column holds a very long URL with no break points and grows wider than the other. What is the usual fix?",
     [("a", "Change both tracks to 50% widths"), ("b", "Use minmax(0, 1fr) and let the text wrap or scroll"),
      ("c", "Turn the grid into a wrapping flex row"), ("d", "Add a larger gap between the two tracks")],
     "b", "A plain 1fr has an automatic minimum equal to its content; minmax(0, 1fr) removes that floor so the tracks stay equal."),
  mc("t216-a4", "normal-flow", "Without any layout system set, how are two paragraphs placed inside a section?",
     [("a", "Side by side, wrapping onto a new line when full"), ("b", "Stacked vertically, each as wide as the section"),
      ("c", "Overlapping at the section's top-left corner"), ("d", "In equal columns sized to the widest paragraph")],
     "b", "Paragraphs are block boxes, so normal flow stacks them and stretches them to the available width; inline boxes are the ones that sit on a line."),
  order("t216-a5", "fr-units", "Order the steps a grid uses to size 200px 1fr 2fr columns in a fixed-width container.",
     [("s3", "Divide the remaining space by the total number of fr"), ("s1", "Start from the container's width"),
      ("s2", "Subtract the fixed track and the gaps"), ("s4", "Give each fr track its multiple of one fr")],
     ["s1", "s2", "s3", "s4"], "fr units only see the space that fixed tracks and gaps leave behind."),
  est("t216-a6", "fr-units", "A grid is 960 px wide with columns 1fr 1fr 2fr and two 16 px gaps. How wide is the 2fr column, in pixels?",
      "px", 464, ["960 px container", "columns 1fr 1fr 2fr", "two gaps of 16 px"], "(960 − 2 × 16) ÷ 4 × 2",
      "(960 − 32) ÷ 4 = 232 px per fr, so 2fr = 464 px",
      "Sanity check: 232 + 232 + 464 + 32 = 960, so the tracks and gaps fill the container to the pixel; forgetting the gaps gives 480 px and an overflow.",
      0.01, [480])
 ],
 "flashcards": [
  {"id": "t216-f1", "front": "Flexbox vs grid in one line?", "back": "Flexbox: one axis, content-driven. Grid: rows and columns together."},
  {"id": "t216-f2", "front": "What does 1fr share?", "back": "The space left after fixed tracks and gaps."},
  {"id": "t216-f3", "front": "Why can a 1fr column grow past its share?", "back": "Its minimum is auto (content size); use minmax(0, 1fr)."}
 ],
 "sources": [
  {"title": "MDN: Basic concepts of flexbox", "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Basic_concepts"},
  {"title": "MDN: Basic concepts of grid layout", "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts"},
  {"title": "W3C: CSS Grid Layout Module Level 1", "url": "https://www.w3.org/TR/css-grid-1/"}
 ],
 "deep": {
  "teaches": ["normal-flow", "flex-vs-grid", "fr-units", "min-content"],
  "mechanism": {"title": "How the browser resolves a layout", "steps": [
    "Layout starts at the root and works down. Each box asks its parent for an available width, works out its own width, lays out its children, and reports its height back up. That is why changing one element's size can move everything after it.",
    "In normal flow, block boxes stack in the block direction (top to bottom in English) and fill the inline size of their container; inline content is broken into line boxes that wrap. Vertical margins between adjacent blocks can collapse into the larger of the two, a frequent source of surprise spacing.",
    "A flex container lays its children along a main axis. Each item starts from its flex-basis (often its content size); if the line has spare space it is shared in proportion to flex-grow, and if it is short the deficit is taken in proportion to flex-shrink weighted by basis. With wrapping on, each line is sized independently, so items on different lines do not line up in columns.",
    "A grid container first defines tracks. Fixed tracks (pixels, percentages) and gaps are taken out of the container's size; then fr tracks share what is left in proportion to their fr values, subject to each track's minimum. Items are then placed into cells by line numbers, names or auto-placement.",
    "Track minimums matter. A plain 1fr behaves like minmax(auto, 1fr): it will not shrink below its content's minimum size. That protects content from being cut off but breaks equal columns when one cell holds wide content. minmax(0, 1fr) removes the floor.",
    "Patterns such as repeat(auto-fill, minmax(200px, 1fr)) let the grid decide how many columns fit, giving a responsive gallery without media queries; flexbox with flex-wrap gives a similar effect when columns need not align."
  ]},
  "useWhen": ["Use grid when items must align in both rows and columns, such as a page shell or a card gallery.",
              "Use flexbox for a row or column of items whose sizes come from their content, such as a toolbar, a button group or centring one item."],
  "avoidWhen": ["Avoid percentage columns plus gaps when the total must fit; use fr or flex-grow so gaps come out first.",
                "Avoid absolute positioning for whole layouts; positioned boxes leave normal flow, so siblings no longer make room and text resizing overlaps them."],
  "tradeoffs": {"columns": ["System", "Dimensions", "Sizing driven by", "Good for"], "rows": [
    ["Normal flow", "Block stack plus inline lines", "Container width and content", "Articles, forms and most text"],
    ["Flexbox", "One axis per container", "Content first, then grow and shrink", "Toolbars, nav bars, centring, tag lists"],
    ["Grid", "Rows and columns together", "Container first, tracks defined up front", "Page layouts, galleries, dashboards"]
  ]},
  "numbers": {"title": "Where 1,000 px goes in a 200px 1fr 2fr grid", "assumptions": [
    "Container 1,000 px wide", "Columns: 200px 1fr 2fr", "Column gap 20 px (two gaps)", "No content wider than its track"],
   "steps": ["Fixed space: the 200 px track plus two 20 px gaps, 240 px in all.", "Free space for fr tracks: 1,000 − 240 = 760 px.",
             "Total fr = 1 + 2 = 3, so 1fr = 760 ÷ 3 ≈ 253.3 px.", "Columns: 200 px, ≈ 253.3 px and ≈ 506.7 px; plus 40 px of gaps = 1,000 px.",
             "At 600 px wide, free space is 360 px and 1fr = 120 px; below that a single-column layout usually reads better."],
   "result": "fr tracks get only what fixed tracks and gaps leave, so narrowing the container shrinks the fr columns faster than the fixed one."},
  "india": {"title": "Edge case: the minimum size of an fr track", "label": "Official documentation",
   "body": "The CSS Grid specification defines a flexible track sized with fr as having an automatic minimum unless the author sets one, which is why MDN's grid guides recommend minmax(0, 1fr) when columns must stay equal. In practice a single long product code, URL or untranslated word in one cell can make a two-column layout lopsided on narrow screens. Testing layouts with long, unbreakable strings and large text sizes catches this before users do."},
  "pitfalls": [
   {"trap": "“Use four 25% columns with a 16 px gap.”", "say": "“Percentages plus gaps overflow; I'd use repeat(4, 1fr) so the gaps are taken out first.”"},
   {"trap": "“Flexbox with wrap gives me a grid.”", "say": "“Each wrapped flex line sizes independently, so columns won't line up; I'd use grid when alignment across rows matters.”"}
  ],
  "takeaways": ["Normal flow stacks blocks and wraps inline content; layout systems are opted into per container.",
                "Flexbox is one-dimensional and content-driven; grid is two-dimensional and container-driven.",
                "fr shares the space left after fixed tracks and gaps.",
                "A 1fr track will not shrink below its content unless you write minmax(0, 1fr)."]
 },
 "interactive": {"kind": "slider", "title": "Shrink the container",
  "prompt": "A grid uses columns 200px 1fr 2fr with two 20 px gaps. Slide the container width and watch how wide one fr becomes.",
  "model": "fr-tracks", "params": {"fixedPx": 200, "gapPx": 20, "gaps": 2, "frTotal": 3},
  "control": {"label": "Container width", "min": 400, "max": 1600, "step": 40, "initial": 1000, "unit": "px"},
  "takeaway": "At 1,000 px one fr is about 253.3 px. The 240 px of fixed track and gaps never shrinks, so at 560 px one fr is only about 106.7 px. That is the point to switch to a single column with a media query or an auto-fill grid."},
 "seeAlso": [{"topicId": 201, "why": "Layout is the stage of the rendering pipeline these rules feed into"}]
})

# ---------------------------------------------------------------- 217 Responsive
T.append({
 "id": 217, "slug": "responsive-design-viewport", "region": "f1-frontend", "order": 17,
 "title": "Responsive Design: Viewports, Breakpoints and Images", "kind": "lesson",
 "objectives": ["Explain CSS pixels, device pixels and the device pixel ratio",
                "Use the viewport meta tag, media queries and container queries",
                "Choose image sizes with srcset and sizes"],
 "difficulty": 2, "durationMinutes": 12, "prereqIds": [216],
 "cards": [
  {"id": "t217-c1", "kind": "text", "title": "CSS pixels are not screen pixels",
   "body": "Layout works in CSS pixels. A phone with a device pixel ratio (DPR) of 3 draws each CSS pixel with a 3 × 3 block of physical pixels. Without the viewport meta tag (width=device-width, initial-scale=1), mobile browsers lay the page out on a wide virtual viewport, often around 980 CSS px, and shrink it, so text becomes tiny.",
   "teaches": ["pixels"]},
  {"id": "t217-c2", "kind": "text", "title": "Worked example: the right image for a 360 px slot",
   "body": "An image shows 360 CSS px wide on a DPR 3 phone, so it needs 360 × 3 = 1,080 device pixels across to look sharp. Sending a 2,160 px wide image doubles the width and quadruples the pixel count to download and decode. Sending 360 px looks blurry. srcset and sizes let the browser pick the closest file.",
   "teaches": ["responsive-images"]},
  {"id": "t217-c3", "kind": "diagram", "title": "How the browser picks from srcset",
   "body": "The page lists files; the browser chooses, and may factor in network or data-saving preferences.",
   "teaches": ["responsive-images"],
   "steps": ["srcset lists files with their real widths: 480w, 960w, 1440w",
             "sizes says how wide the slot will be, for example 100vw on phones and 33vw on desktops",
             "The browser multiplies the slot width by the DPR to get the pixels needed",
             "It downloads one candidate close to that, before layout has finished"]},
  {"id": "t217-c4", "kind": "text", "title": "Media queries ask about the page; container queries ask about the slot",
   "body": "A media query changes styles based on the viewport, such as min-width: 48rem. A component reused in a sidebar and in a main column sees very different widths on the same screen, so a container query, which tests the size of the component's container, lets the card change layout where it actually sits.",
   "teaches": ["queries"]},
  {"id": "t217-c5", "kind": "text", "title": "Trap: 100vh on mobile",
   "body": "On many mobile browsers 100vh is the height with the address bar hidden, so a full-height hero with the bar showing pushes its button below the fold. The newer units svh (small), lvh (large) and dvh (dynamic) name which viewport you mean.",
   "teaches": ["viewport-units"]}
 ],
 "questions": [
  mc("t217-a1", "pixels", "A site has no viewport meta tag. On a phone, text looks tiny and the user must zoom. Why?",
     [("a", "The phone's DPR makes each CSS pixel physically smaller"), ("b", "The browser lays out on a wide virtual viewport and scales it down"),
      ("c", "The browser disables media queries when the tag is missing"), ("d", "The font files fail to load at small screen sizes")],
     "b", "Without width=device-width, mobile browsers assume a desktop-width layout viewport; DPR alone does not shrink CSS pixel sizes."),
  mc("t217-a2", "responsive-images", "An image fills a 400 CSS px slot on a DPR 2 laptop. Which candidate width is the best match?",
     [("a", "400w"), ("b", "800w"), ("c", "1,600w"), ("d", "200w")],
     "b", "400 CSS px × DPR 2 = 800 device pixels; 400w looks soft and 1,600w is four times the pixels needed."),
  mc("t217-a3", "queries", "A product card appears in a narrow sidebar and in a wide main column on the same desktop page. Which tool lets the card change layout in each place?",
     [("a", "A media query on the viewport width"), ("b", "A container query on the card's container"),
      ("c", "A device pixel ratio media feature"), ("d", "A larger srcset with more candidates")],
     "b", "The viewport is the same for both cards; only the container differs, so a container query is the right test."),
  mc("t217-a4", "viewport-units", "A hero set to 100vh hides its call-to-action under the mobile address bar. Which unit fits the space visible while the bar is shown?",
     [("a", "100lvh"), ("b", "100svh"), ("c", "100vw"), ("d", "100%")],
     "b", "svh is the small viewport, measured with browser toolbars expanded; lvh is the large one, which matches the old 100vh behaviour on many browsers."),
  order("t217-a5", "responsive-images", "Order the steps for choosing an image from srcset and sizes.",
     [("s2", "Read the slot width from sizes for the current viewport"), ("s4", "Request the candidate closest to the pixels needed"),
      ("s1", "Read the candidate files and widths listed in srcset"), ("s3", "Multiply the slot width by the device pixel ratio")],
     ["s1", "s2", "s3", "s4"], "The browser needs the candidates and the slot width before it can work out the pixels and pick a file.",
     [["s2", "s1", "s3", "s4"], ["s2", "s3", "s1", "s4"]]),
  est("t217-a6", "responsive-images", "An image spans the full width of a 390 CSS px phone screen at DPR 3. How many device pixels wide should the ideal file be?",
      "px", 1170, ["slot = 390 CSS px", "DPR 3"], "390 × 3", "390 × 3 = 1,170 px",
      "Sanity check: a 1,170 px wide photo at the same aspect ratio has 9 times the pixels of a 390 px one, which is why serving one huge file to every device wastes so much on small screens.",
      0.02, [390, 780])
 ],
 "flashcards": [
  {"id": "t217-f1", "front": "Device pixel ratio?", "back": "Device pixels per CSS pixel along one axis (2 or 3 on most phones)."},
  {"id": "t217-f2", "front": "Viewport meta tag to use?", "back": "width=device-width, initial-scale=1."},
  {"id": "t217-f3", "front": "svh, lvh, dvh?", "back": "Small, large and dynamic viewport heights (toolbars shown, hidden, current)."},
  {"id": "t217-f4", "front": "Media vs container query?", "back": "Viewport size vs the size of the element's container."}
 ],
 "sources": [
  {"title": "MDN: <meta name=\"viewport\">", "url": "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport"},
  {"title": "MDN: Responsive images", "url": "https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images"},
  {"title": "web.dev: Serve responsive images", "url": "https://web.dev/articles/serve-responsive-images"},
  {"title": "W3C: CSS Values and Units Module Level 4", "url": "https://www.w3.org/TR/css-values-4/"}
 ],
 "deep": {
  "teaches": ["pixels", "responsive-images", "queries", "viewport-units"],
  "mechanism": {"title": "How a page adapts to the screen", "steps": [
    "The layout viewport is the rectangle the page is laid out in. On desktop it is the window. On mobile, without a viewport meta tag, browsers pick a wide default so desktop sites do not break, then scale it down to fit. width=device-width makes the layout viewport as wide as the device in CSS pixels.",
    "CSS pixels are a unit of layout, not hardware. The device pixel ratio says how many physical pixels draw one CSS pixel along each axis. Text and vector graphics are drawn crisply at any DPR; bitmap images need more pixels to stay sharp, which is why image choice depends on DPR.",
    "Media queries apply styles when conditions on the viewport or device are true: width ranges, orientation, prefers-color-scheme, prefers-reduced-motion, hover capability. Breakpoints in rem units scale with the user's font size, so a user with larger text gets the narrower layout sooner.",
    "Container queries apply styles based on the size of a declared container. This lets a component adapt to the space it actually has, which matters in design systems where the same card sits in sidebars, modals and full-width sections.",
    "For images, srcset lists candidate files with their intrinsic widths and sizes tells the browser the slot width under each condition. The browser computes slot width × DPR and picks a candidate, possibly a smaller one on a constrained connection. The picture element with source media conditions is for art direction, such as a tighter crop on phones, and for offering newer formats with a fallback.",
    "Viewport-percentage units (vw, vh) were defined before mobile toolbars appeared and disappeared during scroll. CSS Values Level 4 adds small, large and dynamic variants (svh, lvh, dvh and their width and inline equivalents). dvh tracks the current size but changes during scroll, which can cause layout jumps, so svh is often the safer choice for a hero."
  ]},
  "useWhen": ["Use srcset with sizes for any content image whose display width varies with the screen.",
              "Use container queries for reusable components that appear in slots of different widths."],
  "avoidWhen": ["Avoid device-specific breakpoints such as one exact phone width; choose breakpoints where the content starts to look wrong.",
                "Avoid dvh for large layout blocks that should not move while the user scrolls; svh or lvh is stable."],
  "tradeoffs": {"columns": ["Technique", "Decides based on", "Strength", "Limitation"], "rows": [
    ["Fluid layout (fr, %, flex)", "Available space", "Works at every width without breakpoints", "Cannot reorganise content on its own"],
    ["Media query", "Viewport and device features", "Page-level changes, user preferences", "Blind to where a component sits"],
    ["Container query", "Size of a container", "Component-level adaptation", "Needs a declared container"],
    ["srcset and sizes", "Slot width × DPR, plus browser hints", "Right-sized image downloads", "sizes must match the CSS or the pick is wrong"]
  ]},
  "numbers": {"title": "The cost of one oversized hero image (illustrative)", "assumptions": [
    "Hero slot: 390 × 260 CSS px on a DPR 3 phone", "The site sends one 3,000 × 2,000 px image to everyone",
    "Decoded images use 4 bytes per pixel (RGBA)"],
   "steps": ["Pixels needed: 1,170 × 780 = 912,600.",
             "Pixels sent: 3,000 × 2,000 = 6,000,000, about 6.6 times more.",
             "Decoded memory at 4 bytes per pixel: 24 MB for the 6,000,000 pixels sent, against about 3.7 MB for the 912,600 needed.",
             "The download grows too, though compressed size does not scale exactly with pixel count."],
   "result": "Right-sizing with srcset cuts decode memory by roughly 6.6 times here and usually most of the download, which helps LCP on phones."},
  "india": {"title": "Why new viewport units were added", "label": "Official documentation",
   "body": "The CSS Values and Units Level 4 specification defines the small, large and dynamic viewport sizes because mobile browsers show and hide toolbars as the user scrolls, so a single viewport height no longer describes what the user can see. MDN's viewport documentation also explains that without a viewport meta tag, mobile browsers render pages on a virtual viewport wider than the screen and then shrink the result. Both behaviours explain common mobile bugs: tiny text and hidden full-height buttons."},
  "pitfalls": [
   {"trap": "“I'll export every image at 4,000 px so it looks sharp everywhere.”", "say": "“I'd generate a few widths and let srcset and sizes pick slot width × DPR.”"},
   {"trap": "“Breakpoints at 375 and 414 px, the iPhone widths.”", "say": "“I'd set breakpoints in rem where the content breaks, and let fluid layout handle widths in between.”"}
  ],
  "takeaways": ["Add width=device-width, initial-scale=1, or mobile pages render on a wide virtual viewport.",
                "Image pixels needed = slot width in CSS px × DPR.",
                "Media queries ask about the viewport; container queries ask about the component's space.",
                "Use svh, lvh or dvh when mobile toolbars matter."]
 },
 "interactive": {"kind": "tradeoff", "title": "One card, two places",
  "prompt": "A product card is used in a 280 px sidebar and in a 900 px main column on the same desktop page. Below 400 px of its own width it should stack its image above the text.",
  "choices": [
   {"id": "a", "label": "A container query on the card's wrapper at 400 px", "feedback": "Right: the card reacts to its own available width wherever it is placed."},
   {"id": "b", "label": "A media query at a viewport width of 400 px", "feedback": "The viewport is 1,280 px or more on desktop, so the sidebar card never stacks."},
   {"id": "c", "label": "A separate sidebar-card component with its own styles", "feedback": "It works, but now two components must be kept in sync."}],
  "correctId": "a",
  "reveal": "When the same component appears in containers of different widths on one screen, only a container query sees the difference. Media queries remain the tool for page-level layout and user preferences such as reduced motion."},
 "seeAlso": [{"topicId": 210, "why": "Oversized hero images are a common cause of slow Largest Contentful Paint"}]
})
