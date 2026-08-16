import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PageContent } from '../types'

interface Props {
  content: PageContent
}

export default function PageHero({ content }: Props) {
  const navigate = useNavigate()
  return (
    <div className="hero">
      <span className="tag"><Sparkles size={12} /> 源码驱动 · 可点击 · 可追踪</span>
      <h1>
        <span>{content.emoji}</span>
        <span>{content.title}</span>
      </h1>
      <p className="sub">{content.subtitle}</p>
      {content.hero && (
        <div className="hero-text">
          {content.hero.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <div className="learn">
        {content.learn.map((l) => (
          <span className="learn-chip" key={l}>✓ {l}</span>
        ))}
      </div>
    </div>
  )
}
