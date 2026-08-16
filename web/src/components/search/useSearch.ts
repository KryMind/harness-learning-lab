// ---------------------------------------------------------------------------
// 搜索打分与结果计算 —— UX#10：概念 > 公共 API > Package/Docs > Source
// 概念标题 100/92，official API 96/88，aliases 90/74，title 前缀 80，
// exported API 62，signature/doc description 70/56/50，源码路径 30。
// ---------------------------------------------------------------------------
import { useMemo } from 'react'
import type { SearchRecord } from '../../data/searchIndex'

export type SearchTab = 'all' | 'concept' | 'doc' | 'package' | 'api' | 'source'

export const TABS: { key: SearchTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'concept', label: '概念' },
  { key: 'doc', label: '文档' },
  { key: 'package', label: 'Package' },
  { key: 'api', label: 'API' },
  { key: 'source', label: '源码' },
]

const hit = (v?: string) => (v ?? '').toLowerCase()

export function score(rec: SearchRecord, q: string): number {
  const s = q.trim().toLowerCase()
  if (!s) return 0
  const title = hit(rec.title)

  // 精确命中（概念/官方 API 最高权重）
  if (title === s) return rec.type === 'concept' || (rec.type === 'api' && rec.tier === 'official-surface') ? 100 : 88
  if (rec.type === 'concept' && title.startsWith(s)) return 92
  if (rec.type === 'api' && rec.tier === 'official-surface' && title.includes(s)) return 88
  if (rec.aliases?.some((a) => hit(a) === s)) return 90
  if (title.startsWith(s)) return 80
  if (rec.type === 'package' && hit(rec.package).startsWith(s)) return 80
  if (rec.aliases?.some((a) => hit(a).includes(s))) return 74
  if (rec.type === 'api' && rec.tier === 'exported-symbol' && title.includes(s)) return 62
  if (rec.signature && hit(rec.signature).includes(s)) return 70
  if (rec.type === 'doc' && rec.description && hit(rec.description).includes(s)) return 56
  if (rec.description && hit(rec.description).includes(s)) return 50
  if (rec.sourcePath && hit(rec.sourcePath).includes(s)) return 30
  return 0
}

export function useSearch(records: SearchRecord[], q: string, tab: SearchTab) {
  return useMemo(() => {
    const s = q.trim()
    if (!s || records.length === 0) return [] as SearchRecord[]
    const scored = records
      .map((r) => ({ r, sc: score(r, s) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
    const top = tab === 'all' ? scored : scored.filter((x) => x.r.type === tab)
    return top.slice(0, 40).map((x) => x.r)
  }, [records, q, tab])
}
