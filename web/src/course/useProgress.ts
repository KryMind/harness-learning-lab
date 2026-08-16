// ---------------------------------------------------------------------------
// 学习进度 + UI 模式 React 钩子
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react'
import {
  loadProgress,
  markCompleted,
  recordVisit,
  saveQuizResult,
  isCompleted,
} from './progress'
import type { LearningProgress } from './types'
import { TOTAL_LESSONS } from './lessons'
import { useData } from '../data'

export type UiMode = 'learning' | 'developer'

export function useProgress() {
  const { meta } = useData()
  const snapshot = meta?.repoCommit ?? ''
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress())
  const [uiMode, setUiMode] = useState<UiMode>(() => {
    const m = localStorage.getItem('hll.ui.mode')
    return m === 'developer' ? 'developer' : 'learning'
  })

  const record = useCallback((lessonId: string) => setProgress((p) => recordVisit(p, lessonId)), [])
  const complete = useCallback(
    (lessonId: string) => setProgress((p) => markCompleted(p, lessonId, snapshot)),
    [snapshot],
  )
  const quiz = useCallback(
    (quizId: string, score: number, total: number) => setProgress((p) => saveQuizResult(p, quizId, score, total)),
    [],
  )

  const completedCount = progress.completedLessons.length
  const percent = Math.round((completedCount / TOTAL_LESSONS) * 100)

  useEffect(() => {
    localStorage.setItem('hll.ui.mode', uiMode)
  }, [uiMode])

  return {
    progress,
    completedCount,
    percent,
    total: TOTAL_LESSONS,
    isCompleted: (id: string) => isCompleted(progress, id),
    record,
    complete,
    quiz,
    uiMode,
    setUiMode,
  }
}

export type ProgressApi = ReturnType<typeof useProgress>
