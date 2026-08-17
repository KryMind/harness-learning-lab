// ---------------------------------------------------------------------------
// Harness Learning Lab V0.2 —— 12 课课程定义（route 复用现有页面）
// ---------------------------------------------------------------------------
import type { Lesson, LessonGroup } from './types'

export const LESSONS: Lesson[] = [
  {
    id: 'overview',
    order: 1,
    route: '/overview',
    shortTitle: 'Harness 是什么',
    title: 'Harness 是什么',
    description: 'Harness 到底是什么，它和 Agent / LLM 的关系。',
    objectives: ['解释 Harness 的定位', '列出核心子系统', '找到总览源码'],
    sourcePaths: ['docs/architecture.md', 'docs/README.md'],
    quizId: 'overview-basic',
    estimatedMinutes: 8,
    relatedLessons: ['cordis'],
    relatedConcepts: ['Agent', 'Plugin'],
    relatedPackages: ['packages/core/agent-loop'],
    whyItMatters:
      'Longsys AI 的 Agent 体系（接入 OpenMetadata、SQL 查询、业务语义）都建立在同一套「插件 + 执行循环」心智上，这里先建立全局地图。',
  },
  {
    id: 'cordis',
    order: 2,
    route: '/cordis',
    shortTitle: 'Plugin / Cordis',
    title: 'Everything is a Plugin / Cordis',
    description: '一切皆插件，Cordis 是宿主。',
    objectives: ['解释 Plugin 与 ctx', '理解 Cordis 生命周期', '定位 cordis 源码'],
    sourcePaths: ['docs/architecture.md', 'vendor/cordis/**'],
    quizId: 'cordis-basic',
    estimatedMinutes: 10,
    relatedLessons: ['profile'],
    relatedConcepts: ['Plugin', 'ctx', 'Cordis'],
    whyItMatters:
      '所有 Longsys AI 能力都封装成插件挂进 Profile，理解 Cordis 就理解「能力如何被宿主启动与组合」。',
  },
  {
    id: 'profile',
    order: 3,
    route: '/profile',
    shortTitle: 'Profile / Bundle',
    title: 'Profile 与 Bundle',
    description: '如何把插件组装成可运行实例。',
    objectives: ['理解 Profile→Bundle→插件行', '理解 cordis.patch.yml', '定位 bundle 源码'],
    sourcePaths: ['packages/bundle/base/**', 'apps/cli/src/profile-boot.ts'],
    quizId: 'profile-basic',
    estimatedMinutes: 10,
    relatedLessons: ['agent-loop'],
    relatedConcepts: ['Profile', 'Bundle'],
    whyItMatters:
      '部署 Longsys AI 实例（如 openmetadata 技能栈、SQL Agent）就是在组装 Profile，这一课是配置的底层语法。',
  },
  {
    id: 'agent-loop',
    order: 4,
    route: '/agent-loop',
    shortTitle: 'Agent Loop',
    title: 'Agent Loop',
    description: '理解 Harness 如何在模型调用和工具执行之间循环推进任务。',
    objectives: [
      '理解 Turn 和 Step 的区别',
      '理解模型什么时候继续调用 Tool',
      '理解 Tool Result 如何进入下一轮',
      '能够从源码定位 Agent Loop',
    ],
    sourcePaths: ['docs/architecture.md', 'packages/core/agent-loop/**'],
    quizId: 'agent-loop-basic',
    estimatedMinutes: 12,
    relatedLessons: ['session', 'tools'],
    relatedConcepts: ['Turn', 'Step', 'Tool Call', 'Session Event'],
    relatedApis: ['ctx.agents', 'ctx.agentLoop'],
    whyItMatters:
      '所有 Agent 行为（查库、调 OpenMetadata、多步推理）本质都是「模型 + 工具循环」，这是调试与设计一切 Longsys AI Agent 的核心。',
  },
  {
    id: 'session',
    order: 5,
    route: '/session',
    shortTitle: 'Session',
    title: 'Session',
    description: '事件日志、恢复、审计。',
    objectives: ['理解 durable 事件', '理解 Session 恢复', '定位 session 源码'],
    sourcePaths: ['packages/core/session/**', 'docs/agent-lifecycle.md'],
    quizId: 'session-basic',
    estimatedMinutes: 9,
    relatedLessons: ['agent-loop'],
    relatedConcepts: ['Session Event'],
    relatedPackages: ['packages/core/session'],
    whyItMatters:
      'Longsys AI 的审计与可追溯（谁问了什么、工具做了什么）依赖 Session 事件，是合规与排查的单一事实源。',
  },
  {
    id: 'tools',
    order: 6,
    route: '/tools',
    shortTitle: 'Tools',
    title: 'Tools',
    description: '注册、执行、权限控制。',
    objectives: [
      '理解 defineTool',
      '理解 ctx.tools.register',
      '理解 pre / execute / post 管线',
      '定位 tools 源码',
    ],
    sourcePaths: ['packages/core/tools/**', 'packages/core/agent-loop/src/tool-calls.ts'],
    quizId: 'tools-basic',
    estimatedMinutes: 11,
    relatedLessons: ['skills'],
    relatedConcepts: ['Tool', 'Tool Call'],
    relatedPackages: ['packages/core/tools'],
    relatedApis: ['ctx.tools.register'],
    whyItMatters:
      '把 OpenMetadata、Semantic Orchestrator、SQL 查询 API 接入 Longsys AI，本质上都需要理解这一层 —— Tool 是外部能力的标准入口。',
  },
  {
    id: 'skills',
    order: 7,
    route: '/skills',
    shortTitle: 'Skills',
    title: 'Skills',
    description: 'Provider → Catalog → Loader 的能力注入管线。',
    objectives: [
      '理解能力 Seam 三角色',
      '理解 ctx.skills 分层注册',
      '理解 catalog / loader',
      '定位 skills 源码',
    ],
    sourcePaths: ['packages/skill/**', 'docs/subsystems/skills.md'],
    quizId: 'skills-basic',
    estimatedMinutes: 10,
    relatedLessons: ['tools', 'subagent'],
    relatedConcepts: ['Skill', 'Catalog', 'Loader'],
    relatedPackages: ['packages/skill/skill', 'packages/skill/tool-skill'],
    relatedApis: ['ctx.skills'],
    whyItMatters:
      'Longsys AI 不同业务 Agent 的分析策略、开发规范、领域知识，都可以通过 Skills 统一管理与注入，是「知识进系统」的入口。',
  },
  {
    id: 'subagent',
    order: 8,
    route: '/subagent',
    shortTitle: 'Subagents',
    title: 'Subagents',
    description: '主 Agent 如何创建子 Agent。',
    objectives: ['理解 ctx.subagents.start', '理解 SubagentResult', '定位 subagent 源码'],
    sourcePaths: ['packages/subagent/**'],
    quizId: 'subagent-basic',
    estimatedMinutes: 9,
    relatedLessons: ['workflow'],
    relatedConcepts: ['Subagent'],
    relatedApis: ['ctx.subagents.start'],
    whyItMatters:
      '复杂任务拆给多个专职 Agent 并行处理，是 Longsys AI 业务场景（多数据源调研）的常用协作模式。',
  },
  {
    id: 'workflow',
    order: 9,
    route: '/workflow',
    shortTitle: 'Workflow',
    title: 'Workflow',
    description: '动态编排多个 Subagent 的 JavaScript orchestration script。',
    objectives: [
      '理解 script + meta + args',
      '理解 ctx.workflowEngine.start',
      '理解 agent / parallel / pipeline / phase',
      '定位 workflow 源码',
    ],
    sourcePaths: ['packages/workflow/**'],
    quizId: 'workflow-basic',
    estimatedMinutes: 11,
    relatedLessons: ['subagent'],
    relatedConcepts: ['Workflow'],
    relatedApis: ['ctx.workflowEngine.start'],
    whyItMatters:
      '复杂任务的 Subagent 并行与阶段式编排（调研→分析→总结）用 Workflow 表达，是业务级编排的标准手段。',
  },
  {
    id: 'permission',
    order: 10,
    route: '/permission',
    shortTitle: 'Permission',
    title: 'Permission / Approval / Sandbox',
    description: '安全、审批、沙箱。',
    objectives: ['理解 Approval', '理解权限预设', '理解 Sandbox', '定位 permission 源码'],
    sourcePaths: ['packages/interaction/permission-presets/**', 'packages/sandbox/**'],
    quizId: 'permission-basic',
    estimatedMinutes: 10,
    relatedLessons: ['tools'],
    relatedConcepts: ['Approval', 'Permission', 'Sandbox'],
    whyItMatters:
      '给 Longsys AI 接真实数据源前，必须先设计「什么工具需要审批、跑在什么沙箱里」，这一课决定安全边界。',
  },
  {
    id: 'web-ui',
    order: 11,
    route: '/web-ui',
    shortTitle: 'Web UI',
    title: 'Web Client / UI Slots',
    description: 'React Client 与 UI 插件。',
    objectives: ['理解 ctx.slots.register', '理解 Client UI Plugin', '定位 ui-slots 源码'],
    sourcePaths: ['packages/client/**'],
    quizId: 'webui-basic',
    estimatedMinutes: 9,
    relatedLessons: ['plugin-generator'],
    relatedConcepts: ['Client UI Plugin', 'UI Slots'],
    relatedApis: ['ctx.slots.register'],
    whyItMatters:
      '以后做 Skills 管理、Agent Hub、审计、权限页面，这一节直接相关 —— 所有管理界面都是 UI 插件挂进 Slots。',
  },
  {
    id: 'plugin-generator',
    order: 12,
    route: '/plugin-generator',
    shortTitle: 'Plugin Generator',
    title: 'Plugin Generator',
    description: '在线生成 Harness 插件模板。',
    objectives: ['理解六种插件类型', '理解生成模板与官方 API 一致', '把生成的模板挂进 Profile'],
    sourcePaths: [
      'packages/core/tools/**',
      'packages/workflow/**',
      'packages/schedule/**',
      'packages/client/ui-slots/**',
    ],
    quizId: undefined,
    estimatedMinutes: 10,
    relatedLessons: ['tools', 'workflow'],
    relatedConcepts: ['Plugin', 'Tool', 'Workflow', 'Schedule'],
    relatedApis: ['ctx.tools.register', 'ctx.slots.register'],
    whyItMatters: '把前 11 课的知识变成「能跑的插件骨架」，是 Longsys AI 能力落地的第一步。',
  },
]

// ---------------------------------------------------------------------------
// 查询辅助
// ---------------------------------------------------------------------------

export const lessonByRoute = (route: string) => LESSONS.find((l) => l.route === route)
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)
export const nextLesson = (id: string) =>
  LESSONS.find((l) => l.order === (lessonById(id)?.order ?? 0) + 1)
export const prevLesson = (id: string) =>
  LESSONS.find((l) => l.order === (lessonById(id)?.order ?? 0) - 1)
export const TOTAL_LESSONS = LESSONS.length
export const TOTAL_MINUTES = LESSONS.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0)

/**
 * 「继续学习」目标课：从 lastLesson 开始向后找第一个未完成课程；
 * 若之后全部完成，则回到开头找；若全部完成，则指向最后一课（供复习）。
 */
export function nextLessonToContinue(
  lastLessonId: string | null,
  isDone: (lessonId: string) => boolean,
) {
  const ordered = [...LESSONS].sort((a, b) => a.order - b.order)
  const start = lastLessonId ? ordered.findIndex((l) => l.id === lastLessonId) : -1
  const from = start >= 0 ? start : 0
  for (let i = from; i < ordered.length; i++) {
    if (!isDone(ordered[i].id)) return ordered[i]
  }
  for (let i = 0; i < from; i++) {
    if (!isDone(ordered[i].id)) return ordered[i]
  }
  return ordered[ordered.length - 1]
}

/** 学习主题分组（首页第二屏） */
export const LESSON_GROUPS: LessonGroup[] = [
  { title: '基础', lessonIds: ['overview', 'cordis', 'profile'] },
  { title: '执行核心', lessonIds: ['agent-loop', 'session', 'tools', 'skills'] },
  { title: 'Agent 能力', lessonIds: ['subagent', 'workflow', 'permission'] },
  { title: '扩展开发', lessonIds: ['web-ui', 'plugin-generator'] },
]

/** sourcePaths 前缀匹配：判断某个文件是否属于某课（version diff 用） */
export function lessonMatchesPath(lesson: Lesson, filePath: string): boolean {
  return lesson.sourcePaths.some((p) => {
    if (p.endsWith('/**')) return filePath.startsWith(p.slice(0, -3))
    if (p.endsWith('/*')) return filePath.startsWith(p.slice(0, -2))
    return filePath === p || filePath.startsWith(p.endsWith('/') ? p : p + '/')
  })
}

/** 搜索用的概念索引（含中文 aliases，UX#12） */
export interface ConceptIndexEntry {
  id: string
  type: 'concept'
  title: string
  aliases: string[]
  description: string
  lessonId: string
  route: string
}

const ALIASES: Record<string, string[]> = {
  overview: ['Harness', '智能体框架', 'Agent框架'],
  cordis: ['Plugin', '插件', 'Cordis', 'Koishi'],
  profile: ['Profile', 'Bundle', '配置', '装配', '配置文件'],
  'agent-loop': ['Agent Loop', 'Agent循环', '执行循环', '智能体循环'],
  session: ['Session', '会话', '事件日志', 'Event Log'],
  tools: ['Tool', '工具', 'ctx.tools', 'defineTool'],
  skills: ['Skill', 'Skills', '技能', '能力包'],
  subagent: ['Subagent', '子代理', '子Agent'],
  workflow: ['Workflow', '工作流', '编排', '多Agent编排'],
  permission: ['Permission', 'Approval', '审批', '权限', 'Sandbox', '沙箱'],
  'web-ui': ['Web UI', 'UI Slots', '界面', 'Slots'],
  'plugin-generator': ['Plugin Generator', '插件生成器', '模板'],
}

export function buildConceptIndex(): ConceptIndexEntry[] {
  return LESSONS.map((l) => ({
    id: `concept-${l.id}`,
    type: 'concept' as const,
    title: l.title,
    aliases: [l.shortTitle, l.title, ...(ALIASES[l.id] ?? [])],
    description: l.description,
    lessonId: l.id,
    route: l.route,
  }))
}
