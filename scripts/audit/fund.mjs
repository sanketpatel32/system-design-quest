// Fundamentals track rules: separate ID range, area sizes, language-agnostic wording, authoritative sources,
// valid links into the System Design track, and the same depth as the core lessons (enforced via DEEP_REGIONS).
export const FUND_AREAS = ['f1-frontend', 'f2-backend', 'f3-networking', 'f4-databases', 'f5-os', 'f6-security', 'f7-cloud']
// The first areas were sized 12–16; Frontend and Backend grew to fill their catalog ranges (201–220, 221–240); the three later sections 10–14
const AREA_SIZE = { 'f1-frontend': [12, 28], 'f2-backend': [12, 28], 'f5-os': [10, 34], 'f6-security': [10, 14], 'f7-cloud': [10, 14] }
export const FUND_SOURCE_HOSTS = [
  'developer.mozilla.org', 'web.dev', 'developer.chrome.com', 'www.rfc-editor.org', 'datatracker.ietf.org', 'www.w3.org', 'html.spec.whatwg.org',
  'fetch.spec.whatwg.org', 'dom.spec.whatwg.org', 'url.spec.whatwg.org', 'cheatsheetseries.owasp.org', 'owasp.org', 'www.postgresql.org', '12factor.net',
  'www.iana.org', 'dl.acm.org', 'www.mongodb.com', 'cassandra.apache.org', 'redis.io', 'sre.google', 'opentelemetry.io', 'dev.mysql.com', 'learn.microsoft.com', 'docs.oracle.com', 'sqlite.org', 'www.sqlite.org',
  'man7.org', 'pubs.opengroup.org', 'docs.kernel.org', 'kubernetes.io', 'docs.docker.com', 'docs.aws.amazon.com', 'cloud.google.com', 'slsa.dev', 'cwe.mitre.org', 'csrc.nist.gov', 'pages.nist.gov', 'martinfowler.com', 'developer.hashicorp.com', 'opencontainers.org', 'protobuf.dev', 'grpc.io',
]
// Framework, library and language-API names: Fundamentals teach concepts with pseudocode, HTTP and diagrams only
const LANG_SPECIFIC = /\b(React|Vue|Angular|Svelte|Next\.js|Nuxt|Express|Django|Flask|Rails|Laravel|Spring Boot|jQuery|axios|Redux|Workbox|Node\.js|npm|pip install|setTimeout|setInterval|offsetHeight|getBoundingClientRect|AbortController|preventDefault|stopPropagation|stopImmediatePropagation|WeakMap|WeakSet|WeakRef|FinalizationRegistry|AbortSignal|addEventListener|querySelector|innerHTML|textContent|console\.log|requestAnimationFrame|async def|public static void|System\.out|goroutine|Sequelize|Hibernate|SQLAlchemy|Prisma|ActiveRecord)\b/

export function checkFundamentals(topics) {
  const errors = []
  const info = []
  const byId = new Map(topics.map((t) => [t.id, t]))
  const fund = topics.filter((t) => FUND_AREAS.includes(t.region))
  const slugs = new Map()
  for (const t of topics) {
    if (slugs.has(t.slug)) errors.push(`Topic ${t.id}: slug "${t.slug}" also used by topic ${slugs.get(t.slug)}`)
    slugs.set(t.slug, t.id)
  }
  for (const t of topics) {
    if (t.id > 120 && !FUND_AREAS.includes(t.region)) errors.push(`Topic ${t.id}: IDs above 120 are reserved for the Fundamentals track`)
  }
  const counts = {}
  for (const t of fund) {
    const bad = (m) => errors.push(`Fundamentals ${t.id}: ${m}`)
    counts[t.region] = (counts[t.region] ?? 0) + 1
    if (t.id < 200) bad('Fundamentals topics use IDs 200+ so System Design IDs 1–120 stay stable')
    if (t.kind !== 'lesson') bad('must be a lesson')
    const types = new Set(t.questions.map((q) => q.type))
    if (types.size < 3) bad(`needs 3+ question types (has ${[...types].join(', ')})`)
    if ((t.sources ?? []).length < 2) bad('needs 2+ sources')
    for (const s of t.sources ?? []) {
      let host = ''
      try { host = new URL(s.url).host } catch { bad(`bad source URL ${s.url}`) }
      if (host && !FUND_SOURCE_HOSTS.includes(host)) bad(`source ${s.url} is not on the authoritative list (MDN, RFCs, W3C/WHATWG, web.dev, OWASP, PostgreSQL docs, …)`)
    }
    if (!t.cards.some((c) => /^(Worked example|Misconception)/.test(c.title))) bad('needs a worked-example or misconception card')
    if (!t.cards.some((c) => /^Trap:/.test(c.title))) bad('needs a “Trap:” card')
    for (const s of t.seeAlso ?? []) {
      const o = byId.get(s.topicId)
      if (!o || o.kind !== 'lesson' || o.id === t.id) bad(`seeAlso ${s.topicId} must be another lesson (System Design or Fundamentals)`)
      if (!s.why || s.why.length < 20) bad(`seeAlso ${s.topicId} needs a reason`)
    }
    const { sources, seeAlso, ...rest } = t
    const blob = JSON.stringify(rest)
    const m = blob.match(LANG_SPECIFIC)
    if (m) bad(`language- or framework-specific term "${m[0]}" (keep Fundamentals language-agnostic)`)
    if (!/^(Real-world|Official|Public|Illustrative)/i.test(t.deep?.india?.label ?? '') && !/official|public|illustrative/i.test(t.deep?.india?.label ?? '')) bad('real-world example needs an honest label')
  }
  for (const [area, n] of Object.entries(counts)) { const [lo, hi] = AREA_SIZE[area] ?? [12, 16]; if (n < lo || n > hi) errors.push(`Fundamentals ${area}: ${n} topics (need ${lo}–${hi})`) }
  const links = fund.reduce((n, t) => n + (t.seeAlso?.length ?? 0), 0)
  info.push(`Fundamentals: ${fund.length} topics (${FUND_AREAS.filter((a) => counts[a]).map((a) => `${a.slice(3)} ${counts[a]}`).join(', ')}), ${links} links into System Design`)
  return { errors, info, count: fund.length }
}
