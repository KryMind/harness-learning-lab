import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Play, Wand2 } from 'lucide-react'
import { useTheme } from '../theme'
import SourceViewer from '../components/SourceViewer'
import MonacoEditor from '../components/MonacoEditor'

const TEMPLATE = `// my-tool.ts —— 一个最简单的 Harness 工具插件
// 官方写法：defineTool() + ctx.tools.register()；execute 返回规范 JSON value
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { Context } from '@deepseek-ai/cordis'

export const name = 'hello-world'
export const inject = ['tools']

export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'hello-world',
    description: '向用户打个招呼，并返回当前时间。用于演示如何注册一个工具。',
    parameters: {
      greeting: { type: 'string', description: '问候语' },
    },
    output: {
      // 规范输出：execute 的返回值会与 schema 严格校验，render 再投影成模型可见文本
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          greeting: { type: 'string', required: true },
          now: { type: 'string', required: true },
        },
      },
      render: (_args, value): ContentBlock[] => [
        { type: 'text', text: JSON.stringify(value) },
      ],
    },
    isConcurrencySafe: () => true,
    async execute(args) {
      return { greeting: args.greeting ?? '你好', now: new Date().toISOString() }
    },
  }))
}
`

const PATCH = `# 把你的插件挂进 profile（cordis.patch.yml 增行示例）
- insert:
    - id: my-tool
      name: 'my-harness-tools'      # 你的插件 npm 包名
      config:
        enabled: true
`

export default function PlaygroundPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [code, setCode] = useState(TEMPLATE)
  const [patch, setPatch] = useState(PATCH)
  const [check, setCheck] = useState<null | { ok: boolean; issues: string[] }>(null)
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<string[]>([])

  const runCheck = () => {
    const issues: string[] = []
    if (!/name\s*:/.test(code)) issues.push('缺少 name 字段（工具名）')
    if (!/description\s*:/.test(code)) issues.push('缺少 description（模型靠它决定何时调用）')
    if (!/async\s+execute/.test(code)) issues.push('缺少 async execute 执行函数')
    if (!/parameters\s*:/.test(code)) issues.push('缺少 parameters（工具入参 schema）')
    if (!/output\s*:/.test(code)) issues.push('缺少 output（规范输出：schema + render）')
    if (!/ctx\.tools\.register/.test(code)) issues.push('缺少 ctx.tools.register（注册入口）')
    setCheck({ ok: issues.length === 0, issues })
  }

  const runPreview = () => {
    setRunning(true)
    // 模拟 profile 组装：dsh-base 骨架 + 你的插件行
    const base = [
      'web profile',
      '├─ dsh-base',
      '│   ├─ llm / session / agent / tools',
      '│   ├─ sandbox / approval / permission',
      '│   ├─ skill / skill-filesystem / tool-skill',
      '│   ├─ subagent / workflow / tool-workflow',
      '│   └─ …（共 60+ 行）',
      '├─ dsh-web-app',
      '│   └─ ui-sidebar / ui-conversation / ui-tool …',
      '└─ your-plugin  ← 刚写的 hello_world 工具',
    ]
    const rows = [...base]
    const idMatch = patch.match(/id:\s*([\w-]+)/)
    const nm = idMatch ? idMatch[1] : 'my-tool'
    setPreview(rows.map((r, i) => (i === rows.length - 1 ? r.replace('your-plugin', nm) : r)))
    setRunning(false)
  }

  const checks = useMemo(
    () => [
      { label: '声明 name（工具身份）', pass: /name\s*:/.test(code) },
      { label: '提供 description（模型决策依据）', pass: /description\s*:/.test(code) },
      { label: '实现 async execute（返回规范 JSON value）', pass: /async\s+execute/.test(code) },
      { label: '声明 parameters（入参 schema）', pass: /parameters\s*:/.test(code) },
      { label: '定义 output.schema + render（规范输出）', pass: /output\s*:/.test(code) && /render\s*:/.test(code) },
      { label: 'ctx.tools.register（注册入口）', pass: /ctx\.tools\.register/.test(code) },
    ],
    [code],
  )

  return (
    <div className="page">
      <div className="hero">
        <span className="tag">🧪 Playground</span>
        <h1>自己写一个 Harness Plugin</h1>
        <p className="sub">
          按官方 cookbook 的套路：defineTool() → ctx.tools.register() → 打包成插件挂进 profile。
          execute 返回规范 JSON value，output.schema/render 定义工具契约。
          下面是可编辑模板与“模拟 profile 组装”预览（本页不真正执行 dsh，只是学习脚手架）。
        </p>
        <div className="learn">
          <span className="learn-chip">模板可编辑</span>
          <span className="learn-chip">静态预检</span>
          <span className="learn-chip">模拟 Plugin Tree</span>
          <span className="learn-chip">参考官方 cookbook</span>
        </div>
      </div>

      <div className="section-title">
        <h2>① 工具插件模板</h2>
        <span className="hint">参考 packages/core/tools/schema.ts 的 defineTool 结构；可直接修改</span>
      </div>
      <MonacoEditor
        height={360}
        language="typescript"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        value={code}
        onChange={(v) => setCode(v ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
          scrollBeyondLastLine: false,
        }}
      />

      <div className="section-title" style={{ marginTop: 28 }}>
        <h2>② 静态预检</h2>
        <span className="hint">检查插件定义是否满足基本结构</span>
      </div>
      <div className="cards">
        <div className="card">
          <div className="card-head"><span className="ic">✅</span><span>结构检查</span></div>
          <div className="src-list">
            {checks.map((c) => (
              <span key={c.label} className={`badge ${c.pass ? 'success' : 'warning'}`}>
                {c.pass ? '✓' : '·'} {c.label}
              </span>
            ))}
          </div>
          <div className="src-list" style={{ marginTop: 12 }}>
            <button className="btn" onClick={runCheck}><Play size={14} style={{ marginRight: 6 }} />运行预检</button>
          </div>
          {check && (
            <p className="card-body" style={{ marginTop: 10 }}>
              {check.ok
                ? <span style={{ color: 'var(--success)' }}><CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 4 }} />结构完整，可以尝试注册了。</span>
                : <span style={{ color: 'var(--danger)' }}><XCircle size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{check.issues.join('；')}</span>}
            </p>
          )}
        </div>
        <div className="card">
          <div className="card-head"><span className="ic">📚</span><span>官方参考</span></div>
          <p className="card-body">官方 cookbook 的“添加一个工具”教程，以及工具运行时源码。</p>
          <div className="src-list">
            <button className="src-chip" onClick={() => navigate('/source?path=docs/cookbook/adding-a-tool.md')}>cookbook/adding-a-tool.md</button>
            <button className="src-chip" onClick={() => navigate('/source?path=packages/core/tools/src/schema.ts')}>tools/schema.ts（defineTool）</button>
            <button className="src-chip" onClick={() => navigate('/source?path=packages/core/tools/src/index.ts')}>tools/index.ts</button>
          </div>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <h2>③ 挂进 Profile（cordis.patch.yml）</h2>
        <span className="hint">可编辑；配置行与 dsh-base 的 cordis.patch.yml 同构</span>
      </div>
      <MonacoEditor
        height={220}
        language="yaml"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        value={patch}
        onChange={(v) => setPatch(v ?? '')}
        options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", scrollBeyondLastLine: false }}
      />

      <div className="section-title" style={{ marginTop: 28 }}>
        <h2>④ 模拟 Profile 组装预览</h2>
        <span className="hint">你的插件将出现在真实 Plugin Tree 的末尾（模拟）</span>
      </div>
      <div className="src-list" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={runPreview} disabled={running}>
          <Wand2 size={14} style={{ marginRight: 6 }} />{running ? '组装中…' : '生成 Plugin Tree'}
        </button>
      </div>
      {preview.length > 0 && (
        <div className="codeview">
          <div className="cv-head">🌳 模拟 dsh --profile web --dump-config</div>
          <div style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.8 }}>
            {preview.map((l, i) => (
              <div key={i} style={{ color: i === preview.length - 1 ? 'var(--accent)' : 'var(--text-2)', whiteSpace: 'pre' }}>{l}</div>
            ))}
          </div>
        </div>
      )}

      <div className="section-title" style={{ marginTop: 28 }}>
        <h2>下一个里程碑：把 Learning Lab 变成插件</h2>
        <span className="hint">学完 UI 插件与 Slots，就可以做这件事</span>
      </div>
      <SourceViewer path="packages/client/ui-slots" height={300} />
    </div>
  )
}
