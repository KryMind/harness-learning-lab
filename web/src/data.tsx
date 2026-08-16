import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
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

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.all([api.index(), api.packages(), api.docs(), api.stats(), api.meta()])
      .then(([idx, pkgs, doc, stats, meta]) => {
        setState({
          loading: false,
          error: null,
          meta: meta.meta,
          files: idx.files,
          packages: pkgs.packages,
          docs: doc.docs,
          stats,
        })
      })
      .catch((e) => {
        setState((s) => ({ ...s, loading: false, error: String(e?.message ?? e) }))
      })
  }

  useEffect(load, [])

  const value: DataState = {
    ...state,
    packageByDir: (dir: string) => state.packages.find((p) => p.dir === dir),
    docByPath: (path: string) => state.docs.find((d) => d.source_path === path),
    fileByPath: (path: string) => state.files.find((f) => f.source_path === path),
    refresh: load,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData 必须在 DataProvider 内使用')
  return v
}
