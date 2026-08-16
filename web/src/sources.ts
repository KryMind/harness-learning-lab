// ---------------------------------------------------------------------------
// 静态源码快照加载器
// ---------------------------------------------------------------------------
// 构建期由 scripts/scan.ts 生成：
//   data/sources-index.json       源码路径 → chunkId 映射
//   data/sources/chunk-*.json     源码内容分块（按需加载）
// 浏览器运行时直接 fetch 静态 JSON，不依赖任何 server。
// ---------------------------------------------------------------------------

const BASE = import.meta.env.BASE_URL

let indexCache: Record<string, string> | null = null
const chunkCache: Record<string, Record<string, string>> = {}

async function fetchJson<T>(rel: string): Promise<T> {
  const res = await fetch(BASE + rel)
  if (!res.ok) throw new Error(`加载 ${rel} 失败: ${res.status}`)
  return res.json() as Promise<T>
}

/** 按路径加载源码内容；静态快照中不存在则返回 null。 */
export async function loadSourceContent(path: string): Promise<string | null> {
  try {
    if (!indexCache) indexCache = await fetchJson<Record<string, string>>('data/sources-index.json')
    const chunkId = indexCache[path]
    if (!chunkId) return null
    let chunk = chunkCache[chunkId]
    if (!chunk) {
      chunk = await fetchJson<Record<string, string>>(`data/sources/${chunkId}.json`)
      chunkCache[chunkId] = chunk
    }
    return chunk[path] ?? null
  } catch {
    return null
  }
}
