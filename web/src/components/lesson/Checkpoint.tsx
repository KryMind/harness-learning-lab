// ---------------------------------------------------------------------------
// Checkpoint —— 每课小测（必选模块 ④）
// single / multiple / boolean；第一次答错不给答案，第二次仍错可查看答案（UX#11）
// ---------------------------------------------------------------------------
import { useState } from 'react'
import { Check, X, Award } from 'lucide-react'
import type { Quiz } from '../../course/types'
import { useProgress } from '../../course/useProgress'

interface Props {
  quiz: Quiz
}

function QuestionCard({
  q,
  onSubmit,
}: {
  q: Quiz['questions'][number]
  onSubmit: (correct: boolean) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none')

  const isMulti = q.type === 'multiple'
  const toggle = (id: string) => {
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
    setAttempts((a) => a + 1)
    if (correct) onSubmit(true)
    else onSubmit(false)
  }

  const showAnswer = revealed || attempts >= 2

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

      {feedback === 'none' && (
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

      {feedback === 'wrong' && showAnswer && (
        <div className="cq-feedback bad with-answer">
          <X size={15} /> 正确答案已亮出
          <p className="cq-explain">{q.explanation}</p>
        </div>
      )}

      {showAnswer && !feedback && (
        <div className="cq-feedback bad with-answer">
          <p className="cq-explain">{q.explanation}</p>
        </div>
      )}
    </div>
  )
}

export default function Checkpoint({ quiz }: Props) {
  const { quiz: saveQuiz } = useProgress()
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)

  const onAnswer = (correct: boolean) => {
    setAnswered((a) => a + 1)
    if (correct) setScore((s) => s + 1)
  }

  const allDone = answered >= quiz.questions.length

  return (
    <div className="checkpoint">
      <div className="section-title">
        <h2>🎯 Checkpoint · {quiz.lessonId}</h2>
        <span className="hint">答对记分；答错两次后可以查看答案与源码解释</span>
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
          <QuestionCard key={q.id} q={q} onSubmit={onAnswer} />
        ))}
      </div>
    </div>
  )
}
