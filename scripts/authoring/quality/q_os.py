"""Quality pass, Operating systems: symptoms and incidents to diagnose instead of definitions. Applied by apply.py."""

P = {
 287: {
  'q': {
   't287-a1': {'prompt': 'A team fixes a deadlock by making every code path take the orders lock before the payments lock. Which of the four conditions did they remove?',
    'choices': [('a', 'Hold-and-wait'), ('b', 'Circular wait'), ('c', 'Mutual exclusion'), ('d', 'No preemption')],
    'correct': 'b',
    'explanation': 'Threads still hold one lock while waiting for another, the locks are still exclusive and nothing takes them away. What changed is that no thread can hold payments while waiting for orders, so a cycle cannot form. Removing hold-and-wait would mean taking both locks at once or neither.'},
   't287-a2': {'prompt': 'At peak, an order service stops completing orders. The process is up, its health check still answers, CPU is at 2% and the order threads are all parked waiting for locks. What is the likely cause?',
    'choices': [('a', 'A deadlock between lock holders'), ('b', 'A livelock of threads retrying'), ('c', 'A busy loop on one core'), ('d', 'Memory used up by a leak')],
    'correct': 'a',
    'explanation': 'Deadlocked threads sleep, so CPU drops while the process stays up and unrelated threads such as the health check still answer. A livelock and a busy loop burn CPU, and a leak shows growing memory and out-of-memory kills, not threads parked on locks. A thread dump showing each thread waiting on a lock another holds confirms it.'},
   't287-a3': {'explanation': 'Livelock: the threads are active and burning CPU, but each backs off and retries in step with the other, so none progresses. A deadlock shows sleeping threads, priority inversion needs threads of different priorities, and a memory leak grows memory. Random jitter in the back-off breaks the lockstep.'},
   't287-a4': {'explanation': 'Ordering by direction (source first, or destination first) means transfer(X, Y) and transfer(Y, X) take the locks in opposite orders, so a cycle can form. A fixed global order such as the lower id first gives every pair one order. “Less busy” changes from moment to moment, so it is no order at all.'},
  },
 },
 289: {
  'q': {
   't289-a1': {'explanation': 'The kernel keeps the 2 GB of pages in memory after the first read, and with 16 GB free nothing evicts them. A drive’s own cache is tiny by comparison, and checksums and compression do not depend on whether the file was read before.'},
   't289-a2': {'prompt': 'A payments ledger appends each transaction to a file, then replies “success”. Power fails a second later. Which call, made before replying, makes sure the entry survives?',
    'choices': [('a', 'Calling close on the file'), ('b', 'write returning the byte count'), ('c', 'Opening the file in append mode'), ('d', 'Calling fsync on the file')],
    'correct': 'd',
    'explanation': 'write returns once the bytes are in the page cache, and close only releases the descriptor; neither waits for the device. Append mode controls where bytes go, not when they reach storage. fsync waits until the data and metadata are on stable storage, so only then is it safe to reply.'},
   't289-a3': {'prompt': 'A service updates settings.json in place by truncating it and writing 40 KB. A crash mid-write leaves an empty file and the service will not start. What makes the update crash-safe?',
    'choices': [('a', 'Write the file in smaller 4 KB pieces'), ('b', 'Write a temp file, fsync it, rename it over'), ('c', 'Call close straight after the last write'), ('d', 'Keep a copy of the settings in memory')],
    'correct': 'b',
    'explanation': 'rename atomically switches the name to a fully written, synced file, so after a crash readers see the old settings or the new ones, never a truncated mix; fsync the directory too so the rename itself survives. Smaller writes still leave a half-written file, close does not flush to storage, and a copy in memory is gone after the crash.'},
   't289-a4': {'explanation': 'Linux may already have dropped the dirty pages and cleared the error, so a second fsync can succeed with nothing written. Assume the data is lost and recover from a known-good copy or a log, as PostgreSQL does by crashing and replaying its write-ahead log. The failure can hit data, not just metadata, and the cache is no longer a safe copy.'},
  },
 },
 286: {
  'q': {
   't286-a1': {'explanation': 'Two threads can both read 5, both add 1 and both write 6, so one increment vanishes. The counter is ordinary shared memory, and threads share globals, which is the whole problem; nothing is skipping additions, the interleaving loses them.'},
   't286-a3': {'explanation': 'The lock is held for the whole call, so every thread that needs it queues for up to 300 ms, and the lock allows only about 3 such calls a second. Locks do not time out or pause during I/O by themselves. Copy what you need under the lock, release it, then call the API.'},
   't286-a4': {'prompt': 'A checkout race shows up once in a million test runs. During a sale, production handles 5 million checkouts a day. What should you expect?',
    'choices': [('a', 'It will not appear, as tests are harsher'), ('b', 'Several failures a day, likely more at peak'), ('c', '5 failures, one per million, every day'), ('d', 'No failures, as production servers are faster')],
    'correct': 'b',
    'explanation': 'At one in a million, 5 million checkouts is already about 5 a day, and real concurrency at peak usually makes the bad interleaving more likely, not less. A probability gives an expected count, not a fixed one, and faster or busier machines change the timing in ways that often expose races.'},
  },
 },
 285: {
  'q': {
   't285-a1': {'prompt': 'A server watches 5,000 sockets with epoll. The wait call returns 3 of them. What does that tell the server?',
    'choices': [('a', 'Three requests have been fully processed'), ('b', 'Three sockets can be read or written now'), ('c', 'Three threads are idle and can take work'), ('d', 'Three sockets have used the most CPU')],
    'correct': 'b',
    'explanation': 'Readiness means the next read or write on those 3 descriptors will not block: data has arrived, or there is buffer space to send. The program still does the reading, parsing and handling itself; epoll knows nothing about threads, request completion or CPU use.'},
   't285-a3': {'explanation': 'Many idle long-lived connections, such as chat or live cricket scores, need only a few KB of state each on a loop, against a thread stack each. Heavy maths and CPU-bound batch jobs gain nothing from an event loop, and a daily script has no connections to multiplex.'},
   't285-a4': {'explanation': 'One loop runs on one thread, so it uses one core; run one loop per core, often as several processes sharing the port, to use them all. A thread per connection abandons the event model, lowering priority only makes it slower, and blocking sockets would stall the loop.'},
  },
 },
}
