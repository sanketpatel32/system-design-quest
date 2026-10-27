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
 288: {'q': {
   't288-a2': {'explanation': 'A semaphore holds a count: each caller takes a permit before the call and returns it after, so a 21st caller waits until one of the 20 frees up. A mutex admits only one thread at a time, a condition variable needs a counter and a mutex beside it to do the same job, and a read-write lock separates readers from writers rather than capping a number.'},
   't288-a3': {'explanation': 'A full bounded queue makes producers wait or fails their put at once, so overload shows up as backpressure the caller can act on (slow down, retry later). Nothing reorders items, the scheduler does not hand consumers more CPU, and memory growing until the process is killed is what an unbounded queue does.'},
   't288-a5': {'explanation': 'Lock the mutex, then wait on “not empty” in a while loop (the wait releases the lock while asleep), remove the item, signal “not full” so a blocked producer can proceed, and unlock. Signalling before unlocking is fine; the woken producer simply waits for the mutex.'},
   't288-a6': {'explanation': 'A 10× burst for minutes means work arrives faster than 8 workers finish, so any queue grows by thousands of jobs. Bounded with 503 and Retry-After keeps memory fixed and latency predictable, and clients can retry. An unbounded queue grows until memory runs out, with jobs waiting minutes, and a thread per job overwhelms the CPU and memory without raising throughput.'},
 }},
 282: {'q': {
   't282-a1': {'prompt': 'Thread A is preempted halfway through a loop and resumes later on the same core. What must the kernel have saved so it carries on exactly where it stopped?',
     'explanation': 'A thread’s execution state is its registers: the program counter (where it is), the stack pointer and the working values. The kernel saves them on a switch and restores them later. Heap memory, open files and the program’s code stay in place in memory and need no saving; source code is not even loaded.'},
   't282-a2': {'explanation': 'A blocked thread leaves the run queue entirely and uses no CPU until the disk interrupt marks it runnable again. That is why one core can host thousands of threads that are mostly waiting. Threads do not poll for I/O they asked the kernel to do, and nothing reserves CPU for sleeping threads.'},
   't282-a3': {'explanation': 'Shorter slices mean a waiting thread gets the CPU sooner, at the cost of more switches, each of which costs a few microseconds plus colder caches. It does not change the number of cores or threads, memory use, stack size or I/O.'},
   't282-a4': {'explanation': 'A CPU-bound thread keeps a core busy, so about one per core uses all four with little switching. One thread leaves three cores idle; one per request or 400 threads just queue for the same four cores and add switching and cache misses. I/O-bound work is different: threads that mostly wait can number many more than cores.'},
   't282-a6': {'explanation': 'A 2 ms wait is hundreds of times longer than a context switch (a few microseconds), so blocking frees the core for other runnable threads and wakes this one when the lock is released. Spinning burns 2 ms of a contended CPU, and a fixed 10 ms sleep adds up to 8 ms of needless delay. Spin only when waits are a few microseconds.'},
 }},
 281: {'q': {
   't281-a2': {
     'prompt': 'A shell forks a child, and the child calls exec to run ls. What does the child keep across exec?',
     'choices': [('a', 'Its process id and its open file descriptors'),
                 ('b', 'The shell’s code, heap and variables'),
                 ('c', 'Nothing; exec gives it a new process id'),
                 ('d', 'Only the threads the shell had running')],
     'correct': 'a',
     'explanation': 'exec replaces the program image (code, heap, stack) with ls but keeps the same process, so its id and its open file descriptors carry over, except those marked close-on-exec. That is how a shell sets up redirection: it rearranges descriptors in the child before exec. fork creates the process; exec does not, and only the calling thread survives exec.'},
   't281-a4': {'explanation': 'A finished child keeps a small process-table entry holding its exit status until the parent calls wait; until then it is a zombie. Its memory, threads and sockets are already freed. Thousands of zombies can exhaust the process-id space, so parents must reap, or a dead parent’s children are adopted and reaped by init.'},
   't281-a5': {'explanation': 'The shell forks a copy of itself, the child execs the command, the program runs and exits, and the parent waits to collect its exit status, which becomes $? and frees the zombie entry.'},
 }},
 284: {'q': {
   't284-a3': {'explanation': 'A successful write means the kernel copied the data into the page cache; it reaches the disk later, typically within about 30 seconds on Linux. A power cut before then loses it. fsync (or fdatasync) waits until the data, and the drive’s own volatile cache, is flushed. Opening the file changes nothing, and solid-state drives cache writes too.'},
   't284-a4': {'explanation': 'Each system call has a fixed cost to enter and leave the kernel, so gathering header and body into one write (or one writev of several buffers) cuts the calls per response. Priority changes when the code runs, smaller socket buffers mean more calls, and a thread per response adds switching on top of the same calls.'},
   't284-a6': {'explanation': 'The program calls read, the CPU switches to kernel mode, the kernel copies bytes from the page cache (reading from disk first on a miss) into the program’s buffer, and returns the byte count as the CPU drops back to user mode. A return smaller than asked for is normal, not an error.'},
 }},
 290: {'q': {
   't290-a1': {
     'prompt': 'A stop script runs kill -9 on a server. In-flight requests drop and the shutdown handler’s log line never appears. Why?',
     'choices': [('a', 'The handler was too slow to finish in time'),
                 ('b', 'SIGKILL cannot be caught; the kernel ends it'),
                 ('c', 'kill -9 sends SIGTERM twice in quick succession'),
                 ('d', 'Logs are discarded once a process gets a signal')],
     'correct': 'b',
     'explanation': 'Signal 9 is SIGKILL, which (like SIGSTOP) cannot be caught, blocked or ignored, so the kernel ends the process without running any handler. Send SIGTERM first, give the process time to drain, and use SIGKILL only after a deadline. Handler speed is irrelevant when the handler never runs, and receiving a signal does not discard logs.'},
   't290-a2': {'explanation': 'On SIGTERM a server should stop taking new work (close the listener, fail its readiness check so the load balancer stops sending) and finish requests already in flight, then exit before the platform’s deadline, 30 s by default in Kubernetes. Exiting at once drops those requests, restarting in place is not what was asked, and no second SIGTERM is coming, only SIGKILL.'},
   't290-a5': {'explanation': 'Receive SIGTERM, stop accepting new connections, let in-flight requests finish within a deadline, close database and queue connections so nothing is left half-done, and exit 0. Closing the database before requests finish would fail them, so release resources only after draining.'},
 }},
}
