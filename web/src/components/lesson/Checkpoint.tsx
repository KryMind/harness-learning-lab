// ---------------------------------------------------------------------------
// Checkpoint —— 每课小测（必选模块 ④）
// single / multiple / boolean
// - 计分按 questionId 去重：每题答对一次即记 1 分，答错不计入已完成题数
// - 连续答错两次后出现「查看答案与源码依据」按钮，由用户主动展开
// - 参考答案附 sourcePaths 源码依据链接
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Award, Eye } from 'lucide-react'
import type { Quiz, Question } from '../../course/types'
import { useProgress } from '../../course/useProgress'

interface Props {
  quiz: Quiz
}

function SourceRef({ path }: { path: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="cq-source"
      onClick={() => navigate(`/source?path=${encodeURIComponent(path)}`)}
      title={`查看源码 ${path}`}
    >
      {path.split('/').pop()}
      <span className="cq-source-path">{path}</span>
    </button>
  )
}

function QuestionCard({ q, onCorrect }: { q: Question; onCorrect: () => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none')

  const isMulti = q.type === 'multiple'
  const showAnswer = revealed

  const toggle = (id: string) => {
    if (feedback === 'correct') return // 答对后锁定，避免误改
    setSelected((prev) =>
      isMulti
        ? prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id]
        : [id],
    )
    setFeedback('none')
  }

  const check = () => {
    const correct = q.answer.length === selected.length && q.answer.every((a) => selected.includes(a))
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) onCorrect()
    else setWrongAttempts((a) => a + 1)
  }

  return (
    <div className="cq-card">
      <div className="cq-q">
        <span className="cq-type">{q.type === 'boolean' ? '对错' : q.type === 'multiple' ? '多选' : '单选'}</span>
        {q.question}
      </div>
      <div className="cq-opts">
        {q.options.map((o) => {
          const isPicked = selected.includes(o.id)
          const isAnswer = showAnswer && q.answer.includes(o.id)
          return (
            <button
              key={o.id}
              className={`cq-opt ${isPicked ? 'picked' : ''} ${isAnswer ? 'answer' : ''}`}
              onClick={() => toggle(o.id)}
            >
              <span className="cq-o-key">{o.id}</span>
              <span>{o.text}</span>
            </button>
          )
        })}
      </div>

      {feedback !== 'correct' && (
        <button className="btn primary cq-submit" onClick={check} disabled={selected.length === 0}>
          提交
        </button>
      )}

      {feedback === 'correct' && (
        <div className="cq-feedback ok">
          <Check size={15} /> 正确
        </div>
      )}

      {feedback === 'wrong' && !showAnswer && (
        <div className="cq-feedback bad">
          <X size={15} /> 还差一点，再试一次
        </div>
      )}

      {feedback === 'wrong' && wrongAttempts >= 2 && !showAnswer && (
        <button type="button" className="btn ghost cq-reveal" onClick={() => setRevealed(true)}>
          <Eye size={14} /> 查看答案与源码依据
        </button>
      )}

      {showAnswer && (
        <div className="cq-feedback bad with-answer">
          <X size={15} /> 参考答案
          <p className="cq-explain">{q.explanation}</p>
          {q.sourcePaths.length > 0 && (
            <div className="cq-sources">
              <span className="cq-sources-label">源码依据</span>
              {q.sourcePaths.map((sp) => (
                <SourceRef key={sp} path={sp} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Checkpoint({ quiz }: Props) {
  const { quiz: saveQuiz } = useProgress()
  // 按 questionId 去重：同一题只计一次正确
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set())

  const onCorrect = (id: string) => {
    setCorrectIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const score = correctIds.size
  const allDone = score >= quiz.questions.length

  return (
    <div className="checkpoint">
      <div className="section-title">
        <h2>🎯 Checkpoint · {quiz.lessonId}</h2>
        <span className="hint">每题答对记 1 分；连续答错两次后可主动查看答案与源码依据</span>
      </div>

      <div className="cq-score">
        <Award size={15} /> 得分 {score} / {quiz.questions.length}
        {allDone && (
          <button className="btn ghost mini" onClick={() => saveQuiz(quiz.id, score, quiz.questions.length)}>
            保存本次得分
          </button>
        )}
      </div>

      <div className="cq-list">
        {quiz.questions.map((q) => (
          <QuestionCard key={q.id} q={q} onCorrect={() => onCorrect(q.id)} />
        ))}
      </div>
    </div>
  )
}
