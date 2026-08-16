// ---------------------------------------------------------------------------
// Harness Learning Lab V0.2 —— Course 数据模型
// ---------------------------------------------------------------------------

export interface Lesson {
  id: string
  order: number            // 1..12
  route: string
  title: string
  shortTitle: string
  description: string
  objectives: string[]
  sourcePaths: string[]    // 与官方快照 diff 匹配用
  prerequisites?: string[]
  quizId?: string
  estimatedMinutes?: number
  relatedLessons?: string[]   // 继续学习（lesson id）
  relatedConcepts?: string[]  // 相关概念（title）
  relatedPackages?: string[]  // 相关包目录
  relatedApis?: string[]      // 相关 API symbol（如 ctx.skills）
  whyItMatters?: string       // 「这东西以后有什么用」（UX#13，每课必填）
}

export interface LearningProgress {
  version: 1
  completedLessons: string[]
  lastLesson: string | null
  lastVisitedAt: string | null
  quizResults: Record<string, { score: number; total: number; completedAt: string }>
  snapshotCommitWhenCompleted: Record<string, string>
}

// ---------------------------------------------------------------------------
// Quiz 数据模型
// ---------------------------------------------------------------------------

export interface Quiz {
  id: string
  lessonId: string
  questions: Question[]
}

export interface Question {
  id: string
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: { id: string; text: string }[]
  answer: string[]
  explanation: string
  sourcePaths: string[]
}

// ---------------------------------------------------------------------------
// 学习主题分组（首页第二屏）
// ---------------------------------------------------------------------------

export interface LessonGroup {
  title: string
  lessonIds: string[]
}
