// ---------------------------------------------------------------------------
// LessonHeader —— 课程页顶部：一句话理解（必选模块 ①）
// 第一屏不出现源码/package/path，保持渐进式信息披露（UX#3）
// ---------------------------------------------------------------------------
import { Sparkles } from 'lucide-react'
import { renderRichText } from '../ApiRef'

interface Props {
  title: string
  emoji: string
  subtitle: string
  /** 一句话理解（≤3 行） */
  summary: string
  order?: number
  minutes?: number
}

export default function LessonHeader({ title, emoji, subtitle, summary, order, minutes }: Props) {
  return (
    <div className="lesson-header">
      <span className="tag"><Sparkles size={12} /> 交互式课程</span>
      <h1>
        <span className="lh-emoji">{emoji}</span> {title}
      </h1>
      <p className="lh-sub">{subtitle}</p>
      {(order !== undefined || minutes !== undefined) && (
        <div className="lesson-meta">
          {order !== undefined && <span className="badge">第 {order}/12 课</span>}
          {minutes !== undefined && <span className="badge">{minutes} min</span>}
        </div>
      )}
      <div className="lesson-summary">{renderRichText(summary, `lh-${title}`)}</div>
    </div>
  )
}
