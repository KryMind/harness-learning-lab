// ---------------------------------------------------------------------------
// VersionPage —— /version 版本差异页
// 学习快照 vs 官方 master；按学习主题分类 changedFiles（lesson.sourcePaths 交集）；
// GitHub API 失败时优雅降级显示。
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { ChevronDown, ChevronRight, FileCode2, RefreshCw } from 'lucide-react'
import { LESSONS } from '../course/lessons'
import { useVersionInfo, changedFilesForLesson } from '../data/version'

export default function VersionPage() {
  const info = useVersionInfo()
  const [showAll, setShowAll] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const changed = info.changedFiles ?? []
  const perLesson = LESSONS.map((l) => ({ lesson: l, files: changedFilesForLesson(info, l) })).filter(
    (x) => x.files.length > 0,
  )
  const matched = new Set(perLesson.flatMap((x) => x.files))
  const unmatched = changed.filter((f) => !matched.has(f))

  const refresh = async () => {
    setRefreshing(true)
    // 清缓存后重新查询
    try {
      localStorage.removeItem('hll.version.cache.v1')
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  const fmt = (iso: string | null) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('zh-CN', { hour12: false })
    } catch {
      return ''
    }
  }

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">🔄 版本差异</span>
        <h1>学习快照 vs 官方 master</h1>
        <p className="sub">课程内容绑定固定 commit <b className="vs-mono">{info.snapshotCommit?.slice(0, 7) ?? '—'}</b>。这里展示官方仓库的最新进展，以及哪些课程受上游变化影响。</p>
      </div>

      {/* 状态总览 */}
      <div className="vp-summary">
        <div className="vps-row">
          <span className="vps-label">学习快照</span>
          <span className="vs-mono">{info.snapshotCommit ? info.snapshotCommit.slice(0, 7) : '—'}</span>
          <span className="vps-sub">课程 / 源码 / API 全部来自该 commit</span>
        </div>
        <div className="vps-row">
          <span className="vps-label">官方 master</span>
          <span className="vs-mono">{info.officialMaster ?? '—'}</span>
          {info.status === 'current' ? (
            <span className="vs-state vs-ok">✓ 当前</span>
          ) : info.status === 'outdated' ? (
            <span className="vs-state vs-out">⚠ 上游已有更新</span>
          ) : (
            <span className="vs-state vs-unknown">官方版本检查暂不可用</span>
          )}
        </div>
        <div className="vps-row">
          <span className="vps-label">变化</span>
          <span className="vs-mono">{info.status === 'unknown' ? '—' : `${changed.length} files changed`}</span>
          <span className="vps-sub">检查时间 {fmt(info.checkedAt)}</span>
          <button type="button" className="vps-refresh" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={12} className={refreshing ? 'spin' : ''} /> 重新检查
          </button>
        </div>
      </div>

      {info.status === 'unknown' && (
        <div className="vp-note">无法连接 GitHub API（可能受网络/速率限制影响）。这是可选信息，不影响学习任何课程。</div>
      )}

      {/* 按学习主题分类 */}
      <div className="lesson-section" style={{ marginTop: 28 }}>
        <div className="section-title">
          <h2>按学习主题分类</h2>
          <span className="hint">匹配课程 sourcePaths ∩ changedFiles</span>
        </div>

        {perLesson.length === 0 ? (
          <div className="vp-empty">
            {info.status === 'unknown' ? '等待检查…' : '✓ 所有课程关联源码在官方最新版中均未变化'}
          </div>
        ) : (
          <div className="vp-lessons">
            {perLesson.map(({ lesson, files }) => (
              <div className="vp-lesson" key={lesson.id}>
                <div className="vpl-head">
                  <span className="vpl-name">
                    {lesson.order}. {lesson.shortTitle}
                  </span>
                  <span className="vpl-count">⚠ {files.length} files changed</span>
                </div>
                {showAll && (
                  <ul className="vpl-files">
                    {files.map((f) => (
                      <li key={f}>
                        <FileCode2 size={12} /> <code>{f}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 影响文件展开/收起 */}
        <div className="vp-footer">
          <button type="button" className="vpl-toggle all" onClick={() => setShowAll((s) => !s)}>
            {showAll ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {showAll ? '收起' : '展开'}影响文件（{changed.length}）
          </button>
        </div>
      </div>

      {/* 未匹配到任何课程的变更文件 */}
      {info.status === 'outdated' && unmatched.length > 0 && (
        <div className="lesson-section" style={{ marginTop: 20 }}>
          <div className="section-title">
            <h2>其他变更文件</h2>
            <span className="hint">未命中任何课程 sourcePaths</span>
          </div>
          <details className="vp-other">
            <summary>{unmatched.length} 个文件</summary>
            <ul className="vpl-files">
              {unmatched.map((f) => (
                <li key={f}>
                  <FileCode2 size={12} /> <code>{f}</code>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  )
}
