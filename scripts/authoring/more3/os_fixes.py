"""Quality fixes for the original OS topics (281-290) in scripts/authored/fund-os.json.
Each fix checks the old text first, so running twice is a no-op and a drifted file fails loudly.
Run: python3 scripts/authoring/more3/os_fixes.py"""
import json, os

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'authored', 'fund-os.json')
T = {t['id']: t for t in json.load(open(PATH))}
applied, skipped = [], []


def card(tid, cid, old_title, title, body, teaches):
    c = next(c for c in T[tid]['cards'] if c['id'] == f't{tid}-{cid}')
    if (c['title'], c['body'], c['teaches']) == (title, body, teaches):
        skipped.append(f'{tid}-{cid}'); return
    assert c['title'] in (old_title, title), (tid, cid, c['title'])
    c.update(title=title, body=body, teaches=teaches); applied.append(f'{tid}-{cid}')


def card_body(tid, cid, old_start, body):
    c = next(c for c in T[tid]['cards'] if c['id'] == f't{tid}-{cid}')
    if c['body'] == body:
        skipped.append(f'{tid}-{cid} body'); return
    assert c['body'].startswith(old_start), (tid, cid)
    c['body'] = body; applied.append(f'{tid}-{cid} body')


def choices(tid, qid, new, expl):
    """new: {choice id: (old label, new label)}"""
    q = next(q for q in T[tid]['questions'] if q['id'] == f't{tid}-{qid}')
    by = {c['id']: c for c in q['choices']}
    if all(by[k]['label'] == v[1] for k, v in new.items()) and q['explanation'] == expl:
        skipped.append(f'{tid}-{qid}'); return
    for k, (old, lab) in new.items():
        assert by[k]['label'] in (old, lab), (tid, qid, k, by[k]['label'])
        by[k]['label'] = lab
    q['explanation'] = expl; applied.append(f'{tid}-{qid}')


# 281: c5 and c6 both taught "fork in a multithreaded process"; c5 now teaches copy-on-write cost
card(281, 'c5', 'Trap: forking a process that has many threads', 'Trap: copy-on-write makes fork look free',
     'fork does not copy memory straight away: parent and child share every page, marked copy-on-write, and a page is copied only when one side writes to it. A child that calls exec at once costs little. A large process that forks a long-lived child, for example to write a snapshot, pays for a copy of every page it keeps writing: a 10 GB process that rewrites half its heap during the child’s life needs about 5 GB more memory, enough to trigger an out-of-memory kill.',
     ['fork-exec'])
card(281, 'c6', 'Edge case: fork in a multithreaded program', 'Edge case: fork in a multithreaded program',
     'fork copies the whole address space but only the thread that called it. If another thread held a lock at that moment, such as the memory allocator’s, the child inherits the lock in its held state with no thread to release it, and can hang on its next allocation. POSIX allows only async-signal-safe calls in the child of a multithreaded fork until it calls exec; prefer posix_spawn or spawning before starting threads.',
     ['fork-exec', 'process-model'])
choices(281, 'a1', {'b': ('Nothing until the kernel syncs them', 'A copy held in each core’s cache until a lock is taken')},
        'Threads share one address space, so a global is one memory location for all of them; only stacks and registers are per thread. Caches are kept coherent by hardware, so there is no private per-core copy to sync (ordering still needs locks or atomics). Copy-on-write applies between processes after fork, and threads never get a private copy at start.')
choices(281, 'a3', {'b': ('A larger thread stack', 'A thread with its own exception handler')},
        'A separate process has its own address space, so a crash or memory corruption in the plugin cannot reach the main app. A thread shares the address space: a segmentation fault ends the whole process, and an exception handler cannot catch memory corruption or a crash in native code. Scheduling priority changes when code runs, not what a crash takes down.')
q = next(q for q in T[281]['questions'] if q['id'] == 't281-a6')
ap = {a['id']: a for a in q['approaches']}
ap['p1']['label'] = 'A pool of worker processes'
ap['p3']['label'] = 'Run decoders inside each request handler'
ap['p2']['label'] = 'One process with a thread per conversion'
q['explanation'] = 'A segmentation fault in a decoder kills whatever process it runs in, so only separate worker processes keep other users’ requests alive, and each worker can run with fewer permissions. Running inline or on threads shares one process, so one bad file drops everyone. Processes still use every core, and copying a file to a worker costs little next to a CPU-heavy conversion.'
applied.append('281-a6')

# 283: c5 and c6 both taught overcommit and the OOM killer; c6 now teaches shared pages in RSS
card(283, 'c6', 'Edge case: memory that fails later', 'Edge case: adding up resident memory overcounts',
     'Resident set size (RSS) counts every page a process has in memory, including shared library code and shared memory that other processes map too. Summing RSS across 50 worker processes that share 200 MB of code counts that 200 MB fifty times. Proportional set size (PSS) divides each shared page among the processes using it, so it adds up correctly; use it, or the cgroup’s total, when sizing a machine. In containers the memory limit, not the sum of RSS, decides when the kill comes.',
     ['address-translation', 'memory-pressure'])
choices(283, 'a1', {'c': ('Yes, addresses are global', 'Yes, a pointer value names one physical byte'), 'd': ('Yes, unless one is a thread', 'Yes, if both processes run the same program')},
        'Each process has its own page tables, so the same virtual address can map to different physical pages, or to the same page only if they deliberately share memory. Pointers are virtual, not physical; running the same program gives the same layout, not the same pages; and the kernel happily lets equal addresses exist in different processes.')
choices(283, 'a2', {'d': ('A minor fault on a cached page', 'A minor fault on a page already in the page cache')},
        'A major fault must wait for storage to read the page, which costs microseconds to milliseconds. A minor fault on a page already in the page cache only updates the page table, a fault on an already-mapped page is a permission or copy-on-write fault handled in memory, and a guard-page fault signals stack overflow rather than costing I/O.')

# 284: silly distractors
choices(284, 'a1', {'b': ('Disk drivers run in the browser', 'The file system locks the device for its own use')},
        'The CPU runs programs in user mode, where instructions that touch device registers fault; only the kernel, in privileged mode, drives hardware, and programs ask it through system calls. The file system is kernel code that also goes through drivers, devices do not check which kind of thread is asking, and compilers emit whatever instructions you write.')
choices(284, 'a2', {'a': ('The disk rotates more slowly', 'Each call forces the disk head to seek again'), 'd': ('Each byte is encrypted twice', 'The page cache flushes to disk after each call')},
        'Each write is a system call with fixed overhead, so 1 MB in 10-byte calls makes 100,000 transitions into the kernel; buffer in user space and write in large chunks. The page cache absorbs small writes, so neither seeks nor flushes happen per call, and the page cache is not disabled by small writes.')

# 285: weak distractor
choices(285, 'a2', {'b': ('An immediate 503 from the kernel', 'The kernel resets their connections at once')},
        'An event loop runs one callback at a time on its thread, so every other client waits until the parse finishes. The kernel keeps accepting and queuing connections rather than resetting them, nothing runs in parallel on a single loop, and no cache makes replies faster. Move the parse to a worker or stream it in chunks.')

# 288: c4 and c6 both taught spurious wake-ups; c6 now teaches lost wake-ups and broadcast
card(288, 'c6', 'Edge case: waking up for no reason', 'Edge case: the lost wake-up',
     'A producer that adds an item and signals without holding the mutex can slip between a consumer’s check (queue empty) and its wait, so the signal arrives before anyone is waiting and the consumer sleeps with an item ready. Change the shared state while holding the mutex the waiters use, then signal. Use broadcast when threads wait for different conditions on one condition variable, because signal may wake a thread that cannot proceed.',
     ['condition-variable'])
choices(288, 'a1', {'b': ('The loop makes the wait faster', 'The loop retakes the mutex after every wake-up'), 'c': ('The mutex needs to be retaken', 'It lets the wait run without holding the mutex'), 'd': ('Signals are delivered twice', 'Each signal wakes every thread that is waiting')},
        'A wait can return without a signal, and another thread may take the item between the signal and this thread running, so the condition must be re-checked after every wake-up. The wait itself retakes the mutex before returning, so the loop does not need to; the mutex must be held when the wait is called, loop or not; and signal wakes at most one waiter (broadcast wakes all).')
choices(288, 'a4', {'b': ('Keeps holding it while asleep', 'Keeps holding it, so signallers wait for the sleeper'), 'd': ('Destroys it after the wait', 'Releases it for good; the waiter locks it again later')},
        'Waiting atomically releases the mutex and sleeps, so a producer can lock it and change the state, and the wait retakes it before returning. Holding it while asleep would deadlock the signaller, the mutex is never handed directly to another thread, and the caller does not have to relock it after the wait returns.')

# 289: c5 and c6 both taught the failed-fsync retry trap; c6 now teaches fdatasync and device caches
card(289, 'c6', 'Edge case: a failed fsync cannot be retried', 'Edge case: fdatasync, metadata and drive caches',
     'fsync flushes a file’s data and all of its metadata, including size and timestamps; fdatasync skips metadata that is not needed to read the data back, such as the modification time, but still flushes a change in size, which saves a write per call for logs that overwrite space allocated in advance. On Linux either call normally also asks the device to empty its volatile write cache. A drive or virtual disk that acknowledges flushes without honouring them silently breaks durability, so test with real power loss rather than trusting the acknowledgement.',
     ['fsync', 'page-cache'])

# 290: c5 and c6 both taught "shell as PID 1"; c6 now teaches PID 1's reaping duty
card_body(290, 'c5', 'If a container starts the server through a shell script',
          'If a container starts the server through a shell script, the shell may be process 1 and not forward SIGTERM to its child. The server never sees the signal and is killed after the grace period. Even when the server itself is PID 1, the kernel applies no default action to signals it has not handled, so it must install its own SIGTERM handler. Use exec to replace the shell, or a small init process that forwards signals.')
card(290, 'c6', 'Edge case: PID 1 in a container ignores SIGTERM', 'Edge case: PID 1 must reap orphaned children',
     'When a process exits, it stays a zombie holding a process-table entry until its parent collects its exit status with wait. Orphans are re-parented to PID 1. An application running as PID 1 that never calls wait collects zombies from every helper its children leave behind, until the container’s process limit is reached and new processes cannot start. A minimal init such as tini forwards signals and reaps zombies, so the application does not have to.',
     ['exit-codes', 'signals'])
choices(290, 'a3', {'a': ('It hit a syntax error', 'It failed to start because of a syntax error'), 'b': ('It exited normally', 'It exited normally after a clean shutdown'),
                    'c': ('It was killed by SIGKILL (128 + 9)', 'It was killed by signal 9, SIGKILL')},
        'Shells and runtimes report death by signal as 128 plus the signal number, and 137 − 128 = 9 is SIGKILL, commonly from an out-of-memory kill or a grace period running out. A start-up error usually exits with a small code such as 1 or 2, a clean exit is 0, and a handled SIGTERM normally ends with the program’s own code (often 0, or 143 if it re-raises SIGTERM).')
# 290-a4 labels are already rebalanced in scripts/option-balance.json; only the explanation changes here
choices(290, 'a4', {},
        'With a shell as PID 1, SIGTERM reaches the shell, which does not pass it on, so the server never starts shutting down and is killed when the grace period ends. Platforms send SIGTERM first and SIGKILL only after the grace period, containers receive signals like any other process, and the log buffer size does not stop a message being written.')

with open(PATH, 'w') as f:
    json.dump(list(T.values()), f, ensure_ascii=False, indent=1)
    f.write('\n')
print('applied', applied); print('already applied', skipped)
