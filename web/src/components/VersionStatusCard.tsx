// ---------------------------------------------------------------------------
// VersionStatusCard —— 首页顶部版本状态小条（UX#9：安静小 Badge，非大横幅）
// DeepSeek Harness · 学习快照 47f9438 · 官方 master a8b32c1 · [✓ 当前 / ⚠ 上游已有更新]
// 点击 → /version
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitCompare } from 'lucide-react'
import { useVersionInfo } from '../data/version'

export default function VersionStatusCard() {
  const navigate = useNavigate()
  const info = useVersionInfo()
  const short = info.snapshotCommit ? info.snapshotCommit.slice(0, 7) : null

  let state: ReactNode
  if (info.status === 'current') {
    state = <span className="vs-state vs-ok">✓ 当前</span>
  } else if (info.status === 'outdated') {
    state = <span className="vs-state vs-out">⚠ 上游已有更新</span>
  } else {
    state = <span className="vs-state vs-unknown">官方版本检查暂不可用</span>
  }

  return (
    <button type="button" className="vs-card" onClick={() => navigate('/version')} title="查看版本差异详情">
      <GitCompare size={13} />
      <span className="vs-strong">DeepSeek Harness</span>
      <span className="vs-sep">·</span>
      <span>
        学习快照 <b className="vs-mono">{short ?? '—'}</b>
      </span>
      <span className="vs-sep">·</span>
      <span>
        官方 master <b className="vs-mono">{info.officialMaster ?? '—'}</b>
      </span>
      {state}
    </button>
  )
}
