# Reviewer-pass fixes: option balance, absolute words in distractors, stem near-duplicates, deep word counts.
import re
R = {
 'fe_a.py': [
  ("'A full site rebuild on each price change'", "'A full rebuild of every page whenever any price changes'"),
  ("'Wait for both, then send one complete page'", "'Wait for both queries, then send the complete page in one go'"),
  ("'200 OK, overwriting the other user’s change'", "'200 OK, saving it over the other user’s earlier change'"),
  ("'It lets the server cache the response longer'", "'It lets the server and CDN cache the response for longer'"),
  ("'The server sends different data to each tab'", "'The server pushes the read status to only the most recent tab'"),
  ("'Making the server reject the extra connections'", "'Having the server reject extra connections from the same user’s browser'"),
  ("('a', 'The whole application state')", "('a', 'The full application state, serialised')"),
  ("'Several pending edits to one item should be applied in order on top of the confirmed state. When one fails, rebuild the shown state from the confirmed state plus the remaining pending edits, rather than restoring a snapshot that predates them.'",
   "'Several pending edits to one item should be applied in order on top of the confirmed state. When one fails, rebuild the shown state from the confirmed state plus the remaining pending edits, rather than restoring a snapshot that predates them. Whatever happens, the user should see a short message that names the change that was undone and why, so a rollback never looks like a glitch or lost work.'"),
 ],
 'fe_b.py': [
  ("('a', 'Network time to download the rows'), ('b', 'About 50,000 elements to style, lay out and keep in memory'), ('c', 'The database query behind the table'), ('d', 'Image decoding for the row icons')",
   "('a', 'Network time to download all of the row data first'), ('b', 'About 50,000 elements to style, lay out and hold'), ('c', 'The database query that produces the rows'), ('d', 'Decoding the icon images shown in the rows')"),
  ("'Every row, with off-screen rows hidden'", "'All of the rows, with off-screen ones hidden by styles'"),
  ("'To make the scrollbar the right size'", "'To keep the scrollbar thumb the right size for the list'"),
  ("'The scrollbar always shows the wrong size'", "'The scrollbar size can no longer match the length of the list'"),
  ("'Loading a stylesheet in the head'", "'Loading a stylesheet in the head before any script runs'"),
  ("'It interrupts the task and runs at once'", "'It interrupts the running task and its handler runs first'"),
  ("'Changing the colour of a button'", "'Changing the colour of a button on hover'"),
  ("'What does Interaction to Next Paint measure?',\n   [('a', 'Time until the first image appears'), ('b', 'How far content moves during load'), ('c', 'Script download time for the page'), ('d', 'Delay from an interaction until the next frame is painted')]",
   "'A dashboard scores poorly on INP. What is being measured?',\n   [('a', 'Time until the largest image or text block appears'), ('b', 'How far visible content moves while the page loads'), ('c', 'Script download time for the page'), ('d', 'Delay from an interaction to the next painted frame')]"),
  ("'The total work finishes much faster'", "'The total work finishes sooner because pieces are smaller'"),
  ("Lists can expose their total size and each row’s position with ARIA attributes, keep focus on a rendered row, and offer an in-app search.'",
   "Lists can expose their total size and each row’s position with ARIA attributes, keep focus on a rendered row, and offer an in-app search. Printing and copying a whole selection need the same care, since only rendered rows can be printed or selected.'"),
  ("Setting width and height or an aspect ratio, reserving slots, and inserting new content below the viewport or in response to user input avoid them.'",
   "Setting width and height or an aspect ratio, reserving slots, and inserting new content below the viewport or in response to user input avoid them. Shifts within half a second of a tap or key press are excluded from the score.'"),
 ],
 'be_a.py': [
  ("'It converts requests into bytes for storage'", "'It converts the daily request count into bytes needed for storage'"),
  ("'A fixed 1 GB, since caches should stay small'", "'A fixed 1 GB, since caches should stay very small'"),
  ("('a', 'A large read cache'), ('b', 'Read replicas in more regions'), ('c', 'Cheap appends, batching and partitioned storage'), ('d', 'Keeping all events in RAM')",
   "('a', 'A large read cache in front of the event store'), ('b', 'Read replicas in more regions for the nightly job'), ('c', 'Cheap appends, batching and partitioned storage'), ('d', 'Keeping all events in RAM until the job runs')"),
  ("'10M daily users each make 40 reads a day. Roughly how many reads per second on average?'",
   "'A feed has 10M people reading 40 posts apiece each day. Spread across the day, how many reads per second is that?'"),
  ("'Appends the row to a new file and merges it later'", "'Appends the row to a new sorted file and merges it in later compaction'"),
  ("'Each file holds only one column of the table'", "'Each sorted file stores a single column of the table rows'"),
  ("'The engine keeps every row in two copies'", "'The engine keeps two copies of each row on disk'"),
  ("'Either, as engines do not differ on writes'", "'Either one, as engines barely differ on write cost'"),
  ("'A cache of free seats in memory'", "'A cache of the free seats kept in app memory'"),
  ("'Checking availability twice in the code'", "'Checking seat availability twice in the booking code'"),
 ],
 'be_b.py': [
  ("'So one failing message cannot block or burn capacity forever'", "'So one failing message cannot block the queue or burn capacity'"),
  ("'Because brokers delete messages after three attempts'", "'Because brokers delete any message after three failed deliveries'"),
  ("'To make every message arrive exactly once'", "'To turn at-least-once delivery into exactly-once'"),
  ("'What should happen to a message after its final failed attempt?'", "'The consumer has tried a message five times and it still fails. Where should it go next?'"),
  ("'Put it back at the head of the queue'", "'Put it back at the head of the queue for another try'"),
  ("'Process them by hand in the database'", "'Apply them by hand with SQL updates in the orders database'"),
  ("'Both writes are kept as conflicting copies'", "'Both writes are kept side by side as two conflicting copies'"),
  ("'Round timestamps to whole seconds to hide skew'", "'Round each timestamp to the nearest second so skew is hidden'"),
  ("'Extend every lease to 60 s to be safe'", "'Extend each lease to 60 s so it cannot expire mid-write'"),
  ("'400 Bad Request, as the client sent too much'", "'400 Bad Request, as the client sent too many requests'"),
  ("'Rejection late in the request is more polite'", "'A late rejection gives the client a more detailed error message'"),
  ("'An early rejection costs almost nothing; late ones waste capacity'", "'An early rejection is cheap; a late one wastes capacity'"),
  ("'A larger buffer sized for the worst day'", "'A larger in-memory buffer sized for the busiest day of the year'"),
 ],
}
for f, pairs in R.items():
    s = open(f).read()
    for a, b in pairs:
        n = s.count(a)
        assert n == 1, (f, a[:60], n)
        s = s.replace(a, b)
    open(f, 'w').write(s)
print('applied', sum(len(v) for v in R.values()))
