import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, TerminalSquare } from 'lucide-react'
import { api } from '../api'
import type { DumpConfigResult } from '../types'

export default function LivePage() {
  const [data, setData] = useState<DumpConfigResult | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.dumpConfig())
    } catch (e) {
      setData({ ok: false, available: false, error: String(e instanceof Error ? e.message : e) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">🟢 Live Harness</span>
        <h1>当前机器的真实 Plugin Tree</h1>
        <p className="sub">后端执行 <span className="mono">dsh --profile web --dump-config</span>，把“这台机器上实际启动出来的 Harness”可视化。</p>
        <div className="learn">
          <span className="learn-chip">为什么它存在</span>
          <span className="learn-chip">谁注册它</span>
          <span className="learn-chip">ctx 上提供什么服务</span>
          <span className="learn-chip">哪些插件依赖它</span>
        </div>
      </div>

      <div className="section-title">
        <h2>执行环境</h2>
        <span className="hint">需要 deepseek-harness 已安装依赖并构建出 dsh</span>
      </div>

      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">⚙️</span><span>dsh 是否可用</span></div>
          <p className="card-body">
            {data === null
              ? '正在探测…'
              : data.available
                ? '✓ 已找到 dsh 可执行文件'
                : '✗ 未找到 dsh（未构建）'}
          </p>
          <div className="src-list">
            <span className={`badge ${data?.ok ? 'success' : 'danger'}`}>{data?.ok ? '运行成功' : '未成功'}</span>
            <button className="btn ghost" onClick={load} disabled={loading}>
              <RefreshCw size={14} style={{ marginRight: 6 }} />{loading ? '运行中…' : '重新运行'}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">🏗</span><span>什么意思</span></div>
          <p className="card-body">
            Profile → Bundle → 插件行（id + name + config）。每一行都是一个真实会被 Cordis 宿主启动的插件。这就是“这台机器上 Harness 到底由什么组成”的权威答案。
          </p>
        </div>
      </div>

      {data?.error && (
        <div className="codeview" style={{ marginTop: 16 }}>
          <div className="cv-head"><TerminalSquare size={13} /> stderr / 错误</div>
          <pre style={{ padding: 16, fontSize: 12.5, fontFamily: 'var(--mono)', overflow: 'auto', maxHeight: 260, whiteSpace: 'pre-wrap', color: 'var(--danger)' }}>
            {data.error}
            {data.stderr ? `\n\n${data.stderr}` : ''}
          </pre>
        </div>
      )}

      {data?.hint && (
        <div className="empty" style={{ marginTop: 12, padding: 20 }}>
          💡 {data.hint}
        </div>
      )}

      {data?.tree && data.tree.length > 0 && (
        <>
          <div className="section-title">
            <h2>🌳 Plugin Tree</h2>
            <span className="hint">缩进表示层级；每个插件一行</span>
          </div>
          <div className="codeview">
            <div className="cv-head"><TerminalSquare size={13} /> dsh --profile web --dump-config</div>
            <div style={{ padding: '14px 16px', overflow: 'auto' }}>
              {data.tree.map((node, i) => (
                <div
                  key={i}
                  style={{
                    paddingLeft: node.indent * 16,
                    fontFamily: 'var(--mono)',
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    color: node.indent === 0 ? 'var(--primary)' : 'var(--text-2)',
                    whiteSpace: 'pre',
                  }}
                >
                  {node.indent === 0 ? '▸ ' : node.indent === 1 ? '├─ ' : '· '}
                  {node.text}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {data?.raw && !data.tree && (
        <div className="codeview" style={{ marginTop: 16 }}>
          <div className="cv-head"><TerminalSquare size={13} /> 原始输出</div>
          <pre style={{ padding: 16, fontSize: 12.5, fontFamily: 'var(--mono)', overflow: 'auto', maxHeight: 400, whiteSpace: 'pre-wrap' }}>{data.raw}</pre>
        </div>
      )}

      {data?.ok && data.tree && data.tree.length === 0 && (
        <div className="empty" style={{ marginTop: 16 }}>命令执行成功但没有任何输出（可能是构建版本差异）。</div>
      )}
    </div>
  )
}
