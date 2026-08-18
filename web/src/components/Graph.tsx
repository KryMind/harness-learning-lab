import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
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
      className={`llab-node kind-${kind}${(data as { dimmed?: boolean }).dimmed ? ' dimmed' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* 布局从左到右：target 在左、source 在右；透明但不能 display:none，否则连线不画 */}
      <Handle type="target" position={Position.Left} className="llab-handle" />
      <div className="nn-row">
        <span className="nn-ic">{icon ?? KIND_EMOJI[kind] ?? '▪'}</span>
        <span className="nn-label">{(data as { label: string }).label}</span>
      </div>
      <div className="nn-kind">{KIND_LABEL[kind] ?? kind}</div>
      <Handle type="source" position={Position.Right} className="llab-handle" />
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
  /** 节点抽屉打开时固定聚焦该节点，直到抽屉关闭 */
  selectedNodeId?: string | null
  /** 点击画布空白处（恢复全部关系） */
  onPaneClick?: () => void
}

function GraphInner({ nodes, edges, onNodeClick, height, selectedNodeId, onPaneClick }: GraphProps) {
  const { isMobile } = useResponsive()
  const { theme } = useTheme()
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [showAllLabels, setShowAllLabels] = useState(false)
  const positions = useMemo(() => layoutNodes(nodes, edges), [nodes, edges])

  // 聚焦节点：抽屉选中的优先，其次为悬停节点
  const activeId = selectedNodeId ?? hoverId

  const rfNodes: Node[] = useMemo(() => {
    const focusSet = new Set<string>()
    if (activeId) {
      focusSet.add(activeId)
      edges.forEach((e) => {
        if (e.from === activeId) focusSet.add(e.to)
        if (e.to === activeId) focusSet.add(e.from)
      })
    }
    return nodes.map((n) => ({
      id: n.id,
      type: 'llab',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: {
        ...n,
        label: n.label,
        kind: n.kind,
        brief: n.brief,
        icon: n.icon,
        // 聚焦时无关节点轻微降透明度（不隐藏）
        dimmed: activeId != null && !focusSet.has(n.id),
      },
    }))
  }, [nodes, positions, edges, activeId])

  const rfEdges: Edge[] = useMemo(() => {
    const isRelated = (e: KGEdge) => activeId != null && (e.from === activeId || e.to === activeId)
    const isDimmed = (e: KGEdge) => activeId != null && !isRelated(e)
    return edges.map((e) => {
      const related = isRelated(e)
      const showLabel = showAllLabels || related
      return {
        id: e.id,
        source: e.from,
        target: e.to,
        type: 'smoothstep',
        label: showLabel ? e.label : undefined,
        animated: e.animated !== false,
        dashed: e.dashed,
        style: {
          stroke: 'var(--primary)',
          strokeOpacity: isDimmed(e) ? 0.1 : related ? 1 : 0.6,
          strokeWidth: related ? (e.dashed ? 2.4 : 3) : e.dashed ? 1.2 : 1.6,
          strokeDasharray: e.dashed ? '5 4' : undefined,
        },
        labelStyle: {
          fill: related ? 'var(--text)' : 'var(--text-3)',
          fontSize: 11,
          fontFamily: 'var(--mono)',
        },
        labelBgStyle: {
          fill: 'var(--surface)',
          stroke: 'var(--border-strong)',
          strokeWidth: 1,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 5,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 14, height: 14 },
      }
    })
  }, [edges, activeId, showAllLabels])

  const handleClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      const orig = nodes.find((n) => n.id === node.id)
      if (orig) onNodeClick?.(orig)
    },
    [nodes, onNodeClick],
  )

  const handlePaneClick = useCallback(() => {
    setHoverId(null)
    onPaneClick?.()
  }, [onPaneClick])

  return (
    <div className="graph-wrap" style={{ height: height ?? 520 }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodeClick={handleClick}
        onNodeMouseEnter={(_e, n) => setHoverId(n.id)}
        onNodeMouseLeave={() => setHoverId(null)}
        onPaneClick={handlePaneClick}
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
      <div className="graph-label-toggle">
        <span className="tt">关系文字</span>
        <button className={!showAllLabels ? 'on' : ''} onClick={() => setShowAllLabels(false)} aria-pressed={!showAllLabels}>
          智能显示
        </button>
        <button className={showAllLabels ? 'on' : ''} onClick={() => setShowAllLabels(true)} aria-pressed={showAllLabels}>
          全部显示
        </button>
      </div>
      <div className="graph-tip">悬停/点击节点高亮关系 · 点击空白恢复 · 关系文字默认智能显示</div>
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
