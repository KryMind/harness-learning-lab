// ---------------------------------------------------------------------------
// 学习进度 React Context —— 全站共享同一份进度状态
// ProgressProvider 挂在 App 根部；任何子组件 useProgress() 读到的都是同一状态，
// 子组件写进度后 Sidebar / Home 等立即可见（无需刷新）。
// ---------------------------------------------------------------------------
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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

export interface ProgressApi {
  progress: LearningProgress
  completedCount: number
  percent: number
  total: number
  isCompleted: (id: string) => boolean
  /** 记录一次访问（更新 lastLesson） */
  record: (lessonId: string) => void
  /** 用户主动标记完成 */
  complete: (lessonId: string) => void
  /** 保存一次 Quiz 得分 */
  quiz: (quizId: string, score: number, total: number) => void
}

const ProgressContext = createContext<ProgressApi | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { meta } = useData()
  const snapshot = meta?.repoCommit ?? ''
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress())

  const record = useCallback(
    (lessonId: string) => setProgress((p) => recordVisit(p, lessonId)),
    [],
  )
  const complete = useCallback(
    (lessonId: string) => setProgress((p) => markCompleted(p, lessonId, snapshot)),
    [snapshot],
  )
  const quiz = useCallback(
    (quizId: string, score: number, total: number) =>
      setProgress((p) => saveQuizResult(p, quizId, score, total)),
    [],
  )

  const value = useMemo<ProgressApi>(() => {
    const completedCount = progress.completedLessons.length
    return {
      progress,
      completedCount,
      percent: Math.round((completedCount / TOTAL_LESSONS) * 100),
      total: TOTAL_LESSONS,
      isCompleted: (id: string) => isCompleted(progress, id),
      record,
      complete,
      quiz,
    }
  }, [progress, record, complete, quiz])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress 必须在 <ProgressProvider> 内使用')
  return ctx
}
