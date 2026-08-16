import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, Menu, X } from 'lucide-react'
import { SECTIONS, pageByRoute } from './content/pages'
import { lessonById } from './course/lessons'
import { useTheme } from './theme'
import { useData } from './data'
import { useProgress } from './course/useProgress'
import { buildSearchRecords, type SearchRecord } from './data/searchIndex'
import CommandPalette from './components/search/CommandPalette'

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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchRecords, setSearchRecords] = useState<SearchRecord[]>([])

  const current = pageByRoute(location.pathname)

  // 应用启动后构建一次统一搜索索引（概念 + docs + packages + api + source）
  useEffect(() => {
    let alive = true
    buildSearchRecords({ files, packages, docs, meta }).then((recs) => {
      if (alive) setSearchRecords(recs)
    })
    return () => {
      alive = false
    }
  }, [files, packages, docs, meta])

  // Ctrl+K / Cmd+K 打开搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
          <button type="button" className="search-trigger" onClick={() => setSearchOpen(true)}>
            <span className="si"><Search size={15} /></span>
            <span className="search-ph">搜索概念 / API / Package / 源码…</span>
            <kbd>Ctrl K</kbd>
          </button>
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

      <CommandPalette records={searchRecords} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
