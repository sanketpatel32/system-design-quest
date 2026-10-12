// Builds hand-drawn (Excalidraw-style) diagrams from scripts/diagrams/specs.txt.
// Output: public/diagrams/<topicId>.svg (text converted to paths, no font shipped),
//         public/diagrams/<topicId>.excalidraw (open in excalidraw.com),
//         src/content/generated/diagrams.json (alt text + size per topic).
// Font: Virgil by Ellinor Rapp (SIL OFL 1.1), see scripts/diagrams/fonts/LICENSE.md.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'
import wawoff2 from 'wawoff2'
import { createRequire } from 'node:module'
const rough = createRequire(import.meta.url)('roughjs/bundled/rough.cjs.js')

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const outDir = path.join(root, 'public/diagrams')
const indexFile = path.join(root, 'src/content/generated/diagrams.json')

const ttf = await wawoff2.decompress(fs.readFileSync(path.join(here, 'fonts/Virgil.woff2')))
const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength))
const gen = rough.generator()

const FS = 17, EFS = 13, LINE = 22, PADX = 16, PADY = 12, GAPX = 70, GAPY = 34, MARGIN = 24
const PALETTE = {
  client: ['#d3f9d8', '#2f9e44'],
  store: ['#d0ebff', '#1971c2'],
  queue: ['#fff3bf', '#e67700'],
  ext: ['#ffe3e3', '#c92a2a'],
  svc: ['#f3f0ff', '#6741d9'],
}
function kindOf(label) {
  const l = label.toLowerCase()
  if (/(service|svc|server|worker|agent|indexer|builder|job|engine|gateway|scheduler|controller|fan-out|dispatch|limiter|api\b|lib)/.test(l)) return 'svc'
  if (/\b(client|clients|app|apps|user|users|browser|player|players|viewers|rider|driver|traders|customer|pod|phone|mobile)\b/.test(l)) return 'client'
  if (/(kafka|queue|topic|stream|event|pub\/sub|dlq|log\b|op log)/.test(l)) return 'queue'
  if (/(db|sql|store|storage|redis|cache|index|tsdb|ledger|cluster|registry|warehouse|lake|elasticsearch|disk|replica|follower|leader|shard|node|table|snapshot|zset|s3|cdn|edge)/.test(l)) return 'store'
  if (/(fcm|apns|sms provider|npci|bank|third|supplier|internet|isp|turn)/.test(l)) return 'ext'
  return 'svc'
}
const r1 = (v) => {
  if (!Number.isFinite(v)) throw new Error('non-finite glyph coordinate')
  return String(Math.round(v * 10) / 10)
}
function cmdsToD(cmds) {
  let d = ''
  for (const c of cmds) {
    if (c.type === 'M' || c.type === 'L') d += c.type + r1(c.x) + ' ' + r1(c.y)
    else if (c.type === 'Q') d += 'Q' + [c.x1, c.y1, c.x, c.y].map(r1).join(' ')
    else if (c.type === 'C') d += 'C' + [c.x1, c.y1, c.x2, c.y2, c.x, c.y].map(r1).join(' ')
    else if (c.type === 'Z') d += 'Z'
  }
  return d
}
// Glyph-by-glyph layout: opentype.js's contextual substitution produces NaN paths for some strings with this font.
const width = (t, s) => [...t].reduce((w, ch) => w + font.getAdvanceWidth(ch, s, { kerning: false }), 0)
function textPath(t, cx, y, s) {
  let x = cx - width(t, s) / 2
  let d = ''
  for (const ch of t) {
    const g = font.charToGlyph(ch)
    d += cmdsToD(g.getPath(x, y, s).commands)
    x += font.getAdvanceWidth(ch, s, { kerning: false })
  }
  if (d.includes('NaN')) throw new Error('NaN in text path: ' + t + ' ' + cx + ' ' + y + ' ' + s)
  return d
}

function parse(src) {
  const out = []
  let cur = null
  for (const raw of src.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = /^@(\d+)\s+(.+)$/.exec(line)
    if (m) { cur = { id: Number(m[1]), alt: m[2], lines: [] }; out.push(cur); continue }
    if (!cur) throw new Error('chain before @id: ' + line)
    cur.lines.push(line)
  }
  return out
}

function buildGraph(spec) {
  const nodes = new Map(), edges = []
  const node = (label) => {
    if (!nodes.has(label)) nodes.set(label, { id: 'n' + nodes.size, label, lines: label.split('|').map((s) => s.trim()) })
    return nodes.get(label)
  }
  for (const line of spec.lines) {
    const parts = line.split(/\s+((?:\[[^\]]*\])?~?>)\s+/)
    for (let i = 0; i + 2 < parts.length; i += 2) {
      const a = node(parts[i].trim()), b = node(parts[i + 2].trim())
      const op = parts[i + 1]
      const lm = /^\[([^\]]*)\]/.exec(op)
      edges.push({ from: a, to: b, dashed: op.endsWith('~>'), label: lm ? lm[1] : '' })
    }
    if (parts.length === 1) node(parts[0].trim())
    for (const p of parts) if (!p.trim()) throw new Error(`empty node in ${spec.id}: ${line}`)
  }
  return { nodes: [...nodes.values()], edges }
}

function layout(g) {
  // longest-path ranks; back edges (found by DFS in authoring order) are ignored for ranking
  const out = new Map(g.nodes.map((n) => [n, []]))
  for (const e of g.edges) out.get(e.from).push(e)
  const state = new Map()
  const dfs = (n) => {
    state.set(n, 1)
    for (const e of out.get(n)) {
      if (state.get(e.to) === 1) e.back = true
      else if (!state.has(e.to)) dfs(e.to)
    }
    state.set(n, 2)
  }
  for (const n of g.nodes) if (!state.has(n)) dfs(n)
  for (const n of g.nodes) n.rank = 0
  for (let k = 0; k < g.nodes.length; k++)
    for (const e of g.edges) if (!e.back && e.to.rank < e.from.rank + 1) e.to.rank = e.from.rank + 1
  for (const n of g.nodes) {
    n.w = Math.max(...n.lines.map((t) => width(t, FS))) + PADX * 2
    n.h = n.lines.length * LINE + PADY * 2
  }
  const ranks = []
  for (const n of g.nodes) (ranks[n.rank] ??= []).push(n)
  // barycenter ordering to reduce crossings (stable, a few sweeps)
  const pos = new Map()
  const reindex = () => ranks.forEach((r) => r.forEach((n, i) => pos.set(n, i)))
  reindex()
  const fwd = g.edges.filter((e) => !e.back)
  for (let sweep = 0; sweep < 4; sweep++) {
    const down = sweep % 2 === 0
    const order = down ? ranks.map((_, i) => i).slice(1) : ranks.map((_, i) => i).reverse().slice(1)
    for (const ri of order) {
      const bc = new Map()
      for (const n of ranks[ri]) {
        const nb = fwd.filter((e) => (down ? e.to === n : e.from === n)).map((e) => pos.get(down ? e.from : e.to))
        bc.set(n, nb.length ? nb.reduce((a, b) => a + b, 0) / nb.length : pos.get(n))
      }
      ranks[ri].sort((a, b) => bc.get(a) - bc.get(b) || pos.get(a) - pos.get(b))
      reindex()
    }
  }
  const vertical = ranks.length > 5
  if (!vertical) {
    let x = MARGIN
    const colH = ranks.map((r) => r.reduce((s, n) => s + n.h, 0) + GAPY * (r.length - 1))
    const H = Math.max(...colH)
    ranks.forEach((r, i) => {
      const cw = Math.max(...r.map((n) => n.w))
      let y = MARGIN + 18 + (H - colH[i]) / 2
      for (const n of r) { n.x = x + (cw - n.w) / 2; n.y = y; y += n.h + GAPY }
      x += cw + GAPX
    })
  } else {
    let y = MARGIN
    const rowW = ranks.map((r) => r.reduce((s, n) => s + n.w, 0) + 40 * (r.length - 1))
    const W = Math.max(...rowW)
    ranks.forEach((r, i) => {
      const rh = Math.max(...r.map((n) => n.h))
      let x = MARGIN + 60 + (W - rowW[i]) / 2
      for (const n of r) { n.x = x; n.y = y + (rh - n.h) / 2; x += n.w + 40 }
      y += rh + 56
    })
  }
  g.vertical = vertical
  const W = Math.max(...g.nodes.map((n) => n.x + n.w)) + MARGIN + (vertical ? 60 : 0)
  const H = Math.max(...g.nodes.map((n) => n.y + n.h)) + MARGIN + 18
  g.W = Math.ceil(W); g.H = Math.ceil(H)
}

function clip(n, tx, ty) {
  const cx = n.x + n.w / 2, cy = n.y + n.h / 2
  const dx = tx - cx, dy = ty - cy
  if (!dx && !dy) return [cx, cy]
  const s = Math.min(Math.abs((n.w / 2 + 4) / (dx || 1e-9)), Math.abs((n.h / 2 + 4) / (dy || 1e-9)))
  return [cx + dx * s, cy + dy * s]
}

function edgeGeom(e, g) {
  const a = e.from, b = e.to
  if (e.back) {
    // route around: below (horizontal) or to the right (vertical)
    if (!g.vertical) {
      const y = Math.max(a.y + a.h, b.y + b.h) + 22
      const p0 = [a.x + a.w / 2, a.y + a.h + 4], p3 = [b.x + b.w / 2, b.y + b.h + 4]
      return { pts: [p0, [p0[0], y], [p3[0], y], p3], curve: true }
    }
    const x = Math.max(a.x + a.w, b.x + b.w) + 30
    const p0 = [a.x + a.w + 4, a.y + a.h / 2], p3 = [b.x + b.w + 4, b.y + b.h / 2]
    return { pts: [p0, [x, p0[1]], [x, p3[1]], p3], curve: true }
  }
  const s = clip(a, b.x + b.w / 2, b.y + b.h / 2), t = clip(b, a.x + a.w / 2, a.y + a.h / 2)
  return { pts: [s, t], curve: false }
}

function seedOf(str) { let h = 7; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 2 ** 30) + 1 }
function d2path(drawable) { return gen.toPaths(drawable).map((p) => `<path d="${p.d.replace(/(\d+\.\d)\d+/g, '$1')}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill ?? 'none'}"${drawable.options.strokeLineDash ? ` stroke-dasharray="${drawable.options.strokeLineDash.join(' ')}"` : ''}/>`).join('') }

function renderSvg(spec, g) {
  const parts = []
  const seed = seedOf(String(spec.id))
  for (const n of g.nodes) {
    const [bg, stroke] = PALETTE[kindOf(n.label)]
    parts.push(d2path(gen.rectangle(n.x, n.y, n.w, n.h, { seed: seed + n.rank, roughness: 1.1, stroke, strokeWidth: 1.6, fill: bg, fillStyle: 'solid' })))
    n.lines.forEach((t, i) => {
      parts.push(`<path d="${textPath(t, n.x + n.w / 2, n.y + PADY + (i + 1) * LINE - 6, FS)}" fill="#1e1e1e"/>`)
    })
  }
  for (const e of g.edges) {
    const { pts, curve } = edgeGeom(e, g)
    const opts = { seed, roughness: 0.9, stroke: '#343a40', strokeWidth: 1.4, ...(e.dashed ? { strokeLineDash: [6, 5] } : {}) }
    parts.push(d2path(curve ? gen.curve(pts, opts) : gen.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], opts)))
    const [px, py] = pts[pts.length - 2], [qx, qy] = pts[pts.length - 1]
    const ang = Math.atan2(qy - py, qx - px), L = 11
    const hx = (da) => (qx - L * Math.cos(ang + da)).toFixed(1), hy = (da) => (qy - L * Math.sin(ang + da)).toFixed(1)
    parts.push(`<path d="M${hx(0.45)} ${hy(0.45)}L${qx.toFixed(1)} ${qy.toFixed(1)}L${hx(-0.45)} ${hy(-0.45)}" stroke="#343a40" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    if (e.label) {
      let mx, my
      if (curve) { mx = (pts[1][0] + pts[2][0]) / 2; my = (pts[1][1] + pts[2][1]) / 2 + (g.vertical ? 0 : 15) }
      else { mx = (pts[0][0] + pts[1][0]) / 2; my = (pts[0][1] + pts[1][1]) / 2 - 6 }
      const w = width(e.label, EFS) + 8
      parts.push(`<rect x="${(mx - w / 2).toFixed(1)}" y="${(my - 13).toFixed(1)}" width="${w.toFixed(1)}" height="17" rx="4" fill="#ffffff" opacity="0.9"/>`)
      parts.push(`<path d="${textPath(e.label, mx, my, EFS)}" fill="#495057"/>`)
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.W} ${g.H}" width="${g.W}" height="${g.H}" role="img"><title>${spec.alt.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title><rect width="100%" height="100%" fill="#ffffff"/>${parts.join('')}</svg>\n`
}

function renderExcalidraw(spec, g) {
  const els = []
  let k = 0
  const base = (type, extra) => ({
    id: `d${spec.id}-${k++}`, type, angle: 0, strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2,
    strokeStyle: 'solid', roughness: 1, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: 1000 + k, version: 1, versionNonce: 1 + k,
    isDeleted: false, boundElements: [], updated: 1, link: null, locked: false, ...extra,
  })
  const idOf = new Map()
  for (const n of g.nodes) {
    const [bg, stroke] = PALETTE[kindOf(n.label)]
    const rect = base('rectangle', { x: n.x, y: n.y, width: n.w, height: n.h, strokeColor: stroke, backgroundColor: bg, roundness: { type: 3 } })
    const text = n.lines.join('\n')
    const t = base('text', { x: n.x + PADX, y: n.y + PADY, width: n.w - PADX * 2, height: n.lines.length * LINE, text, originalText: text, fontSize: 16, fontFamily: 1, textAlign: 'center', verticalAlign: 'middle', containerId: rect.id, lineHeight: 1.25, autoResize: true })
    rect.boundElements.push({ type: 'text', id: t.id })
    idOf.set(n, rect)
    els.push(rect, t)
  }
  for (const e of g.edges) {
    const { pts } = edgeGeom(e, g)
    const [x0, y0] = pts[0]
    const a = base('arrow', {
      x: x0, y: y0, width: Math.abs(pts.at(-1)[0] - x0), height: Math.abs(pts.at(-1)[1] - y0), strokeStyle: e.dashed ? 'dashed' : 'solid',
      points: pts.map(([x, y]) => [x - x0, y - y0]), startArrowhead: null, endArrowhead: 'arrow', roundness: { type: 2 },
      startBinding: { elementId: idOf.get(e.from).id, focus: 0, gap: 4 }, endBinding: { elementId: idOf.get(e.to).id, focus: 0, gap: 4 },
    })
    idOf.get(e.from).boundElements.push({ type: 'arrow', id: a.id })
    idOf.get(e.to).boundElements.push({ type: 'arrow', id: a.id })
    els.push(a)
    if (e.label) {
      const mid = pts[Math.floor(pts.length / 2)]
      const t = base('text', { x: mid[0], y: mid[1] - 18, width: width(e.label, EFS), height: 16, text: e.label, originalText: e.label, fontSize: 14, fontFamily: 1, textAlign: 'left', verticalAlign: 'top', containerId: null, lineHeight: 1.25, autoResize: true })
      els.push(t)
    }
  }
  return JSON.stringify({ type: 'excalidraw', version: 2, source: 'https://system-design-quest-phi.vercel.app', elements: els, appState: { viewBackgroundColor: '#ffffff', gridSize: null }, files: {} }, null, 1) + '\n'
}

const specs = parse(fs.readFileSync(path.join(here, 'specs.txt'), 'utf8'))
fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })
const index = {}
const seen = new Set()
for (const spec of specs) {
  if (seen.has(spec.id)) throw new Error('duplicate diagram id ' + spec.id)
  seen.add(spec.id)
  const g = buildGraph(spec)
  layout(g)
  fs.writeFileSync(path.join(outDir, `${spec.id}.svg`), renderSvg(spec, g))
  fs.writeFileSync(path.join(outDir, `${spec.id}.excalidraw`), renderExcalidraw(spec, g))
  index[spec.id] = { alt: spec.alt, width: g.W, height: g.H }
}
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n')
console.log(`diagrams: ${specs.length} built`)
