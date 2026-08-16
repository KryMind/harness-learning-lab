import { FileCode2 } from 'lucide-react'
import type { SourceRef } from '../types'

interface Props {
  sources: SourceRef[]
  onOpen?: (path: string) => void
  kind?: 'src' | 'doc'
}

export default function SourceChips({ sources, onOpen, kind = 'src' }: Props) {
  return (
    <div className="src-list">
      {sources.map((s) => (
        <button
          key={s.path + (s.label ?? '')}
          className="src-chip"
          title={s.path}
          onClick={() => (onOpen ? onOpen(s.path) : undefined)}
        >
          <FileCode2 size={12} className="sf" />
          {s.label ?? s.path}
        </button>
      ))}
    </div>
  )
}
