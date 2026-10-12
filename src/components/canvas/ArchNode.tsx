import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { CanvasComponentType } from '../../content/types'

export const typeLabels: Record<CanvasComponentType, string> = {
  client: 'Client',
  dns: 'DNS',
  load_balancer: 'Load Balancer',
  api_gateway: 'API Gateway',
  service: 'Service',
  cache: 'Cache',
  sql_db: 'SQL DB',
  nosql_db: 'NoSQL',
  queue: 'Queue',
  cdn: 'CDN',
  blob_storage: 'Blob',
  search: 'Search',
  worker: 'Worker',
}

/** Pastel family per component role (see DESIGN.md "Boss canvas") */
const FAMILY = {
  edge: { bg: '#DDF4FE', bd: '#84D8FF', ink: '#12749F' },
  traffic: { bg: '#F0E6FC', bd: '#CDB0F5', ink: '#7A45C0' },
  compute: { bg: '#E3F9D3', bd: '#A5E075', ink: '#2F7D00' },
  cache: { bg: '#DDF6F6', bd: '#8FDCDC', ink: '#1B7A7A' },
  data: { bg: '#FFF1DB', bd: '#FFC97A', ink: '#A35F00' },
  queue: { bg: '#FCE2F1', bd: '#F2A6D2', ink: '#B0347F' },
} as const

const TYPE_FAMILY: Record<CanvasComponentType, keyof typeof FAMILY> = {
  client: 'edge',
  dns: 'edge',
  cdn: 'edge',
  load_balancer: 'traffic',
  api_gateway: 'traffic',
  service: 'compute',
  worker: 'compute',
  cache: 'cache',
  sql_db: 'data',
  nosql_db: 'data',
  blob_storage: 'data',
  search: 'data',
  queue: 'queue',
}

export function typeStyle(t: CanvasComponentType) {
  return FAMILY[TYPE_FAMILY[t] ?? 'compute']
}

export function TypeGlyph({ type, size = 22 }: { type: CanvasComponentType; size?: number }) {
  const c = typeStyle(type).ink
  const g: Record<string, React.ReactNode> = {
    edge: <><rect x="4" y="4" width="16" height="12" rx="3" fill={c} /><rect x="9" y="17" width="6" height="3" rx="1.5" fill={c} /></>,
    traffic: <><circle cx="6" cy="12" r="3.2" fill={c} /><path d="M9 12h3M12 12l6-6M12 12l6 6M12 12h7" stroke={c} strokeWidth="2.4" strokeLinecap="round" /></>,
    compute: <><rect x="4" y="5" width="16" height="6" rx="2.5" fill={c} /><rect x="4" y="13" width="16" height="6" rx="2.5" fill={c} opacity="0.7" /><circle cx="16.5" cy="8" r="1.3" fill="#fff" /></>,
    cache: <path d="M13 2 5 13h6l-1 9 8-11h-6z" fill={c} />,
    data: <><ellipse cx="12" cy="6" rx="7" ry="3" fill={c} /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6c0 1.7-3.1 3-7 3S5 7.7 5 6z" fill={c} opacity="0.7" /></>,
    queue: <><rect x="3" y="8" width="5" height="8" rx="2" fill={c} /><rect x="9.5" y="8" width="5" height="8" rx="2" fill={c} opacity="0.8" /><rect x="16" y="8" width="5" height="8" rx="2" fill={c} opacity="0.6" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      {g[TYPE_FAMILY[type] ?? 'compute']}
    </svg>
  )
}

export function ArchNode({ data }: NodeProps) {
  const componentType = (data as { componentType?: CanvasComponentType }).componentType ?? 'service'
  const label = String((data as { label?: string }).label ?? typeLabels[componentType])
  const st = typeStyle(componentType)
  return (
    <div className="arch-node" style={{ ['--node-bg' as string]: st.bg, ['--node-bd' as string]: st.bd }}>
      <Handle type="target" position={Position.Left} className="arch-handle" />
      <div className="arch-node-type flex items-center justify-center gap-1.5" style={{ color: st.ink }}>
        <TypeGlyph type={componentType} size={18} />
        {typeLabels[componentType]}
      </div>
      {label.toLowerCase() !== typeLabels[componentType].toLowerCase() && <div className="arch-node-label">{label}</div>}
      <Handle type="source" position={Position.Right} className="arch-handle" />
    </div>
  )
}
