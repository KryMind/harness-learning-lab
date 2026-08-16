// ---------------------------------------------------------------------------
// API 客户端
// ---------------------------------------------------------------------------
import type { Meta, IndexFile, PkgRecord, DocRecord, Stats, DumpConfigResult } from './types'

const BASE = ''

async function get<T>(url: string): Promise<T> {
  const res = await fetch(BASE + url)
  if (!res.ok) throw new Error(`请求失败 ${url}: ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  meta: () => get<{ meta: Meta | null }>('/api/meta'),
  index: () => get<{ meta: Meta; files: IndexFile[] }>('/api/index'),
  packages: () => get<{ meta: Meta; packages: PkgRecord[] }>('/api/packages'),
  docs: () => get<{ meta: Meta; docs: DocRecord[] }>('/api/docs'),
  source: (path: string) => get<{ path: string; content?: string; type?: string; items?: { name: string; type: string }[]; error?: string }>(`/api/source?path=${encodeURIComponent(path)}`),
  search: (q: string) =>
    get<{
      files: { source_path: string; source_type: string; package: string | null; title: string }[]
      packages: { dir: string; name: string; description: string; group: string }[]
      docs: { source_path: string; title: string }[]
    }>(`/api/search?q=${encodeURIComponent(q)}`),
  stats: () => get<Stats>('/api/stats'),
  dumpConfig: () => get<DumpConfigResult>('/api/dump-config'),
}
