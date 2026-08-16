import { useNavigate } from 'react-router-dom'
import { ExternalLink, Info } from 'lucide-react'

/**
 * Live Harness 已静态化：
 * 原“实时执行 dsh --profile web --dump-config”属于 Runtime Live 功能，
 * 已迁移至未来的 Harness Plugin Studio。本页改为静态讲解卡，不发起任何运行时请求。
 */
export default function LivePage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">🟢 Live Harness</span>
        <h1>当前机器的真实 Plugin Tree</h1>
        <p className="sub">
          这里原本会执行 <span className="mono">dsh --profile web --dump-config</span>，
          把“这台机器上实际启动出来的 Harness”可视化。该能力属于 Runtime Live，已迁移。
        </p>
        <div className="learn">
          <span className="learn-chip">为什么它存在</span>
          <span className="learn-chip">谁注册它</span>
          <span className="learn-chip">ctx 上提供什么服务</span>
          <span className="learn-chip">哪些插件依赖它</span>
        </div>
      </div>

      <div className="section-title">
        <h2>ℹ️ Runtime Live 功能已迁移</h2>
        <span className="hint">本学习站已改为纯静态架构</span>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">🚀</span><span>Runtime Live 功能去向</span></div>
          <p className="card-body">
            <b>Runtime Live 功能已迁移至未来的 Harness Plugin Studio。</b>
            在线学习站不再执行任何真实 Harness 进程、Session Live Stream、Tool Live Execution 或 Shell。
            这些交互能力将由 Harness Plugin Studio 在本地提供。
          </p>
          <div className="src-list">
            <span className="badge warning">静态讲解页</span>
            <span className="badge success">零运行时请求</span>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">🏗</span><span>Profile / Bundle 是什么</span></div>
          <p className="card-body">
            Profile → Bundle → 插件行（id + name + config）。每一行都是一个真实会被 Cordis 宿主启动的插件。
            这就是“一台机器上 Harness 到底由什么组成”的权威答案。
          </p>
          <div className="src-list">
            <button className="src-chip" onClick={() => navigate('/profile')}>
              → 学习 Profile / Bundle
            </button>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>📌 相关源码映射</h2>
        <span className="hint">“这台机器上实际启动的插件树”由以下源码决定</span>
      </div>
      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">🧬</span><span>CLI 启动与解析</span></div>
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
    </div>
  )
}
