// ---------------------------------------------------------------------------
// ApiRef —— 源码引用体验（Step 4）：把正文里的 ctx.xxx / 导出符号变成可点击的 API 引用
// 自包含：模块级懒加载 api-symbols.json 注册表，点击/悬停显示 tier、签名、源码与关联课程。
// ---------------------------------------------------------------------------
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, ExternalLink, GraduationCap } from 'lucide-react'
import type { ApiSymbolRecord } from '../data/searchIndex'
import { lessonById } from '../course/lessons'

const BASE = import.meta.env.BASE_URL
let registryPromise: Promise<Map<string, ApiSymbolRecord>> | null = null

function getRegistry(): Promise<Map<string, ApiSymbolRecord>> {
  let p = registryPromise
  if (!p) {
    p = fetch(`${BASE}data/search/api-symbols.json`)
      .then((r) => (r.ok ? r.json() : Promise.resolve({ symbols: [] })) as Promise<{ symbols?: ApiSymbolRecord[] }>)
      .then((j) => {
        const map = new Map<string, ApiSymbolRecord>()
        for (const s of j.symbols ?? []) map.set(s.symbol, s)
        return map
      })
      .catch(() => new Map<string, ApiSymbolRecord>())
    registryPromise = p
  }
  return p
}

/** 匹配正文中的 API 引用：`ctx.xxx` / `defineTool` 反引号代码段 */
const REF_RE = /`([A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+)`|`([A-Za-z_$][\w$]*)`/g

export function ApiRef({ symbol }: { symbol: string }) {
  const navigate = useNavigate()
  const [rec, setRec] = useState<ApiSymbolRecord | undefined>()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    getRegistry().then((m) => {
      if (alive) setRec(m.get(symbol))
    })
    return () => {
      alive = false
    }
  }, [symbol])

  const official = rec?.tier === 'official-surface' || symbol.startsWith('ctx.')
  const lessons = rec?.lessonIds ?? []

  return (
    <span className="api-ref-wrap">
      <button
        type="button"
        className={`api-ref${official ? ' official' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <Code2 size={12} />
        {symbol}
      </button>
      {open && (
        <span className="api-ref-pop" onClick={(e) => e.stopPropagation()}>
          <span className="arp-head">
            <b>{symbol}</b>
            <span className={`arp-tier${official ? ' off' : ''}`}>{official ? 'official-surface' : 'exported-symbol'}</span>
          </span>
          {rec?.signature && <span className="arp-sig">{rec.signature}</span>}
          {rec?.sourcePath && (
            <button
              type="button"
              className="arp-link"
              onClick={() => navigate(`/source?path=${encodeURIComponent(rec.sourcePath)}${rec.line ? `&line=${rec.line}` : ''}`)}
            >
              <ExternalLink size={12} /> {rec.sourcePath}
              {rec.line ? `:${rec.line}` : ''}
            </button>
          )}
          {lessons.length > 0 && (
            <span className="arp-lessons">
              <GraduationCap size={12} />
              {lessons.map((id) => {
                const l = lessonById(id)
                return l ? (
                  <button key={id} className="arp-lesson" onClick={() => navigate(l.route)}>
                    {l.shortTitle}
                  </button>
                ) : null
              })}
            </span>
          )}
          {!rec && <span className="arp-note">Harness API（源码引用）</span>}
        </span>
      )}
    </span>
  )
}

/** 把文本中的反引号 API 引用渲染为可点击 ApiRef；其余原样输出 */
export function renderRichText(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  REF_RE.lastIndex = 0
  let i = 0
  while ((m = REF_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const symbol = m[1] ?? m[3]
    out.push(<ApiRef key={`${keyPrefix}-${i++}`} symbol={symbol} />)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
