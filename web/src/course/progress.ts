// ---------------------------------------------------------------------------
// Harness Learning Lab V0.2 —— 学习进度 localStorage 存储
// key: hll.learning.progress.v1
// 纯前端，无账号、无云同步；损坏/版本不符时恢复默认。
// ---------------------------------------------------------------------------
import type { LearningProgress } from './types'

const KEY = 'hll.learning.progress.v1'

function defaultProgress(): LearningProgress {
  return {
    version: 1,
    completedLessons: [],
    lastLesson: null,
    lastVisitedAt: null,
    quizResults: {},
    snapshotCommitWhenCompleted: {},
  }
}

export function loadProgress(): LearningProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    const p = JSON.parse(raw) as LearningProgress
    if (p.version !== 1) return defaultProgress()
    return p
  } catch {
    return defaultProgress()
  }
}

function save(p: LearningProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export function isCompleted(p: LearningProgress, lessonId: string): boolean {
  return p.completedLessons.includes(lessonId)
}

export function markCompleted(
  p: LearningProgress,
  lessonId: string,
  snapshotCommit: string,
): LearningProgress {
  const next: LearningProgress = {
    ...p,
    completedLessons: p.completedLessons.includes(lessonId)
      ? p.completedLessons
      : [...p.completedLessons, lessonId],
    snapshotCommitWhenCompleted: {
      ...p.snapshotCommitWhenCompleted,
      [lessonId]: snapshotCommit,
    },
    lastVisitedAt: new Date().toISOString(),
  }
  save(next)
  return next
}

export function recordVisit(p: LearningProgress, lessonId: string): LearningProgress {
  const next = { ...p, lastLesson: lessonId, lastVisitedAt: new Date().toISOString() }
  save(next)
  return next
}

export function saveQuizResult(
  p: LearningProgress,
  quizId: string,
  score: number,
  total: number,
): LearningProgress {
  const next = {
    ...p,
    quizResults: {
      ...p.quizResults,
      [quizId]: { score, total, completedAt: new Date().toISOString() },
    },
  }
  save(next)
  return next
}
