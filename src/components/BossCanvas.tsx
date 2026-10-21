import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArchNode, TypeGlyph } from './canvas/ArchNode'
import { Mascot } from './art/Mascot'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  MarkerType,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { CanvasComponentType } from '../content/types'

/** Touch screens: one finger on the empty canvas scrolls the page (instead of trapping it); pinch zooms, nodes still drag. */
function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: coarse)')
    if (!mq) return
    const on = () => setCoarse(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return coarse
}

const PALETTE: { type: CanvasComponentType; label: string }[] = [
  { type: 'client', label: 'Client' },
  { type: 'dns', label: 'DNS' },
  { type: 'load_balancer', label: 'Load Balancer' },
  { type: 'api_gateway', label: 'API Gateway' },
  { type: 'service', label: 'Service' },
  { type: 'cache', label: 'Cache' },
  { type: 'sql_db', label: 'SQL DB' },
  { type: 'nosql_db', label: 'NoSQL DB' },
  { type: 'queue', label: 'Queue/Kafka' },
  { type: 'cdn', label: 'CDN' },
  { type: 'blob_storage', label: 'Blob Storage' },
  { type: 'search', label: 'Search' },
  { type: 'worker', label: 'Worker' },
]

export interface CanvasSnapshot {
  nodes: { id: string; type: CanvasComponentType; label: string; position: { x: number; y: number } }[]
  edges: { id: string; source: string; target: string; label?: string }[]
}

interface Props {
  initial?: CanvasSnapshot
  onChange: (snap: CanvasSnapshot) => void
  /** Components suggested for this scenario, shown first */
  suggested?: CanvasComponentType[]
}

/** "Service", then "Service 2" … so wiring lists read like a diagram, not ids */
function readableName(type: CanvasComponentType, nodes: Node[]) {
  const base = PALETTE.find((p) => p.type === type)?.label ?? type
  const n = nodes.filter((x) => (x.data as { componentType?: string }).componentType === type).length
  return n === 0 ? base : `${base} ${n + 1}`
}

const nodeName = (n: Node) => String((n.data as { label?: string }).label)

/** Next free id; a module counter would restart at n1 after reload and collide with a restored draft. */
function nextNodeId(nodes: Node[]) {
  const max = nodes.reduce((m, n) => Math.max(m, Number(n.id.replace(/^n/, '')) || 0), 0)
  return `n${max + 1}`
}

const nodeTypes = { arch: ArchNode }

export function BossCanvas({ initial, onChange, suggested }: Props) {
  const initialNodes: Node[] = useMemo(
    () =>
      (initial?.nodes ?? []).map((n) => ({
        id: n.id,
        position: n.position,
        data: { label: n.label, componentType: n.type },
        type: 'arch',
      })),
    [initial],
  )
  const initialEdges: Edge[] = useMemo(
    () =>
      (initial?.edges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    [initial],
  )

  const suggestedSet = new Set(suggested ?? [])
  const ordered = [...PALETTE.filter((p) => suggestedSet.has(p.type)), ...PALETTE.filter((p) => !suggestedSet.has(p.type))]
  const suggestedCount = PALETTE.filter((p) => suggestedSet.has(p.type)).length
  const srcRef = useRef<HTMLSelectElement>(null)
  const tgtRef = useRef<HTMLSelectElement>(null)
  const coarse = useCoarsePointer()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Emit after React Flow has applied changes, so drags and deletions are saved with their final state
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    onChangeRef.current({
      nodes: nodes.map((node) => ({
        id: node.id,
        type: (node.data as { componentType: CanvasComponentType }).componentType,
        label: String((node.data as { label?: string }).label ?? ''),
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
      })),
    })
  }, [nodes, edges])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, id: `e${Date.now().toString(36)}` }, eds))
    },
    [setEdges],
  )

  const addComponent = (type: CanvasComponentType) => {
    const id = nextNodeId(nodes)
    const node: Node = {
      id,
      position: { x: 80 + (nodes.length % 4) * 140, y: 60 + Math.floor(nodes.length / 4) * 90 },
      type: 'arch',
      data: { label: readableName(type, nodes), componentType: type },
    }
    setNodes((ns) => [...ns, node])
  }

  const connectViaForm = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return
    setEdges((eds) => addEdge({ id: `e${Date.now().toString(36)}`, source: sourceId, target: targetId }, eds))
  }

  return (
    <div className="grid lg:grid-cols-[200px_1fr] gap-3">
      <aside className="panel-slab p-3 space-y-3" aria-label="Canvas tools">
        <div>
          <p className="text-sm font-semibold text-chalk mb-2">{suggested?.length ? 'Suggested for this scenario' : 'Add a component'}</p>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
            {ordered.map((p, i) => (
              <span key={p.type} className="contents">
                {suggested?.length && i === suggestedCount && (
                  <span className="col-span-2 lg:col-span-1 text-xs text-dim pt-2">More components</span>
                )}
              <button
                type="button"
                className={`palette-btn ${suggestedSet.has(p.type) ? 'palette-btn-suggested' : ''}`}
                onClick={() => addComponent(p.type)}
              >
                <TypeGlyph type={p.type} />
                <span className="sr-only">+ </span>
                {p.label}
              </button>
              </span>
            ))}
          </div>
        </div>
        <div className="pt-3 border-t border-[var(--color-rail)] space-y-1.5">
          <p className="text-sm font-semibold text-chalk">Connect without dragging</p>
          <label className="block text-xs text-dim">
            From
            <select ref={srcRef} className="mt-0.5 w-full field text-xs" disabled={nodes.length < 2}>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>{nodeName(n)}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-dim">
            To
            <select ref={tgtRef} className="mt-0.5 w-full field text-xs" disabled={nodes.length < 2}>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>{nodeName(n)}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="w-full btn-sky btn-sm"
            disabled={nodes.length < 2}
            onClick={() => connectViaForm(srcRef.current?.value ?? '', tgtRef.current?.value ?? '')}
          >
            Connect
          </button>
        </div>
      </aside>
      <div className="min-w-0 space-y-2">
      {coarse && (
        <p className="text-sm font-bold text-dim" data-testid="canvas-touch-hint">Drag components to move them, pinch to zoom; swipe the empty canvas to keep scrolling.</p>
      )}
      <div className={`boss-flow relative h-[480px] max-sm:h-[min(420px,62dvh)] rounded-[20px] ${coarse ? 'boss-flow-touch' : ''} border-2 border-[var(--color-rail)] overflow-hidden bg-[#f7f5f0]`}>
        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-6 text-center">
            <div className="max-w-xs">
              <Mascot mood="think" size={84} className="mx-auto" />
              <p className="font-display text-lg text-chalk mt-1">Empty canvas</p>
              <p className="text-sm text-dim mt-1">Add components from the palette, then drag them into place. Start where the request starts: the client.</p>
            </div>
          </div>
        )}
        {nodes.length >= 2 && edges.length === 0 && (
          <p className="pointer-events-none absolute left-3 top-3 z-10 rounded-2xl border-2 border-[var(--color-rail)] bg-white px-3 py-1.5 text-sm font-bold text-chalk">
            Drag from a node’s right-hand dot to another node to wire requests, or use Connect.
          </p>
        )}
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          colorMode="light"
          panOnDrag={!coarse}
          preventScrolling={!coarse}
          fitView
          fitViewOptions={{ maxZoom: 1.1, padding: 0.3 }}
          defaultEdgeOptions={{ style: { stroke: '#8AA0B8', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8AA0B8' } }}
        >
          <Background color="#DED7CA" gap={24} size={2} />
          <MiniMap pannable zoomable nodeColor="#BFD7EA" maskColor="rgba(255,249,240,0.7)" style={{ background: '#FFFFFF' }} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      </div>
    </div>
  )
}
