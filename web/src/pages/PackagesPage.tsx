import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X, ExternalLink } from 'lucide-react'
import { useData } from '../data'
import SourceViewer from '../components/SourceViewer'
import type { PkgRecord } from '../types'

const FAMILY_LABEL: Record<string, string> = {
  core: '核心执行',
  bundle: 'Profile / Bundle',
  client: 'Web Client / UI',
  llm: 'LLM 适配',
  session: '会话',
  'session-query': '会话查询',
  skill: '技能',
  subagent: '子代理',
  workflow: '工作流',
  sandbox: '沙箱',
  fs: '文件系统',
  shell: 'Shell',
  web: '网络 / Web',
  interaction: '交互 / 权限',
  compaction: '上下文压缩',
  guard: '守卫 / 策略',
  sdk: 'SDK',
  acp: 'ACP 协议',
  api: 'API',
  attachment: '附件',
  boot: '启动',
  context: '上下文',
  credentials: '凭据',
  e2b: 'E2B 沙箱',
  extensions: '扩展',
  feedback: '反馈',
  goal: '目标',
  hooks: '钩子',
  host: '宿主',
  identity: '身份',
  jobs: '任务',
  lsp: 'LSP',
  mcp: 'MCP',
  plan: '计划',
  preset: '预设',
  schedule: '调度',
  settings: '设置',
  spill: '溢出',
  storage: '存储',
  subprocess: '子进程',
  terminal: '终端',
  todo: '待办',
  typert: '类型化运行时',
  util: '工具',
  workspace: '工作区',
}

export default function PackagesPage() {
  const { packages, stats, loading } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const selectedDir = params.get('dir') ?? ''
  const [q, setQ] = useState('')

  const groups = useMemo(() => {
    const map = new Map<string, PkgRecord[]>()
    for (const p of packages) {
      const family = p.dir.startsWith('apps/') ? 'apps' : p.dir.split('/')[1] ?? 'other'
      if (!map.has(family)) map.set(family, [])
      map.get(family)!.push(p)
    }
    const list = [...map.entries()].sort((a, b) => b[1].length - a[1].length)
    return list.map(([family, pkgs]) => ({
      family,
      label: family === 'apps' ? '应用 / 入口' : FAMILY_LABEL[family] ?? family,
      count: pkgs.length,
      pkgs: pkgs.sort((a, b) => a.dir.localeCompare(b.dir)),
    }))
  }, [packages])

  const filtered = useMemo(() => {
    if (!q.trim()) return groups
    const s = q.trim().toLowerCase()
    return groups
      .map((g) => ({ ...g, pkgs: g.pkgs.filter((p) => p.name.toLowerCase().includes(s) || p.dir.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)) }))
      .filter((g) => g.pkgs.length > 0)
  }, [q, groups])

  const selected = packages.find((p) => p.dir === selectedDir) ?? null

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">📦 Packages 总览</span>
        <h1>每一个 package 到底干什么</h1>
        <p className="sub">把官方 200+ 个包按功能族归类 —— 想看哪个包，点进去看它的 src 与 README。</p>
        <div className="learn">
          <span className="learn-chip">{stats?.packageCount ?? packages.length} 个包</span>
          <span className="learn-chip">按功能族分组</span>
          <span className="learn-chip">源码可直接阅读</span>
        </div>
      </div>

      <div className="search-wrap" style={{ marginBottom: 16 }}>
        <span className="si">🔍</span>
        <input placeholder="按包名 / 目录 / 描述检索…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.map((g) => (
        <div key={g.family} style={{ marginBottom: 24 }}>
          <div className="section-title">
            <h2>{g.label} <span className="hint">({g.family})</span></h2>
            <span className="hint">{g.count} 个包</span>
          </div>
          <div className="cards">
            {g.pkgs.map((p) => (
              <div
                className="card"
                key={p.dir}
                style={{ cursor: 'pointer' }}
                onClick={() => setParams({ dir: p.dir })}
              >
                <div className="card-head">
                  <span className="ic">📦</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{p.name}</span>
                </div>
                <p className="card-body">{p.description || p.dir}</p>
                <div className="src-list">
                  <span className="badge info mono">{p.dir}</span>
                  {p.hasSrc && <span className="badge success">{p.srcFiles.length} 文件</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <div className="empty"><div className="big">∅</div>没有匹配的包</div>}

      {selected && (
        <div className="drawer-overlay" onClick={() => setParams({})}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <span className="ic">📦</span>
              <h3>{selected.name}</h3>
              <button className="drawer-close" onClick={() => setParams({})}><X size={16} /></button>
            </div>
            <div className="drawer-body">
              <p style={{ color: 'var(--text-2)', fontSize: 13 }}>{selected.description}</p>
              <div className="src-list" style={{ marginBottom: 10 }}>
                <span className="badge info mono">{selected.dir}</span>
                <span className="badge">v{selected.version}</span>
                {selected.private && <span className="badge warning">private</span>}
                {selected.hasSrc && <span className="badge success">{selected.srcFiles.length} 个源码文件</span>}
              </div>

              {selected.dsh && (
                <>
                  <h4>dsh manifest</h4>
                  <div className="codeview" style={{ marginBottom: 12 }}>
                    <pre style={{ padding: 14, fontSize: 12, fontFamily: 'var(--mono)', overflow: 'auto', maxHeight: 220, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selected.dsh, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              <h4>依赖</h4>
              <div className="src-list" style={{ marginBottom: 12 }}>
                {selected.dependencies.length > 0
                  ? selected.dependencies.slice(0, 30).map((d) => <span key={d} className="badge mono">{d}</span>)
                  : <span className="hint">无运行时依赖</span>}
              </div>

              {selected.hasSrc && selected.srcFiles.length > 0 && (
                <>
                  <h4>主源码 <span className="hint">{selected.srcFiles[0]}</span></h4>
                  <SourceViewer path={selected.srcFiles[0]} height={420} />
                </>
              )}

              {selected.readme && (
                <>
                  <h4>README</h4>
                  <button
                    className="src-chip"
                    onClick={() => {
                      setParams({})
                      navigate(`/source?path=${encodeURIComponent(selected.readme!)}`)
                    }}
                  >
                    <ExternalLink size={12} /> 在源码浏览器中查看 README
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
