// ---------------------------------------------------------------------------
// VersionStatusCard —— 首页 Hero 底部版本提示（轻量）
// 仅当官方 master 已有更新（outdated）时显示一行 warning；否则不占视觉空间。
// 点击 → /version
// ---------------------------------------------------------------------------
import { useNavigate } from 'react-router-dom'
import { GitCompare } from 'lucide-react'
import { useVersionInfo } from '../data/version'

export default function VersionStatusCard() {
  const navigate = useNavigate()
  const info = useVersionInfo()

  // 只在官方源码发生变化时轻量提示（学习者的第一视觉不被 commit 信息占据）
  if (info.status !== 'outdated') return null

  const short = info.snapshotCommit ? info.snapshotCommit.slice(0, 7) : null

  return (
    <button
      type="button"
      className="vs-card vs-warn-only"
      onClick={() => navigate('/version')}
      title="查看版本差异详情"
    >
      <GitCompare size={13} />
      <span>上游已有更新</span>
      <span className="vs-sep">·</span>
      <span>
        学习快照 <b className="vs-mono">{short ?? '—'}</b> vs 官方 master{' '}
        <b className="vs-mono">{info.officialMaster ?? '—'}</b>
      </span>
      <span className="vs-link">查看差异 →</span>
    </button>
  )
}
