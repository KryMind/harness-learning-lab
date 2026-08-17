// ---------------------------------------------------------------------------
// LessonNavigation —— 上一节 / 标记已完成 / 下一节（UX#5）
// 必须由用户主动点击完成，不因打开页面自动学完
// ---------------------------------------------------------------------------
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'
import { prevLesson, nextLesson } from '../../course/lessons'
import { useProgress } from '../../course/useProgress'

interface Props {
  lessonId: string
}

export default function LessonNavigation({ lessonId }: Props) {
  const navigate = useNavigate()
  const { isCompleted, complete } = useProgress()
  const done = isCompleted(lessonId)
  const prev = prevLesson(lessonId)
  const next = nextLesson(lessonId)

  return (
    <div className="lesson-nav">
      <div className="ln-row">
        {prev ? (
          <button className="ln-btn" onClick={() => navigate(prev.route)}>
            <ChevronLeft size={16} />
            <span>
              <span className="ln-k">上一节</span>
              <span className="ln-t">{prev.shortTitle}</span>
            </span>
          </button>
        ) : (
          <button className="ln-btn" onClick={() => navigate('/')}>
            <ChevronLeft size={16} />
            <span>
              <span className="ln-k">上一节</span>
              <span className="ln-t">学习首页</span>
            </span>
          </button>
        )}

        <button
          className={`ln-done ${done ? 'done' : ''}`}
          onClick={() => !done && complete(lessonId)}
          disabled={done}
          title={done ? '已完成' : '标记已完成'}
        >
          {done ? <><Check size={16} /> 已完成</> : <><Check size={16} /> 标记已完成</>}
        </button>

        {next ? (
          <button className="ln-btn right" onClick={() => navigate(next.route)}>
            <span>
              <span className="ln-k">下一节</span>
              <span className="ln-t">{next.shortTitle}</span>
            </span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <div className="ln-finished">
            <PartyPopper size={15} />
            已完成全部课程，用本页 Plugin Generator 生成你的第一个插件吧
          </div>
        )}
      </div>
    </div>
  )
}
