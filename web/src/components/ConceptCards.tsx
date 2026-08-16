import type { Concept } from '../types'
import SourceChips from './SourceChips'

interface Props {
  concepts: Concept[]
  onOpenSource?: (path: string) => void
}

export default function ConceptCards({ concepts, onOpenSource }: Props) {
  if (!concepts.length) return null
  return (
    <div className="cards">
      {concepts.map((c) => (
        <div className="card" key={c.title}>
          <div className="card-head">
            {c.icon && <span className="ic">{c.icon}</span>}
            <span>{c.title}</span>
          </div>
          <p className="card-body" style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
          {c.sources && c.sources.length > 0 && (
            <SourceChips sources={c.sources} onOpen={onOpenSource} />
          )}
        </div>
      ))}
    </div>
  )
}
