"""Quality fixes for the existing Networking lessons (241-254) in scripts/authored/fund-networking.json.

Each fix is an exact find/replace on a JSON string value; every 'find' must occur exactly once.
Re-running is safe: a fix whose replacement is already present is skipped.
    python3 scripts/authoring/more3/net_fixes.py
"""
import json, os

PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'authored', 'fund-networking.json')

# (topic, why, find, replace). Strings are raw values; they are JSON-encoded before matching.
FIXES = [
 (254, 'Interactive feedback undercounted setup time: DNS (80 ms) is setup too, so setup is 370 of 460 ms, not 290.',
  'Right: 290 of the 460 ms is setup work before the real request; HSTS, no redirect and a nearby edge cut it.',
  'Right: 370 of the 460 ms (redirect 130, DNS 80, connect and TLS 160) is setup before the real request; HSTS, no redirect, a warm DNS cache and a nearby edge cut most of it.'),
 (254, 'Happy Eyeballs claim was wrong: RFC 8305 recommends a 250 ms Connection Attempt Delay, not tens of ms.',
  'so a broken path costs tens of milliseconds instead of seconds.',
  'so a broken path costs about a quarter of a second (RFC 8305 recommends a 250 ms Connection Attempt Delay) instead of a long connection timeout.'),
 (249, 'Only the side that closes first enters TIME_WAIT; 60 s is Linux’s fixed value, not an arbitrary one.',
  'Each closed connection keeps its port in TIME_WAIT for 60 s (an illustrative value)',
  'Each connection the proxy closes first keeps its port in TIME_WAIT for 60 s (Linux’s fixed value)'),
 (244, 'Added the TCP counterpart to the UDP NAT timeout (RFC 5382: established TCP at least 2 h 4 min).',
  'for UDP the guideline in RFC 4787 is at least 2 minutes, and many devices use shorter values in practice.',
  'for UDP the guideline in RFC 4787 is at least 2 minutes, for established TCP RFC 5382 asks for at least 2 hours 4 minutes, and many devices use shorter values in practice.'),
 (246, 'One-line explanation now covers every option (labels are already balanced by scripts/option-balance.json).',
  'Caches keep the old answer until its TTL runs out.',
  'Caches keep the old answer until its TTL runs out, so the worst case is about one TTL, here an hour. Resolvers have no 60-second minimum that overrides the TTL; restarting devices clears only their local caches, not the resolvers’; and DNS has no push to resolvers.'),
 (244, 'Explanation now covers every option.',
  'It replaces the private source with its public address and a port it tracks.',
  'It replaces the private source with its public address and a port it tracks. The destination stays as the client chose it; tracking connections is how NAT remembers each rewrite, not a substitute for it; and TCP sequence numbers pass through unchanged.'),
 (247, 'Explanation now covers every option.',
  'The active closer waits 2×MSL before reusing the address and port pair.',
  'The active closer waits 2×MSL before reusing the address and port pair. Who initiated the connection does not matter, only who sent the first FIN; the passive closer goes straight to CLOSED after its last ACK; and TIME_WAIT is part of every normal close, not an error path.'),
 (249, 'Explanation now covers every option, including the Linux default range.',
  'RFC 6335; operating systems may use a different range.',
  'RFC 6335 sets aside 49,152–65,535. Linux defaults to 32,768–60,999, which is an operating-system choice, not the IANA range; 0–1,023 are system ports and 1,024–49,151 are registered ports.'),
 (253, 'Silly distractor “It drops to zero” replaced.',
  'It drops to zero', 'It drops by about half'),
 (253, 'Explanation now covers every option.',
  'Bandwidth does not change propagation delay.',
  'Bandwidth does not change propagation delay, which dominates a tiny request. Serialisation time for a few hundred bytes was already microseconds, so neither halving nor a tenth is plausible, and nothing about a faster link doubles the delay.'),
 (242, 'Explanation now covers every option.',
  'Dual stack lets each connection use IPv6 when both sides can.',
  'Dual stack keeps IPv4 for whatever has not moved yet and lets each connection use IPv6 when both sides can. TLS runs over either version; IPv6 is widely used on home and mobile networks, not only in data centres; and neither version is faster in general.'),
 (252, 'Silly distractor “Switch the load balancer to UDP” replaced.',
  'Switch the load balancer to UDP', 'Turn on HTTP/2 between the balancer and the app'),
 (252, 'Explanation now covers every option.',
  'The app only sees plain HTTP from the proxy unless it reads the forwarded scheme.',
  'The app only sees plain HTTP from the proxy unless it reads the forwarded scheme. Certificates on the app servers or HTTP/2 to the backend do not tell the app what the user used, and timeouts are unrelated to the scheme.'),
]


def enc(s):
    return json.dumps(s, ensure_ascii=False)


def main():
    with open(PATH) as f:
        text = f.read()
    applied = skipped = 0
    for tid, why, find, repl in FIXES:
        a, b = enc(find)[1:-1], enc(repl)[1:-1]
        if b in text:  # already applied (a replacement may contain its own 'find' text)
            skipped += 1
            continue
        assert text.count(a) == 1, f'{tid}: expected exactly one match for {find!r}, got {text.count(a)}'
        text = text.replace(a, b)
        applied += 1
    json.loads(text)  # still valid JSON
    with open(PATH, 'w') as f:
        f.write(text)
    print(f'net_fixes: applied {applied}, already applied {skipped}, total {len(FIXES)}')


if __name__ == '__main__':
    main()
