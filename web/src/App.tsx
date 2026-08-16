import { useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, Menu, X } from 'lucide-react'
import { SECTIONS, pageByRoute } from './content/pages'
import { lessonById } from './course/lessons'
import { useTheme } from './theme'
import { useData } from './data'
import { useProgress } from './course/useProgress'
import type { IndexFile, PkgRecord, DocRecord } from './types'

import HomePage from './pages/HomePage'
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
import PluginGeneratorPage from './pages/PluginGeneratorPage'
import PlaygroundPage from './pages/PlaygroundPage'

export default function App() {
  const { theme, toggle } = useTheme()
  const { meta, files, packages, docs } = useData()
  const location = useLocation()
  const navigate = useNavigate()
  const { progress, completedCount, percent, isCompleted, uiMode, setUiMode } = useProgress()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<{ files: IndexFile[]; packages: PkgRecord[]; docs: DocRecord[] } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const current = pageByRoute(location.pathname)

  const onSearch = (v: string) => {
    setQ(v)
    const s = v.trim().toLowerCase()
    if (!s) return setResults(null)
    // 纯前端过滤：直接在已加载的静态数据（repo-index / packages / docs-index）中检索
    setResults({
      files: files.filter((f) => f.source_path.toLowerCase().includes(s) || f.title.toLowerCase().includes(s)).slice(0, 20),
      packages: packages
        .filter((p) => p.name.toLowerCase().includes(s) || p.dir.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
        .slice(0, 8),
      docs: docs.filter((d) => d.source_path.toLowerCase().includes(s) || d.title.toLowerCase().includes(s)).slice(0, 8),
    })
  }

  const gitLabel = useMemo(() => {
    if (!meta?.repoCommit) return null
    return meta.repoCommit.slice(0, 7)
  }, [meta])

  const go = (route: string) => {
    navigate(route)
    setDrawerOpen(false)
  }

  return (
    <div className="app-shell">
      {/* 移动端遮罩 */}
      {drawerOpen && <div className="drawer-mask" onClick={() => setDrawerOpen(false)} />}

      <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo">⚡</div>
          <div>
            <div className="name">Harness Learning Lab</div>
            <div className="sub">源码驱动的学习地图</div>
          </div>
          {drawerOpen && (
            <button className="icon-btn drawer-close" onClick={() => setDrawerOpen(false)}>
              <X size={16} />
            </button>
          )}
        </div>

        {uiMode === 'learning' && (
          <div className="sidebar-progress">
            <div className="sp-label">学习进度</div>
            <div className="sp-bar"><div className="sp-fill" style={{ width: `${percent}%` }} /></div>
            <div className="sp-meta">{completedCount} / 12 · {percent}%</div>
          </div>
        )}

        <nav className="sidebar-nav">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="nav-section">{sec.title}</div>
              {sec.pages.map((p) => {
                const lesson = p.lessonId ? lessonById(p.lessonId) : undefined
                const done = p.lessonId ? isCompleted(p.lessonId) : false
                const isCurrent = location.pathname === p.route
                return (
                  <a
                    key={p.id}
                    href={p.route}
                    onClick={(e) => {
                      e.preventDefault()
                      go(p.route)
                    }}
                    className={`nav-item ${isCurrent ? 'active' : ''} ${p.lessonId ? 'lesson' : 'ref'} ${done ? 'done' : ''}`}
                  >
                    {p.lessonId && lesson && (
                      <span className="num">{String(lesson.order).padStart(2, '0')}</span>
                    )}
                    {!p.lessonId && <span className="ic">{p.emoji}</span>}
                    <span className="nav-label">{p.navTitle}</span>
                    {p.lessonId && (done ? <span className="st done">✓</span> : isCurrent ? <span className="st cur">●</span> : <span className="st" />)}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="snapshot">
            <span className="dot" />
            Harness Snapshot {gitLabel ?? meta?.repo ?? 'deepseek-harness'}
          </span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setDrawerOpen(true)}>
            <Menu size={16} />
          </button>
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
          <div className="mode-switch" role="tablist" aria-label="界面模式">
            <button
              role="tab"
              aria-selected={uiMode === 'learning'}
              className={uiMode === 'learning' ? 'active' : ''}
              onClick={() => setUiMode('learning')}
            >
              学习模式
            </button>
            <button
              role="tab"
              aria-selected={uiMode === 'developer'}
              className={uiMode === 'developer' ? 'active' : ''}
              onClick={() => setUiMode('developer')}
            >
              开发模式
            </button>
          </div>
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
                  <div key={'f' + f.source_path} className="sr-item" onMouseDown={() => go(`/source?path=${encodeURIComponent(f.source_path)}`)}>
                    <span className="badge info sr-kind">源码</span>
                    <span className="sr-path">{f.source_path}</span>
                  </div>
                ))}
                {results.packages.slice(0, 8).map((p) => (
                  <div key={'p' + p.dir} className="sr-item" onMouseDown={() => go(`/packages?dir=${encodeURIComponent(p.dir)}`)}>
                    <span className="badge accent sr-kind">包</span>
                    <span className="sr-path">{p.name}</span>
                  </div>
                ))}
                {results.docs.slice(0, 8).map((d) => (
                  <div key={'d' + d.source_path} className="sr-item" onMouseDown={() => go(`/source?path=${encodeURIComponent(d.source_path)}`)}>
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
            <Route path="/" element={<HomePage />} />
            <Route path="/overview" element={<OverviewPage />} />
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
            <Route path="/plugin-generator" element={<PluginGeneratorPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="*" element={<div className="empty"><div className="big">404</div>页面不存在</div>} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
