// ---------------------------------------------------------------------------
// RelatedLinks —— 每课底部「为什么值得学」+ 相关内容（UX#13）
// 全部由 lesson metadata 驱动，非 AI 生成
// ---------------------------------------------------------------------------
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, Package, Wrench, GraduationCap } from 'lucide-react'
import type { Lesson } from '../../course/types'
import { lessonById } from '../../course/lessons'
import { ApiRef, renderRichText } from '../ApiRef'

interface Props {
  lesson: Lesson
}

/** 相关 API 的 chip 形态（复用 ApiRef 弹出层） */
function ApiRefChip({ symbol }: { symbol: string }) {
  return (
    <span className="rl-chip">
      <ApiRef symbol={symbol} />
    </span>
  )
}

export default function RelatedLinks({ lesson }: Props) {
  const navigate = useNavigate()

  return (
    <div className="related-links">
      {lesson.whyItMatters && (
        <div className="rl-why">
          <div className="rl-why-title">
            <GraduationCap size={16} />
            这东西以后有什么用？
          </div>
          <p>{renderRichText(lesson.whyItMatters, `why-${lesson.id}`)}</p>
        </div>
      )}

      {(lesson.relatedLessons?.length || lesson.relatedConcepts?.length || lesson.relatedPackages?.length || lesson.relatedApis?.length) && (
        <div className="rl-grid">
          {lesson.relatedLessons && lesson.relatedLessons.length > 0 && (
            <div className="rl-col">
              <div className="rl-head"><ArrowRight size={13} /> 继续学习</div>
              {lesson.relatedLessons.map((id) => {
                const l = lessonById(id)
                return l ? (
                  <button key={id} className="rl-item" onClick={() => navigate(l.route)}>
                    {l.shortTitle}
                  </button>
                ) : null
              })}
            </div>
          )}
          {lesson.relatedConcepts && lesson.relatedConcepts.length > 0 && (
            <div className="rl-col">
              <div className="rl-head"><BookOpen size={13} /> 相关概念</div>
              {lesson.relatedConcepts.map((c) => (
                <span key={c} className="rl-chip">{c}</span>
              ))}
            </div>
          )}
          {lesson.relatedPackages && lesson.relatedPackages.length > 0 && (
            <div className="rl-col">
              <div className="rl-head"><Package size={13} /> 相关 Package</div>
              {lesson.relatedPackages.map((p) => (
                <button key={p} className="rl-chip link" onClick={() => navigate(`/packages?dir=${encodeURIComponent(p)}`)}>
                  {p}
                </button>
              ))}
            </div>
          )}
          {lesson.relatedApis && lesson.relatedApis.length > 0 && (
            <div className="rl-col">
              <div className="rl-head"><Wrench size={13} /> 相关 API</div>
              {lesson.relatedApis.map((a) => (
                <ApiRefChip key={a} symbol={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
