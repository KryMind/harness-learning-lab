// ---------------------------------------------------------------------------
// VersionStatusBanner —— 课程页版本提示小徽标（小 Badge + 点击展开，非大横幅）
// 默认折叠；点击徽标展开关联源码 diff 信息。
// 仅 Plugin Generator 等生成代码可能失效处使用强警告（见 Phase 7）
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import type { Lesson } from '../../course/types'
import { useVersionInfo, changedFilesForLesson } from '../../data/version'

export default function VersionStatusBanner({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate()
  const info = useVersionInfo()
  const [open, setOpen] = useState(false)

  if (info.status === 'unknown' || !info.changedFiles) {
    return (
      <div className="vs-banner">
        <span className="vs-badge vs-dim" title="官方版本检查暂不可用">
          官方版本检查暂不可用
        </span>
      </div>
    )
  }

  const files = changedFilesForLesson(info, lesson)

  return (
    <div className="vs-banner">
      {files.length > 0 ? (
        <>
          <button type="button" className="vs-badge vs-warn" onClick={() => setOpen((o) => !o)}>
            ⟳ 本课关联源码 {files.length} files changed
          </button>
          {open && (
            <div className="vs-expand">
              <div className="vse-meta">
                <span>
                  当前课程快照 <b className="vs-mono">{info.snapshotCommit?.slice(0, 7)}</b>
                </span>
                <span>
                  官方最新 <b className="vs-mono">{info.officialMaster ?? '—'}</b>
                </span>
              </div>
              <div className="vse-title">关联源码变化：</div>
              <ul className="vse-files">
                {files.map((f) => (
                  <li key={f}>
                    <code>{f}</code>
                  </li>
                ))}
              </ul>
              <button type="button" className="vse-link" onClick={() => navigate('/version')}>
                <RefreshCw size={12} /> 查看完整变化 →
              </button>
            </div>
          )}
        </>
      ) : (
        <span className="vs-badge vs-ok" title="本课关联源码在官方最新版中未变化">
          ✓ 未发现变化
        </span>
      )}
    </div>
  )
}
