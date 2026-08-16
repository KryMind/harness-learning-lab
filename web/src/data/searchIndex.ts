// ---------------------------------------------------------------------------
// 搜索索引 —— 构建期产物（generated/search/）+ 前端运行时数据合并
// 五类记录：concept / doc / package / api / source
// 概念由 LESSONS 运行时构建（含中文 aliases）；docs/packages/source 复用已加载的
// useData() 数据避免重复下载大文件；api 来自 AST 扫描产物（按需 fetch）。
// ---------------------------------------------------------------------------
import { buildConceptIndex } from '../course/lessons'
import type { DocRecord, IndexFile, Meta, PkgRecord } from '../types'

export type SearchType = 'concept' | 'doc' | 'package' | 'api' | 'source'

export interface SearchRecord {
  id: string
  type: SearchType
  title: string
  aliases?: string[]
  description?: string
  /** 跳转路由（无则不可导航） */
  route?: string
  package?: string
  sourcePath?: string
  line?: number
  signature?: string
  lessonIds?: string[]
  /** API 分级：official-surface 高于 exported-symbol（UX#12） */
  tier?: 'official-surface' | 'exported-symbol'
}

export interface ApiSymbolRecord {
  symbol: string
  tier: 'official-surface' | 'exported-symbol'
  package: string | null
  sourcePath: string
  line: number
  signature: string
  lessonIds: string[]
}

const BASE = import.meta.env.BASE_URL

async function fetchApiSymbols(): Promise<ApiSymbolRecord[]> {
  try {
    const res = await fetch(`${BASE}data/search/api-symbols.json`)
    if (!res.ok) return []
    const j = (await res.json()) as { symbols?: ApiSymbolRecord[] }
    return Array.isArray(j.symbols) ? j.symbols : []
  } catch {
    return []
  }
}

const sourcePathOf = (p: string) => `/source?path=${encodeURIComponent(p)}`
const pkgRouteOf = (dir: string) => `/packages?dir=${encodeURIComponent(dir)}`

/** 从已加载数据 + 按需 fetch 的 API 索引，构建统一搜索记录集（应用启动后构建一次）。 */
export async function buildSearchRecords(opts: {
  files: IndexFile[]
  packages: PkgRecord[]
  docs: DocRecord[]
  meta: Meta | null
}): Promise<SearchRecord[]> {
  const { files, packages, docs } = opts
  const recs: SearchRecord[] = []

  // 1) 概念（本地构建，含中文 aliases）
  for (const c of buildConceptIndex()) {
    recs.push({
      id: c.id,
      type: 'concept',
      title: c.title,
      aliases: c.aliases,
      description: c.description,
      route: c.route,
      lessonIds: [c.lessonId],
    })
  }

  // 2) 文档
  for (const d of docs) {
    recs.push({
      id: `doc-${d.source_path}`,
      type: 'doc',
      title: d.title,
      description: d.headings.slice(0, 6).map((h) => h.text).join(' · '),
      package: d.package ?? undefined,
      sourcePath: d.source_path,
      route: sourcePathOf(d.source_path),
    })
  }

  // 3) 包
  for (const p of packages) {
    recs.push({
      id: `pkg-${p.dir}`,
      type: 'package',
      title: p.name,
      aliases: [p.pkg],
      description: p.description,
      package: p.name,
      route: pkgRouteOf(p.dir),
    })
  }

  // 4) API（AST 扫描产物）
  for (const a of await fetchApiSymbols()) {
    recs.push({
      id: `api-${a.symbol}`,
      type: 'api',
      title: a.symbol,
      tier: a.tier,
      description: a.signature,
      package: a.package ?? undefined,
      sourcePath: a.sourcePath || undefined,
      line: a.line || undefined,
      lessonIds: a.lessonIds,
      route: a.sourcePath ? `${sourcePathOf(a.sourcePath)}${a.line ? `&line=${a.line}` : ''}` : undefined,
    })
  }

  // 5) 源码（降噪：只收 packages/vendor/docs 下可读源码，且与课程关联，避免淹没搜索）
  for (const f of files) {
    if (!/\.(ts|tsx|mts|cts|md)$/.test(f.source_path)) continue
    if (!f.source_path.startsWith('packages/') && !f.source_path.startsWith('vendor/') && !f.source_path.startsWith('docs/')) continue
    if (/\.(spec|test)\./.test(f.source_path)) continue
    recs.push({
      id: `src-${f.source_path}`,
      type: 'source',
      title: f.source_path.split('/').pop() ?? f.source_path,
      sourcePath: f.source_path,
      route: sourcePathOf(f.source_path),
    })
  }

  return recs
}
