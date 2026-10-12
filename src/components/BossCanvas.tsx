import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { CanvasComponentType } from '../content/types'

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
}

let nodeCounter = 1

export function BossCanvas({ initial, onChange }: Props) {
  const initialNodes: Node[] = useMemo(
    () =>
      (initial?.nodes ?? []).map((n) => ({
        id: n.id,
        position: n.position,
        data: { label: n.label, componentType: n.type },
        type: 'default',
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const emit = useCallback(
    (n: Node[], e: Edge[]) => {
      onChange({
        nodes: n.map((node) => ({
          id: node.id,
          type: (node.data as { componentType: CanvasComponentType }).componentType,
          label: String((node.data as { label?: string }).label ?? ''),
          position: node.position,
        })),
        edges: e.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: typeof edge.label === 'string' ? edge.label : undefined,
        })),
      })
    },
    [onChange],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge({ ...connection, id: `e${eds.length + 1}` }, eds)
        emit(nodes, next)
        return next
      })
    },
    [emit, nodes, setEdges],
  )

  const addComponent = (type: CanvasComponentType) => {
    const id = `n${nodeCounter++}`
    const node: Node = {
      id,
      position: { x: 80 + (nodes.length % 4) * 140, y: 60 + Math.floor(nodes.length / 4) * 90 },
      data: { label: type.replace(/_/g, ' '), componentType: type },
    }
    const next = [...nodes, node]
    setNodes(next)
    emit(next, edges)
  }

  const connectViaForm = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId) return
    const edge: Edge = { id: `e${edges.length + 1}`, source: sourceId, target: targetId }
    const next = [...edges, edge]
    setEdges(next)
    emit(nodes, next)
  }

  return (
    <div className="grid lg:grid-cols-[200px_1fr] gap-3">
      <aside className="space-y-2">
        <p className="text-xs text-slate-400">Palette</p>
        {PALETTE.map((p) => (
          <button
            key={p.type}
            type="button"
            className="w-full text-left text-xs px-2 py-1 rounded border border-slate-600 hover:border-cyan-400/50"
            onClick={() => addComponent(p.type)}
          >
            + {p.label}
          </button>
        ))}
        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Keyboard/mobile connect</p>
          <select id="src" className="w-full mb-1 bg-slate-800 text-xs rounded border border-slate-600">
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{String((n.data as { label?: string }).label)} ({n.id})</option>
            ))}
          </select>
          <select id="tgt" className="w-full mb-1 bg-slate-800 text-xs rounded border border-slate-600">
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{String((n.data as { label?: string }).label)} ({n.id})</option>
            ))}
          </select>
          <button
            type="button"
            className="w-full text-xs py-1 rounded bg-slate-800 border border-slate-600"
            onClick={() => {
              const src = (document.getElementById('src') as HTMLSelectElement)?.value
              const tgt = (document.getElementById('tgt') as HTMLSelectElement)?.value
              connectViaForm(src, tgt)
            }}
          >
            Connect
          </button>
        </div>
      </aside>
      <div className="h-[420px] rounded-lg border border-slate-700 overflow-hidden bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(c) => {
            onNodesChange(c)
            emit(nodes, edges)
          }}
          onEdgesChange={(c) => {
            onEdgesChange(c)
            emit(nodes, edges)
          }}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
