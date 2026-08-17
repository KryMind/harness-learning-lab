import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Download, ExternalLink, Sparkles } from 'lucide-react'
import { useTheme } from '../theme'
import MonacoEditor from '../components/MonacoEditor'
import { PLUGIN_TEMPLATES, generateProfilePatch, fileFor } from '../content/plugin-templates'

// 官方名称规则：^[a-z0-9]+(?:-[a-z0-9]+)*$ —— 数字可开头、连字符两端须有字母数字
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function defaultsFor(t: (typeof PLUGIN_TEMPLATES)[number]): Record<string, string> {
  const out: Record<string, string> = {}
  t.options?.forEach((o) => { out[o.id] = o.default })
  return out
}

export default function PluginGeneratorPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [typeId, setTypeId] = useState(PLUGIN_TEMPLATES[0].id)
  const [opts, setOpts] = useState<Record<string, string>>(() => defaultsFor(PLUGIN_TEMPLATES[0]))
  const [name, setName] = useState('my-plugin')
  const [desc, setDesc] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedPatch, setCopiedPatch] = useState(false)

  const tmpl = PLUGIN_TEMPLATES.find((t) => t.id === typeId) ?? PLUGIN_TEMPLATES[0]

  const selectType = (id: string) => {
    setTypeId(id)
    const t = PLUGIN_TEMPLATES.find((x) => x.id === id)
    setOpts(t ? defaultsFor(t) : {})
  }

  const nameValid = NAME_RE.test(name)
  const code = useMemo(() => tmpl.generate(nameValid ? name : 'my-plugin', desc, opts), [tmpl, nameValid, name, desc, opts])
  const patch = useMemo(() => generateProfilePatch(nameValid ? name : 'my-plugin'), [nameValid, name])
  const fileName = fileFor(typeId, nameValid ? name : 'my-plugin')
  const files = tmpl.files
    ? tmpl.files(nameValid ? name : 'my-plugin', desc, opts)
    : [{ path: fileName, content: code }]
  const multiFile = files.length > 1

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

  const downloadAll = () => {
    files.forEach((f) => download(f.content, f.path))
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
      <div role="radiogroup" aria-label="插件类型" className="cards">
        {PLUGIN_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={t.id === typeId}
            className="card"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              color: 'var(--text-1)',
              background: t.id === typeId ? 'var(--bg-2)' : undefined,
              borderColor: t.id === typeId ? 'var(--primary)' : undefined,
              outline: t.id === typeId ? '2px solid var(--primary)' : undefined,
            }}
            onClick={() => selectType(t.id)}
          >
            <div className="card-head"><span className="ic">{t.emoji}</span><span>{t.label}</span></div>
            <p className="card-body">{t.description}</p>
          </button>
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
          {!nameValid && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>名称须为小写 kebab-case：^[a-z0-9]+(?:-[a-z0-9]+)*$（数字可开头，如 2fa、my-2fa，不允许连续连字符 / 尾连字符）</p>}
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">📝</span><span>一句话描述</span></div>
          <input style={inputStyle} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="这个插件做什么（可选）" />
        </div>
        {tmpl.options?.map((o) => (
          <div className="card" key={o.id}>
            <div className="card-head"><span className="ic">🧩</span><span>{o.label}</span></div>
            <div role="radiogroup" aria-label={o.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {o.values.map((v) => {
                const selected = (opts[o.id] ?? o.default) === v.value
                return (
                  <button
                    key={v.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setOpts((prev) => ({ ...prev, [o.id]: v.value }))}
                    style={{
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      color: 'var(--text-1)',
                      background: selected ? 'var(--bg-2)' : 'var(--surface)',
                      border: '1px solid',
                      borderColor: selected ? 'var(--primary)' : 'var(--border)',
                      borderRadius: 8,
                      padding: '8px 10px',
                    }}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>
        <h2>③ 生成代码预览</h2>
        <span className="hint">{tmpl.label} · 预览为只读，复制后粘贴到编辑器修改{multiFile ? ` · 将导出 ${files.length} 个文件` : ''}</span>
        <span style={{ marginLeft: 'auto' }} className="src-list">
          <button className="btn ghost" onClick={() => copy(code, setCopied)}>
            {copied ? <Check size={14} style={{ marginRight: 6 }} /> : <Copy size={14} style={{ marginRight: 6 }} />}
            {copied ? '已复制' : '复制代码'}
          </button>
          <button className="btn" onClick={downloadAll}>
            <Download size={14} style={{ marginRight: 6 }} />{multiFile ? `导出 ${files.length} 个文件` : `导出 ${fileName}`}
          </button>
        </span>
      </div>
      <MonacoEditor
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
      <MonacoEditor
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
