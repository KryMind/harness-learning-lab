import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import { useTheme } from '../theme'

let seq = 0

const BASE = {
  startOnLoad: false,
  theme: 'base' as const,
  securityLevel: 'loose' as const,
  fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
}

const DARK_VARS = {
  fontSize: '13px',
  primaryColor: '#16233c',
  primaryBorderColor: '#38bdf8',
  primaryTextColor: '#e2e8f0',
  lineColor: '#64748b',
  secondaryColor: '#111c30',
  tertiaryColor: '#0f172a',
  actorBkg: '#111c30',
  actorBorder: '#38bdf8',
  actorTextColor: '#e2e8f0',
  activationBkgColor: '#16233c',
  sequenceNumberColor: '#fbbf24',
  noteBkgColor: '#1c2c4a',
  noteTextColor: '#e2e8f0',
  labelBoxBkgColor: '#111c30',
  labelTextColor: '#e2e8f0',
}

const LIGHT_VARS = {
  fontSize: '13px',
  primaryColor: '#dbeafe',
  primaryBorderColor: '#0284c7',
  primaryTextColor: '#0f172a',
  lineColor: '#64748b',
  secondaryColor: '#f1f5f9',
  tertiaryColor: '#f8fafc',
  actorBkg: '#f1f5f9',
  actorBorder: '#0284c7',
  actorTextColor: '#0f172a',
  activationBkgColor: '#e0f2fe',
  sequenceNumberColor: '#d97706',
  noteBkgColor: '#fef9c3',
  noteTextColor: '#0f172a',
  labelBoxBkgColor: '#f1f5f9',
  labelTextColor: '#0f172a',
}

interface Props {
  chart: string
  caption?: string
}

export default function Mermaid({ chart, caption }: Props) {
  const { theme } = useTheme()
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    let alive = true
    const id = `m-${++seq}`
    // theme 变化时重新初始化并渲染（mermaid 是全局单例，再次 initialize 会覆盖）
    mermaid.initialize({ ...BASE, themeVariables: theme === 'light' ? LIGHT_VARS : DARK_VARS })
    mermaid
      .render(id, chart)
      .then(({ svg }) => alive && setSvg(svg))
      .catch((e) => alive && setSvg(`<pre style="color:var(--danger);padding:12px;font-size:12px">${String(e)}</pre>`))
    return () => {
      alive = false
    }
  }, [chart, theme])

  return (
    <div className="mermaid-box">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      {caption && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', padding: '4px 0 8px' }}>{caption}</div>}
    </div>
  )
}
