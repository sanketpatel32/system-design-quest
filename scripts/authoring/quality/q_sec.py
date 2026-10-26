"""Quality pass, Security: scenarios in place of definitions; explanations rule out each wrong option. Applied by apply.py."""

P = {
 305: {
  'q': {
   't305-a1': {'prompt': 'An app logs users in by taking whatever access token the browser sends, calling the provider’s profile API with it and trusting the email returned. What is the flaw?',
    'choices': [('a', 'Another app’s token would log its holder in'), ('b', 'Access tokens expire too fast for login'), ('c', 'Calling the API on each login is slow'), ('d', 'Browsers cannot send access tokens')],
    'correct': 'a',
    'explanation': 'An access token says the bearer may call an API, not that it was issued to your app. A malicious app that collected a user’s token could present it to you and be logged in as them. For login, validate an OpenID Connect ID token whose audience is your client id. Lifetime, speed and transport are not the problem.'},
   't305-a2': {'prompt': 'A single-page app cannot keep a client secret. What stops someone who intercepts its authorisation code from redeeming it?',
    'choices': [('a', 'The code is encrypted in the redirect URL'), ('b', 'Codes work only from the user’s IP address'), ('c', 'The verifier is needed, and it never left the app'), ('d', 'The state value is checked when redeeming')],
    'correct': 'c',
    'explanation': 'PKCE: the app sent only the SHA-256 hash of a random code_verifier at the start, and the token endpoint demands the verifier itself, so a stolen code alone is useless. Codes travel unencrypted in the redirect URL, providers do not bind codes to IP addresses, and state protects the callback from forgery; it is not checked at the token endpoint.'},
   't305-a4': {'prompt': 'An old single-page app gets tokens with the implicit flow (response_type=token). A security review asks you to replace it. What should it use?',
    'choices': [('a', 'Client credentials, with the secret in the bundle'), ('b', 'Authorisation code with PKCE'), ('c', 'The password grant, sending the user’s password'), ('d', 'The implicit flow with shorter-lived tokens')],
    'correct': 'b',
    'explanation': 'RFC 9700 says the implicit grant should not be used: tokens arrive in the URL, where history, logs and referrers can leak them. Code with PKCE keeps tokens out of URLs. A secret shipped in a browser bundle is public, the password grant hands your app the user’s password (RFC 9700 forbids it), and shorter-lived tokens still leak.'},
  },
 },
 310: {
  'q': {
   't310-a1': {'explanation': 'The passkey signs a challenge together with the origin the browser actually visited, so a signature made on the proxy’s domain is useless at the real site. SMS, authenticator and email codes are digits the user types; the proxy relays them within seconds, long before they expire.'},
   't310-a2': {'explanation': 'Repeated prompts wear the user down until they approve: MFA fatigue, or prompt bombing. Number matching (typing a number shown on the login screen) and rate limits stop it. Session fixation plants a session id, credential stuffing replays leaked passwords (the attacker already has this one), and SIM swapping steals a phone number.'},
   't310-a4': {'prompt': 'A bank’s login sends a one-time code by SMS. Which risk does that add, compared with codes from an authenticator app?',
    'choices': [('a', 'The number can be moved to the attacker’s SIM'), ('b', 'The code can be typed into a phishing page'), ('c', 'The code changes every 30 seconds'), ('d', 'The code can be guessed in a few tries')],
    'correct': 'a',
    'explanation': 'In a SIM swap the attacker persuades or bribes a carrier to move the number to their SIM, then receives every code. Both kinds of code can be typed into a phishing page, so that risk is not specific to SMS; changing every 30 seconds is how authenticator (TOTP) codes work; and six-digit codes with rate limits are not guessable in a few tries.'},
  },
 },
 308: {
  'q': {
   't308-a1': {'explanation': 'Only the URL import makes the server fetch an address the attacker chooses, so it could be pointed at 169.254.169.254 or an internal admin page. Resizing a stored image, accepting an upload and showing a logo fetch nothing from a user-supplied address (uploads have their own risks).'},
   't308-a2': {'prompt': 'A link-preview feature fetches http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role for an attacker and shows the text. What did the attacker get?',
    'choices': [('a', 'Temporary cloud credentials for the server’s role'), ('b', 'The private key of the site’s TLS certificate'), ('c', 'The password hashes of the app’s users'), ('d', 'Nothing, since the address is link-local')],
    'correct': 'a',
    'explanation': 'On AWS with IMDSv1, that path returns an access key, secret and session token for the instance’s role, usable from anywhere until they expire. The metadata service holds no TLS keys or user data, and link-local only means the address is not routed off the host, which is exactly why a request from the server itself reaches it.'},
  },
 },
 309: {
  'q': {
   't309-a2': {'prompt': 'A build on Monday and a rebuild of the same commit on Friday ship different code, because a dependency published a patch release in between. What prevents this?',
    'choices': [('a', 'Pinning only the direct dependencies'), ('b', 'A committed lockfile with hashes'), ('c', 'Running a vulnerability scan per build'), ('d', 'Choosing the most popular versions')],
    'correct': 'b',
    'explanation': 'A lockfile records the exact version and hash of every package, transitive ones included, so Friday’s build gets Monday’s bytes or fails. Pinning direct dependencies still lets their dependencies float, a scanner finds known vulnerabilities but does not stop drift, and popularity says nothing about which version you get.'},
   't309-a3': {'prompt': 'Which question can the SBOM for release 4.2 answer on its own?',
    'choices': [('a', 'Does it contain zlib, and which version?'), ('b', 'Was it built by our CI from reviewed code?'), ('c', 'Is the zlib code inside it free of bugs?'), ('d', 'Which servers are running it right now?')],
    'correct': 'a',
    'explanation': 'An SBOM is an inventory of components and versions, which you can match against new vulnerability reports. Who built it and from what is provenance, an inventory says nothing about bugs, and where a release runs is deployment data.'},
  },
 },
 306: {
  'q': {
   't306-a1': {'explanation': 'The server returned order 501 without checking it belongs to the caller: an insecure direct object reference. TLS protects the connection, not the authorisation; length checks do not reject a valid id; and a larger id space only slows guessing, since ids still leak through links and logs.'},
   't306-a3': {'explanation': 'Read-only access to those two tables caps what a compromised service can do: no writes and no other tables. Full admin turns any bug into total access, sharing the main app’s login inherits all its rights and muddles audit logs, and a report needs no write access.'},
   't306-a4': {'explanation': 'A uniform 404 for “does not exist” and “not yours” stops outsiders learning which ids exist. A stack trace leaks internals, a 403 naming the owner leaks the owner, and a 200 tells clients and caches the request succeeded.'},
  },
 },
}
