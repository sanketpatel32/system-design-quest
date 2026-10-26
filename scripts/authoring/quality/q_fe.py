"""Quality pass, Frontend: recall questions become scenarios, explanations say why each wrong option is wrong,
generic cards get numbers. Applied by apply.py."""

P = {
 213: {
  'cards': {
   't213-c1': {'body': 'UI state belongs to the page: which tab is open, the half-typed delivery note. Server state is a copy of data owned elsewhere: the cart, whether the restaurant is still taking orders. Leave a food-ordering page open for 20 minutes and the restaurant may have closed, but your selected tab is still right. Server state goes stale, so it needs fetching, caching and refresh rules; UI state does not.'},
  },
  'q': {
   't213-a1': {'prompt': 'A food-ordering page has sat open for 20 minutes. Which value is most likely wrong now unless the page refetches it?',
    'choices': [('a', 'Which menu tab the user selected'), ('b', 'Whether the restaurant still accepts orders'), ('c', 'The half-typed note for the rider'), ('d', 'Whether the filter drawer is open')],
    'correct': 'b',
    'explanation': 'The restaurant’s status is owned by the server and can change while the page sits idle, so it is server state and needs a refresh rule, such as refetching when the tab regains focus. The selected tab, the draft note and the drawer are UI state: the page itself is their source of truth, so they cannot go stale.'},
   't213-a2': {'explanation': 'Render a response only if its query matches what is in the box now, or cancel the older request. Showing whichever arrived last is exactly the bug; an error punishes the user for network timing; and merging mixes in results for a query nobody is asking any more.'},
   't213-a3': {'prompt': 'Your team wants to show success before the server confirms. For which action is that acceptable?',
    'choices': [('a', 'Starring a restaurant as a favourite'), ('b', 'Showing a UPI payment as completed'), ('c', 'Confirming the last Tatkal seat on a train'), ('d', 'Cancelling an order the kitchen may have started')],
    'correct': 'a',
    'explanation': 'A favourite rarely fails, harms nobody if it is briefly wrong and rolls back cleanly. A payment can be declined by the bank and a Tatkal seat can be taken by someone else a second earlier, and the user acts on the result, so both must wait for the server. A cancellation may be refused once cooking starts, so promising it early misleads the user.'},
   't213-a4': {'prompt': 'A user types “paneer” at a steady 150 ms per key, then stops. The search box has a 300 ms debounce. How many search requests are sent?',
    'choices': [('a', 'Six, one for each key pressed'), ('b', 'One, about 300 ms after the last key'), ('c', 'Three, one every 300 ms while typing'), ('d', 'None until the user presses Enter')],
    'correct': 'b',
    'explanation': 'Debounce restarts its 300 ms timer on every key, and keys arrive every 150 ms, so the timer expires only after the last one: one request. One per key is no debounce at all; a request every 300 ms while typing is throttling, a different technique; and a debounced box searches by itself without Enter.'},
   't213-a5': {'explanation': 'Show the change first, then send it, then reconcile. On failure the count goes back and the user is told why; a silent rollback looks like a glitch and makes people tap again.'},
   't213-a6': {'explanation': 'Low-risk toggles suit optimistic updates as long as failures roll back and the list is refreshed. Waiting for the server makes a checkbox feel broken on a 2-second mobile round trip, and never confirming means a failed write or another user’s change goes unnoticed.'},
  },
 },
 207: {
  'q': {
   't207-a2': {'explanation': 'application/json is not one of the three safelisted content types (form-encoded, multipart form data, plain text), so the browser asks first. A GET or HEAD without custom headers is simple, and so is a form-encoded POST with a cookie: cookies do not trigger a preflight, which is why CSRF defences are still needed.'},
   't207-a4': {'explanation': 'Credentialed responses need an explicit origin and Allow-Credentials: true. The wildcard alone hides credentialed responses from scripts, the wildcard plus credentials is rejected by browsers, and an explicit origin without Allow-Credentials still hides the response.'},
   't207-a5': {'explanation': 'Permission first, then the real request. If the OPTIONS answer does not allow PUT or the requested headers, the PUT is not sent at all and the script only sees a network error.'},
  },
 },
 344: {
  'q': {
   't344-a1': {'explanation': 'About 50,000 elements must each be styled, laid out and kept in memory, and layout work grows with that count. The row data is typically a few hundred kilobytes, the query runs once on the server, and the icons are usually a handful of cached images.'},
   't344-a2': {'prompt': 'An order-history page lists 10,000 orders in a virtual list. A tester scrolls to order 5,000 and inspects the page. What should the DOM contain?',
    'choices': [('a', 'About 27 rows near order 5,000 inside one tall spacer'), ('b', 'All 10,000 rows, most hidden with display: none'), ('c', 'Rows 1 to 5,027, the early ones scrolled out of view'), ('d', 'Only the 17 rows that are fully visible, no others')],
    'correct': 'a',
    'explanation': 'A virtual list keeps only the visible window plus overscan (about 17 + 10 rows at 48 px in an 800 px viewport) and a spacer for the full height. Hiding rows with styles keeps all 80,000 elements; keeping every row above the window grows without limit as you scroll; and with no overscan a fast flick shows blank space.'},
   't344-a3': {'explanation': 'Overscan rows are already rendered when a fast flick brings them into view, so no blank gap shows. The spacer, not overscan, keeps the scrollbar the right size; search engines do not see virtual rows either way; and overscan adds a few elements rather than removing any.'},
   't344-a4': {'explanation': 'Unrendered rows are not in the document, so find-in-page and screen readers cannot reach them: provide your own search and expose the list size and each row’s position. The spacer keeps the scrollbar right, rendered rows can hold links, and lazy images still work in the rows that render.'},
  },
 },
 212: {
  'q': {
   't212-a1': {'prompt': 'A rail-booking form allows at most 6 passengers, using a max attribute and a script check. A tester posts 9 passengers with a command-line client. Which check stops the booking?',
    'choices': [('a', 'The passenger limit enforced by the booking server'), ('b', 'The max attribute on the passenger-count field'), ('c', 'The script that validates the form before submit'), ('d', 'The browser’s built-in constraint validation')],
    'correct': 'a',
    'explanation': 'The command-line client never loads the page, so the max attribute, the form script and the browser’s constraint validation never run. Only the server sees every request; browser checks exist for fast feedback, not for enforcement.'},
   't212-a2': {'explanation': 'With Post/Redirect/Get the page being refreshed is a GET, so refresh just reloads the result. Returning the result straight from the POST is what causes the resubmit prompt, and required attributes or autocomplete only affect how the form is filled in.'},
   't212-a3': {'prompt': 'On a 12-field checkout form, the PIN code fails validation after a screen-reader user submits with Enter. Which feedback works for them?',
    'choices': [('a', 'A toast message that fades out after two seconds'), ('b', 'A red border drawn around the PIN code field'), ('c', 'Focus moves to the field, with error text linked to it'), ('d', 'A short shake animation on the submit button')],
    'correct': 'c',
    'explanation': 'Moving focus to the first invalid field, with the message linked to it (for example through aria-describedby), means the error is announced where the user now is. A fading toast may vanish before it is read, a red border carries no text and fails people who cannot see colour, and a shake says nothing about which field is wrong.'},
   't212-a4': {'explanation': 'The server stores the key with the first result, so the second request with the same key returns that result instead of charging again. A pattern attribute is a browser check the request skips, returning 200 twice still charges twice, and validating the card twice just validates two charges.'},
  },
 },
 214: {
  'q': {
   't214-a1': {'explanation': 'A service worker is a proxy for its scope. It cannot touch any page’s DOM (it posts messages instead), it requires HTTPS rather than bypassing it, and it is installed by a page, so a first-ever visit downloads the HTML normally.'},
   't214-a2': {'explanation': 'The hash in the name changes whenever the content does, so a cached copy can never be stale: cache first is safe and instant. Network first spends a round trip on a file that cannot change, and never caching or network only make repeat and offline loads slow or impossible.'},
   't214-a3': {'explanation': 'By default the new worker installs, then waits until no tab is controlled by the old one, so a page is never served by two versions; one reload of the only open tab is not enough, because the old page is still alive while the new one loads. A browser restart or clearing the cache is not what the lifecycle waits for, and sites can opt in to taking over sooner.'},
   't214-a4': {'prompt': 'A restaurant list may be a few minutes old, but it must appear at once even on a weak 3G signal. Which strategy fits?',
    'choices': [('a', 'Network only, with a spinner until the list arrives'), ('b', 'Cache first, keeping the copy until the next deploy'), ('c', 'Stale-while-revalidate'), ('d', 'Network first, waiting 10 s before using the cache')],
    'correct': 'c',
    'explanation': 'Stale-while-revalidate shows the cached list at once and refreshes it in the background, so the next view is fresh. Network only leaves a spinner on 3G, cache first until the next deploy can show a list that is days old, and network first with a 10-second timeout makes a weak signal feel broken.'},
  },
 },
 345: {
  'q': {
   't345-a1': {'prompt': 'Right after a script changes a card’s width, which read does not force the browser to lay out the page?',
    'choices': [('a', 'Reading the card’s rendered height'), ('b', 'Reading the card’s position on the page'), ('c', 'Reading how far its container is scrolled'), ('d', 'Reading a width the script saved earlier')],
    'correct': 'd',
    'explanation': 'Any geometry read (size, position, scroll offset) needs current layout, so after a write it forces one. A value already held in the script’s memory needs nothing from the browser, which is why measuring once before the loop and reusing the numbers removes the thrashing.'},
   't345-a2': {'explanation': 'Batched, the loop costs one layout instead of 200, about 50 ms saved at 0.25 ms each (three dropped frames). Spreading the cards over 200 frames takes more than 3 seconds to finish, and hiding cards while resizing them one by one still interleaves reads and writes.'},
   't345-a3': {'explanation': 'Reserved space, such as fixed dimensions or an aspect ratio on the ad slot, means nothing moves when the ad arrives. Loading it sooner only narrows the window for the shift, fading changes opacity while the layout still jumps, and showing ads after a scroll shifts content that is now on screen.'},
   't345-a4': {'explanation': 'Moving an element with transform does not change layout, so it is not counted as a layout shift. A late image without dimensions, a font with different metrics and a banner inserted above content all move content that was already laid out.'},
  },
 },
 343: {
  'q': {
   't343-a2': {'prompt': 'A brokerage dashboard is open in three tabs. An order fills in one tab. What is the lightest way to update the holdings shown in the other two?',
    'choices': [('a', 'Every tab polls the holdings API once a second'), ('b', 'Route a message through the server to each tab'), ('c', 'Post a small message on a broadcast channel'), ('d', 'Each tab re-reads a cookie once a second')],
    'correct': 'c',
    'explanation': 'A broadcast channel delivers the message to every same-origin tab with no network trip; each tab then reads the new holdings from storage or refetches once. Polling from three tabs triples the load for a rare change, routing through the server adds a round trip and a connection per tab, and polling a cookie is a slow workaround from before broadcast channels.'},
   't343-a4': {'explanation': 'Send what changed, the id and new version, and let each tab read the current value from shared storage, so out-of-order messages cannot leave a tab on an older version. Full state or every note is copied into every tab on each edit, and a session token does not belong in a message any script on the origin can receive.'},
  },
 },
 211: {
  'cards': {
   't211-c1': {'body': 'Asset loading comes down to three moves: discover critical files early, make every file as small as it can be, and delay anything the first view does not need. The stakes are easy to work out: on a 10 Mbit/s mobile link (illustrative), a 1 MB hero image needs about 0.8 s of transfer alone, while a right-sized 150 KB version needs about 0.12 s.'},
  },
  'q': {
   't211-a1': {'explanation': 'The font is found only after the stylesheet downloads and is parsed; preload starts it alongside the HTML. Preconnecting to your own origin does nothing because that connection is already open, a low priority on the stylesheet delays the font further, and font-display: swap changes how text appears while waiting, not when the font is fetched.'},
   't211-a2': {'prompt': 'A product image is shown 360 CSS px wide on a phone with a device pixel ratio of 3. Its srcset offers 480, 1,080 and 2,160 px files. Which does the browser normally fetch?',
    'choices': [('a', 'The 480 px file, because it is smallest'), ('b', 'The 1,080 px file, enough for 360 × 3'), ('c', 'The 2,160 px file, because it is sharpest'), ('d', 'All three, keeping the best one it gets')],
    'correct': 'b',
    'explanation': 'The browser needs about 360 × 3 = 1,080 device pixels and picks the smallest candidate that covers it. 480 px looks blurry at three times density, 2,160 px decodes four times the pixels for no visible gain, and only one candidate is downloaded. Browsers may choose a smaller file on a slow connection or with data saving on.'},
   't211-a3': {'prompt': 'A sale page has a hero banner, 4 products above the fold and 60 product images further down. Which images should get loading="lazy"?',
    'choices': [('a', 'All 65, to save the most bytes'), ('b', 'Only the 60 below the fold'), ('c', 'Only the hero, as it is the largest'), ('d', 'None, because lazy-loading hurts LCP')],
    'correct': 'b',
    'explanation': 'Lazy-loading the 60 below-the-fold images saves bytes for visitors who never scroll that far. Lazy-loading the hero or the first products delays what the user sees first, often the LCP element, and lazy images far down the page do not affect LCP, so skipping lazy-loading entirely just wastes bandwidth.'},
   't211-a4': {'explanation': 'JPEG, PNG and WebP are already compressed, so gzip saves almost nothing and costs CPU. Text formats such as script bundles, HTML and JSON usually shrink by more than half.'},
  },
 },
 204: {
  'q': {
   't204-a1': {'prompt': 'A blog sends the same HTML to every reader, and it changes only when an author publishes. Where is that HTML produced?',
    'choices': [('a', 'On the server, again for each request'), ('b', 'In the browser, from a near-empty page'), ('c', 'Once, when the content is published'), ('d', 'In the browser, during hydration')],
    'correct': 'c',
    'explanation': 'That is static generation: HTML is built when content changes and every reader gets the same file, ideally from a CDN. Per-request server rendering repeats identical work for each reader, client rendering ships an empty page and builds it with script, and hydration does not produce HTML; it attaches behaviour to HTML that already exists.'},
   't204-a2': {'explanation': 'The HTML has painted, but the script that attaches handlers has not finished downloading and running; on a mid-range phone that gap can last seconds. Browsers paint server HTML as soon as it arrives, missing styles change how the page looks rather than whether buttons work, and static pages can have handlers once hydrated.'},
   't204-a4': {'explanation': 'The server renders at one moment and in one time zone, the browser at another, so the printed time differs and the framework must patch or throw away that part. A CSS class, props the server also used and a fixed heading render identically on both sides.'},
  },
 },
 209: {
  'q': {
   't209-a1': {'explanation': 'A button element is focusable, activates on Enter and Space, submits its form and is announced as a button with no extra code. A span or a div needs all of that rebuilt by hand, and a link with href="#" is announced as a link, jumps to the top of the page and does not activate on Space.'},
   't209-a2': {'prompt': 'A design uses light grey text measured at 3.2:1 against its white background. Where may it be used under WCAG level AA?',
    'choices': [('a', 'Body text, because it is above 3:1'), ('b', 'Large text only, such as 24 px headings'), ('c', 'Nowhere, as level AA needs 7:1'), ('d', 'Anywhere, as contrast is an AAA rule')],
    'correct': 'b',
    'explanation': 'AA asks for 4.5:1 for normal text and 3:1 for large text (at least 24 px, or about 18.7 px bold), so 3.2:1 suits headings but not body copy. 7:1 is the stricter AAA level for normal text, and contrast is already part of AA.'},
   't209-a4': {'explanation': 'Moving focus into the dialog, keeping it there while it is open and returning it to the button that opened it keeps keyboard and screen-reader users where the action is. Leaving focus behind the dialog lets them tab through a page they cannot see, and jumping to the first link or the address bar loses their place.'},
   't209-a5': {'prompt': 'Order how a “Pay now” button reaches a screen-reader user.',
    'items': [('s3', 'The browser exposes the accessibility tree to the platform'), ('s1', 'The browser parses the HTML into the DOM'), ('s5', 'The user hears “Pay now, button”'), ('s2', 'The browser computes each element’s role, name and state'), ('s4', 'The screen reader reads the node that has focus')],
    'correctOrder': ['s1', 's2', 's3', 's4', 's5'],
    'alternativeOrders': None,
    'explanation': 'Assistive technology never reads your markup directly; it reads the tree the browser derives from the DOM. That is why a div with a click handler is announced with no button role: nothing in the DOM told the browser it was one.'},
  },
 },
}
