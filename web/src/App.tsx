import { useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, GitCommit } from 'lucide-react'
import { SECTIONS, pageByRoute } from './content/pages'
import { useTheme } from './theme'
import { useData } from './data'
import { api } from './api'

import OverviewPage from './pages/OverviewPage'
import CordisPage from './pages/CordisPage'
import ProfilePage from './pages/ProfilePage'
import AgentLoopPage from './pages/AgentLoopPage'
import SessionPage from './pages/SessionPage'
import ToolsPage from './pages/ToolsPage'
import SkillsPage from './pages/SkillsPage'
import SubagentPage from './pages/SubagentPage'
import WorkflowPage from './pages/WorkflowPage'
import PermissionPage from './pages/PermissionPage'
import WebUIPage from './pages/WebUIPage'
import PackagesPage from './pages/PackagesPage'
import SourcePage from './pages/SourcePage'
import LivePage from './pages/LivePage'
import PlaygroundPage from './pages/PlaygroundPage'

export default function App() {
  const { theme, toggle } = useTheme()
  const { meta } = useData()
  const location = useLocation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Awaited<ReturnType<typeof api.search>> | null>(null)

  const current = pageByRoute(location.pathname)

  const onSearch = async (v: string) => {
    setQ(v)
    if (!v.trim()) return setResults(null)
    try {
      setResults(await api.search(v.trim()))
    } catch {
      setResults(null)
    }
  }

  const gitLabel = useMemo(() => {
    if (!meta?.repoCommit) return null
    return meta.repoCommit.slice(0, 7)
  }, [meta])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">⚡</div>
          <div>
            <div className="name">Harness Learning Lab</div>
            <div className="sub">源码驱动的学习地图</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="nav-section">{sec.title}</div>
              {sec.pages.map((p) => (
                <a
                  key={p.id}
                  href={p.route}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(p.route)
                  }}
                  className={`nav-item ${location.pathname === p.route ? 'active' : ''}`}
                >
                  <span className="ic">{p.emoji}</span>
                  <span>{p.navTitle}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          {gitLabel ? (
            <span>
              <span className="dot" />
              {meta?.repo} @ {gitLabel}
            </span>
          ) : (
            <span>
              <span className="dot" />
              {meta?.repo ?? 'deepseek-harness'}
            </span>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="crumb">
            {current ? (
              <>
                {current.emoji} <b>{current.title}</b>
                <span style={{ margin: '0 6px' }}>/</span>
                <span>{current.subtitle}</span>
              </>
            ) : (
              <b>Harness Learning Lab</b>
            )}
          </div>
          <div className="spacer" />
          <div className="search-wrap">
            <span className="si"><Search size={15} /></span>
            <input
              placeholder="搜索源码 / 包 / 文档…"
              value={q}
              onChange={(e) => onSearch(e.target.value)}
              onBlur={() => setTimeout(() => setResults(null), 200)}
            />
            {results && (
              <div className="search-results">
                {results.files.slice(0, 12).map((f) => (
                  <div key={'f' + f.source_path} className="sr-item" onMouseDown={() => navigate(`/source?path=${encodeURIComponent(f.source_path)}`)}>
                    <span className="badge info sr-kind">源码</span>
                    <span className="sr-path">{f.source_path}</span>
                  </div>
                ))}
                {results.packages.slice(0, 8).map((p) => (
                  <div key={'p' + p.dir} className="sr-item" onMouseDown={() => navigate(`/packages?dir=${encodeURIComponent(p.dir)}`)}>
                    <span className="badge accent sr-kind">包</span>
                    <span className="sr-path">{p.name}</span>
                  </div>
                ))}
                {results.docs.slice(0, 8).map((d) => (
                  <div key={'d' + d.source_path} className="sr-item" onMouseDown={() => navigate(`/source?path=${encodeURIComponent(d.source_path)}`)}>
                    <span className="badge success sr-kind">文档</span>
                    <span className="sr-path">{d.source_path}</span>
                  </div>
                ))}
                {results.files.length + results.packages.length + results.docs.length === 0 && (
                  <div className="sr-item" style={{ color: 'var(--text-3)' }}>无结果</div>
                )}
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={toggle} title="切换深浅色">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <div className="content">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/cordis" element={<CordisPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/agent-loop" element={<AgentLoopPage />} />
            <Route path="/session" element={<SessionPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/subagent" element={<SubagentPage />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/permission" element={<PermissionPage />} />
            <Route path="/web-ui" element={<WebUIPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/source" element={<SourcePage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="*" element={<div className="empty"><div className="big">404</div>页面不存在</div>} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
