// ---------------------------------------------------------------------------
// SourceEvidence —— 真实源码证据（可选模块：默认折叠，渐进披露）
// 只展示最相关的 10-30 行，附 Commit、行号、打开按钮
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileCode2, ExternalLink, ChevronDown, ChevronRight, Crosshair } from 'lucide-react'
import { useData } from '../../data'
import { loadSourceContent } from '../../sources'

export interface Evidence {
  path: string
  label?: string
  lineStart?: number
  lineEnd?: number
  note?: string
}

interface Props {
  evidences: Evidence[]
}

/** 从快照源码中截取指定行区间（无行号时取前 24 行） */
function sliceLines(content: string, lineStart?: number, lineEnd?: number) {
  const lines = content.split('\n')
  const from = lineStart && lineStart > 0 ? lineStart - 1 : 0
  const to = lineEnd && lineEnd > from ? lineEnd - 1 : Math.min(from + 24, lines.length - 1)
  return {
    text: lines.slice(from, to + 1).join('\n'),
    from,
    to,
  }
}

function EvidenceItem({ ev }: { ev: Evidence }) {
  const navigate = useNavigate()
  const { meta } = useData()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const commit = meta?.repoCommit ?? ''

  useEffect(() => {
    if (!open || loaded) return
    loadSourceContent(ev.path).then((c) => {
      setContent(c)
      setLoaded(true)
    })
  }, [open, loaded, ev.path])

  const slice = content ? sliceLines(content, ev.lineStart, ev.lineEnd) : null
  const githubUrl = `https://github.com/deepseek-ai/deepseek-harness/blob/${commit}/${ev.path}` +
    (ev.lineStart ? `#L${ev.lineStart}${ev.lineEnd ? `-L${ev.lineEnd}` : ''}` : '')

  return (
    <div className={`se-item ${open ? 'open' : ''}`}>
      <div className="se-head" onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((o) => !o)}>
        {open ? <ChevronDown size={14} className="se-chev" /> : <ChevronRight size={14} className="se-chev" />}
        <FileCode2 size={14} className="se-file" />
        <span className="se-path">{ev.label ?? ev.path}</span>
        {ev.lineStart && <span className="se-lines mono">L{ev.lineStart}{ev.lineEnd ? `-${ev.lineEnd}` : ''}</span>}
        <span className="se-commit mono">{commit.slice(0, 7)}</span>
        <span className="se-actions">
          <button
            className="btn ghost mini"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/source?path=${encodeURIComponent(ev.path)}`)
            }}
          >
            <Crosshair size={12} /> 打开源码
          </button>
          <a className="btn ghost mini" href={githubUrl} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}>
            <ExternalLink size={12} /> GitHub
          </a>
        </span>
      </div>
      {open && (
        <div className="se-body">
          {ev.note && <p className="se-note">{ev.note}</p>}
          {slice ? (
            <pre className="se-code">{slice.text}</pre>
          ) : (
            <div className="se-missing">
              源码快照不存在：<code>{ev.path}</code>
              <a className="btn ghost mini" href={githubUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={12} /> 打开官方 GitHub
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SourceEvidence({ evidences }: Props) {
  return (
    <div className="source-evidence">
      <div className="section-title">
        <h2>📄 真实源码证据</h2>
        <span className="hint">每个学习结论都能追到官方源码，点击展开</span>
      </div>
      <div className="se-list">
        {evidences.map((ev) => (
          <EvidenceItem key={ev.path + (ev.label ?? '')} ev={ev} />
        ))}
      </div>
    </div>
  )
}
