"""Quality pass, Databases (round 5): recall stems become scenarios, thin explanations say why each
wrong option fails. Facts checked against the PostgreSQL and MySQL manuals (see each lesson's sources)."""

P = {
    261: {'q': {
        't261-a2': {
            'prompt': 'orders.customer_id has a foreign key to customers.id with the default delete rule. Support tries to delete customer 7, who still has three orders. What happens?',
            'choices': [('a', 'Customer 7 and all three orders are deleted together'),
                        ('b', 'The delete fails while orders still reference customer 7'),
                        ('c', 'Customer 7 goes; the orders keep customer_id = 7'),
                        ('d', 'Customer 7 goes; the orders get customer_id = NULL')],
            'correct': 'b',
            'explanation': 'The default rule (NO ACTION, or RESTRICT) refuses to delete a parent that child rows still reference, so the foreign key keeps every order’s customer real. Deleting the orders too needs ON DELETE CASCADE, and nulling the column needs ON DELETE SET NULL; both must be declared. Leaving orders pointing at a missing customer is exactly what a foreign key exists to prevent.'},
        't261-a5': {'explanation': 'The parent table must exist before a foreign key can point at it, so customers comes first, then orders, then the link with its delete rule. The index on orders.customer_id can be created before or after the foreign key; PostgreSQL does not create it for you, and without it every customer delete scans orders to check for children.'},
        't261-a6': {'explanation': 'References copy the primary key into every child row, so it must never change: a generated id stays put when the email changes, and a unique constraint still stops two accounts sharing an email. Email as the key forces every referencing row to change with it, and a table with no primary key cannot be referenced safely at all.'},
    }},
    262: {'q': {
        't262-a2': {
            'prompt': 'A report must list customers with more than 5 orders. WHERE COUNT(*) > 5 fails with an error about aggregates. Where does the condition belong?',
            'choices': [('a', 'In HAVING, after GROUP BY customer_id'),
                        ('b', 'In WHERE, with the count moved into SELECT'),
                        ('c', 'In the ON clause of the join to orders'),
                        ('d', 'In ORDER BY, followed by a LIMIT of 5')],
            'correct': 'a',
            'explanation': 'WHERE runs on single rows before grouping, when no per-customer count exists yet, which is why it rejects the aggregate. HAVING runs after GROUP BY and can test COUNT(*). An ON condition also works row by row, and sorting then taking 5 rows returns the top five customers, not those above five orders.'},
        't262-a5': {'explanation': 'Rows are gathered and joined (FROM, JOIN), filtered one by one (WHERE), grouped, filtered as groups (HAVING), projected (SELECT) and finally sorted and cut (ORDER BY, LIMIT). That is why a SELECT alias cannot be used in WHERE, and an aggregate test cannot go in WHERE either. The planner may execute in another physical order, but the result must match this logical one.'},
    }},
    263: {'q': {
        't263-a1': {
            'prompt': 'Orders store the customer’s city on every row. A customer moves and support edits only their latest order. Next month a sales-by-city report counts them in two cities. Which design change prevents this?',
            'choices': [('a', 'Store the city once on customers and join orders to it'),
                        ('b', 'Add a nightly job that copies the newest city everywhere'),
                        ('c', 'Add an index on the city column of orders'),
                        ('d', 'Make the city column on orders NOT NULL')],
            'correct': 'a',
            'explanation': 'One fact copied onto many rows invites an update anomaly: any write that misses a copy leaves the data contradicting itself. Storing the city once on the customer removes the copies. A nightly sync narrows the window but the report can still run in it, an index only speeds lookups, and NOT NULL stops missing values, not conflicting ones. If the city at the time of each order matters, store it as a separate, deliberate fact.'},
        't263-a5': {'explanation': 'Each normal form assumes the previous one: first split lists into rows (1NF), then move columns that depend on only part of a composite key (2NF), then columns that depend on another non-key column (3NF). Foreign keys link the new tables, and checking the main queries confirms the joins are acceptable before you ship.'},
        't263-a6': {'explanation': 'With reads 1,000 times more common than new reviews, counting on every view repeats the same work; a counter updated in the same transaction as the review insert is cheap and may lag only if you choose to update it asynchronously. Reviews stay the source of truth, so a job can rebuild the count if it drifts. Copying the full review list onto the product row makes every new review rewrite a large row and duplicates every review.'},
    }},
    264: {'q': {
        't264-a2': {
            'prompt': 'A team adds a hash index on products.price, hoping to speed up “price between ₹500 and ₹1,000” filters. Will the planner use it for that filter?',
            'choices': [('a', 'Yes, hash lookups are faster than B-tree lookups'),
                        ('b', 'Yes, once ANALYZE has run on the table'),
                        ('c', 'No, a hash index serves only equality'),
                        ('d', 'No, hash indexes are ignored for numeric columns')],
            'correct': 'c',
            'explanation': 'A hash index stores buckets of hashed values with no order, so it can answer price = 750 but not a range. A B-tree keeps keys sorted and serves both. Speed of a single lookup is irrelevant when the index cannot answer the question, statistics do not add range support, and hash indexes work on numbers as well as text.'},
        't264-a4': {'explanation': 'An 8 KB page holds hundreds of keys, so each level multiplies the reach by hundreds: three levels cover tens of millions of entries and four cover billions. Keys are not squeezed into one level, the tree is never flattened nightly (it rebalances as it splits pages), and an index holds an entry for every row, not a sample.'},
        't264-a5': {'explanation': 'A lookup starts at the root, follows the pointer for the key’s range through inner pages to a leaf, finds the key there and then fetches the table row, unless the index already holds every column the query needs. With three or four levels that is a handful of page reads, most of them usually already in memory.'},
    }},
    265: {'q': {
        't265-a4': {
            'prompt': "To see why a cleanup was slow, a colleague runs EXPLAIN ANALYZE DELETE FROM sessions WHERE created_at < now() - interval '30 days' on production. What did that do?",
            'choices': [('a', 'Showed the estimated plan without touching any rows'),
                        ('b', 'Ran the delete in a snapshot and rolled it back'),
                        ('c', 'Deleted the rows, then printed the actual plan'),
                        ('d', 'Locked the rows but deleted nothing until COMMIT')],
            'correct': 'c',
            'explanation': 'EXPLAIN ANALYZE executes the statement to measure it, so the old sessions are really gone (in autocommit mode the delete commits at once) and any delete triggers fired. Plain EXPLAIN only plans. Nothing rolls back automatically; to measure a write safely, wrap it in BEGIN … ROLLBACK or run it on a copy.'},
        't265-a5': {'explanation': 'The text is parsed into a tree, the rewriter expands views and rules, the planner estimates costs and chooses a plan, the executor runs it, and rows stream back to the client. The planner cannot choose until it knows which tables the views really touch, which is why rewriting comes before planning.'},
    }},
    266: {'q': {
        't266-a4': {
            'prompt': 'A PostgreSQL import inserts 10,000 rows in one transaction. Row 4,200 breaks a unique constraint. You want to skip bad rows and still commit the rest together. What do you use?',
            'choices': [('a', 'Catch the error in the app and carry on inserting'),
                        ('b', 'A savepoint before each row, rolled back on error'),
                        ('c', 'Autocommit, so each row commits on its own'),
                        ('d', 'Read Uncommitted, so the error is not raised')],
            'correct': 'b',
            'explanation': 'After any error PostgreSQL marks the whole transaction aborted and rejects every later statement until it rolls back, so catching the error is not enough. ROLLBACK TO SAVEPOINT undoes just the failed row and lets the transaction continue. Autocommit gives up committing the rows together, and isolation levels do not suppress constraint errors. For large imports, a savepoint per batch of rows is cheaper than one per row.'},
        't266-a6': {'explanation': 'A database transaction cannot include the payment provider, and wrapping the call holds locks and a connection for seconds. Reserving stock in one short transaction, charging outside it with an idempotency key, then confirming or releasing in a second short transaction keeps locks brief, and a stored reservation lets a job reconcile a charge whose reply was lost.'},
    }},
    267: {'q': {
        't267-a2': {
            'prompt': 'In PostgreSQL with default settings, a transaction runs SELECT SUM(balance) twice while another session commits a transfer in between. Do the two sums match?',
            'choices': [('a', 'Yes: one snapshot covers the whole transaction'),
                        ('b', 'Not necessarily: each statement gets a fresh snapshot'),
                        ('c', 'No: the second one waits, then fails with an error'),
                        ('d', 'Yes: the transfer waits until the sums are done')],
            'correct': 'b',
            'explanation': 'PostgreSQL defaults to Read Committed, where every statement sees data committed before that statement began, so the second sum can include the transfer. One snapshot for the whole transaction is Repeatable Read, which you must request. Readers do not block writers under MVCC, and no error is raised at Read Committed.'},
        't267-a7': {'explanation': 'InnoDB’s consistent snapshot applies to plain SELECTs. An UPDATE reads the latest committed row instead, so T1 writes the 9 it computed from its stale read and T2’s decrement disappears: a lost update, with no error and no wait because T2 has already committed. Use an atomic SET stock = stock - 1, or read with SELECT … FOR UPDATE, to prevent it.'},
    }},
    268: {'q': {
        't268-a3': {
            'prompt': 'Two requests try to book seat 12. Each runs BEGIN, then SELECT … FROM seats WHERE id = 12 FOR UPDATE. The first gets the row and is still checking it. What does the second do?',
            'choices': [('a', 'Reads the old row at once, so both can book the seat'),
                        ('b', 'Fails immediately with a lock error'),
                        ('c', 'Waits, then reads the row as the first left it'),
                        ('d', 'Blocks every other read of the seats table')],
            'correct': 'c',
            'explanation': 'FOR UPDATE takes a row lock held until COMMIT or ROLLBACK, so the second request waits; when the first commits, PostgreSQL (at Read Committed) hands it the updated row, and it sees the seat taken. It fails at once only with NOWAIT. Plain SELECTs from other sessions are not blocked at all under MVCC, and other rows stay writable.'},
        't268-a5': {'explanation': 'The lock must be taken before the check, inside the transaction: BEGIN, SELECT … FOR UPDATE, check it is free, UPDATE, COMMIT. Checking first and locking later leaves a gap in which another request can book the same seat.'},
        't268-a6': {'explanation': 'An ALTER that waits for its exclusive lock blocks every later query on the table, so an unbounded wait behind a long report can become an outage. A short lock_timeout (say 2 seconds) makes it give up quickly and retry in a quieter moment. Killing every session discards users’ work and is unnecessary once the wait is time-boxed.'},
    }},
    269: {'q': {
        't269-a4': {
            'prompt': 'To cut background write I/O, a team raises the checkpoint interval from 5 to 30 minutes. What is the trade-off?',
            'choices': [('a', 'Less background writing, but slower crash recovery'),
                        ('b', 'Commits are no longer durable until a checkpoint'),
                        ('c', 'Faster crash recovery, and less background writing too'),
                        ('d', 'The WAL can be switched off between checkpoints')],
            'correct': 'a',
            'explanation': 'A page changed many times between checkpoints is written once instead of several times, and fewer full-page images go to the log. But recovery replays all WAL since the last checkpoint, so up to 30 minutes of log must be replayed after a crash instead of 5. Commits stay durable because the log is still flushed at each commit, and the log cannot be skipped; it is what recovery replays.'},
        't269-a5': {'explanation': 'Changes are made to pages in memory and described in WAL records; those records are flushed to stable storage before the client hears “committed”. The changed pages themselves reach the data files later, at a checkpoint or by the background writer, because recovery can rebuild them from the log.'},
    }},
    270: {'q': {
        't270-a1': {
            'prompt': 'A payments primary adds a synchronous standby in another zone, 2 ms away. What does each commit now cost, and what does it buy?',
            'choices': [('a', 'One extra round trip; failover to it loses no commits'),
                        ('b', 'Nothing extra; the standby catches up in the background'),
                        ('c', 'A full table copy; failover loses at most one second'),
                        ('d', 'A lock on the standby; reads on it stop during commits')],
            'correct': 'a',
            'explanation': 'The primary waits until the standby confirms it has flushed the commit’s WAL before replying, so each commit gains about one round trip (here roughly 2 ms) and a failover to that standby loses no acknowledged commit. Catching up in the background describes asynchronous replication, which can lose recent commits. Replication streams log records, not tables, and the standby keeps serving reads.'},
        't270-a5': {'explanation': 'The primary flushes its own WAL and streams it to the standby; it reports success only after the standby confirms its flush. If the standby is unreachable, commits wait, which is why synchronous setups usually name two or more candidate standbys.'},
    }},
    272: {'q': {
        't272-a3': {'explanation': 'Each batch is a short transaction, so row locks, dead row versions and log volume stay small, and replicas can keep up between batches. One UPDATE over 20 million rows holds locks on all of them until it commits, writes a burst of WAL that replicas must replay, and leaves 20 million dead versions for VACUUM. There is no row limit on one UPDATE, a single statement is atomic, and batches still write to the log.'},
        't272-a4': {
            'prompt': 'A developer edits migration 0042, already applied in production, to change a column’s default. The change works locally on a fresh database. What happens in production?',
            'choices': [('a', 'The tool reruns 0042 because its file changed'),
                        ('b', 'Nothing: 0042 is recorded as applied, so prod drifts'),
                        ('c', 'Production rolls back 0042 and applies it again'),
                        ('d', 'The tool applies only the changed line from 0042')],
            'correct': 'b',
            'explanation': 'A migration tool records which versions ran and never runs them again, so production keeps the old default while fresh environments get the new one. Some tools detect the edit through a checksum and refuse to continue, which at least surfaces the problem. Tools do not roll back or apply a diff of a file; write a new migration, 0043, for every change.'},
        't272-a5': {'explanation': 'Expand, then migrate, then contract: add the new column, write to both, backfill old rows in batches, switch reads to the new column, and only when no running code uses the old column, stop writing it and drop it. Each step works with both the old and the new application version, so a rolling deploy never breaks.'},
    }},
    273: {'q': {
        't273-a2': {
            'prompt': 'The post list above makes 1 query for posts and 100 for their authors. Which change keeps it at 2 queries however many posts are shown?',
            'choices': [('a', 'Load all the authors in one query, with IN or a join'),
                        ('b', 'Increase the database connection pool size'),
                        ('c', 'Cache each author query for one second'),
                        ('d', 'Add an index on the posts.title column')],
            'correct': 'a',
            'explanation': 'Fetching every author in one query, with WHERE id IN (…) or a join, makes the query count constant whatever the page size. A bigger pool or a per-author cache still pays one round trip per author on a cold cache, and an index on posts.title does nothing for the author lookups.'},
        't273-a5': {'explanation': 'Run the list query, collect the distinct author ids, fetch all of them in one query, index the results by id in memory and attach each one to its post. Two round trips replace N + 1, and the in-memory lookup costs microseconds.'},
    }},
    621: {'q': {
        't621-a7': {'explanation': 'Plan reuse pays off when a statement runs thousands of times a second. At 50 runs a minute, a custom plan costs 2 ms × 50 = 0.1 s of planning per minute and always fits the region asked for, so small regions get index scans and the big one gets a scan. A forced generic plan fits one of them badly, and inlining values gives up the protection that parameters bring.'},
    }},
    624: {'q': {
        't624-a7': {'explanation': 'At 20,000 statements a second, logging every one costs real I/O and produces more log than anyone reads. Statement statistics aggregate all of them for almost nothing and show where total time goes; a slow log at about 500 ms and sampled plan logging capture concrete outliers to explain. Waiting for complaints finds problems only after users do.'},
    }},
}
