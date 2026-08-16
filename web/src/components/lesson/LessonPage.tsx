// ---------------------------------------------------------------------------
// LessonPage —— 课程页统一骨架（4 必选 + 2 可选，渐进式信息披露 UX#3）
// 必选：① 一句话理解 ② 你将学会 ③ 互动区(ConceptFlow) ④ Checkpoint
// 可选：⑤ 关键概念(ConceptCards) ⑥ 真实源码证据(SourceEvidence)
// 公共：RelatedLinks + LessonNavigation 首尾
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react'
import type { PageContent, Concept } from '../../types'
import type { Lesson, Quiz } from '../../course/types'
import type { FlowStep } from './ConceptFlow'
import LessonHeader from './LessonHeader'
import LearningObjectives from './LearningObjectives'
import ConceptFlow from './ConceptFlow'
import SourceEvidence, { type Evidence } from './SourceEvidence'
import Checkpoint from './Checkpoint'
import LessonNavigation from './LessonNavigation'
import RelatedLinks from './RelatedLinks'
import ConceptCards from '../ConceptCards'
import { useProgress } from '../../course/useProgress'
import { useEffect } from 'react'

export interface LessonContent {
  lesson: Lesson
  page: PageContent
  emoji: string
  subtitle: string
  /** 一句话理解（不填则回退到 lesson.description） */
  summary?: string
  objectives?: string[]
  /** 动态执行图（可选） */
  flow?: { steps: FlowStep[]; title?: string; hint?: string; interactive?: boolean }
  /** 关键概念（可选，默认取 page.concepts） */
  concepts?: Concept[]
  /** 真实源码证据（可选，默认由 page 的 sources 生成） */
  evidences?: Evidence[]
  quiz?: Quiz
  children?: ReactNode
}

export default function LessonPage({ lesson, page, emoji, subtitle, summary, objectives, flow, concepts, evidences, quiz, children }: LessonContent) {
  const { record } = useProgress()

  // 记录访问（不自动视为学完，标记完成需用户主动点击）
  useEffect(() => {
    record(lesson.id)
  }, [lesson.id, record])

  const finalObjectives = objectives ?? lesson.objectives
  const finalConcepts = concepts ?? page.concepts
  const finalEvidences = evidences ?? []

  return (
    <div className="page lesson-page">
      <LessonHeader
        title={lesson.title}
        emoji={emoji}
        subtitle={subtitle}
        summary={summary ?? lesson.description}
        order={lesson.order}
        minutes={lesson.estimatedMinutes}
      />

      <LearningObjectives objectives={finalObjectives} />

      {flow && (
        <ConceptFlow
          steps={flow.steps}
          title={flow.title}
          hint={flow.hint}
          interactive={flow.interactive}
        />
      )}

      {children}

      {finalConcepts.length > 0 && (
        <div className="lesson-section">
          <div className="section-title">
            <h2>💡 关键概念</h2>
            <span className="hint">点击「深入」查看详细解释</span>
          </div>
          <ConceptCards concepts={finalConcepts} />
        </div>
      )}

      {finalEvidences.length > 0 && <SourceEvidence evidences={finalEvidences} />}

      {quiz && <Checkpoint quiz={quiz} />}

      <RelatedLinks lesson={lesson} />

      <LessonNavigation lessonId={lesson.id} />
    </div>
  )
}
