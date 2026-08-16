import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SourceRef } from '../types'
import SourceChips from './SourceChips'

export interface LoopStep {
  key: string
  name: string
  kind: 'durable' | 'live' | 'gate' | 'tool'
  desc: string
  sources?: SourceRef[]
}

interface Props {
  steps: LoopStep[]
  onOpenSource?: (path: string) => void
}

const SPEEDS = [0.5, 1, 2]

export default function LoopTimeline({ steps, onOpenSource }: Props) {
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

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
    const delay = 1500 / speed
    timer.current = setTimeout(() => {
      setIndex((i) => {
        const next = i + 1
        // 自动滚动到当前节点
        const el = document.getElementById(`loop-node-${next}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        return next
      })
    }, delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [playing, index, speed, steps.length])

  const play = () => {
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

  const kindBadge = (k: LoopStep['kind']) => {
    if (k === 'durable') return <span className="badge success ln-kind">durable · 持久事件</span>
    if (k === 'live') return <span className="badge warning ln-kind">live · 扩展点</span>
    if (k === 'gate') return <span className="badge accent ln-kind">决策点</span>
    return <span className="badge info ln-kind">tool 管线</span>
  }

  return (
    <div className="loop-stage">
      <div className="loop-track" ref={trackRef}>
        {steps.map((s, i) => {
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {i > 0 && <div className="loop-arrow" style={{ padding: 0, marginRight: 2 }}>→</div>}
              <div
                id={`loop-node-${i}`}
                className={`loop-node ${index === i ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => stepTo(i)}
                title={s.desc}
              >
                <div className="ln-seq">#{String(i + 1).padStart(2, '0')}</div>
                {kindBadge(s.kind)}
                <div className="ln-name">{s.name}</div>
                <div className="ln-desc">{s.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="loop-controls">
        <button className="btn ghost" onClick={play}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
          {playing ? '暂停' : index >= steps.length - 1 ? '重放' : '播放'}
        </button>
        <button className="icon-btn" onClick={reset} title="重置"><RotateCcw size={14} /></button>
        <button className="icon-btn" onClick={() => go(-1)} disabled={playing}><ChevronLeft size={14} /></button>
        <button className="icon-btn" onClick={() => go(1)} disabled={playing}><ChevronRight size={14} /></button>
        <div className="speed">
          <span>速度</span>
          <div className="flow-tabs">
            {SPEEDS.map((s) => (
              <button key={s} className={speed === s ? 'active' : ''} onClick={() => setSpeed(s)}>{s}×</button>
            ))}
          </div>
        </div>
        <div className="loop-progress">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          {index < 0 ? '—' : `${index + 1}`}/{steps.length}
        </span>
      </div>

      {active && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <strong style={{ fontFamily: 'var(--mono)', color: 'var(--primary)' }}>{active.key}</strong>
            {kindBadge(active.kind)}
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{active.desc}</div>
          {active.sources && active.sources.length > 0 && (
            <SourceChips sources={active.sources} onOpen={onOpenSource} />
          )}
        </div>
      )}
    </div>
  )
}
