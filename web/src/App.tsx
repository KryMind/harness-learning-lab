import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { Search, Sun, Moon, Menu, X, ChevronDown, ChevronRight, Home } from 'lucide-react'
import { SECTIONS, pageByRoute } from './content/pages'
import { lessonById } from './course/lessons'
import { useTheme } from './theme'
import { useData } from './data'
import { ProgressProvider, useProgress } from './course/useProgress'
import { buildSearchRecords, type SearchRecord } from './data/searchIndex'
import CommandPalette from './components/search/CommandPalette'

// 懒加载页面路由（Phase 6 性能）：按需拉取对应页面 chunk
const HomePage = lazy(() => import('./pages/HomePage'))
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const CordisPage = lazy(() => import('./pages/CordisPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AgentLoopPage = lazy(() => import('./pages/AgentLoopPage'))
const SessionPage = lazy(() => import('./pages/SessionPage'))
const ToolsPage = lazy(() => import('./pages/ToolsPage'))
const SkillsPage = lazy(() => import('./pages/SkillsPage'))
const SubagentPage = lazy(() => import('./pages/SubagentPage'))
const WorkflowPage = lazy(() => import('./pages/WorkflowPage'))
const PermissionPage = lazy(() => import('./pages/PermissionPage'))
const WebUIPage = lazy(() => import('./pages/WebUIPage'))
const PackagesPage = lazy(() => import('./pages/PackagesPage'))
const SourcePage = lazy(() => import('./pages/SourcePage'))
const VersionPage = lazy(() => import('./pages/VersionPage'))
const RuntimeSnapshotPage = lazy(() => import('./pages/RuntimeSnapshotPage'))
const PluginGeneratorPage = lazy(() => import('./pages/PluginGeneratorPage'))
const PluginCodeLabPage = lazy(() => import('./pages/PluginCodeLabPage'))

export default function App() {
  return (
    <ProgressProvider>
      <AppShell />
    </ProgressProvider>
  )
}

function AppShell() {
  const { theme, toggle } = useTheme()
  const { meta, files, packages, docs } = useData()
  const location = useLocation()
  const navigate = useNavigate()
  const { progress, completedCount, percent, isCompleted } = useProgress()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchRecords, setSearchRecords] = useState<SearchRecord[]>([])
  const [devRefOpen, setDevRefOpen] = useState(true)

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
        <div
          className="sidebar-brand"
          role="button"
          tabIndex={0}
          title="回到学习首页"
          onClick={() => go('/')}
          onKeyDown={(e) => e.key === 'Enter' && go('/')}
        >
          <div className="logo">⚡</div>
          <div>
            <div className="name">Harness Learning Lab</div>
            <div className="sub">源码驱动的学习地图</div>
          </div>
          {drawerOpen && (
            <button
              className="icon-btn drawer-close"
              onClick={(e) => {
                e.stopPropagation()
                setDrawerOpen(false)
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sidebar-progress">
          <div className="sp-label">学习进度</div>
          <div className="sp-bar"><div className="sp-fill" style={{ width: `${percent}%` }} /></div>
          <div className="sp-meta">{completedCount} / 12 · {percent}%</div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) => `nav-item home ${isActive ? 'active' : ''}`}
          >
            <span className="ic"><Home size={14} /></span>
            <span className="nav-label">学习首页</span>
          </NavLink>

          {SECTIONS.map((sec) => {
            const isDevRef = sec.title === '开发者参考'
            return (
              <div key={sec.title}>
                {isDevRef ? (
                  <>
                    <button
                      type="button"
                      className={`nav-section toggle ${devRefOpen ? 'open' : ''}`}
                      onClick={() => setDevRefOpen((o) => !o)}
                    >
                      {devRefOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      {sec.title}
                    </button>
                    {devRefOpen && sec.pages.map((p) => (
                      <NavLink
                        key={p.id}
                        to={p.route}
                        onClick={() => setDrawerOpen(false)}
                        className={({ isActive }) => `nav-item ref ${isActive ? 'active' : ''}`}
                      >
                        <span className="ic">{p.emoji}</span>
                        <span className="nav-label">{p.navTitle}</span>
                      </NavLink>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="nav-section">{sec.title}</div>
                    {sec.pages.map((p) => {
                      const lesson = p.lessonId ? lessonById(p.lessonId) : undefined
                      const done = p.lessonId ? isCompleted(p.lessonId) : false
                      return (
                        <NavLink
                          key={p.id}
                          to={p.route}
                          onClick={() => setDrawerOpen(false)}
                          className={({ isActive }) =>
                            `nav-item lesson ${done ? 'done' : ''} ${isActive ? 'active' : ''}`
                          }
                        >
                          {lesson && <span className="num">{String(lesson.order).padStart(2, '0')}</span>}
                          <span className="nav-label">{p.navTitle}</span>
                          {done ? (
                            <span className="st done">✓</span>
                          ) : (
                            <span className="st" />
                          )}
                        </NavLink>
                      )
                    })}
                  </>
                )}
              </div>
            )
          })}
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
            <button type="button" className="crumb-home" onClick={() => go('/')}>
              Harness Learning Lab
            </button>
            {current && (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-cur">
                  {current.emoji} {current.title}
                </span>
              </>
            )}
          </div>
          <div className="spacer" />
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
          <Suspense fallback={<div className="page-loading">加载中…</div>}>
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
              <Route path="/version" element={<VersionPage />} />
              <Route path="/runtime-snapshot" element={<RuntimeSnapshotPage />} />
              <Route path="/plugin-generator" element={<PluginGeneratorPage />} />
              <Route path="/plugin-code-lab" element={<PluginCodeLabPage />} />
              <Route path="*" element={<div className="empty"><div className="big">404</div>页面不存在</div>} />
            </Routes>
          </Suspense>
        </div>
      </div>

      <CommandPalette records={searchRecords} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
