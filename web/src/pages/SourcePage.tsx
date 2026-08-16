import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Folder, FileCode2, ChevronRight, ArrowUp } from 'lucide-react'
import { useData } from '../data'
import SourceViewer from '../components/SourceViewer'

interface DirItem {
  name: string
  type: 'dir' | 'file'
}

export default function SourcePage() {
  const [params, setParams] = useSearchParams()
  const current = params.get('path') ?? ''
  const { files, loading } = useData()
  const [q, setQ] = useState('')

  // 由静态 repo-index 推导目录树，无需 server
  const items = useMemo<DirItem[] | null>(() => {
    if (loading) return null
    const prefix = current ? current + '/' : ''
    const seen = new Set<string>()
    const out: DirItem[] = []
    for (const f of files) {
      if (!f.source_path.startsWith(prefix)) continue
      const rest = f.source_path.slice(prefix.length)
      const idx = rest.indexOf('/')
      if (idx === -1) {
        out.push({ name: rest, type: 'file' })
      } else {
        const name = rest.slice(0, idx)
        if (!seen.has(name)) {
          seen.add(name)
          out.push({ name, type: 'dir' })
        }
      }
    }
    return out
  }, [current, files, loading])

  const isFile = !!current && !current.endsWith('/') && files.some((f) => f.source_path === current)

  const segs = current ? current.split('/').filter(Boolean) : []
  const up = segs.slice(0, -1).join('/')

  const go = (p: string) => {
    setParams({ path: p })
    setQ('')
  }

  const dirs = (items ?? []).filter((i) => i.type === 'dir').sort((a, b) => a.name.localeCompare(b.name))
  const flds = (items ?? []).filter((i) => i.type === 'file').sort((a, b) => a.name.localeCompare(b.name))

  const matches = useMemo(() => {
    if (!q.trim()) return []
    const s = q.trim().toLowerCase()
    return files.filter((f) => f.source_path.toLowerCase().includes(s)).slice(0, 40)
  }, [q, files])

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">📂 源码浏览器</span>
        <h1>DeepSeek Harness 源码</h1>
        <p className="sub">直接在浏览器里阅读官方源码 —— 从架构图 / 页面任何源码引用跳转到这里</p>
        <div className="learn">
          <span className="learn-chip">支持目录浏览与全文检索</span>
          <span className="learn-chip">Monaco 高亮与语法着色</span>
          <span className="learn-chip">点击任意架构节点直达源码</span>
        </div>
      </div>

      <div className="search-wrap" style={{ marginBottom: 16 }}>
        <span className="si">🔍</span>
        <input
          placeholder={`在 ${files.length} 个文件里检索（如 agent-loop / session / cordis）…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {matches.length > 0 && (
          <div className="search-results">
            {matches.map((f) => (
              <div key={f.source_path} className="sr-item" onMouseDown={() => go(f.source_path)}>
                <span className="badge info sr-kind">{f.source_type}</span>
                <span className="sr-path">{f.source_path}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="codeview" style={{ marginBottom: 16 }}>
        <div className="cv-head">
          <Folder size={13} style={{ color: 'var(--info)' }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            deepseek-harness/{current || ''}
          </span>
          {current && (
            <button className="icon-btn" title="上级目录" onClick={() => go(up)}>
              <ArrowUp size={13} />
            </button>
          )}
        </div>
      </div>

      {current && (
        <div className="path" style={{ marginBottom: 12 }}>
          <button className="path-step" onClick={() => go('')}>root</button>
          {segs.map((s, i) => {
            const p = segs.slice(0, i + 1).join('/')
            return (
              <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <ChevronRight size={12} style={{ color: 'var(--text-3)' }} />
                <button className="path-step" onClick={() => go(p)}>{s}</button>
              </span>
            )
          })}
        </div>
      )}

      {isFile ? (
        <SourceViewer path={current} height={640} />
      ) : (
        <div className="file-tree">
          <div className="ft-head">
            <span>📁 目录 {items ? `${dirs.length} 个目录 · ${flds.length} 个文件` : ''}</span>
          </div>
          {loading && <div className="empty" style={{ padding: 30 }}>加载中…</div>}
          {!loading && items && dirs.length + flds.length === 0 && (
            <div className="empty" style={{ padding: 30 }}>空目录</div>
          )}
          {!loading && items && (
            <>
              {dirs.map((d) => (
                <div key={d.name} className="ft-row dir" onClick={() => go(current ? `${current}/${d.name}` : d.name)}>
                  <Folder size={13} style={{ color: 'var(--info)' }} /> {d.name}/
                </div>
              ))}
              {flds.map((f) => (
                <div key={f.name} className="ft-row" onClick={() => go(current ? `${current}/${f.name}` : f.name)}>
                  <FileCode2 size={13} style={{ color: 'var(--success)' }} /> {f.name}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
