import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Info, Rocket } from 'lucide-react'
import RoadmapModal from '../components/RoadmapModal'
import { useData } from '../data'

/**
 * Runtime Snapshot —— 构建时保存的静态 Plugin / Package / Runtime 结构。
 * 不是当前机器上的实时 Harness Runtime；真实运行能力迁移至 Harness Plugin Studio。
 */
export default function RuntimeSnapshotPage() {
  const navigate = useNavigate()
  const { meta } = useData()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">📸 Runtime Snapshot</span>
        <h1>构建时保存的静态 Harness 结构</h1>
        <p className="sub">
          这里展示的是构建 Learning Lab 时保存的 Harness Plugin / Package / Runtime
          静态结构（Profile → Bundle → 插件树）。它不是当前机器上的实时 Harness Runtime。
        </p>
        <div className="learn">
          <span className="learn-chip">快照来自 commit {meta?.repoCommit?.slice(0, 7) ?? '—'}</span>
          <span className="learn-chip">纯静态 JSON，无运行时请求</span>
          <span className="learn-chip">Profile 决定机器上的插件树</span>
        </div>
      </div>

      <div className="section-title">
        <h2>🧬 快照里有什么</h2>
        <span className="hint">这些结构在构建时被扫描并静态保存</span>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">🧬</span><span>Profile / Bundle 结构</span></div>
          <p className="card-body">
            Profile → Bundle → 插件行（id + name + config）。每一行都是一个真实会被 Cordis
            宿主启动的插件。这就是"一台机器上 Harness 到底由什么组成"的权威答案。
          </p>
          <div className="src-list">
            <button className="src-chip" onClick={() => navigate('/profile')}>
              → 学习 Profile / Bundle
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">📦</span><span>Package 组成</span></div>
          <p className="card-body">
            packages / 下的每个目录对应一个独立 package，提供 ctx 上的服务、Tool 或 UI 插件。
            快照保存了它们的依赖关系与源码映射。
          </p>
          <div className="src-list">
            <button className="src-chip" onClick={() => navigate('/packages')}>
              → 查看 Packages 总览
            </button>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>📌 相关源码映射</h2>
        <span className="hint">快照结构由以下源码决定</span>
      </div>
      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">⚙️</span><span>CLI 启动与解析</span></div>
          <p className="card-body">
            <span className="mono">apps/cli/src/profile-boot.ts</span> 负责加载 profile 与 bundle；
            <span className="mono">apps/cli/src/dump-config.ts</span> 负责打印插件树。
          </p>
          <div className="src-list">
            <button className="src-chip" onClick={() => navigate(`/source?path=${encodeURIComponent('apps/cli/src/dump-config.ts')}`)}>
              <ExternalLink size={12} /> dump-config.ts
            </button>
            <button className="src-chip" onClick={() => navigate(`/source?path=${encodeURIComponent('apps/cli/src/profile-boot.ts')}`)}>
              <ExternalLink size={12} /> profile-boot.ts
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">🧩</span><span>Bundle 基础</span></div>
          <p className="card-body">
            <span className="mono">packages/bundle/base</span> 是所有 profile 的公共核心；
            <span className="mono">dsh-web-app</span> 叠加 UI 插件层。
          </p>
          <div className="src-list">
            <button className="src-chip" onClick={() => navigate('/profile')}>
              → 去 Profile 页看 Bundle 组成
            </button>
          </div>
        </div>
      </div>

      <div className="empty" style={{ marginTop: 24, padding: 24 }}>
        <Info size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
        提示：学习站中的「Plugin Generator」负责创建插件模板（纯浏览器端）；
        真实的安装、加载、Hot Reload 与运行测试将在 Harness Plugin Studio 中完成。
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>🚀 未来能力</h2>
        <span className="hint">真实运行能力属于 Harness Plugin Studio</span>
      </div>
      <div className="empty" style={{ marginTop: 12, padding: 24 }}>
        <Rocket size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
        Harness Plugin Studio 将提供：实际 Runtime / Plugin 加载 / Hot Reload / Tool 调试 /
        Session Event / Permission / Runtime Trace。
      </div>
      <button type="button" className="btn primary" style={{ marginTop: 16 }} onClick={() => setModalOpen(true)}>
        了解 Plugin Studio →
      </button>

      <RoadmapModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
