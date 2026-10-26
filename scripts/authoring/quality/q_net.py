"""Quality pass, Networking: definition questions become captures, timings and distances to reason about;
explanations rule out each wrong option. Applied by apply.py."""

P = {
 245: {
  'q': {
   't245-a1': {'explanation': '198.51.100.20 is outside 192.168.1.0/24, so the frame goes to the gateway’s MAC with the server’s IP inside, and each router repeats this on its next link. The broadcast address is for ARP requests, not data; the laptop’s own MAC is the source; and the remote server’s MAC is never known on this link.'},
   't245-a2': {'prompt': 'A laptop that just joined the office Wi-Fi wants to reach the local file server at 10.20.0.40 for the first time. How does it learn the server’s hardware address?',
    'choices': [('a', 'It asks the DNS server for the MAC address'), ('b', 'It broadcasts an ARP request to the segment'), ('c', 'It asks the default router to look it up'), ('d', 'It derives the MAC from the IPv4 address')],
    'correct': 'b',
    'explanation': 'It does not know where the server is, so it broadcasts “Who has 10.20.0.40?” and the owner replies directly. DNS maps names to IP addresses, not IP to MAC; the router is involved only for other networks; and a MAC address cannot be computed from an IPv4 address.'},
   't245-a3': {'explanation': 'The switch does not know the port yet, so it floods the frame out of every port except the one it arrived on; the reply teaches it where that address lives. Switches do not wait for ARP or use gateways, which are IP-level ideas, and they send no error for an unknown address.'},
   't245-a4': {'prompt': 'An IPv6 host needs the link-layer address of 2001:db8::25, a neighbour on the same link. Which messages does it use?',
    'choices': [('a', 'A DHCPv6 request for an address lease'), ('b', 'A reverse DNS lookup of the address'), ('c', 'An ARP broadcast, just as in IPv4'), ('d', 'ICMPv6 Neighbor Solicitation and Advertisement')],
    'correct': 'd',
    'explanation': 'IPv6 has no ARP: Neighbor Discovery (RFC 4861) sends a Neighbor Solicitation to a multicast address and the owner answers with a Neighbor Advertisement. DHCPv6 hands out addresses, reverse DNS maps addresses to names, and IPv6 has no broadcast for ARP to use.'},
  },
 },
 251: {
  'q': {
   't251-a1': {'prompt': 'Users in Sydney reach your Mumbai servers over a round trip of about 150 ms. Moving from TLS 1.2 to TLS 1.3 saves how much on each new connection?',
    'choices': [('a', 'Nothing: both need two round trips'), ('b', 'About 150 ms, one round trip'), ('c', 'About 300 ms, two round trips'), ('d', 'About 15 ms of encryption work')],
    'correct': 'b',
    'explanation': 'TLS 1.3 sends key shares in its first messages, so its handshake takes one round trip instead of TLS 1.2’s two: about 150 ms saved per new connection. It cannot save two, because TLS 1.3 still needs one, and encryption CPU time is tiny next to a 150 ms trip. Resumption with 0-RTT saves more, but only for replay-safe requests.'},
   't251-a2': {'explanation': 'The certificate must list pay.example.com in its subject alternative names, or carry a wildcard such as *.example.com that covers it. A trusted CA vouches only for the names it signed, sharing a parent domain grants nothing, and browsers do not fall back to plain HTTP.'},
   't251-a3': {'prompt': 'An attacker records a year of a bank’s TLS 1.3 traffic, then steals the server’s certificate private key. Which recorded sessions can they decrypt?',
    'choices': [('a', 'None of them'), ('b', 'All of them'), ('c', 'Only those from the last 90 days'), ('d', 'Only those that used 0-RTT')],
    'correct': 'a',
    'explanation': 'TLS 1.3 key exchange is ephemeral Diffie-Hellman, so session keys were never derivable from the certificate key: forward secrecy. The stolen key lets the attacker impersonate the server from now on, not read the past. With TLS 1.2’s old RSA key exchange, every recorded session would fall; certificate lifetimes do not matter here, and early data is protected by resumption secrets, not the certificate key.'},
   't251-a4': {'explanation': 'An attacker can replay early data, so only a request that is safe to repeat belongs there. Replaying a DELETE, an order or a transfer would repeat its side effect, which is why servers refuse or delay those in early data, for example with 425 Too Early.'},
  },
 },
 247: {
  'q': {
   't247-a1': {'prompt': 'A capture shows the server’s SYN-ACK with seq=5000 and ack=1001. What does it tell you?',
    'choices': [('a', 'Server starts at 5000; it got the SYN numbered 1000'), ('b', 'The server has received 1,001 bytes of data'), ('c', 'The client’s data must start at byte 5000'), ('d', 'The server is about to send 1,001 bytes')],
    'correct': 'a',
    'explanation': 'A SYN uses up one sequence number, so ack=1001 acknowledges the client’s SYN, whose initial number was 1000; seq=5000 is the server’s own starting number. No data has moved yet, the client’s data continues from 1001, not 5000, and the ack field says what was received, not what will be sent.'},
   't247-a2': {'explanation': 'Three duplicate ACKs say one segment is missing while later ones arrived, so the sender resends it at once (fast retransmit) instead of waiting for the much longer timer, and it also reduces its window. It does not speed up, and it does not reset the connection.'},
   't247-a4': {'explanation': 'A successful write means only that the bytes reached your own kernel’s send buffer. The peer’s operating system may never have received them, let alone the application processing them or writing them to disk; only an application-level reply proves that.'},
  },
 },
 254: {
  'q': {
   't254-a1': {'choices': [('a', 'Tries http:// and follows the redirect'), ('b', 'Tries both schemes and keeps the faster'), ('c', 'Uses https:// directly, skipping http://'), ('d', 'Shows a warning before connecting')],
    'correct': 'c',
    'explanation': 'HSTS tells the browser to use HTTPS for that host until max-age runs out, so it rewrites the URL to https:// before sending anything and skips the redirect round trip. Without HSTS it would try http:// first; browsers do not race the two schemes, and a known HSTS host gets no warning.'},
   't254-a2': {'prompt': 'A user reloads your page 10 minutes after the first visit. The DNS TTL is 300 s, the connection has closed and the HTML has Cache-Control: no-cache. What repeats?',
    'choices': [('a', 'DNS, TCP and TLS again, then the request'), ('b', 'Only the HTTP request; the rest is cached'), ('c', 'Only TLS; DNS and TCP are still cached'), ('d', 'Nothing; the HTML comes from the cache')],
    'correct': 'a',
    'explanation': 'The 300 s TTL has run out, so the name is looked up again, and a closed connection must be reopened with TCP and TLS (a session ticket can make TLS cheaper, not free). TCP connections are not cached, and no-cache means the browser must check the HTML with the server before using its copy.'},
   't254-a4': {'explanation': 'With 40 ms of server time, most of the 900 ms is round trips over distance (DNS, TCP, TLS and the request), so an edge or a nearer region shortens every one of them. More bandwidth does not shorten a round trip, more servers help only when they are overloaded, and 20 ms saved in the handler is about 2% of the wait.'},
  },
 },
 248: {
  'q': {
   't248-a1': {'prompt': 'A phone downloads from a fast server, but the app reading the data is slow and the phone’s receive buffer is full. What makes the server pause?',
    'choices': [('a', 'Packets expire as their IP time to live runs out'), ('b', 'The server’s congestion window shrinks after loss'), ('c', 'The phone repeats the three-way handshake'), ('d', 'The phone advertises a receive window of zero')],
    'correct': 'd',
    'explanation': 'This is flow control: the receiver advertises how much buffer is free, and at zero the sender stops, probing until space opens. The congestion window reacts to the network, not to a slow receiver; the time to live limits hops; and the handshake happens once per connection.'},
   't248-a2': {'explanation': 'Duplicate ACKs are a congestion signal, so classic TCP halves its window (multiplicative decrease) and carries on rather than resetting. Doubling would add to the congestion, and the receiver’s buffer is a flow-control matter that has nothing to do with loss.'},
   't248-a3': {'explanation': '10⁹ bits/s × 0.1 s = 10⁸ bits = 12.5 MB. 125 MB multiplies by a full second, and 1.25 MB or 125 KB would leave the link idle for most of each round trip.'},
   't248-a4': {'prompt': 'A server in Mumbai sends a backup to Frankfurt over a 1 Gbit/s path with a 120 ms RTT. Window scaling is turned off. What is the most it can achieve?',
    'choices': [('a', 'About 4.4 Mbit/s'), ('b', 'About 44 Mbit/s'), ('c', 'About 440 Mbit/s'), ('d', 'The full 1 Gbit/s')],
    'correct': 'a',
    'explanation': 'Without scaling the window field stops at 65,535 bytes, and throughput ≤ window ÷ RTT = 65,535 × 8 ÷ 0.12 s ≈ 4.4 Mbit/s, under 1% of the link. Filling it needs about 15 MB in flight (10⁹ ÷ 8 × 0.12 s), which only window scaling allows.'},
  },
 },
 241: {
  'q': {
   't241-a1': {'prompt': 'One host at 10.0.0.5 runs an HTTPS server and a metrics endpoint. Which header lets it hand each arriving segment to the right process?',
    'choices': [('a', 'The IP header’s destination address'), ('b', 'The Ethernet header’s destination MAC'), ('c', 'The TCP header’s destination port'), ('d', 'The HTTP request’s Host header')],
    'correct': 'c',
    'explanation': 'Both processes share one IP address and one MAC, so only the transport header’s destination port tells them apart, for example 443 against 9100. The Host header sits inside the stream and is read by an application after the transport layer has already chosen the process.'},
   't241-a2': {'explanation': 'Each link has its own hardware addresses, so the router writes a new source and destination MAC for the next link. The IP addresses stay end to end (NAT aside), ports belong to the endpoints, and the Host header is inside the payload that routers do not read.'},
   't241-a3': {'explanation': 'Small packets fit and big ones are silently dropped because the ICMP “packet too big” messages that path MTU discovery needs are blocked: a black hole. A slow DNS server or a closed port fails before anything loads, and an expired certificate fails the handshake, not a download halfway through.'},
  },
 },
 253: {
  'q': {
   't253-a2': {'prompt': 'A game server in Mumbai serves players in Singapore, about 3,900 km away. What is the lowest possible round trip over fibre?',
    'choices': [('a', 'About 13 ms'), ('b', 'About 20 ms'), ('c', 'About 39 ms'), ('d', 'About 78 ms')],
    'correct': 'c',
    'explanation': 'Fibre carries light at about 200,000 km/s, so one way takes 3,900 ÷ 200,000 ≈ 19.5 ms and a round trip at least 39 ms; real cable routes are longer, so measured values are higher. 13 ms uses the speed of light in a vacuum for one way, 20 ms forgets the return trip, and 78 ms counts the round trip twice.'},
   't253-a3': {'explanation': 'Twelve sequential calls wait 12 × 80 = 960 ms on round trips, while 24 KB takes about 4 ms to send even at 50 Mbit/s. Batching into one call, or running independent calls in parallel, removes most of the wait; a bigger buffer, compression or a faster link only shave those 4 ms.'},
   't253-a4': {'prompt': 'Pings to a server 1,000 km away range from 12 ms to 180 ms during the evening peak. Which delay is doing the varying?',
    'choices': [('a', 'Transmission delay of the ping packets'), ('b', 'Propagation delay along the fibre'), ('c', 'Processing delay inside each router'), ('d', 'Queueing delay in busy buffers')],
    'correct': 'd',
    'explanation': 'The 1,000 km sets a floor of about 10 ms per round trip that does not move, and a small ping takes microseconds to transmit and process. What swings with evening load is time spent waiting in router and modem queues, which is why jitter and tail latency track congestion.'},
  },
 },
}
