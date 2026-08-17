import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  type NodeMouseHandler,
} from '@xyflow/react'
import { useResponsive } from '../hooks/useResponsive'
import { useTheme } from '../theme'
import type { KGNode, KGEdge } from '../types'

export const KIND_LABEL: Record<string, string> = {
  package: 'Package',
  ctx: 'ctx 服务',
  event: '事件',
  file: '源码',
  concept: '概念',
  doc: '文档',
  tool: '工具',
  role: '角色',
  profile: 'Profile',
  bundle: 'Bundle',
  backend: '后端',
  provider: 'Provider',
  user: '用户',
  gate: '决策点',
  consumer: 'Consumer',
}

export const KIND_EMOJI: Record<string, string> = {
  package: '📦',
  ctx: '🔌',
  event: '⚡',
  file: '📄',
  concept: '🧩',
  doc: '📚',
  tool: '🛠',
  role: '👤',
  profile: '🧬',
  bundle: '🧶',
  backend: '🖥',
  provider: '🔀',
  user: '🧑',
  gate: '🚦',
  consumer: '🎧',
}

export const KIND_COLOR: Record<string, string> = {
  package: '#22d3ee',
  ctx: '#818cf8',
  event: '#fbbf24',
  file: '#34d399',
  concept: '#a78bfa',
  doc: '#fb7185',
  tool: '#f59e0b',
  role: '#2dd4bf',
  profile: '#22d3ee',
  bundle: '#f472b6',
  backend: '#34d399',
  provider: '#f59e0b',
  user: '#38bdf8',
  gate: '#e879f9',
  consumer: '#67e8f9',
}

// ---------------------------------------------------------------------------
// 自动分层布局：按拓扑排序分层，层=列，层内竖直排布
// ---------------------------------------------------------------------------
function layoutNodes(nodes: KGNode[], edges: KGEdge[]) {
  const layer = new Map<string, number>()
  nodes.forEach((n) => layer.set(n.id, 0))
  const indeg = new Map<string, number>()
  nodes.forEach((n) => indeg.set(n.id, 0))
  edges.forEach((e) => indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1))

  const roots = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id)
  const queue: string[] = roots.length ? [...roots] : [nodes[0]?.id].filter(Boolean)
  const visited = new Set<string>()
  let guard = 0
  while (queue.length && guard++ < 1000) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const l = layer.get(id) ?? 0
    edges
      .filter((e) => e.from === id)
      .forEach((e) => {
        layer.set(e.to, Math.max(layer.get(e.to) ?? 0, l + 1))
        queue.push(e.to)
      })
  }
  // 孤立/回环节点兜底
  nodes.forEach((n) => {
    if (!visited.has(n.id)) layer.set(n.id, layer.get(n.id) ?? 0)
  })

  const byLayer = new Map<number, string[]>()
  nodes.forEach((n) => {
    const l = layer.get(n.id) ?? 0
    if (!byLayer.has(l)) byLayer.set(l, [])
    byLayer.get(l)!.push(n.id)
  })
  const cols = [...byLayer.entries()].sort((a, b) => a[0] - b[0])
  const maxCol = Math.max(1, ...cols.map(([, ids]) => ids.length))
  const V_GAP = Math.max(84, Math.floor(760 / maxCol))
  const H_GAP = 200

  const pos = new Map<string, { x: number; y: number }>()
  cols.forEach(([l, ids]) => {
    ids.forEach((id, i) => {
      pos.set(id, { x: l * H_GAP + 24, y: i * V_GAP + 16 })
    })
  })
  return pos
}

// ---------------------------------------------------------------------------
// 自定义节点（hover 显示简介气泡）
// ---------------------------------------------------------------------------
function LLabNode({ data }: NodeProps) {
  const [hover, setHover] = useState(false)
  const brief = (data as { brief?: string }).brief
  const kind = (data as { kind: string }).kind
  const icon = (data as { icon?: string }).icon
  return (
    <div
      className={`llab-node kind-${kind}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="nn-row">
        <span className="nn-ic">{icon ?? KIND_EMOJI[kind] ?? '▪'}</span>
        <span className="nn-label">{(data as { label: string }).label}</span>
      </div>
      <div className="nn-kind">{KIND_LABEL[kind] ?? kind}</div>
      {hover && brief && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 8,
            width: 240,
            background: 'var(--surface-3)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 11.5,
            color: 'var(--text)',
            boxShadow: 'var(--shadow)',
            zIndex: 40,
            pointerEvents: 'none',
            whiteSpace: 'normal',
            lineHeight: 1.5,
            textAlign: 'left',
          }}
        >
          {brief}
        </div>
      )}
    </div>
  )
}

interface GraphProps {
  nodes: KGNode[]
  edges: KGEdge[]
  onNodeClick?: (node: KGNode) => void
  height?: number
}

function GraphInner({ nodes, edges, onNodeClick, height }: GraphProps) {
  const { isMobile } = useResponsive()
  const { theme } = useTheme()
  const positions = useMemo(() => layoutNodes(nodes, edges), [nodes, edges])

  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: 'llab',
        position: positions.get(n.id) ?? { x: 0, y: 0 },
        data: { ...n, label: n.label, kind: n.kind, brief: n.brief, icon: n.icon },
      })),
    [nodes, positions],
  )

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        label: e.label,
        animated: e.animated !== false,
        dashed: e.dashed,
        style: {
          stroke: 'var(--primary)',
          strokeOpacity: 0.65,
          strokeWidth: e.dashed ? 1.2 : 1.6,
          strokeDasharray: e.dashed ? '5 4' : undefined,
        },
        labelStyle: { fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--mono)' },
        labelBgStyle: { fill: 'var(--surface)', opacity: 0.85 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 14, height: 14 },
      })),
    [edges],
  )

  const handleClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      const orig = nodes.find((n) => n.id === node.id)
      if (orig) onNodeClick?.(orig)
    },
    [nodes, onNodeClick],
  )

  return (
    <div className="graph-wrap" style={{ height: height ?? 520 }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodeClick={handleClick}
        nodeTypes={{ llab: LLabNode }}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={isMobile ? 0.2 : 0.3}
        maxZoom={1.6}
        nodesDraggable={isMobile}
        panOnDrag
        proOptions={{ hideAttribution: true }}
        colorMode={theme}
        style={{ background: 'transparent' }}
      >
        <Background gap={22} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
      <div className="graph-legend">
        {Object.entries(KIND_LABEL).map(([k, l]) => (
          <div className="li" key={k}>
            <span className="dot" style={{ background: KIND_COLOR[k] }} />
            {l}
          </div>
        ))}
      </div>
      <div className="graph-tip">悬停查看简介 · 点击节点查看详情与源码</div>
    </div>
  )
}

export default function Graph(props: GraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  )
}
