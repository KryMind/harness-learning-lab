import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Meta, IndexFile, PkgRecord, DocRecord, Stats } from './types'

interface DataState {
  loading: boolean
  error: string | null
  meta: Meta | null
  files: IndexFile[]
  packages: PkgRecord[]
  docs: DocRecord[]
  stats: Stats | null
  packageByDir: (dir: string) => PkgRecord | undefined
  docByPath: (path: string) => DocRecord | undefined
  fileByPath: (path: string) => IndexFile | undefined
  refresh: () => void
}

const Ctx = createContext<DataState | null>(null)

// 静态数据基址：GitHub Pages 子路径下自动带前缀（由 vite base 决定）
const BASE = import.meta.env.BASE_URL

async function loadJson<T>(rel: string): Promise<T> {
  const res = await fetch(BASE + rel)
  if (!res.ok) throw new Error(`加载 ${rel} 失败: ${res.status}`)
  return res.json() as Promise<T>
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<DataState, 'packageByDir' | 'docByPath' | 'fileByPath' | 'refresh'>>({
    loading: true,
    error: null,
    meta: null,
    files: [],
    packages: [],
    docs: [],
    stats: null,
  })

  useEffect(() => {
    let alive = true
    Promise.all([
      loadJson<{ meta: Meta; files: IndexFile[] }>('data/repo-index.json'),
      loadJson<{ meta: Meta; packages: PkgRecord[] }>('data/packages.json'),
      loadJson<{ meta: Meta; docs: DocRecord[] }>('data/docs-index.json'),
      loadJson<Stats>('data/stats.json'),
    ])
      .then(([idx, pkgs, doc, stats]) => {
        if (!alive) return
        setState({
          loading: false,
          error: null,
          meta: idx.meta,
          files: idx.files,
          packages: pkgs.packages,
          docs: doc.docs,
          stats,
        })
      })
      .catch((e) => {
        if (!alive) return
        setState((s) => ({ ...s, loading: false, error: String(e?.message ?? e) }))
      })
    return () => {
      alive = false
    }
  }, [])

  const value: DataState = {
    ...state,
    packageByDir: (dir: string) => state.packages.find((p) => p.dir === dir),
    docByPath: (path: string) => state.docs.find((d) => d.source_path === path),
    fileByPath: (path: string) => state.files.find((f) => f.source_path === path),
    // 静态数据无需刷新
    refresh: () => {},
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData 必须在 DataProvider 内使用')
  return v
}
