// ---------------------------------------------------------------------------
// Learning Lab 共享类型
// ---------------------------------------------------------------------------

/** 源码引用 */
export interface SourceRef {
  path: string
  label?: string
}

/** 知识图谱节点 */
export interface KGNode {
  id: string
  label: string
  kind:
    | 'package'
    | 'ctx'
    | 'event'
    | 'file'
    | 'concept'
    | 'doc'
    | 'tool'
    | 'role'
    | 'profile'
    | 'bundle'
    | 'backend'
    | 'provider'
    | 'user'
    | 'gate'
    | 'consumer'
  brief?: string
  detail?: string
  icon?: string
  sources?: SourceRef[]
  docs?: SourceRef[]
  /** 悬停/详情时跳转的包目录 */
  packageDir?: string
}

/** 知识图谱连线 */
export interface KGEdge {
  id: string
  from: string
  to: string
  label?: string
  dashed?: boolean
  animated?: boolean
}

/** 概念卡 */
export interface Concept {
  title: string
  body: string
  icon?: string
  sources?: SourceRef[]
}

/** 一个学习页面的内容定义 */
export interface PageContent {
  id: string
  title: string
  emoji: string
  subtitle: string
  /** 页首介绍段落 */
  hero?: string[]
  /** 你能学到什么 */
  learn: string[]
  nodes: KGNode[]
  edges: KGEdge[]
  concepts: Concept[]
  /** 相关包目录（resolved 到 packages.json） */
  packages?: string[]
  /** 相关文档 */
  docs?: SourceRef[]
  /** 相关页面 */
  relatedPages?: string[]
  /** 附加 mermaid 图 */
  mermaid?: string
  mermaidCaption?: string
}

// ---------------------------------------------------------------------------
// 生成数据（来自 generated/*.json，构建期由 scripts/scan.ts 生成）
// ---------------------------------------------------------------------------

export interface Meta {
  generatedAt: string
  repo: string
  repoPath: string
  repoCommit: string | null
  nodeVersion: string
  fileCount: number
  docCount: number
  packageCount: number
}

export interface IndexFile {
  source_path: string
  source_type: string
  package: string | null
  title: string
  commit_hash: string
}

export interface PkgRecord {
  dir: string
  group: string
  pkg: string
  name: string
  version: string
  description: string
  private: boolean
  type: string
  hasSrc: boolean
  srcFiles: string[]
  readme: string | null
  dependencies: string[]
  peerDependencies: string[]
  dsh: Record<string, unknown> | null
}

export interface DocRecord {
  source_path: string
  source_type: string
  package: string | null
  title: string
  commit_hash: string
  headings: { level: number; text: string }[]
  links: string[]
}

export interface Stats {
  fileCount: number
  packageCount: number
  docCount: number
  srcLineCount: number
  byType: Record<string, number>
  byGroup: Record<string, number>
}
