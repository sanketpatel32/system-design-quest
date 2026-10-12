import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { CanvasComponentType } from '../../content/types'

const typeLabels: Record<CanvasComponentType, string> = {
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

export function ArchNode({ data }: NodeProps) {
  const componentType = (data as { componentType?: CanvasComponentType }).componentType ?? 'service'
  const label = String((data as { label?: string }).label ?? typeLabels[componentType])
  return (
    <div className="arch-node">
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#2dd4bf] !border-0" />
      <div className="arch-node-type">{typeLabels[componentType]}</div>
      <div>{label}</div>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#2dd4bf] !border-0" />
    </div>
  )
}
