"""Quality fixes for the original Databases lessons (261-274) in scripts/authored/fund-databases.json.

Idempotent: every fix sets a field to its final value. Run: python3 scripts/authoring/more3/db_fixes.py
"""
import json, os, re

PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'authored', 'fund-databases.json')
FIXES = []  # human-readable log, printed at the end

def card(t, n, title=None, body=None, teaches=None, why=''):
    return ('card', t, n, dict(title=title, body=body, teaches=teaches), why)

def q(t, n, why='', **fields):
    return ('q', t, n, fields, why)

def choices(*pairs):
    return [{"id": k, "label": v} for k, v in pairs]

EDITS = [
 # ---- 261
 card(261, 6, 'Edge case: a cascade that reaches further than expected',
  'ON DELETE CASCADE removes child rows when the parent goes, and their children too if those foreign keys also cascade. Deleting one customer can then remove orders, order items, payments and shipment records in a single statement, locking each row and writing each removal to the log. A mistaken delete becomes a large, silent one. '
  'Cascade only into rows that are truly part of the parent, such as an order\'s line items. Use RESTRICT, or a soft delete, for records with a life of their own, such as invoices and payments. And index the referencing columns, or every parent delete scans the child tables to find matches.',
  ['relational-model', 'foreign-keys'],
  'c6 repeated c5 (NULLs in a unique column); replaced with a cascade-chain edge case'),
 q(261, 4, 'a4 distractors were not plausible (API request, screen, file); replaced with real modelling mistakes',
   choices=choices(('a', 'One fact about one entity or relationship'),
                   ('b', 'One order, with its line items kept as a list in a column'),
                   ('c', 'Whatever one screen of the application needs to show'),
                   ('d', 'One customer plus a copy of their latest order details')),
   explanation='A table describes one kind of thing, and each row states one fact about one instance of it, such as one order or one order line. '
   'A list of line items in a column breaks first normal form: items can no longer be queried, constrained or referenced individually. '
   'Shaping tables around screens couples storage to today\'s interface, and copying the latest order onto the customer row creates two copies of the same fact that drift apart.'),
 # ---- 262 (quotes fixed globally below)
 # ---- 264
 card(264, 5, body='Every index gets a new entry on every insert, and takes disk and memory. Updates depend on the engine. In PostgreSQL, an update that cannot be done as a heap-only (HOT) update, because an indexed column changed or the page had no room, adds an entry to every index on the table, including indexes on columns that did not change. In InnoDB, a secondary index changes only when its own columns, or the primary key, change. '
  'Unused indexes slow writes for nothing. Index for the queries you actually run, and drop indexes the usage statistics show are never scanned.',
  why='Trap card said indexes change only on updates that touch their columns; that is wrong for PostgreSQL non-HOT updates'),
 # ---- 265
 card(265, 5, body='EXPLAIN only plans; EXPLAIN ANALYZE actually executes the statement to measure it. On an INSERT, UPDATE or DELETE that means the data really changes, and triggers fire. Wrap it in BEGIN … ROLLBACK, or run it on a copy.',
  why='c5 contained a sentence fragment'),
 q(265, 1, 'a1 distractors leaned on absolute words; replaced with real misconceptions',
   choices=choices(('a', 'The planner uses indexes only for equality, not for ranges'),
                   ('b', 'Stale statistics hid the index from the planner'),
                   ('c', 'Reading in order beats millions of random lookups'),
                   ('d', 'The index must be corrupted and needs rebuilding')),
   explanation='At 40% selectivity an index scan would make millions of random page reads, often touching each page several times, while a sequential scan reads every page once in order. The planner\'s cost model sees that and picks the scan. '
   'B-tree indexes serve ranges as well as equality. Statistics change the planner\'s row estimates, not whether it knows an index exists. A corrupted index produces errors or wrong results, not a sensible plan choice.'),
 # ---- 266
 q(266, 2, 'a2 was a definition-recall question; turned into a scenario that also asks what makes the property hold',
   prompt='The database reports COMMIT succeeded, and the server loses power one second later. After restart the change is still there. Which property is that, and what made it hold?',
   choices=choices(('a', 'Durability: its log records reached disk before COMMIT returned'),
                   ('b', 'Atomicity: every statement in the transaction applied together'),
                   ('c', 'Consistency: the constraints were checked before commit'),
                   ('d', 'Isolation: other sessions could not see it before commit')),
   explanation='Durability is the promise that a reported commit survives a crash, and the write-ahead log keeps it: COMMIT returns only after the transaction\'s log records are flushed, so recovery can replay them even if the table pages never reached disk. '
   'Atomicity means all or nothing, consistency means constraints hold, and isolation limits what concurrent transactions see. All three are true here too, but none of them explains surviving the power cut.'),
 # ---- 268
 card(268, 6, 'Edge case: inserting a child row locks the parent',
  'A foreign key check locks the parent row it reads. In PostgreSQL, inserting an order takes a key-share lock on its customer row until the transaction ends; that blocks deleting the customer or changing its key, but not ordinary updates. '
  'InnoDB takes a shared lock on the parent record for the check. So two transactions that each insert an order and then update the same customer row, say to bump an order count, each hold a shared lock the other\'s update needs: a deadlock. '
  'Keep such transactions short, update the parent before inserting children, or drop the stored count.',
  ['row-locks'],
  'c6 repeated c4 (long transactions block cleanup); replaced with the foreign-key parent-lock edge case'),
 q(268, 3, 'a3 distractors were easy to rule out; replaced with common misunderstandings',
   choices=choices(('a', 'Locks the whole table against writes until commit'),
                   ('b', 'Locks those rows until commit or rollback'),
                   ('c', 'Locks the rows only while the SELECT itself runs'),
                   ('d', 'Stops other sessions from reading those rows at all')),
   explanation='FOR UPDATE takes row locks on exactly the rows returned and keeps them until COMMIT or ROLLBACK, so another transaction that wants to update, delete or lock them FOR UPDATE waits. '
   'Other rows of the table stay writable. Releasing the locks when the SELECT finishes would defeat the purpose, since the check-then-write pattern needs them held until the write. '
   'Under MVCC, plain SELECTs by other sessions are not blocked; they read the last committed version.'),
 # ---- 269
 card(269, 6, 'Edge case: log files that can never be removed',
  'Old log segments are recycled after a checkpoint, but only once nothing still needs them. Two things can keep them indefinitely: a replication slot whose consumer has gone away, such as a decommissioned replica or a switched-off change-data-capture tool, and log archiving that keeps failing. '
  'The log directory then grows until the disk fills, and a database that cannot write its log stops accepting writes. '
  'Alert on slot lag and archive failures, drop slots nobody uses, and in PostgreSQL 13 and later cap what a slot may hold with max_slot_wal_keep_size.',
  ['write-ahead'],
  'c6 repeated c5 (volatile disk caches); replaced with the retained-WAL disk-full edge case'),
 q(269, 2, 'a2 tested the write-ahead idea but was tagged crash-recovery; retagged, and the explanation now covers the distractors',
   concept='write-ahead',
   choices=choices(('a', 'Table pages are read-only once they are created'),
                   ('b', 'One sequential append beats many random writes'),
                   ('c', 'The log can be flushed lazily, unlike table pages'),
                   ('d', 'Writing the log lets the database skip index updates')),
   explanation='A commit may change pages scattered all over the table and its indexes. Flushing all of them would mean many random writes per commit, while appending a few log records is one sequential write, and many commits can share one flush. Pages are written later in the background, and the log rebuilds them after a crash. '
   'Pages are changed in place all the time. It is the log that must be flushed at commit; pages are the ones written lazily. Indexes are still updated; the log records those changes too.'),
 # ---- 272
 card(272, 6, 'Edge case: SET NOT NULL scans the whole table',
  'Adding NOT NULL to an existing column makes the database check every row, and in PostgreSQL it holds an exclusive lock while it scans, so a large table is unavailable for the duration. '
  'In PostgreSQL 12 and later, split it up: add CHECK (col IS NOT NULL) NOT VALID, which is instant; run VALIDATE CONSTRAINT, which scans without blocking reads or writes; then SET NOT NULL, which sees the validated check and skips the scan; finally drop the now-redundant check.',
  ['migrations'],
  'c6 repeated 268-c5 (an ALTER queued behind a long query); replaced with the SET NOT NULL validation pattern'),
 # ---- 274
 card(274, 6, 'Edge case: pooled connections that died silently',
  'A connection sitting idle in a pool can be cut without either end noticing: a firewall, NAT gateway or load balancer drops flows that stay idle too long (AWS NAT gateways, for example, after 350 seconds), or the database restarts or fails over. '
  'The pool finds out only when a request borrows the dead connection and its query errors or hangs until a timeout. '
  'Set the pool\'s idle timeout and maximum connection lifetime below the network\'s idle cutoff, enable TCP keepalives, and validate connections on borrow or retry once on a connection error.',
  ['pooling'],
  'c6 repeated c3 (pools multiplied by instances); replaced with the silently-dropped idle connection edge case'),
]

# Fuller explanations: each now says why the answer is right and why the tempting options are wrong.
EXPL = {
 't261-a1': 'Only the database sees both inserts, so only a unique constraint can reject the second one reliably. A check in the handler races: both requests can look, find no account, and insert. Browser validation checks the format, not duplicates, and a unique index on id does nothing for email.',
 't261-a2': 'A foreign key guarantees referential integrity: every orders.customer_id matches an existing customers.id, at insert and on parent delete. It says nothing about id reuse, physical storage order, or customers having orders; a customer with no orders is perfectly valid.',
 't261-a3': 'Primary keys are copied into every referencing row, so a key that changes forces updates everywhere it is used. Use a stable surrogate id and a unique constraint on email. Indexes handle email-length strings fine, keys need not be integers, and uniqueness of email is a reason for a unique constraint, not a reason against using it as a key.',
 't262-a1': 'A left join keeps every row from the left table and fills the right side with NULLs when nothing matches, so customers without orders stay. An inner join drops them, orders LEFT JOIN customers keeps orders rather than customers, and a cross join pairs every customer with every order.',
 't262-a2': 'WHERE filters rows before grouping, when COUNT(*) per group does not exist yet. HAVING filters after the groups are formed, so it can test aggregates. FROM and ON only name tables and match rows.',
 't262-a3': 'COUNT(column) counts non-NULL values, and the unmatched customer\'s orders.id is NULL, so the result is 0. COUNT(*) would count the row itself and give 1. Counting NULLs is not an error, and COUNT never returns NULL.',
 't262-a4': 'Joining order_items repeats each order row once per item, so SUM(orders.total) adds the same total several times. Sum item amounts instead, or aggregate items in a subquery before joining. An inner join that drops orders without items would lower revenue, NULL handling would too, and sorting does not change sums.',
 't263-a1': 'The city is one fact copied onto many rows, so a move must update every copy, and missing one leaves the data contradicting itself: an update anomaly. Deadlocks and phantom reads are concurrency effects, and a delete anomaly is losing facts when rows are deleted.',
 't263-a2': 'The key is (order_id, product_id), and product_name depends on product_id alone, part of the key: a second normal form violation. The table is not fully normalised, it holds single values rather than lists so first normal form is fine, and third normal form concerns dependencies between non-key columns.',
 't263-a3': 'The price paid at purchase is a historical fact, different from the current list price, so storing it on the order line is correct modelling, not duplication. Copies are not always harmless, it breaks no normal form, and moving it to products would lose what customers were charged.',
 't263-a4': 'When customer details live only on order rows, deleting the last order deletes the only record of the customer: a delete anomaly. Nothing archives the data, a cache is not a source of truth, and there is no customer row for a foreign key to protect.',
 't264-a1': 'A composite B-tree is sorted by customer_id first, then created_at, so an equality on customer_id plus a range on created_at reads one contiguous slice. Filters on status or total cannot use it at all, and created_at alone skips the leading column, so the database cannot seek into the tree.',
 't264-a2': 'A hash index maps each value to a bucket and keeps no order, so it answers equality only. A BETWEEN range needs ordered keys, which a B-tree provides. The three equality lookups are exactly what a hash index serves.',
 't264-a3': 'Each insert must add an entry to every one of the 12 indexes, so write cost grows with the index count. Inserts do not lock the whole table or make it read-only, and the planner does not scan indexes to insert; it updates each one directly.',
 't264-a4': 'An 8 KB page holds hundreds of keys, so each level multiplies the reach by hundreds: three levels reach tens of millions of entries and four reach billions. Nothing keeps the whole table in memory, trees are not rebuilt into one level, and indexes contain every row, not a sample.',
 't265-a2': 'With 20 outer rows and an index on the join column, a nested loop does 20 index probes and touches a handful of pages. A hash join would read all 50 million rows to build or probe, a merge join would sort both inputs first, and a cross join builds every pair before filtering.',
 't265-a3': 'Estimates come from table statistics, so a 10 versus 2 million gap usually means statistics are stale or too coarse for the data, and the planner then picks a nested loop or index scan suited to 10 rows. Memory, index count and join type change speed, not the row estimate itself. Run ANALYZE and recheck.',
 't265-a4': 'EXPLAIN ANALYZE runs the statement and shows actual rows, loops and time beside each estimate, which is how you spot misestimates. Plain EXPLAIN shows the plan without running it. Neither suggests indexes nor rewrites the query.',
 't266-a1': 'Without BEGIN, autocommit makes each statement its own transaction, so the first update committed when it finished and only the second failed. The database does not retry it or roll back earlier statements, and there was no batch transaction to undo. Wrap related statements in one transaction.',
 't266-a3': 'The row lock and the connection are held for the whole 4-second call, so other writers to that order wait and the pool loses a connection for that time. Do the external call outside the transaction. The provider never sees uncommitted data, rollback still works, and durability is unaffected.',
 't266-a4': 'A savepoint marks a point inside a transaction; ROLLBACK TO SAVEPOINT undoes only what came after it, and the transaction carries on. It cannot be shared across connections, does not bypass the log, and nothing is committed until the outer COMMIT.',
 't267-a1': 'The same row returned a different value within one transaction because another transaction committed in between: a non-repeatable read. A dirty read would see uncommitted data, a phantom is a new row appearing in a repeated range query, and a deadlock is two transactions waiting on each other.',
 't267-a2': 'PostgreSQL defaults to Read Committed: each statement sees a fresh snapshot of data committed before it started. Repeatable Read and Serializable must be requested explicitly, and asking for Read Uncommitted in PostgreSQL behaves like Read Committed.',
 't267-a3': 'Each doctor read the same on-call count, then updated a different row, so no row-level conflict was detected and the rule broke: write skew. Nothing read uncommitted data, no new rows were inserted, and the two transactions wrote different rows, so it is not a lost update on one row.',
 't267-a4': 'A serialisation failure rolls back the whole transaction, so the app must rerun all of it, re-reading the data its decisions were based on. Retrying one statement continues a transaction that no longer exists, nothing was saved, and lowering isolation removes the protection rather than fixing the conflict.',
 't268-a1': 'Under MVCC each update writes a new row version, and the report keeps reading the versions its snapshot saw, so readers and writers do not block each other. It never sees half-updated rows, and neither side waits for the other.',
 't268-a2': 'A deadlock needs a cycle of waits. If every transfer locks the lower account id first, two transfers on A and B queue for the same first lock instead of each holding one. Longer timeouts only delay detection, locking after updating is impossible, and Read Uncommitted does not change row locking.',
 't268-a4': 'An open transaction\'s snapshot may still need old row versions, so cleanup cannot remove anything newer than it, across the whole database, and tables and indexes bloat. The log is not deleted, other writes continue, and indexes are not rebuilt. Set an idle-in-transaction timeout.',
 't269-a1': 'At commit only the WAL records must be flushed; changed table and index pages can stay in memory because recovery can rebuild them from the log. Flushing every page would make commits slow, and backups are a separate process entirely.',
 't269-a3': 'Asynchronous commit returns before the log is flushed, so a crash can lose the last fraction of a second of transactions that were reported as committed. The database stays consistent: no corruption, no uncommitted work becoming committed, and only recent commits are at risk.',
 't269-a4': 'Fewer checkpoints mean pages are flushed less often, but recovery must replay all the log written since the last checkpoint, so it takes longer. Commits stay durable because the log is still flushed at commit, and the log remains essential.',
 't270-a1': 'With synchronous replication the primary waits for a standby to confirm it has the commit\'s log records before telling the client, so a failover to that standby loses nothing. It does not write a second log, copy tables or lock replicas; the cost is one extra network round trip per commit.',
 't270-a2': 'Asynchronous replicas apply changes a little after the primary, so a read right after a write can miss it: replication lag. Read your own recent writes from the primary or wait for the replica to catch up. Nothing went to the wrong table or rolled back, and replicas do not cache results for a day.',
 't270-a3': 'Logical replication sends row changes, so the target can run a newer major version; you switch over once it has caught up. Physical replication, synchronous or not, copies the binary pages, which requires the same major version, and restoring last night\'s backup loses a day and takes long.',
 't270-a4': 'Replicas copy every change, including the mistaken DELETE, within moments; a synchronous standby copies it before the commit even returns. Only a backup with point-in-time recovery can bring the database back to just before the delete. Increasing lag merely delays the damage.',
 't271-a1': 'Get by id and delete by id are single-key operations, which is exactly what a key-value store is built for, usually with expiry too. Graph, document-with-indexes and wide-column models add capabilities this workload never uses.',
 't271-a2': 'Wide-column stores answer queries from one partition and cannot join, so each access pattern gets its own table keyed for it, and the message is written to both. Scanning a chat table filtered by user reads every partition, one partition for everything grows without bound, and joins are not available.',
 't271-a3': 'Friends of friends who like a band is a multi-hop traversal over relationships, which graph databases store as direct links. Latest log lines suit time-series or wide-column stores, get-by-id suits key-value stores, and monthly totals suit relational or columnar analytics.',
 't271-a4': 'When the questions keep changing, a relational database answers new ones with new queries and indexes on the same normalised data. Key-value and wide-column stores are modelled around known queries, so new ones mean new tables and backfills, and graph databases fit traversals, not general reporting.',
 't272-a1': 'Expand first: add display_name next to fullname, so old code keeps working while new code starts using the new column. A one-statement rename breaks every running server that still reads fullname, dropping the column loses data, and stopping all servers is the downtime the plan avoids.',
 't272-a2': 'CREATE INDEX CONCURRENTLY builds the index while allowing writes, at the cost of a slower build and two table scans. ADD INDEX syntax with a lock, a build inside a long transaction, or VACUUM FULL all hold locks that block writes on a busy table.',
 't272-a4': 'A migration tool records applied versions in a table, so each migration runs exactly once and in the same order in every environment. Random order, per-environment scripts or editing applied migrations all make environments drift apart.',
 't273-a1': 'One query for the list followed by one query per row is the N+1 pattern: 101 round trips where 2 would do. Pooling, deadlock retries and replication lag do not multiply queries per row like this.',
 't273-a2': 'Fetching all authors in one query, with WHERE id IN (…) or a join, makes the query count constant whatever the page size. A bigger pool or per-author caching still pays one round trip per author, and an index on posts.title does not touch the author lookups.',
 't273-a3': 'The number of queries a request makes is deterministic, so a test can assert it and fail when an N+1 sneaks in. Status codes pass with any query count, laptop timings are noisy, and database CPU depends on everything else running.',
 't273-a4': 'Extra latency is paid once per round trip, so 2 ms more turns into 402 ms more for the 201-query page and only 2 to 4 ms for the batched and join pages. That is why the slowdown is not equal across pages.',
 't274-a1': 'A new PostgreSQL connection needs a TCP handshake, often TLS, authentication, and a new server process that loads its caches, which can cost several milliseconds. Pooling pays that once. The database is not copied per connection, and connections run many queries over their life.',
 't274-a2': 'Little\'s law: busy connections = arrival rate × time each is held = 1,000 a second × 0.015 s = 15. 1,000 is the query rate, 150 multiplies by 0.15 s, and 67 divides 1,000 by 15.',
 't274-a3': '40 instances × 10 connections want 400, but the server allows 200, so connection attempts beyond the limit are refused and requests fail. Instances do not share connections, the limit does not rise by itself, and pools do not shrink to fit. Size pools from the limit, or add a shared pooler.',
 't274-a4': 'Once the database\'s CPU, disk or locks are saturated, extra concurrent queries queue for the same resources and add contention, so each takes longer. Pooled connections do run in parallel, pool size has nothing to do with query caching, and there is no 64-connection limit.',
}

def main():
    with open(PATH) as f:
        topics = json.load(f)
    by_id = {t['id']: t for t in topics}
    for kind, tid, n, fields, why in EDITS:
        t = by_id[tid]
        if kind == 'card':
            c = next(c for c in t['cards'] if c['id'] == f't{tid}-c{n}')
            for k, v in fields.items():
                if v is not None:
                    c[k] = v
        else:
            x = next(x for x in t['questions'] if x['id'] == f't{tid}-a{n}')
            x.update(fields)
        FIXES.append(f'{tid} {kind} {n}: {why}')
    qs = {x['id']: x for t in topics for x in t['questions']}
    for qid, e in EXPL.items():
        qs[qid]['explanation'] = e
    FIXES.append(f'Expanded {len(EXPL)} one-line explanations so each covers the tempting options')
    # Typographic apostrophes used as SQL string quotes: ’paid’ -> 'paid'
    raw = json.dumps(topics, ensure_ascii=False)
    fixed, n = re.subn(r"(?<=[\s(=])’([^’\"]{1,30})’", r"'\1'", raw)
    if n:
        topics = json.loads(fixed)
    FIXES.append(f'Replaced {n} typographic-quote SQL literals with straight quotes')
    with open(PATH, 'w') as f:
        json.dump(topics, f, ensure_ascii=False, indent=1); f.write('\n')
    print('\n'.join(FIXES))

if __name__ == '__main__':
    main()
