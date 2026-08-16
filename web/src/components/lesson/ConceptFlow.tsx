// ---------------------------------------------------------------------------
// ConceptFlow —— 动态执行图（可选模块 ③，交互区）
// 每步对应讲解面板 + 源码；提供 播放/暂停/单步/重置；
// 支持 prefers-reduced-motion（自动播放关闭，仍可单步，UX#7）
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react'
import SourceChips from '../SourceChips'
import type { SourceRef } from '../../types'

export interface FlowStep {
  key: string
  name: string
  kind: 'start' | 'action' | 'gate' | 'result' | 'end'
  desc: string
  sources?: SourceRef[]
}

interface Props {
  steps: FlowStep[]
  title?: string
  hint?: string
  /** 「试试看」互动：点击「下一步」推进（UX 评审：互动区） */
  interactive?: boolean
}

const STEP_MS = 750

export default function ConceptFlow({ steps, title = '它是怎么工作的', hint, interactive = false }: Props) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const stop = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])

  useEffect(() => {
    if (!playing) return
    if (index >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const delay = STEP_MS
    timer.current = setTimeout(() => {
      setIndex((i) => {
        const next = i + 1
        const el = document.getElementById(`cf-node-${next}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        return next
      })
    }, delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [playing, index, steps.length])

  const play = () => {
    if (reduceMotion) {
      // 关闭动画时不允许自动播放，但可单步
      stepTo(index + 1)
      return
    }
    if (index >= steps.length - 1) setIndex(0)
    setPlaying((p) => !p)
  }
  const reset = () => {
    stop()
    setIndex(-1)
    setPlaying(false)
  }
  const stepTo = (i: number) => {
    stop()
    setIndex(Math.max(-1, Math.min(steps.length - 1, i)))
    setPlaying(false)
  }
  const go = (d: number) => {
    if (playing) return
    stepTo(index + d)
  }

  const active = index >= 0 && index < steps.length ? steps[index] : null
  const progress = index < 0 ? 0 : ((index + 1) / steps.length) * 100

  const kindIcon = (k: FlowStep['kind']) => {
    if (k === 'gate') return '◆'
    if (k === 'result') return '▣'
    if (k === 'start') return '●'
    if (k === 'end') return '◉'
    return '▸'
  }

  return (
    <div className="concept-flow">
      <div className="section-title">
        <h2>⚙️ {title}</h2>
        {hint && <span className="hint">{hint}</span>}
      </div>

      {interactive && !reduceMotion && (
        <div className="cf-try">
          <MousePointerClick size={14} />
          试试看：点击「下一步」逐步推进（交互区）
        </div>
      )}

      <div className="cf-stage">
        <div className="cf-track">
          {steps.map((s, i) => {
            const isGate = s.kind === 'gate'
            return (
              <div key={s.key} className={`cf-node-wrap`}>
                {i > 0 && <div className="cf-arrow">→</div>}
                <button
                  id={`cf-node-${i}`}
                  className={`cf-node ${index === i ? 'active' : ''} ${isGate ? 'gate' : ''} ${index > i ? 'passed' : ''}`}
                  onClick={() => stepTo(i)}
                >
                  <span className="cf-ic">{kindIcon(s.kind)}</span>
                  <span className="cf-name">{s.name}</span>
                </button>
                {isGate && index === i && (
                  <div className="cf-gate-options">
                    <span className="cf-go">Yes →</span>
                    <span className="cf-no">No →</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="cf-controls">
          <button className="btn ghost" onClick={play}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
            {reduceMotion ? '下一步' : playing ? '暂停' : index >= steps.length - 1 ? '重放' : '播放'}
          </button>
          <button className="icon-btn" onClick={reset} title="重置"><RotateCcw size={14} /></button>
          <button className="icon-btn" onClick={() => go(-1)} disabled={playing}><ChevronLeft size={14} /></button>
          <button className="icon-btn" onClick={() => go(1)} disabled={playing}><ChevronRight size={14} /></button>
          <div className="cf-progress"><div className="fill" style={{ width: `${progress}%` }} /></div>
          <span className="cf-count mono">{index < 0 ? '—' : `${index + 1}`}/{steps.length}</span>
        </div>

        {active && (
          <div className="cf-panel">
            <div className="cf-panel-head">
              <strong className="mono" style={{ color: 'var(--primary)' }}>{active.key}</strong>
              <span className="badge">{active.name}</span>
            </div>
            <p className="cf-panel-desc">{active.desc}</p>
            {active.sources && active.sources.length > 0 && (
              <SourceChips sources={active.sources} onOpen={(p) => navigate(`/source?path=${encodeURIComponent(p)}`)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
