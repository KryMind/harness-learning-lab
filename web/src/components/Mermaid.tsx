import { useEffect, useState } from 'react'
import mermaid from 'mermaid'

let seq = 0

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
  themeVariables: {
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
  },
})

interface Props {
  chart: string
  caption?: string
}

export default function Mermaid({ chart, caption }: Props) {
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    let alive = true
    const id = `m-${++seq}`
    mermaid
      .render(id, chart)
      .then(({ svg }) => alive && setSvg(svg))
      .catch((e) => alive && setSvg(`<pre style="color:var(--danger);padding:12px;font-size:12px">${String(e)}</pre>`))
    return () => {
      alive = false
    }
  }, [chart])

  return (
    <div className="mermaid-box">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      {caption && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', padding: '4px 0 8px' }}>{caption}</div>}
    </div>
  )
}
