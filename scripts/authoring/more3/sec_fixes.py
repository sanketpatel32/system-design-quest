"""Quality fixes to the existing Security topics 301-310 in scripts/authored/fund-security.json.

Each edit asserts the old text first, so a rerun or an upstream change fails loudly instead of silently.
"""
import json, os

PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'authored', 'fund-security.json')

# (question id, choice id, old label, new label): weak or silly distractors replaced with plausible misconceptions
CHOICES = [
    ('t308-a3', 'a', 'The host name was too long', 'The DNS name resolved to a public address'),
    ('t308-a3', 'd', 'The scheme was https', 'The request used https instead of http'),
    ('t301-a1', 'b', 'Only in the database schema', 'At the CDN, with a cache rule per route'),
    ('t301-a1', 'c', 'Only in the mobile app', 'In the web form, with the rules documented'),
    ('t301-a5', 'a', 'The public home page', 'The external payment provider'),
    ('t301-a5', 'b', 'The main login page', 'The login and sign-up flows'),
    ('t302-a1', 'c', 'Compressing each message', 'Encrypting each message with AES-CTR'),
    ('t302-a1', 'd', 'Base64-encoding each message', 'A CRC-32 checksum on each message'),
    ('t302-a2', 'b', 'They cannot encrypt more than a few bytes', 'They need a new certificate for each connection'),
    ('t302-a2', 'c', 'They expire after one second', 'Their keys must change for every record'),
    ('t302-a2', 'd', 'Browsers forbid symmetric keys', 'They cannot provide forward secrecy'),
    ('t302-a4', 'd', 'The download was fast', 'The publisher’s server was not hacked'),
    ('t303-a1', 'd', 'MD5 applied 2 times', 'HMAC-SHA-256 with a secret pepper'),
    ('t303-a2', 'c', 'Identical but in reverse', 'Identical until one of them logs in again'),
    ('t303-a2', 'd', 'Empty until first login', 'Identical, but encrypted with different keys'),
    ('t304-a3', 'b', 'The signature changes on logout', 'The server clears its session record only on the next request'),
    ('t304-a3', 'c', 'JWTs expire after 5 minutes', 'The refresh token cannot be revoked before it expires'),
    ('t305-a3', 'b', 'To choose the scopes', 'To prove the client’s identity to the token endpoint'),
    ('t305-a3', 'c', 'To set the token lifetime', 'To stop the code being redeemed twice'),
    ('t306-a2', 'a', 'In the browser’s local storage', 'In the admin page’s frontend route guard'),
    ('t306-a2', 'b', 'In the CSS for the admin page', 'In the client app’s role check before the call'),
    ('t306-a2', 'd', 'Only by hiding the button', 'By hiding the delete button from non-admins'),
    ('t307-a1', 'a', 'Delete the commit', 'Rewrite the Git history to remove it'),
    ('t307-a1', 'd', 'Email the team about it', 'Rotate it at the next scheduled rotation'),
    ('t307-a2', 'd', 'In the README for operators', 'In an environment file on each server'),
    ('t307-a3', 'b', 'They are faster to type', 'They remove the need for a secrets manager'),
    ('t307-a3', 'c', 'They need no permissions', 'They can be shared between workloads safely'),
    ('t307-a4', 'a', 'No, but only on Windows', 'No, but only the build machine still has it'),
    ('t308-a4', 'c', 'It requires a user password', 'It only answers requests made over HTTPS'),
    ('t308-a4', 'd', 'It moves to a public address', 'It encrypts the credentials it returns'),
    ('t309-a1', 'a', 'SQL injection', 'A hijacked maintainer account'),
    ('t309-a1', 'b', 'Cross-site scripting', 'A malicious install script'),
    ('t309-a4', 'b', 'Slow deployments', 'A compromised CI runner signing its own build'),
    ('t310-a3', 'a', 'To make codes longer', 'To let a code be reused once'),
    ('t310-a3', 'c', 'To skip the password', 'To resist phishing of the code'),
    ('t310-a3', 'd', 'To let users share codes', 'To lower the chance of guessing'),
    # t310-a4 superseded by quality/q_sec.py
]

# Explanations rewritten so every option is accounted for
EXPLANATIONS = {
    't308-a3': 'The first host passed, but the redirect led to an internal address that was never checked. Each hop must pass the same checks, or redirects bypass them. The first name resolving to a public address is why the check passed, and the scheme or TLS of the first hop does not change where the redirect goes.',
    't301-a1': 'Clients and their forms are outside the trust boundary and can be bypassed by calling the API directly. A CDN caches responses; it does not validate input. The server boundary is the first point you control.',
    't301-a5': 'Operational side paths such as admin tools and batch jobs are easy to forget and attractive to attackers. The main user flows, the primary database and third-party providers are what people draw first.',
    't302-a1': 'A plain hash or a CRC can be recomputed by an attacker after editing the message; a MAC needs the key. Unauthenticated CTR encryption hides content but is malleable, so flipped bits go undetected.',
    't302-a2': 'Asymmetric operations are far slower, so the handshake uses them to agree a symmetric session key for bulk data. Ephemeral key exchange is what provides forward secrecy, the certificate is reused across many connections, and session keys do not change per record.',
    't302-a4': 'A signature proves these bytes came unchanged from the key holder. It says nothing about quality or encryption. It catches files altered on a mirror or download server, but it cannot show the publisher was not hacked: an attacker who holds the signing key, or changes code before signing, produces a valid signature.',
    't303-a1': 'Password hashes must be slow and tunable; Argon2id is OWASP’s first choice. SHA-256 and HMAC are fast, so guesses stay cheap even with a salt or pepper, and AES is reversible by anyone with the key.',
    't303-a2': 'A unique salt per user makes identical passwords produce different hashes, so one cracked hash reveals nothing about the other. Hashes do not change on login, and password hashes are not encrypted.',
    't304-a3': 'A self-contained token is checked by signature and expiry, not looked up, so there is no server session record to clear. Refresh tokens are stored by the server and can be revoked, but that does not stop an access token already issued. Use short lifetimes or a revocation check.',
    't305-a3': 'state ties the redirect to a request this browser started, defending against cross-site request forgery on the callback. Client authentication and PKCE prove who redeems the code, and the authorisation server enforces single use.',
    't306-a2': 'Route guards, client-side role checks and hidden buttons all run on the client, which an attacker controls; anyone can call the endpoint directly. Only the server handler sees every request.',
    't307-a1': 'Assume it was copied within minutes, because scanners watch public repositories. Only revocation stops its use. History rewrites come afterwards, and waiting for scheduled rotation leaves it live.',
    't307-a2': 'A secrets manager keeps it out of code and images, adds access control and audit, and allows rotation. Repositories, image layers and files on each server are copied, backed up and hard to rotate.',
    't307-a3': 'Short lifetimes bound the damage of a leak. They are usually issued by a secrets manager or identity service, and each workload should get its own so access can be scoped and traced.',
    't307-a4': 'Image layers are additive: anyone who pulls the image can extract the earlier layer, private or not. Use build-time secret mounts that never enter a layer.',
    't308-a4': 'IMDSv2 requires a session token fetched with a PUT and a custom header, which a simple GET-only SSRF cannot send. It still answers over plain HTTP on the link-local address and returns credentials unencrypted to callers that complete the flow.',
    't309-a1': 'The resolver preferred the public registry’s higher version of an internal name. Typosquatting relies on a mistyped name, a hijacked maintainer publishes under the real package, and an install script attack needs no name clash.',
    't309-a4': 'Provenance ties an artefact to your trusted build. It cannot detect a compromised builder that signs its own output, bugs in the commit, or vulnerable dependencies; those need hardened builders, review and scanning.',
    't310-a3': 'Phone clocks drift and users take time to type, so a one-step window accepts valid codes. It slightly widens the guessing window, does nothing against phishing, and servers should still reject a reused code.',
}

# (topic id, dotted path, old substring, new substring): factual corrections and updates
TEXT = [
    (306, 'cards.0.body',
     'OWASP ranked broken access control first in its 2021 Top 10: it found some form of it in 94% of the applications tested.',
     'OWASP ranked broken access control first in its 2021 Top 10, where 94% of the applications were tested for some form of it, and kept it first in the 2025 edition.'),
    (302, 'deep.numbers.steps.1',
     'At 2^32 (about 4.3 billion) messages the collision chance stays around 2^-32, the bound NIST accepts.',
     'At 2^32 (about 4.3 billion) messages the collision chance is about n² / 2^97 = 2^64 / 2^97 = 2^-33, inside the 2^-32 bound NIST sets.'),
    (307, 'questions.3.prompt',
     'A Docker image build copies a .env file with keys, then deletes it in a later step. Is the secret gone?',
     'A container image build copies a .env file with keys, then deletes it in a later step. Is the secret gone?'),
    (308, 'deep.india.body',
     'and one reason cloud providers pushed hardened metadata access.',
     'and one reason cloud providers pushed hardened metadata access. In the OWASP Top 10:2025, SSRF no longer has its own entry; it is folded into A01 Broken Access Control.'),
]

APPEND = [
    (303, 'deep.mechanism.steps.-1',
     ' The 2025 revision, SP 800-63B-4, makes this firmer: passwords used alone must be at least 15 characters (at least 8 when they are only one factor of MFA), '
     'and verifiers shall not impose composition rules or periodic changes, though they must force a change on evidence of compromise.'),
    (310, 'deep.mechanism.steps.@Push approvals sit in between',
     ' NIST SP 800-63B-4 cites authentication fatigue and no longer accepts a bare approve tap: the user must transfer a secret between the devices, which number matching does when the user types the number shown on screen into the app; picking it from a short list does not count.'),
]

SOURCES = [
    (306, {'title': 'OWASP Top 10:2025: A01 Broken Access Control', 'url': 'https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/'}),
    (308, {'title': 'OWASP Top 10:2025: A01 Broken Access Control (now includes SSRF)', 'url': 'https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/'}),
]


def _walk(obj, path):
    parts = path.split('.')
    for p in parts[:-1]:
        obj = obj[int(p)] if isinstance(obj, list) else obj[p]
    last = parts[-1]
    if isinstance(obj, list):
        if last.startswith('@'):
            idx = next(i for i, s in enumerate(obj) if s.startswith(last[1:]))
            return obj, idx
        return obj, int(last)
    return obj, last


def apply(topics):
    by = {t['id']: t for t in topics}
    qs = {q['id']: q for t in topics for q in t['questions']}
    log = []
    for qid, cid, old, new in CHOICES:
        c = next(c for c in qs[qid]['choices'] if c['id'] == cid)
        if c['label'] == new:
            continue
        assert c['label'] == old, (qid, cid, c['label'])
        assert cid not in qs[qid]['correctChoiceIds'], (qid, cid)
        c['label'] = new
        log.append(f'{qid} {cid}: "{old}" -> "{new}"')
    for qid, expl in EXPLANATIONS.items():
        qs[qid]['explanation'] = expl
    for tid, path, old, new in TEXT:
        o, k = _walk(by[tid], path)
        if new in o[k]:
            continue
        assert old in o[k], (tid, path)
        o[k] = o[k].replace(old, new)
        log.append(f'{tid} {path}: text fix')
    for tid, path, extra in APPEND:
        o, k = _walk(by[tid], path)
        if extra.strip() in o[k]:
            continue
        o[k] = o[k].rstrip() + extra
        log.append(f'{tid} {path}: appended update')
    for tid, s in SOURCES:
        if all(x['url'] != s['url'] for x in by[tid]['sources']):
            by[tid]['sources'].append(s)
            log.append(f'{tid}: added source {s["url"]}')
    return log


def main():
    topics = json.load(open(PATH))
    log = apply(topics)
    with open(PATH, 'w') as f:
        json.dump(topics, f, ensure_ascii=False, indent=1); f.write('\n')
    print(f'sec_fixes: {len(log)} edits')
    for line in log:
        print('  ' + line)


if __name__ == '__main__':
    main()
