// ---------------------------------------------------------------------------
// LearningObjectives —— 「你将学会」（必选模块 ②）
// ---------------------------------------------------------------------------
import { CheckCircle2 } from 'lucide-react'

interface Props {
  objectives: string[]
}

export default function LearningObjectives({ objectives }: Props) {
  return (
    <div className="lesson-objectives">
      <div className="lo-heading">你将学会</div>
      <ul className="lo-list">
        {objectives.map((o) => (
          <li key={o}>
            <CheckCircle2 size={15} className="lo-check" />
            <span>{o}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
