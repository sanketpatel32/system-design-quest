// Shape and size checks for the cloud progress blob (format v1, see src/lib/sync/merge.ts).
// Grading stays on the client; this only makes sure what we store is the expected small, well-typed shape.
// Files starting with "_" are not deployed as functions.

export const MAX_BODY_BYTES = 64 * 1024
const isInt = (n, min = 0, max = 1e9) => Number.isInteger(n) && n >= min && n <= max
const isNum = (n, min = 0, max = 1e9) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
const isStr = (s, max) => typeof s === 'string' && s.length <= max
const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o)
const fail = (why) => ({ ok: false, error: why })

/** Returns { ok: true, value } with only the known fields, or { ok: false, error } */
export function validateProgress(p) {
  if (!isObj(p) || p.v !== 1) return fail('unexpected progress format')
  if (!isInt(p.xp ?? 0, 0, 1e8)) return fail('xp')
  const b = p.b ?? []
  if (!Array.isArray(b) || b.length > 200 || !b.every((x) => isStr(x, 64))) return fail('badges')
  const u = p.u ?? []
  if (!Array.isArray(u) || u.length > 5000 || !u.every((x) => isInt(x, 0, 1e7))) return fail('unlocked')
  if (!isObj(p.t)) return fail('topics')
  const t = Object.entries(p.t)
  if (t.length > 5000 || !t.every(([k, v]) => /^\d{1,7}$/.test(k) && Array.isArray(v) && v.length === 4 && v.every((n) => isNum(n, 0, 1e6)))) return fail('topics')
  const l = Object.entries(p.l ?? {})
  if (!isObj(p.l ?? {}) || l.length > 5000 || !l.every(([k, v]) => /^\d{1,7}$/.test(k) && Array.isArray(v) && v.length === 2 && v.every((n) => isInt(n, 0, 1e4)))) return fail('lessons')
  const s = p.s ?? { d: null, h: [] }
  if (!isObj(s) || !(s.d === null || isStr(s.d, 10)) || !Array.isArray(s.h) || s.h.length > 400 || !s.h.every((x) => isStr(x, 10))) return fail('streak')
  const r = p.r ?? []
  if (!Array.isArray(r) || r.length > 10000 || !r.every((c) => Array.isArray(c) && c.length === 6 && isInt(c[0], 0, 1e7) && isStr(c[1], 128) && isNum(c[2], 0, 100) && isNum(c[3], 0, 1e5) && isStr(c[4], 40) && isInt(c[5], 0, 1e6))) return fail('reviews')
  const bo = p.bo ?? { c: 0, s: 0, f: 0, sub: {} }
  if (!isObj(bo) || !isNum(bo.c ?? 0, 0, 1) || !isNum(bo.s ?? 0, 0, 1e6) || !isNum(bo.f ?? 0, 0, 1) || !isObj(bo.sub ?? {})) return fail('bosses')
  const sub = Object.entries(bo.sub ?? {})
  if (sub.length > 500 || !sub.every(([k, v]) => k.length <= 128 && isNum(v, 0, 1e6))) return fail('bosses')
  const value = { v: 1, xp: p.xp ?? 0, b, u, t: p.t, l: p.l ?? {}, s, r, bo }
  if (p.pr !== undefined) {
    const pr = validatePractice(p.pr)
    if (!pr.ok) return pr
    value.pr = pr.value
  }
  return { ok: true, value }
}

const MINUTES_MAX = 1e8 // whole minutes since 1970 (year ~2160)
export const MAX_PRACTICE_MISTAKES = 100

/** Practice log (`pr`): goal, missed-question queue and last topic; see src/lib/sync/practiceSync.ts */
export function validatePractice(pr) {
  if (!isObj(pr)) return fail('practice')
  if (!isInt(pr.g, 0, 100) || !(pr.ga === null || isInt(pr.ga, 0, MINUTES_MAX)) || !(pr.w === 0 || pr.w === 1)) return fail('practice goal')
  const m = pr.m
  if (!Array.isArray(m) || m.length > MAX_PRACTICE_MISTAKES || !m.every((x) => Array.isArray(x) && x.length === 5 && isInt(x[0], 0, 1e7) && isStr(x[1], 128) && x[1].length > 0 && isInt(x[2], 0, MINUTES_MAX) && isInt(x[3], 0, 10) && isInt(x[4], 0, 1e4))) return fail('practice missed')
  const la = pr.la
  if (!(la === null || (Array.isArray(la) && la.length === 3 && isInt(la[0], 0, 1e7) && (la[1] === 0 || la[1] === 1) && isInt(la[2], 0, MINUTES_MAX)))) return fail('practice last')
  return { ok: true, value: { g: pr.g, ga: pr.ga, w: pr.w, m, la } }
}
