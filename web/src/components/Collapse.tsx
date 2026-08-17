// ---------------------------------------------------------------------------
// Collapse —— 折叠区（渐进式披露）
// 默认折叠：标题行 + chevron，展开后渲染 children。
// 用于「深入理解」等可选深挖内容，避免默认页面过长。
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  /** 默认是否展开，默认折叠 */
  defaultOpen?: boolean
  hint?: string
  children: ReactNode
}

export default function Collapse({ title, defaultOpen = false, hint, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`collapse ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="collapse-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="collapse-chevron"><ChevronDown size={14} /></span>
        <span className="collapse-title">{title}</span>
        {hint && <span className="collapse-hint">{hint}</span>}
      </button>
      {open && <div className="collapse-body">{children}</div>}
    </div>
  )
}
