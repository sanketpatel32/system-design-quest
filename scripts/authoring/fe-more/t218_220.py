from t215_217 import mc, order, est
T = []

# ---------------------------------------------------------------- 218 Real-time
T.append({
 "id": 218, "slug": "client-realtime-sse-websocket", "region": "f1-frontend", "order": 18,
 "title": "Real-Time on the Client: Polling, SSE and WebSockets", "kind": "lesson",
 "objectives": ["Compare short polling, long polling, server-sent events and WebSockets",
                "Explain the WebSocket upgrade handshake and SSE reconnection",
                "Design reconnects that do not overload the server"],
 "difficulty": 2, "durationMinutes": 12, "prereqIds": [203],
 "cards": [
  {"id": "t218-c1", "kind": "text", "title": "Four ways to hear about new data",
   "body": "Short polling asks the server on a timer, whether or not anything changed. Long polling asks and the server holds the request open until there is news. Server-sent events (SSE) keep one HTTP response open and stream text events from server to browser. A WebSocket upgrades one connection into a two-way channel for messages in both directions.",
   "teaches": ["options"]},
  {"id": "t218-c2", "kind": "text", "title": "Worked example: the price of polling every 5 seconds",
   "body": "10,000 open dashboards polling every 5 s send 10,000 ÷ 5 = 2,000 requests per second. If the data changes once a minute, roughly 11 of every 12 responses say nothing new. With SSE the same users hold 10,000 open connections, and the server sends a message only when the data changes.",
   "teaches": ["polling-cost"]},
  {"id": "t218-c3", "kind": "diagram", "title": "Opening a WebSocket",
   "body": "It starts as ordinary HTTP, so it passes through the same ports, TLS and many proxies.",
   "teaches": ["handshake"],
   "steps": ["Browser sends an HTTP GET with Upgrade: websocket and a random Sec-WebSocket-Key",
             "Server answers 101 Switching Protocols with a Sec-WebSocket-Accept derived from that key",
             "Both sides now exchange framed messages, text or binary, in either direction",
             "Ping and pong frames check the link; a close frame ends it cleanly"]},
  {"id": "t218-c4", "kind": "text", "title": "SSE reconnects for you, WebSockets do not",
   "body": "The browser's SSE client reconnects on its own after a dropped stream, waiting a delay the server can set with a retry field, and sends the last event id it saw in a Last-Event-ID header so the server can resume. A WebSocket that drops just closes; the page must notice, reconnect and ask for anything it missed.",
   "teaches": ["reconnect"]},
  {"id": "t218-c5", "kind": "text", "title": "Trap: reconnecting in lockstep",
   "body": "When a server restarts, every client loses its connection at the same moment. If each one retries after a fixed 1 s, they all arrive together and can knock the server over again. Use exponential backoff with random jitter so reconnects spread out.",
   "teaches": ["reconnect"]}
 ],
 "questions": [
  mc("t218-a1", "options", "A live score page only needs updates pushed from server to browser, as text, and should resume after a dropped connection. Which fits with the least custom code?",
     [("a", "Server-sent events"), ("b", "A WebSocket with a custom resume protocol"), ("c", "Short polling every second"), ("d", "Long polling with a resume token")],
     "a", "SSE is one-way text over HTTP with reconnection and Last-Event-ID resume built into the browser client; a WebSocket would need all of that written by hand."),
  mc("t218-a2", "handshake", "What status code does a server send to accept a WebSocket upgrade?",
     [("a", "200 OK"), ("b", "101 Switching Protocols"), ("c", "204 No Content"), ("d", "426 Upgrade Required")],
     "b", "RFC 6455 completes the handshake with 101; 426 is what a server sends when it requires the client to upgrade."),
  mc("t218-a3", "options", "A collaborative whiteboard sends many small binary updates from each user and receives everyone else's. Which transport suits it?",
     [("a", "Server-sent events, one stream per user"), ("b", "Short polling every 200 ms for changes"), ("c", "A WebSocket per open board"), ("d", "Long polling with batched uploads")],
     "c", "Frequent messages in both directions, including binary, are what WebSockets are for; SSE is server-to-client text only."),
  mc("t218-a4", "reconnect", "A chat server restarts and 50,000 clients drop at once. Which reconnect policy is safest?",
     [("a", "Retry after a fixed 1 s delay"), ("b", "Retry at once, then each second"), ("c", "Exponential backoff with random jitter"), ("d", "Retry when the user next types")],
     "c", "Jitter spreads the reconnects over time, and backoff slows retries further if the server is still struggling."),
  order("t218-a5", "handshake", "Order the steps of opening and using a WebSocket.",
     [("s3", "Both sides exchange framed messages"), ("s1", "The client sends an HTTP GET with Upgrade: websocket"),
      ("s4", "One side sends a close frame"), ("s2", "The server replies 101 Switching Protocols")],
     ["s1", "s2", "s3", "s4"], "Every WebSocket begins as an HTTP request, and only after the 101 reply do frames flow."),
  est("t218-a6", "polling-cost", "50,000 clients short-poll an endpoint every 10 seconds. How many requests per second does the server receive on average?",
      "requests/s", 5000, ["50,000 clients", "one request every 10 s each"], "50,000 ÷ 10", "50,000 ÷ 10 = 5,000 requests/s",
      "Sanity check: that load stays the same when nothing changes; with SSE or WebSockets the request rate drops to near zero and the cost moves to holding 50,000 idle connections.",
      0.02, [500000, 500])
 ],
 "flashcards": [
  {"id": "t218-f1", "front": "SSE vs WebSocket direction?", "back": "SSE: server to client, text. WebSocket: both ways, text or binary."},
  {"id": "t218-f2", "front": "WebSocket handshake reply?", "back": "101 Switching Protocols with Sec-WebSocket-Accept."},
  {"id": "t218-f3", "front": "How does SSE resume?", "back": "Auto-reconnect, sending Last-Event-ID."},
  {"id": "t218-f4", "front": "Safe reconnect policy?", "back": "Exponential backoff with random jitter."}
 ],
 "sources": [
  {"title": "RFC 6455: The WebSocket Protocol", "url": "https://www.rfc-editor.org/rfc/rfc6455.html"},
  {"title": "WHATWG HTML Standard: Server-sent events", "url": "https://html.spec.whatwg.org/multipage/server-sent-events.html"},
  {"title": "MDN: Using server-sent events", "url": "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events"},
  {"title": "MDN: EventSource", "url": "https://developer.mozilla.org/en-US/docs/Web/API/EventSource"}
 ],
 "deep": {
  "teaches": ["options", "polling-cost", "handshake", "reconnect"],
  "mechanism": {"title": "How each technique keeps the page current", "steps": [
    "Short polling: the page sends a normal request every N seconds. It is simple and works through any proxy, but most responses are empty when data changes rarely, and updates arrive up to N seconds late.",
    "Long polling: the page sends a request and the server keeps it open until there is something to say or a timeout passes, then the page sends the next one. Latency is low, but each message costs a full request and response, and the server must hold one pending request per client.",
    "Server-sent events: the page opens one GET and the server replies with Content-Type text/event-stream, writing events as lines of text (data, event, id and retry fields) and never finishing the response. The browser parses each event as it arrives. If the stream drops, the browser waits the retry delay, reconnects and sends Last-Event-ID so the server can replay anything missed.",
    "WebSockets: the page sends an HTTP/1.1 GET with Upgrade: websocket and a random key; the server proves it understood by replying 101 Switching Protocols with a hash of that key. From then on the TCP connection carries frames, not HTTP: text or binary data frames and control frames (ping, pong, close). Frames from browser to server are masked, which RFC 6455 requires to protect intermediaries that might misread the traffic.",
    "Neither SSE nor WebSockets solves missed messages across a full disconnect on its own. A robust client keeps a cursor (an event id or sequence number), reconnects with backoff and jitter, and asks the server for everything after that cursor, falling back to a full refetch if the gap is too old.",
    "On the server side, long-lived connections change capacity planning: the limit becomes open connections and memory per connection rather than requests per second, and load balancers need idle timeouts longer than the heartbeat interval."
  ]},
  "useWhen": ["Use SSE for one-way feeds such as notifications, live scores, progress updates and token-by-token text output.",
              "Use WebSockets when the client also sends frequent messages, or messages are binary: chat, games, collaborative editing."],
  "avoidWhen": ["Avoid any persistent connection when data changes every few minutes and a short delay is fine; polling with HTTP caching is simpler.",
                "Avoid SSE over HTTP/1.1 with many tabs open to one site; browsers cap connections per domain, as MDN warns."],
  "tradeoffs": {"columns": ["Technique", "Direction", "Latency", "Main cost"], "rows": [
    ["Short polling", "Client asks", "Up to one polling interval", "Many empty requests"],
    ["Long polling", "Client asks, server waits", "Low", "One full request per message; held requests"],
    ["Server-sent events", "Server to client, text", "Low", "One open connection per client; text only"],
    ["WebSocket", "Both ways, text or binary", "Low", "Open connections; reconnect and resume are up to you"]
  ]},
  "numbers": {"title": "Polling cost against update rate (illustrative)", "assumptions": [
    "20,000 users keep an order-status page open", "Each order changes status about once every 2 minutes",
    "Option A polls every 4 s; option B uses SSE"],
   "steps": ["Polling load: 20,000 ÷ 4 = 5,000 requests/s.",
             "Useful updates: 20,000 ÷ 120 s ≈ 167 per second.",
             "So about 167 ÷ 5,000 ≈ 3.3% of polls return news; the rest are empty.",
             "With SSE: about 167 small messages per second over 20,000 open connections, plus periodic heartbeats."],
   "result": "When updates are rare compared with the polling rate, pushing removes most requests, at the cost of holding connections open."},
  "india": {"title": "Edge case: the per-domain connection limit for SSE", "label": "Official documentation",
   "body": "MDN's EventSource documentation warns that when SSE is used over HTTP/1.1 rather than HTTP/2, it is subject to the browser's limit on open connections per domain, which is low (six in common browsers). Each tab with an open stream uses one, so a user with several tabs open to the same site can find that new requests to that domain stall. Over HTTP/2, streams share one connection and the limit is much higher, so serve SSE over HTTP/2 or share one stream across tabs."},
  "pitfalls": [
   {"trap": "“We'll use WebSockets for notifications.”", "say": "“Notifications are one-way text, so I'd use SSE and get reconnection and resume from the browser for free.”"},
   {"trap": "“If the socket drops, reconnect every second.”", "say": "“I'd reconnect with exponential backoff and jitter, then fetch everything after the last sequence number I saw.”"}
  ],
  "takeaways": ["Polling pays per request whether or not anything changed; push pays per open connection.",
                "SSE: one-way text over HTTP with built-in reconnect and Last-Event-ID resume.",
                "WebSocket: HTTP upgrade (101), then two-way frames; reconnect and resume are your job.",
                "Reconnect with backoff and jitter, and resume from a cursor."]
 },
 "interactive": {"kind": "tradeoff", "title": "Pick the transport",
  "prompt": "A delivery app shows each customer their rider's position, updated about every 5 seconds. The customer's page never sends anything back while watching.",
  "choices": [
   {"id": "a", "label": "Server-sent events", "feedback": "Right: one-way, small text updates, with reconnection and resume built in."},
   {"id": "b", "label": "A WebSocket", "feedback": "It works, but nothing flows from the client, so you take on reconnect and resume logic for no gain."},
   {"id": "c", "label": "Short polling every 5 seconds", "feedback": "Workable, but each update costs a full request and arrives up to 5 s late."}],
  "correctId": "a",
  "reveal": "Server-to-client streams of small text messages match SSE exactly. Reach for a WebSocket when the client sends a steady stream of its own messages too."},
 "seeAlso": [{"topicId": 10, "why": "The system design view of pushing live updates through gateways and pub/sub"}]
})

# ---------------------------------------------------------------- 219 Memory leaks
T.append({
 "id": 219, "slug": "frontend-memory-leaks", "region": "f1-frontend", "order": 19,
 "title": "Memory Leaks in Long-Lived Pages", "kind": "lesson",
 "objectives": ["Explain garbage collection as reachability from roots",
                "Recognise the common leak patterns in single-page apps",
                "Find a leak with heap snapshots"],
 "difficulty": 3, "durationMinutes": 12, "prereqIds": [203],
 "cards": [
  {"id": "t219-c1", "kind": "text", "title": "Garbage collection follows references",
   "body": "The browser's garbage collector frees an object when nothing reachable from a root (the global object, the current call stack, live DOM) refers to it any more. A leak in a web page is not lost memory but forgotten memory: something reachable still points at data you no longer need.",
   "teaches": ["reachability"]},
  {"id": "t219-c2", "kind": "text", "title": "Misconception: removing an element frees it",
   "body": "Removing a node from the document takes it out of the page, but if a variable, a cache or a closure still references it, the node and its whole subtree stay in memory. DevTools shows these as detached elements. Removal frees memory only when the last reference goes.",
   "teaches": ["detached"]},
  {"id": "t219-c3", "kind": "diagram", "title": "Five references that keep old screens alive",
   "body": "Each one is a path from a root to data from a screen the user has left.",
   "teaches": ["leak-patterns"],
   "steps": ["Listeners on window or document that are never unregistered",
             "Timers and intervals still running for an unmounted view",
             "Subscriptions to a store, socket or event bus never cancelled",
             "Module-level caches and maps that only grow",
             "Detached DOM nodes referenced from any of the above"]},
  {"id": "t219-c4", "kind": "text", "title": "Finding a leak: repeat, snapshot, compare",
   "body": "Take a heap snapshot, repeat one action several times (open and close a dialog, navigate away and back), force garbage collection and take another. Objects whose count grows with each repetition are the leak. The retainers view shows which reference chain keeps them alive.",
   "teaches": ["snapshots"]},
  {"id": "t219-c5", "kind": "text", "title": "Trap: caching by element in a plain map",
   "body": "A map from element to computed data holds every element strongly, so removed elements can never be collected. A WeakMap holds its keys weakly: when the element is otherwise unreachable, the entry goes with it. Choose the weak version for metadata attached to objects you do not own.",
   "teaches": ["weak-refs"]}
 ],
 "questions": [
  mc("t219-a1", "reachability", "When can the garbage collector free an object?",
     [("a", "When the page has not used it for a few minutes"), ("b", "When no chain of references from a root reaches it"),
      ("c", "When its element is removed from the document"), ("d", "When the tab moves to the background")],
     "b", "Modern collectors use reachability (mark-and-sweep); time since last use and removal from the page do not matter while a reference remains."),
  mc("t219-a2", "detached", "After closing a modal 20 times, a heap snapshot shows 20 copies of the modal's elements marked detached. What is the most likely cause?",
     [("a", "The browser keeps closed modals for the back button"), ("b", "Something still references each closed modal's elements"),
      ("c", "Detached elements are freed only on page reload"), ("d", "The modal's CSS animations keep each copy alive")],
     "b", "Detached elements survive only while referenced; one copy per close means each open leaves a reference behind, often a listener or a cache entry."),
  mc("t219-a3", "leak-patterns", "A dashboard view starts a 1-second refresh timer when it opens. Users switch views all day and memory climbs. What fix targets the cause?",
     [("a", "Lower the refresh rate to once every 10 seconds"), ("b", "Clear the timer when the view is closed"),
      ("c", "Reload the page every hour in the background"), ("d", "Move the refresh work into a web worker")],
     "b", "The timer's callback keeps the closed view's data reachable and keeps running; slowing it or moving it only changes how fast the leak grows."),
  mc("t219-a4", "weak-refs", "A library attaches computed metadata to elements it does not create, and those elements may be removed at any time. What should it store the metadata in?",
     [("a", "A plain map keyed by element"), ("b", "A WeakMap keyed by element"), ("c", "A global array of pairs"), ("d", "Session storage, by element id")],
     "b", "A WeakMap does not keep its keys alive, so entries disappear with their elements; the plain map and array keep every element forever."),
  order("t219-a5", "snapshots", "Order the steps for confirming a suspected leak with heap snapshots.",
     [("s3", "Repeat the suspect action several times"), ("s1", "Load the page and take a baseline snapshot"),
      ("s4", "Force garbage collection, take a snapshot and compare"), ("s2", "Do the action once to warm up caches")],
     ["s1", "s2", "s3", "s4"], "The warm-up keeps one-time caches out of the comparison, so what grows with repetitions is the leak.",
     [["s2", "s1", "s3", "s4"]]),
  est("t219-a6", "leak-patterns", "Each route change leaks 2.5 MB. A support agent's tab starts at 60 MB and they change route 80 times in a shift. How large is the heap at the end, in MB?",
      "MB", 260, ["start: 60 MB", "2.5 MB leaked per route change", "80 route changes"], "60 + 2.5 × 80",
      "60 + 200 = 260 MB",
      "Sanity check: a leak that is invisible in a 5-minute test (a few MB) becomes hundreds of MB over a working day, so test long sessions, not just page loads.",
      0.02, [200, 2.5])
 ],
 "flashcards": [
  {"id": "t219-f1", "front": "What makes an object collectable?", "back": "No reference chain from a root reaches it."},
  {"id": "t219-f2", "front": "Detached element?", "back": "Removed from the document but still referenced, so still in memory."},
  {"id": "t219-f3", "front": "Common SPA leak sources?", "back": "Global listeners, timers, subscriptions, growing caches."},
  {"id": "t219-f4", "front": "Map vs WeakMap for element metadata?", "back": "WeakMap: it does not keep the element alive."}
 ],
 "sources": [
  {"title": "MDN: Memory management", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management"},
  {"title": "Chrome for Developers: Fix memory problems", "url": "https://developer.chrome.com/docs/devtools/memory-problems"}
 ],
 "deep": {
  "teaches": ["reachability", "detached", "leak-patterns", "snapshots", "weak-refs"],
  "mechanism": {"title": "How memory is kept and released in a page", "steps": [
    "Every object, closure, DOM node and buffer lives on the heap. The garbage collector periodically marks everything reachable from the roots (globals, the active call stack, the live document, pending callbacks) and frees the rest. MDN describes this mark-and-sweep approach; it handles cycles, so two objects pointing at each other are freed together once nothing else reaches them.",
    "Closures capture the variables of the scope they were created in. A small listener function can therefore keep a large array, a component's whole state or a set of DOM nodes alive for as long as the listener itself is reachable.",
    "Registered listeners, timers, animation-frame callbacks, observers and open sockets are all reachable from roots by design: the browser must be able to call them. Anything they capture stays alive until they are unregistered, cleared, disconnected or closed.",
    "Single-page apps make this worse because the page never reloads. On a traditional site, navigation throws the whole heap away. In an app that swaps views, each view must undo what it set up, or every visit adds another copy of its state.",
    "Weak references help when you attach data to objects whose lifetime you do not control. WeakMap and WeakSet keys do not keep their objects alive. WeakRef and FinalizationRegistry exist too, but their timing is up to the collector, so they suit caches, not program logic.",
    "Detection is empirical. In the browser's memory tools, compare heap snapshots taken before and after repeating an action, or record allocations over time. Look for object counts that grow with the number of repetitions, then read the retainer chain to find the root that holds them."
  ]},
  "useWhen": ["Profile memory for apps that stay open for hours: dashboards, email, chat, support consoles and editors.",
              "Pair every setup with a teardown: register and unregister, start and clear, subscribe and unsubscribe."],
  "avoidWhen": ["Avoid treating a high but stable heap as a leak; caches and pooled objects can be deliberate. Growth per repetition is the signal.",
                "Avoid WeakRef-based logic that must run at a known time; the collector decides when, and may never collect in a short session."],
  "tradeoffs": {"columns": ["Approach", "What it holds", "Released when", "Fits"], "rows": [
    ["Plain map or object cache", "Keys and values strongly", "You delete the entry", "Bounded caches with an eviction rule"],
    ["WeakMap keyed by object", "Values while the key is alive", "The key becomes unreachable", "Metadata on elements or objects you do not own"],
    ["Bounded LRU cache", "The most recent N entries", "An entry is evicted", "Data that is expensive to recompute"],
    ["No cache", "Nothing", "At once", "Cheap results; the simplest choice"]
  ]},
  "numbers": {"title": "How a small leak grows over a working day (illustrative)", "assumptions": [
    "Baseline heap after load: 40 MB", "Each route change leaves 3 MB reachable (a view's state plus its detached DOM)",
    "An agent changes route about 25 times an hour for 8 hours", "Budget: 150 MB before low-memory phones and tablets struggle"],
   "steps": ["Route changes in a day: 25 × 8 = 200.", "Leaked memory: 200 × 3 MB = 600 MB.",
             "Heap at end of day: 40 + 600 = 640 MB.",
             "The budget is crossed after (150 − 40) ÷ 3 ≈ 37 route changes, about an hour and a half into the shift."],
   "result": "A 3 MB leak passes any quick test but breaks the app within the first two hours of real use."},
  "india": {"title": "Edge case: detached elements in the memory tools", "label": "Official documentation",
   "body": "Chrome's DevTools documentation on fixing memory problems describes detached DOM trees: nodes removed from the document that are still referenced by script and so cannot be collected. It recommends heap snapshots, searching them for detached nodes, and reading the retainers to find which variable or listener holds them. It also suggests recording allocations on a timeline while repeating an action, because memory that climbs with each repetition and does not fall back after collection is the sign of a leak."},
  "pitfalls": [
   {"trap": "“Memory is high, so we have a leak.”", "say": "“I'd check whether it grows with each repetition of an action; a high but flat heap may just be caching.”"},
   {"trap": "“We remove the elements when the view closes, so it's fine.”", "say": "“Removal frees nothing while a listener, timer or cache still references them; I'd tear those down too.”"}
  ],
  "takeaways": ["The collector frees what is unreachable, so a leak is an unwanted reference.",
                "Global listeners, timers, subscriptions and growing caches are the usual culprits.",
                "Every setup needs a matching teardown when a view closes.",
                "Find leaks by repeating an action and comparing heap snapshots."]
 },
 "interactive": {"kind": "slider", "title": "Watch a 3 MB leak add up",
  "prompt": "A page starts at 40 MB and each route change leaks 3 MB. Slide the number of route changes and see when the heap passes a 150 MB budget.",
  "model": "heap-growth", "params": {"baseMb": 40, "leakMb": 3, "budgetMb": 150},
  "control": {"label": "Route changes", "min": 0, "max": 100, "step": 5, "initial": 20, "unit": "changes"},
  "takeaway": "At 20 route changes the heap is 100 MB and looks fine. By 40 it is 160 MB and over budget, and at 100 it reaches 340 MB. Short tests miss leaks; long sessions find them."},
 "seeAlso": [{"topicId": 213, "why": "Client-side caches and subscriptions are where many app leaks start"}]
})

# ---------------------------------------------------------------- 220 Animation
T.append({
 "id": 220, "slug": "smooth-animation-compositing", "region": "f1-frontend", "order": 20,
 "title": "Smooth Animation: Compositing and Layers", "kind": "lesson",
 "objectives": ["Say which CSS properties trigger layout, paint or only compositing",
                "Explain what will-change does and what layers cost",
                "Avoid forced synchronous layout in animation code"],
 "difficulty": 3, "durationMinutes": 12, "prereqIds": [201],
 "cards": [
  {"id": "t220-c1", "kind": "text", "title": "Each frame redoes only the stages you dirty",
   "body": "Animating width, height, top or left changes geometry, so every frame reruns layout, paint and compositing. Animating colour or a shadow skips layout but still repaints. Animating transform or opacity on an element with its own layer can skip both and only recomposite, which the browser can often do off the main thread.",
   "teaches": ["property-cost"]},
  {"id": "t220-c2", "kind": "text", "title": "Worked example: sliding a panel 300 px",
   "body": "Moving a sidebar from left: −300px to left: 0 relays out the page on every frame, and any layout work above the frame budget drops frames. Leaving left alone and animating transform: translateX(−300px) to translateX(0) moves the same pixels with no layout and no repaint once the panel is on its own layer.",
   "teaches": ["property-cost"]},
  {"id": "t220-c3", "kind": "diagram", "title": "Which stage each property reaches",
   "body": "Cheaper animations stop earlier in the pipeline.",
   "teaches": ["property-cost"],
   "steps": ["Layout, paint and composite: width, height, top, left, margin, font-size",
             "Paint and composite: color, background-color, box-shadow, border-radius",
             "Composite only, on its own layer: transform, opacity",
             "Some filters can be composited too, depending on the browser"]},
  {"id": "t220-c4", "kind": "text", "title": "Layers are memory, not magic",
   "body": "will-change: transform hints that an element will animate, so the browser may give it a compositor layer in advance. Each layer is a bitmap: a 1,000 × 800 px layer at 4 bytes per pixel is about 3.2 MB, and DPR 2 quadruples that. Promote what is about to animate, and remove the hint afterwards.",
   "teaches": ["layers"]},
  {"id": "t220-c5", "kind": "text", "title": "Trap: read, write, read, write in one frame",
   "body": "Changing a style and then reading a size or position forces the browser to run layout right away to answer. Doing that in a loop over many elements causes layout thrashing: one forced layout per element per frame. Read every measurement first, then make every write.",
   "teaches": ["thrashing"]}
 ],
 "questions": [
  mc("t220-a1", "property-cost", "Which animation can usually run with no layout and no repaint per frame?",
     [("a", "Animating left from 0 to 200 px"), ("b", "Animating transform from translateX(0) to translateX(200px)"),
      ("c", "Animating width from 100 to 300 px"), ("d", "Animating box-shadow from small to large")],
     "b", "transform changes how an existing layer is drawn, not the geometry; left and width rerun layout, and box-shadow repaints."),
  mc("t220-a2", "layers", "A developer adds will-change: transform to all 400 cards in a grid to make hover effects smooth. What is the main risk?",
     [("a", "Hover effects stop running on the compositor"), ("b", "Each card may get its own layer, using a lot of memory"),
      ("c", "The cards lose their position in the grid layout"), ("d", "The browser ignores the hint on more than ten elements")],
     "b", "Layers are bitmaps; hundreds of them can exhaust graphics memory and slow compositing. MDN describes will-change as a last resort for known performance problems."),
  mc("t220-a3", "thrashing", "A loop sets each of 200 elements' heights and then reads that element's new size before moving on. Why is it slow?",
     [("a", "Each read forces a fresh layout, so layout runs 200 times"), ("b", "Reading sizes moves the elements onto new compositor layers"),
      ("c", "The browser repaints the screen after each element changes"), ("d", "Style changes are queued and run on the following page load")],
     "a", "Writes mark layout dirty and the next read must be answered accurately, so interleaving forces one layout per element; batch the reads, then the writes."),
  mc("t220-a4", "property-cost", "A fade-in animates opacity from 0 to 1 on a card. Which stages does it need on each frame once the card has its own layer?",
     [("a", "Layout, paint and composite"), ("b", "Paint and composite"), ("c", "Composite only"), ("d", "Style and layout only")],
     "c", "Opacity is applied when layers are combined, so the compositor can blend the existing bitmap without repainting it."),
  order("t220-a5", "property-cost", "Order these animated properties from cheapest to most expensive per frame.",
     [("s3", "width"), ("s1", "opacity"), ("s2", "background-color")],
     ["s1", "s2", "s3"], "opacity only composites, background-color repaints, and width relays out, repaints and composites."),
  est("t220-a6", "layers", "A full-screen layer is 1,920 × 1,080 CSS px on a DPR 1 screen at 4 bytes per pixel. About how many MB does it use?",
      "MB", 8.3, ["1,920 × 1,080 px", "DPR 1", "4 bytes per pixel", "1 MB = 1,000,000 bytes"], "1,920 × 1,080 × 4 ÷ 1,000,000",
      "1,920 × 1,080 = 2,073,600 px; × 4 = 8,294,400 B ≈ 8.3 MB",
      "Sanity check: at DPR 2 the same layer has four times the pixels, about 33 MB, so a handful of promoted full-screen layers can use hundreds of MB on a high-density screen.",
      0.05, [2.1, 33.2])
 ],
 "flashcards": [
  {"id": "t220-f1", "front": "Compositor-friendly properties?", "back": "transform and opacity."},
  {"id": "t220-f2", "front": "What does will-change do?", "back": "Hints the element will change so the browser can prepare, often by creating a layer."},
  {"id": "t220-f3", "front": "Layer memory estimate?", "back": "Width × height × DPR² × 4 bytes."},
  {"id": "t220-f4", "front": "Layout thrashing?", "back": "Interleaved style writes and size reads forcing repeated layouts; batch reads, then writes."}
 ],
 "sources": [
  {"title": "web.dev: Stick to compositor-only properties and manage layer count", "url": "https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count"},
  {"title": "web.dev: How to create high-performance CSS animations", "url": "https://web.dev/articles/animations-guide"},
  {"title": "MDN: will-change", "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change"}
 ],
 "deep": {
  "teaches": ["property-cost", "layers", "thrashing"],
  "mechanism": {"title": "What happens on each frame of an animation", "steps": [
    "On every frame the browser may run script, recalculate styles, run layout, paint and composite. Which of these it must redo depends on what changed. A change to geometry dirties layout, and layout dirties paint for whatever moved. A change to colour dirties paint only. A change to transform or opacity on a layer dirties only compositing.",
    "Painting records drawing commands and rasterises them into bitmaps. Compositing takes those bitmaps, the layers, and combines them with each layer's transform and opacity to make the final frame, usually on the GPU and on a separate compositor thread.",
    "Because the compositor thread does not wait for the main thread, a transform or opacity animation that has been handed to it can stay smooth even while script is busy. A left or width animation cannot, because layout runs on the main thread.",
    "Elements get their own layers for several reasons: 3D transforms, video, canvas, an animation of transform or opacity in progress, or will-change. A layer avoids repainting its neighbours when it moves, but costs memory proportional to its pixel area and adds work to compositing. Too many layers can be slower than none.",
    "Forced synchronous layout happens when code changes styles and then reads a geometric value such as an element's size, position or scroll offset in the same frame. The browser must lay out immediately to return a correct value. Doing this per element in a loop multiplies layout cost; batching all reads before all writes, or deferring writes to the next frame callback, avoids it.",
    "Animations should respect the prefers-reduced-motion media feature: for users who ask for less motion, replace movement with a quick fade or no animation."
  ]},
  "useWhen": ["Use transform and opacity for movement, scaling, fades and slide-ins.",
              "Use will-change briefly on an element just before a known, expensive animation, and remove it afterwards."],
  "avoidWhen": ["Avoid animating width, height, top, left or margin on large or complex pages; animate transform: scale or translate instead where the design allows.",
                "Avoid blanket will-change rules in stylesheets; MDN describes it as a last resort for existing performance problems."],
  "tradeoffs": {"columns": ["Animated property", "Stages per frame", "Can run off the main thread", "Notes"], "rows": [
    ["width, height, top, left", "Layout, paint, composite", "No", "Moves other elements; most expensive"],
    ["color, background, box-shadow", "Paint, composite", "No", "Cost grows with painted area; large blurs are slow"],
    ["transform, opacity (on a layer)", "Composite", "Often yes", "Needs a layer; layers cost memory"]
  ]},
  "numbers": {"title": "The memory bill for promoted layers (illustrative)", "assumptions": [
    "A page promotes 12 cards with will-change: transform", "Each card is 600 × 400 CSS px", "Phone with DPR 3", "4 bytes per pixel"],
   "steps": ["Device pixels per card: (600 × 3) × (400 × 3) = 1,800 × 1,200 = 2,160,000.",
             "Memory per card layer: 2,160,000 × 4 B = 8,640,000 B ≈ 8.6 MB.",
             "Twelve cards: 12 × 8.6 MB ≈ 104 MB of layer memory.",
             "Promoting only the card being animated keeps this near 8.6 MB."],
   "result": "Layers trade memory for cheaper frames; on high-density phones the memory side grows with DPR squared."},
  "india": {"title": "What the performance guides recommend", "label": "Official documentation",
   "body": "web.dev's guide to compositor-only properties recommends animating only transform and opacity where possible, because changes to them can be handled by compositing without layout or paint, and warns that promoting too many elements to layers costs memory and management time and can make performance worse. MDN's will-change page goes further: it calls the property a last resort for existing performance problems, says not to apply it to many elements, and suggests setting it from script shortly before a change and removing it afterwards."},
  "pitfalls": [
   {"trap": "“Add will-change to everything that might animate.”", "say": "“Each layer costs memory, about width × height × DPR² × 4 bytes; I'd set it just before an animation and remove it after.”"},
   {"trap": "“Animate the drawer's left property.”", "say": "“That relays out every frame; I'd animate transform: translateX so it only recomposites.”"}
  ],
  "takeaways": ["Geometry changes cost layout, paint and composite; colour changes cost paint; transform and opacity only composite.",
                "Compositor animations can stay smooth while the main thread is busy.",
                "Layers cost about width × height × DPR² × 4 bytes each, so promote sparingly.",
                "Batch size reads before style writes to avoid layout thrashing."]
 },
 "interactive": {"kind": "predict", "title": "Which animation stutters?",
  "prompt": "A page runs a 300 ms search filter on the main thread while two loading spinners rotate. Spinner A animates transform: rotate; spinner B animates its margin to fake rotation. Predict which keeps moving smoothly.",
  "choices": [
   {"id": "a", "label": "Spinner A", "feedback": "Right: a transform animation on its own layer can be driven by the compositor thread while script runs."},
   {"id": "b", "label": "Spinner B", "feedback": "Margin changes need layout on the main thread, which is busy with the filter for 300 ms."},
   {"id": "c", "label": "Both freeze for 300 ms", "feedback": "Only animations that need the main thread wait; compositor animations do not."}],
  "correctId": "a",
  "reveal": "Main-thread work blocks layout and paint, so animations that need them freeze. Transform and opacity animations handed to the compositor keep running, which is why they are the default choice for motion."},
 "seeAlso": [{"topicId": 201, "why": "The full rendering pipeline that these animation costs come from"}]
})
