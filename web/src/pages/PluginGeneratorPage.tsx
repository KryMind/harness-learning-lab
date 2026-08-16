import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { Check, Copy, Download, ExternalLink, Sparkles } from 'lucide-react'
import { useTheme } from '../theme'
import { PLUGIN_TEMPLATES, generateProfilePatch, fileFor } from '../content/plugin-templates'

const NAME_RE = /^[a-z][a-z0-9-]*$/

export default function PluginGeneratorPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [typeId, setTypeId] = useState(PLUGIN_TEMPLATES[0].id)
  const [name, setName] = useState('my-plugin')
  const [desc, setDesc] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedPatch, setCopiedPatch] = useState(false)

  const tmpl = PLUGIN_TEMPLATES.find((t) => t.id === typeId) ?? PLUGIN_TEMPLATES[0]

  const nameValid = NAME_RE.test(name)
  const code = useMemo(() => tmpl.generate(nameValid ? name : 'my-plugin', desc), [tmpl, nameValid, name, desc])
  const patch = useMemo(() => generateProfilePatch(nameValid ? name : 'my-plugin'), [nameValid, name])
  const fileName = fileFor(typeId, nameValid ? name : 'my-plugin')

  const copy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const download = (text: string, fname: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-2)',
    color: 'var(--text-1)',
    fontFamily: 'var(--mono)',
    fontSize: 13,
    outline: 'none',
  }

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">🧩 Plugin Generator</span>
        <h1>在线生成 Harness 插件模板</h1>
        <p className="sub">
          选择插件类型、填写名称与描述，立即生成可编辑的插件模板代码 —— 纯浏览器端完成，无需任何后端。
        </p>
        <div className="learn">
          <span className="learn-chip">选择类型</span>
          <span className="learn-chip">填写参数</span>
          <span className="learn-chip">代码预览</span>
          <span className="learn-chip">导出模板</span>
        </div>
      </div>

      <div className="empty" style={{ marginBottom: 20, padding: 16, background: 'var(--bg-warn, rgba(245,158,11,.08))' }}>
        <Sparkles size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
        <b>在线生成仅负责创建插件模板。</b>
        真实安装、加载、Hot Reload 和运行测试将在未来的 <b>Harness Plugin Studio</b> 中完成。
      </div>

      <div className="section-title">
        <h2>① 选择插件类型</h2>
        <span className="hint">每种模板都标注了官方 source / docs 来源</span>
      </div>
      <div className="cards">
        {PLUGIN_TEMPLATES.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{ cursor: 'pointer', borderColor: t.id === typeId ? 'var(--primary)' : undefined, outline: t.id === typeId ? '2px solid var(--primary)' : undefined }}
            onClick={() => setTypeId(t.id)}
          >
            <div className="card-head"><span className="ic">{t.emoji}</span><span>{t.label}</span></div>
            <p className="card-body">{t.description}</p>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>② 填写名称与参数</h2>
        <span className="hint">名称须为小写 kebab-case（如 my-tool）</span>
      </div>
      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">✏️</span><span>插件名称</span></div>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value.trim())} placeholder="my-plugin" />
          {!nameValid && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>名称仅允许小写字母 / 数字 / 连字符，且以字母开头</p>}
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">📝</span><span>一句话描述</span></div>
          <input style={inputStyle} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="这个插件做什么（可选）" />
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>③ 生成代码预览</h2>
        <span className="hint">{tmpl.label} · 可编辑（预览为只读，复制后粘贴到编辑器修改）</span>
        <span style={{ marginLeft: 'auto' }} className="src-list">
          <button className="btn ghost" onClick={() => copy(code, setCopied)}>
            {copied ? <Check size={14} style={{ marginRight: 6 }} /> : <Copy size={14} style={{ marginRight: 6 }} />}
            {copied ? '已复制' : '复制代码'}
          </button>
          <button className="btn" onClick={() => download(code, fileName)}>
            <Download size={14} style={{ marginRight: 6 }} />导出 {fileName}
          </button>
        </span>
      </div>
      <Editor
        height={360}
        language={tmpl.language}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        value={code}
        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", scrollBeyondLastLine: false }}
      />

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>④ 挂进 Profile（cordis.patch.yml）</h2>
        <span className="hint">与 dsh-base 的 cordis.patch.yml 同构；可复制 / 导出</span>
        <span style={{ marginLeft: 'auto' }} className="src-list">
          <button className="btn ghost" onClick={() => copy(patch, setCopiedPatch)}>
            {copiedPatch ? <Check size={14} style={{ marginRight: 6 }} /> : <Copy size={14} style={{ marginRight: 6 }} />}
            {copiedPatch ? '已复制' : '复制 Patch'}
          </button>
        </span>
      </div>
      <Editor
        height={200}
        language="yaml"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        value={patch}
        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", scrollBeyondLastLine: false }}
      />

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>📌 本模板对应的官方来源</h2>
        <span className="hint">点击跳转到源码浏览器对照学习</span>
      </div>
      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">📂</span><span>官方源码</span></div>
          <div className="src-list">
            {tmpl.sources.map((s) => (
              <button key={s.path} className="src-chip" onClick={() => navigate(`/source?path=${encodeURIComponent(s.path)}`)}>
                <ExternalLink size={12} /> {s.label ?? s.path}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">📚</span><span>官方文档</span></div>
          <div className="src-list">
            {tmpl.docs.map((d) => (
              <button key={d.path} className="src-chip" onClick={() => navigate(`/source?path=${encodeURIComponent(d.path)}`)}>
                <ExternalLink size={12} /> {d.label ?? d.path}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
