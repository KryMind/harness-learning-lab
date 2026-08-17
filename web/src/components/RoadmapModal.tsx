// ---------------------------------------------------------------------------
// RoadmapModal —— Harness Plugin Studio 迁移路线图弹窗（Runtime Snapshot 页底部）
// 纯静态展示，不访问任何不存在的 URL。
// ---------------------------------------------------------------------------
import { X } from 'lucide-react'

const ITEMS: { title: string; desc: string; tag: string }[] = [
  { title: 'Plugin 模板生成', desc: '纯浏览器端完成，无需本地安装 Harness。', tag: '已上线' },
  { title: '实际 Runtime / Profile 启动', desc: '在本地拉起真实 Cordis 宿主与插件树。', tag: 'Plugin Studio' },
  { title: 'Plugin 加载 / Hot Reload', desc: '修改插件后热重载并观察生命周期。', tag: 'Plugin Studio' },
  { title: 'Tool 调试 / Session Event / Permission / Runtime Trace', desc: '真实执行、权限与运行追踪。', tag: 'Plugin Studio' },
]

export default function RoadmapModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="rm-backdrop" onClick={onClose}>
      <div className="rm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rm-head">
          <h3>Harness Plugin Studio</h3>
          <button type="button" className="icon-btn" onClick={onClose} title="关闭">
            <X size={15} />
          </button>
        </div>
        <p className="rm-sub">
          Runtime 能力迁移路线：在线学习站保持纯静态，真实运行能力将由 Harness Plugin Studio 提供。
        </p>
        <div className="rm-list">
          {ITEMS.map((it) => (
            <div className="rm-item" key={it.title}>
              <div className="rm-title">
                <b>{it.title}</b>
                <span className={`badge ${it.tag === '已上线' ? 'success' : ''}`}>{it.tag}</span>
              </div>
              <div className="rm-desc">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
