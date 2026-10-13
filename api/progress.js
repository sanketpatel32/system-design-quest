// GET/PUT /api/progress — the signed-in user's progress, stored in Clerk privateMetadata.
// The Clerk session token (Authorization: Bearer) is verified with CLERK_SECRET_KEY, which only
// exists on the server (Vercel env). The blob is gzipped + base64 to stay under Clerk's 8 KB limit.
import { createClerkClient, verifyToken } from '@clerk/backend'
import { gzipSync, gunzipSync } from 'node:zlib'

const LIMIT = 7000 // bytes of encoded blob; Clerk caps all metadata at 8 KB
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

async function auth(request) {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) return { error: json(503, { error: 'cloud save not configured' }) }
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return { error: json(401, { error: 'not signed in' }) }
  try {
    const payload = await verifyToken(token, { secretKey })
    return { userId: payload.sub, clerk: createClerkClient({ secretKey }) }
  } catch {
    return { error: json(401, { error: 'invalid session' }) }
  }
}

export async function GET(request) {
  const a = await auth(request)
  if (a.error) return a.error
  try {
    const user = await a.clerk.users.getUser(a.userId)
    const enc = user.privateMetadata?.sdq
    const progress = typeof enc === 'string' ? JSON.parse(gunzipSync(Buffer.from(enc, 'base64')).toString('utf8')) : null
    return json(200, { progress, updatedAt: user.privateMetadata?.sdqAt ?? null })
  } catch {
    return json(502, { error: 'could not load progress' })
  }
}

export async function PUT(request) {
  const a = await auth(request)
  if (a.error) return a.error
  let body
  try { body = await request.json() } catch { return json(400, { error: 'invalid JSON' }) }
  const p = body?.progress
  if (!p || typeof p !== 'object' || p.v !== 1 || typeof p.t !== 'object') return json(400, { error: 'unexpected progress format' })
  const enc = gzipSync(Buffer.from(JSON.stringify(p), 'utf8'), { level: 9 }).toString('base64')
  if (enc.length > LIMIT) return json(413, { error: 'progress too large for cloud save', bytes: enc.length })
  const at = new Date().toISOString()
  try {
    await a.clerk.users.updateUserMetadata(a.userId, { privateMetadata: { sdq: enc, sdqAt: at } })
    return json(200, { ok: true, bytes: enc.length, updatedAt: at })
  } catch {
    return json(502, { error: 'could not save progress' })
  }
}
