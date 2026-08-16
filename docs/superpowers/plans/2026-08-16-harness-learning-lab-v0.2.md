# Harness Learning Lab V0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Harness Learning Lab 从「知识页面 + 源码浏览器」升级为「交互式课程 + 架构可视化 + 官方源码证据 + 插件学习工具」的初学者学习平台（纯静态，无后端）。

**Architecture:** 在现有 React + HashRouter + Vite 纯静态站上，新增 course 数据模型与 localStorage 进度系统；扫描器（scripts/scan.ts）扩展出 search index（含 TypeScript AST API Symbol 扫描）与 snapshot 版本信息；页面统一为 6 段课程结构；新增 Command Palette 搜索、/version 版本差异页、Runtime Snapshot 改名、学习/开发双模式、移动端适配。全程不引入 backend / Runtime / DB / RAG / Dify。

**Tech Stack:** React 18 + TypeScript + Vite 5 + react-router-dom(HashRouter) + @xyflow/react(React Flow) + Monaco(懒加载) + lucide-react。构建期扫描器：node:tsx + TypeScript Compiler API。

**Snapshot:** 当前课程绑定 commit `47f943859bef60e4160492346772ded9b24f765a`（短 `47f9438`）。

**执行约束（来自用户）：** 不删除现有页面；不重做视觉语言；每 Phase 单独 commit；不做 AI/RAG/账号/云同步/真实 Runtime/Dify。

**UX 总原则（用户评审补充，必须遵守，优先级最高）：**
1. Learning Lab 首要目标是「让第一次接触 Harness 的人理解」，不是展示尽可能多的信息。
2. 首页 `/` 与 Lesson 1 `/overview` 分离（原文档此处有冲突，已修正：`/` = HomePage，`/overview` = Lesson 1「Harness 是什么」）。
3. 每课采用渐进式信息披露：一句话理解 → 可视化 → 互动 → 源码 → Quiz；源码/Package/API 默认是第二层信息，不得抢占首屏。
4. 课程页避免 Card 堆砌，保持大面积留白；整体偏 Linear / Vercel Docs + 技术实验室感，不要传统蓝色后台、不要「AI 生成 Dashboard」。
5. 视觉层级：大标题 → 一句话解释 → 大面积互动图 → 留白 → Concept Cards → 源码。
6. 色彩只保留 4 个语义色：蓝=当前/Active、绿=已完成、橙=版本变化/注意、紫=Source/API/Developer；其余全灰阶；禁止大面积渐变、发光边框、每卡不同色、满屏 Emoji。
7. 动画必须「解释行为」，不做纯装饰动画。
8. 源码/Package/API 属于第二层信息；初学者模式弱化 Commit/Diff/API Path，开发者模式提高信息密度（学习/开发模式只改变信息密度，不是两套网站）。
9. Version Warning 默认为轻提示（小 Badge + 点击展开）；仅 Plugin Generator 等生成代码可能失效处用强警告。
10. Plugin Generator 只在 Sidebar 出现一次，同时承担 Lesson 12 + 实践入口。
11. Quiz 第一次答错不给答案；第二次仍错后允许「查看答案 + 源码解释」。
12. 搜索严格遵循排序：概念 > 公共 API > Package/Docs > Source；AST 符号分三级（Official Surface / Exported Symbol / Internal Symbol），Internal 默认不出现在普通搜索。
13. 每节课增加「这东西以后有什么用」（示例：接入 OpenMetadata / Longsys AI 业务 Agent / Skills 管理 / Agent Hub 等），提升学习动力。

**视觉规格（用户评审补充）：** Sidebar 248px；主学习区 760~860px；辅助源码区 360~440px；页面最大宽度 1360px；课程正文不铺满显示器。

---

## 文件结构总览

### 新增
```
web/src/course/
  types.ts           // Lesson / Quiz / Progress 类型
  lessons.ts         // LESSONS: Lesson[]（12 课，route 复用现有页面）
  progress.ts        // localStorage hll.learning.progress.v1 读写
  quizzes.ts         // Quiz 数据（题目答案须可被当前快照源码验证）
web/src/components/lesson/
  LessonHeader.tsx      // 一句话理解（第 1 段）
  LearningObjectives.tsx// 你将学会（第 2 段）
  ConceptFlow.tsx       // 动态执行图 + 讲解面板（第 3 段）
  SourceEvidence.tsx    // 真实源码证据（第 5 段）
  Checkpoint.tsx        // 小测（第 6 段）
  LessonNavigation.tsx  // 上一节 / 标记完成 / 下一节
  LessonPage.tsx        // 课程页骨架（组合 1-6 段 + 版本提示 + 关联知识）
web/src/components/VersionStatusCard.tsx  // snapshot vs 官方 master 状态
web/src/components/ApiPopover.tsx         // 源码引用 popover（概念↔API↔Package↔Source）
web/src/components/RelatedLinks.tsx       // Lesson 底部关联知识
web/src/components/RoadmapModal.tsx       // Plugin Studio roadmap modal
web/src/components/search/
  CommandPalette.tsx
  SearchInput.tsx
  SearchTabs.tsx
  SearchResult.tsx
  SearchEmpty.tsx
  useSearch.ts          // 加载 search index + ranking 打分
web/src/pages/VersionPage.tsx        // /version 版本差异页
web/src/pages/RuntimeSnapshotPage.tsx// /runtime-snapshot（LivePage 改名）
web/src/pages/HomePage.tsx           // 学习首页（Hero + 进度 + 路线图 + 差异卡）
web/src/data/searchIndex.ts          // 加载 generated/search/*.json
web/src/data/version.ts              // 加载 snapshot 元数据 + 官方 master 查询（fetch GitHub API）
web/src/hooks/useUiMode.ts           // 学习/开发模式 (hll.ui.mode)
web/src/hooks/useResponsive.ts       // 移动端断点
```
### 新增扫描产物
```
generated/search/
  concepts.json      // 概念索引（来自 course + lesson metadata）
  docs.json          // docs 摘要索引
  packages.json      // 复用 packages.json（包名/dir/desc/capabilityFamily）
  api-symbols.json   // TS AST 扫描的 export function/class/interface/type + ctx.xxx API
  source-index.json  // 源码路径搜索索引
  version.json       // snapshot commit、文件级 commit_hash 快照（供 /version diff 用）
```
### 修改
```
scripts/scan.ts                       // 增加 search index + api-symbols + version 产物
web/src/App.tsx                       // 新布局：Home、课程路由包装、开发工具分组、Command Palette、模式切换、移动抽屉
web/src/content/pages.ts              // 分组：课程(12) / 开发者参考(Packages/Source/Runtime Snapshot)；Live→Runtime Snapshot
web/src/styles/global.css             // 新增状态色、课程组件、Command Palette、移动端 media query
web/src/components/Graph.tsx          // 小屏 fitView / 节点缩放
web/src/components/SourceViewer.tsx   // 移动端默认 10-30 行预览 + 「打开完整源码」；顶部 Snapshot badge
web/src/components/LoopTimeline.tsx   // 兼容 ConceptFlow（可复用）
web/src/components/Mermaid.tsx        // 保留
web/src/pages/OverviewPage.tsx        // 改为 HomePage（学习首页）或首页跳转
web/src/pages/PluginGeneratorPage.tsx // 联动：前置课程卡 + 版本警告条
web/src/pages/*.tsx                   // 课程页统一套 LessonPage 骨架（除 Packages/Source/PluginGenerator/Playground/Version）
web/src/content/*.ts                  // 各课程增加 objectives/sourcePaths/summary 元数据
web/src/main.tsx                      // lazy 路由 + reduced-motion
web/vite.config.ts                    // 保持 lazy chunk
```

---

## Phase 1：课程框架（course model + progress + sidebar + 首页）

**目标：** 建立 Lesson 模型、localStorage 进度、课程化 Sidebar、上一节/下一节、学习首页。复用现有 route id，不重构路由。

### Task 1: Course 数据模型

**Files:**
- Create: `web/src/course/types.ts`
- Create: `web/src/course/lessons.ts`
- Create: `web/src/content/pages.ts`(修改，加 courseNo / courseTitle 关联)

- [ ] **Step 1: 定义类型**

```ts
// web/src/course/types.ts
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
```

- [ ] **Step 2: 定义 12 课（lesson id 与现有 route 对应）**

`web/src/course/lessons.ts`：

```ts
import type { Lesson } from './types'

export const LESSONS: Lesson[] = [
  { id: 'overview', order: 1, route: '/overview', shortTitle: 'Harness 是什么', title: 'Harness 是什么', description: 'Harness 到底是什么，它和 Agent/LLM 的关系。', objectives: ['解释 Harness 定位','列出核心子系统','找到总览源码'], sourcePaths: ['docs/architecture.md','docs/README.md'], quizId: 'overview-basic', estimatedMinutes: 8, relatedLessons: ['cordis'], relatedConcepts: ['Agent','Plugin'], relatedPackages: ['packages/core/agent-loop'], whyItMatters: 'Longsys AI 的 Agent 体系（接入 OpenMetadata、SQL 查询、业务语义）都建立在同一套「插件 + 执行循环」心智上，这里先建立全局地图。' },
  { id: 'cordis', order: 2, route: '/cordis', shortTitle: 'Plugin / Cordis', title: 'Everything is a Plugin / Cordis', description: '一切皆插件，Cordis 是宿主。', objectives: ['解释 Plugin 与 ctx','理解 Cordis 生命周期','定位 cordis 源码'], sourcePaths: ['docs/architecture.md','packages/core/cordis/**'], quizId: 'cordis-basic', estimatedMinutes: 10, relatedLessons: ['profile'], relatedConcepts: ['Plugin','ctx','Cordis'], whyItMatters: '所有 Longsys AI 能力都封装成插件挂进 Profile，理解 Cordis 就理解「能力如何被宿主启动与组合」。' },
  { id: 'profile', order: 3, route: '/profile', shortTitle: 'Profile / Bundle', title: 'Profile 与 Bundle', description: '如何把插件组装成可运行实例。', objectives: ['理解 Profile→Bundle→插件行','理解 cordis.patch.yml','定位 bundle 源码'], sourcePaths: ['packages/bundle/base/**','apps/cli/src/profile-boot.ts'], quizId: 'profile-basic', estimatedMinutes: 10, relatedLessons: ['agent-loop'], relatedConcepts: ['Profile','Bundle'], whyItMatters: '部署 Longsys AI 实例（如 openmetadata 技能栈、SQL Agent）就是在组装 Profile，这一课是配置的底层语法。' },
  { id: 'agent-loop', order: 4, route: '/agent-loop', shortTitle: 'Agent Loop', title: 'Agent Loop', description: '理解 Harness 如何在模型调用和工具执行之间循环推进任务。', objectives: ['理解 Turn 和 Step 的区别','理解模型什么时候继续调用 Tool','理解 Tool Result 如何进入下一轮','能够从源码定位 Agent Loop'], sourcePaths: ['docs/architecture.md','packages/core/agent-loop/**'], quizId: 'agent-loop-basic', estimatedMinutes: 12, relatedLessons: ['session','tools'], relatedConcepts: ['Turn','Step','Tool Call','Session Event'], relatedApis: ['ctx.agents','ctx.agentLoop'], whyItMatters: '所有 Agent 行为（查库、调 OpenMetadata、多步推理）本质都是「模型 + 工具循环」，这是调试与设计一切 Longsys AI Agent 的核心。' },
  { id: 'session', order: 5, route: '/session', shortTitle: 'Session', title: 'Session', description: '事件日志、恢复、审计。', objectives: ['理解 durable 事件','理解 Session 恢复','定位 session 源码'], sourcePaths: ['packages/core/session/**','docs/agent-lifecycle.md'], quizId: 'session-basic', estimatedMinutes: 9, relatedLessons: ['agent-loop'], relatedConcepts: ['Session Event'], relatedPackages: ['packages/core/session'], whyItMatters: 'Longsys AI 的审计与可追溯（谁问了什么、工具做了什么）依赖 Session 事件，是合规与排查的单一事实源。' },
  { id: 'tools', order: 6, route: '/tools', shortTitle: 'Tools', title: 'Tools', description: '注册、执行、权限控制。', objectives: ['理解 defineTool','理解 ctx.tools.register','理解 pre/execute/post 管线','定位 tools 源码'], sourcePaths: ['packages/core/tools/**','packages/core/agent-loop/src/tool-calls.ts'], quizId: 'tools-basic', estimatedMinutes: 11, relatedLessons: ['skills'], relatedConcepts: ['Tool','Tool Call'], relatedPackages: ['packages/core/tools'], relatedApis: ['ctx.tools.register'], whyItMatters: '把 OpenMetadata、Semantic Orchestrator、SQL 查询 API 接入 Longsys AI，本质上都需要理解这一层 —— Tool 是外部能力的标准入口。' },
  { id: 'skills', order: 7, route: '/skills', shortTitle: 'Skills', title: 'Skills', description: 'Provider → Catalog → Loader 的能力注入管线。', objectives: ['理解能力 Seam 三角色','理解 ctx.skills 分层注册','理解 catalog/loader','定位 skills 源码'], sourcePaths: ['packages/skill/**','docs/subsystems/skills.md'], quizId: 'skills-basic', estimatedMinutes: 10, relatedLessons: ['tools','subagent'], relatedConcepts: ['Skill','Catalog','Loader'], relatedPackages: ['packages/skill/skill','packages/skill/tool-skill'], relatedApis: ['ctx.skills'], whyItMatters: 'Longsys AI 不同业务 Agent 的分析策略、开发规范、领域知识，都可以通过 Skills 统一管理与注入，是「知识进系统」的入口。' },
  { id: 'subagent', order: 8, route: '/subagent', shortTitle: 'Subagents', title: 'Subagents', description: '主 Agent 如何创建子 Agent。', objectives: ['理解 ctx.subagents.start','理解 SubagentResult','定位 subagent 源码'], sourcePaths: ['packages/core/subagent/**','packages/client/ui-slots/**'], quizId: 'subagent-basic', estimatedMinutes: 9, relatedLessons: ['workflow'], relatedConcepts: ['Subagent'], relatedApis: ['ctx.subagents.start'], whyItMatters: '复杂任务拆给多个专职 Agent 并行处理，是 Longsys AI 业务场景（多数据源调研）的常用协作模式。' },
  { id: 'workflow', order: 9, route: '/workflow', shortTitle: 'Workflow', title: 'Workflow', description: '动态编排多个 Subagent 的 JavaScript orchestration script。', objectives: ['理解 script+meta+args','理解 ctx.workflowEngine.start','理解 agent/parallel/pipeline/phase','定位 workflow 源码'], sourcePaths: ['packages/workflow/**'], quizId: 'workflow-basic', estimatedMinutes: 11, relatedLessons: ['subagent'], relatedConcepts: ['Workflow'], relatedApis: ['ctx.workflowEngine.start'], whyItMatters: '复杂任务的 Subagent 并行与阶段式编排（调研→分析→总结）用 Workflow 表达，是业务级编排的标准手段。' },
  { id: 'permission', order: 10, route: '/permission', shortTitle: 'Permission', title: 'Permission / Approval / Sandbox', description: '安全、审批、沙箱。', objectives: ['理解 Approval','理解权限预设','理解 Sandbox','定位 permission 源码'], sourcePaths: ['packages/core/permission/**','packages/sandbox/**'], quizId: 'permission-basic', estimatedMinutes: 10, relatedLessons: ['tools'], relatedConcepts: ['Approval','Permission','Sandbox'], whyItMatters: '给 Longsys AI 接真实数据源前，必须先设计「什么工具需要审批、跑在什么沙箱里」，这一课决定安全边界。' },
  { id: 'web-ui', order: 11, route: '/web-ui', shortTitle: 'Web UI', title: 'Web Client / UI Slots', description: 'React Client 与 UI 插件。', objectives: ['理解 ctx.slots.register','理解 Client UI Plugin','定位 ui-slots 源码'], sourcePaths: ['packages/client/**'], quizId: 'webui-basic', estimatedMinutes: 9, relatedLessons: ['plugin-generator'], relatedConcepts: ['Client UI Plugin','UI Slots'], relatedApis: ['ctx.slots.register'], whyItMatters: '以后做 Skills 管理、Agent Hub、审计、权限页面，这一节直接相关 —— 所有管理界面都是 UI 插件挂进 Slots。' },
  { id: 'plugin-generator', order: 12, route: '/plugin-generator', shortTitle: 'Plugin Generator', title: 'Plugin Generator', description: '在线生成 Harness 插件模板。', objectives: ['理解六种插件类型','理解生成模板与官方 API 一致','把生成的模板挂进 Profile'], sourcePaths: ['packages/core/tools/**','packages/workflow/**','packages/schedule/**','packages/client/ui-slots/**'], quizId: undefined, estimatedMinutes: 10, relatedLessons: ['tools','workflow'], relatedConcepts: ['Plugin','Tool','Workflow','Schedule'], relatedApis: ['ctx.tools.register','ctx.slots.register'], whyItMatters: '把前 11 课的知识变成「能跑的插件骨架」，是 Longsys AI 能力落地的第一步。' },
]

export const lessonByRoute = (route: string) => LESSONS.find((l) => l.route === route)
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)
export const nextLesson = (id: string) => LESSONS.find((l) => l.order === (lessonById(id)?.order ?? 0) + 1)
export const prevLesson = (id: string) => LESSONS.find((l) => l.order === (lessonById(id)?.order ?? 0) - 1)
export const TOTAL_LESSONS = LESSONS.length
```

### Task 2: Progress 存储（localStorage）

**Files:**
- Create: `web/src/course/progress.ts`

- [ ] **Step 1: 读写 + 健壮降级**

```ts
// web/src/course/progress.ts
import type { LearningProgress } from './types'

const KEY = 'hll.learning.progress.v1'

function defaultProgress(): LearningProgress {
  return { version: 1, completedLessons: [], lastLesson: null, lastVisitedAt: null, quizResults: {}, snapshotCommitWhenCompleted: {} }
}

export function loadProgress(): LearningProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    const p = JSON.parse(raw) as LearningProgress
    if (p.version !== 1) return defaultProgress()   // 损坏/版本不符 → 恢复默认
    return p
  } catch {
    return defaultProgress()
  }
}

function save(p: LearningProgress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

export function isCompleted(p: LearningProgress, lessonId: string): boolean {
  return p.completedLessons.includes(lessonId)
}

export function markCompleted(p: LearningProgress, lessonId: string, snapshotCommit: string): LearningProgress {
  const next: LearningProgress = {
    ...p,
    completedLessons: p.completedLessons.includes(lessonId) ? p.completedLessons : [...p.completedLessons, lessonId],
    snapshotCommitWhenCompleted: { ...p.snapshotCommitWhenCompleted, [lessonId]: snapshotCommit },
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

export function saveQuizResult(p: LearningProgress, quizId: string, score: number, total: number): LearningProgress {
  const next = {
    ...p,
    quizResults: { ...p.quizResults, [quizId]: { score, total, completedAt: new Date().toISOString() } },
  }
  save(next)
  return next
}
```

- [ ] **Step 2: React 集成钩子 `web/src/course/useProgress.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import { loadProgress, markCompleted, recordVisit, saveQuizResult, isCompleted } from './progress'
import type { LearningProgress } from './types'
import { useData } from '../data'

export function useProgress() {
  const { meta } = useData()
  const snapshot = meta?.repoCommit ?? ''
  const [progress, setProgress] = useState<LearningProgress>(() => loadProgress())
  const [uiMode, setUiMode] = useState<'learning' | 'developer'>(() => {
    const m = localStorage.getItem('hll.ui.mode')
    return m === 'developer' ? 'developer' : 'learning'
  })

  const record = useCallback((lessonId: string) => setProgress((p) => recordVisit(p, lessonId)), [])
  const complete = useCallback((lessonId: string) => setProgress((p) => markCompleted(p, lessonId, snapshot)), [snapshot])
  const quiz = useCallback((quizId: string, score: number, total: number) => setProgress((p) => saveQuizResult(p, quizId, score, total)), [])
  const completedCount = progress.completedLessons.length
  const percent = Math.round((completedCount / 12) * 100)

  useEffect(() => { localStorage.setItem('hll.ui.mode', uiMode) }, [uiMode])

  return { progress, completedCount, percent, isCompleted: (id: string) => isCompleted(progress, id), record, complete, quiz, uiMode, setUiMode }
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/course/types.ts web/src/course/lessons.ts web/src/course/progress.ts web/src/course/useProgress.ts
git commit -m "feat(course): add lesson model and localStorage progress (V0.2 Phase 1)"
```

### Task 3: Sidebar 课程化 + 进度 + 模式切换

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/content/pages.ts`（分组：课程 / 开发者参考 / 动手）
- Modify: `web/src/styles/global.css`

- [ ] **Step 1: 重构 `web/src/content/pages.ts` 分组**

保持 `SECTIONS` 导出，但拆为课程/开发者参考/动手三组，并给每个课程页加 `lessonId`。**UX#10：Plugin Generator 只在 Sidebar 出现一次** —— 放在课程组（order 12），「动手」组不再重复出现；课程 12 学完后，LessonNavigation 文案引导进入「实践模式」（同页，Generator 本身就是动手实践）。`/playground` 保留在开发者/动手组。

```ts
export const SECTIONS: NavSection[] = [
  {
    title: '课程',
    pages: [ /* 12 个课程页：overview(/overview), cordis, profile, agent-loop, session, tools, skills, subagent, workflow, permission, web-ui, plugin-generator（order 1-12）*/ ],
  },
  {
    title: '开发者参考',
    pages: [
      { id: 'packages', route: '/packages', emoji: '📦', title: 'Packages 总览', navTitle: 'Packages', subtitle: '每一个 package 干什么' },
      { id: 'source', route: '/source', emoji: '📂', title: '源码浏览器', navTitle: '源码浏览器', subtitle: '直接阅读官方源码' },
      { id: 'runtime-snapshot', route: '/runtime-snapshot', emoji: '📸', title: 'Runtime Snapshot', navTitle: 'Runtime Snapshot', subtitle: '构建时保存的静态 Plugin 结构' },
      { id: 'version', route: '/version', emoji: '🔄', title: '版本差异', navTitle: '版本差异', subtitle: '学习快照 vs 官方 master' },
      { id: 'playground', route: '/playground', emoji: '🧪', title: 'Playground', navTitle: 'Playground', subtitle: '自己写一个 Harness Plugin' },
    ],
  },
]
```

> 注意：`/` 路由 = HomePage（首页），不再是 Overview 课程页；Lesson 1「Harness 是什么」在 `/overview`。Sidebar 课程组里带 ✓/● 状态；开发者参考组只放链接（开发模式默认展开该组）。

- [ ] **Step 2: Sidebar 渲染进度 + 课程状态**

在 App.tsx Sidebar 中，课程分组每个 item 显示 `✓`（已完成）/ `●`（当前），并在课程组上方显示进度条：

```tsx
{uiMode === 'learning' && (
  <div className="sidebar-progress">
    <div className="sp-label">学习进度</div>
    <div className="sp-bar"><div className="sp-fill" style={{ width: `${percent}%` }} /></div>
    <div className="sp-meta">{completedCount} / 12 · {percent}%</div>
  </div>
)}
```

- [ ] **Step 3: 模式切换（学习/开发）+ Snapshot footer**

顶部 topbar 加按钮组：

```tsx
<div className="mode-switch">
  <button className={uiMode === 'learning' ? 'active' : ''} onClick={() => setUiMode('learning')}>学习模式</button>
  <button className={uiMode === 'developer' ? 'active' : ''} onClick={() => setUiMode('developer')}>开发模式</button>
</div>
```

Sidebar footer 显示 Snapshot：

```tsx
<div className="sidebar-foot">
  <span className="dot" /> Harness Snapshot <b style={{ fontFamily: 'var(--mono)' }}>{gitLabel}</b>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add web/src/content/pages.ts web/src/App.tsx web/src/styles/global.css
git commit -m "feat(course): course-ized sidebar with progress and mode switch (V0.2 Phase 1)"
```

### Task 4: 学习首页（HomePage）

**Files:**
- Create: `web/src/pages/HomePage.tsx`
- Modify: `web/src/App.tsx`（`/` 路由指向 HomePage）

- [ ] **Step 1: 首页三屏结构**

`/` 路由改用 HomePage，严格三屏（UX 评审修正，去掉 12 个平铺 Card 与三特点卡堆叠）：

```
第一屏（Hero）：
  DeepSeek Harness
  从「它为什么这么设计」开始理解，而不是背 API。
  [继续学习 Agent Loop →]   ← lastLesson；无记录则 [开始学习 →](Lesson 1 /overview)
  [浏览学习路线]             ← 滚动到第二屏
  你的进度  ████████░░  4 / 12

第二屏（学习路线）：按知识结构分四组，非平铺：
  基础      01 Harness 是什么 / 02 Plugin / Cordis / 03 Profile
  执行核心   04 Agent Loop / 05 Session / 06 Tools / 07 Skills
  Agent 能力 08 Subagents / 09 Workflow / 10 Permission
  扩展开发   11 Web UI / 12 Plugin Generator
  每个条目：order + title + 状态（✓已完成/●正在学习/未开始）+ 时长

第三屏（为什么用这个网站）：只留三张卡
  Concept First / Source Driven / Version Aware
```

`继续学习` → `progress.lastLesson`；`开始学习` → `/overview`。顶部放 VersionStatusCard（轻量小 Badge 样式，见 Phase 5）。

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/HomePage.tsx web/src/App.tsx
git commit -m "feat(course): redesign learning home page (V0.2 Phase 1)"
```

---

## Phase 2：学习页面统一组件（6 段结构）

**目标：** 所有核心课程页统一为 6 段：一句话理解 → 你将学会 → 动态执行图 → 关键概念 → 真实源码证据 → Checkpoint（+ LessonNavigation 首尾）。

### Task 5: Lesson 组件集（4 必选 + 2 可选，渐进式信息披露）

**Files:**
- Create: `web/src/components/lesson/LessonHeader.tsx`（一句话理解）
- Create: `web/src/components/lesson/LearningObjectives.tsx`
- Create: `web/src/components/lesson/SourceEvidence.tsx`
- Create: `web/src/components/lesson/LessonNavigation.tsx`
- Create: `web/src/components/lesson/ConceptFlow.tsx`
- Create: `web/src/components/lesson/Checkpoint.tsx`
- Create: `web/src/components/lesson/RelatedLinks.tsx`（whyItMatters + 相关内容）
- Create: `web/src/components/lesson/LessonPage.tsx`（骨架 + 顺序编排）

- [ ] **Step 1: LessonHeader + LearningObjectives**

LessonHeader：显示 `emoji + title + subtitle + 一句话理解（≤3 行）+ 时长徽章 + [第 N/12 课]`，第一屏不出现源码。UX 评审强调：课程页顶部不要一堆 package/path/API。
LearningObjectives：`学完这一节，你应该能够：✓ ...`（3-5 条）。

```tsx
// LessonHeader.tsx
interface Props { title: string; emoji: string; subtitle: string; summary: string; order?: number; minutes?: number }
export default function LessonHeader({ title, emoji, subtitle, summary, order, minutes }: Props) {
  return (
    <div className="lesson-header">
      <span className="tag"><Sparkles size={12} /> 交互式课程</span>
      <h1><span>{emoji}</span> {title}</h1>
      <p className="sub">{subtitle}</p>
      <div className="lesson-meta">
        {order && <span className="badge">第 {order}/12 课</span>}
        {minutes && <span className="badge">{minutes} min</span>}
      </div>
      <div className="lesson-summary">{summary}</div>
    </div>
  )
}
```

- [ ] **Step 2: SourceEvidence**

展示：`📄 官方源码` + 文件路径 + `Lines a-b` + `Commit 47f9438` + 按钮 `[查看源码][在 Source Explorer 打开][打开 GitHub]`，只展示最相关的 10-30 行。实现：读 chunk 内容，截取行区间；`打开 GitHub` 跳 `https://github.com/deepseek-ai/deepseek-harness/blob/{commit}/{path}#L{a}-L{b}`；`在 Source Explorer 打开` 跳 `/source?path=...`；`查看源码` 用 `loadSourceContent` 现取。**UX#8：初学者模式默认折叠，开发者模式默认展开更多。**

```tsx
// SourceEvidence.tsx
interface Evidence { path: string; commit?: string; lineStart?: number; lineEnd?: number; note?: string }
interface Props { evidences: Evidence[]; compact?: boolean }
// 每个 evidence 渲染一个折叠卡片：头部(路径+commit+行号+按钮)，展开后显示 10-30 行代码（<pre>）
```

- [ ] **Step 3: LessonNavigation**

```tsx
interface Props { lessonId: string; }
// ← 上一节（prevLesson）  ✓ 标记已完成/已完成  → 下一节（nextLesson）
// 标记完成调用 complete(lessonId)，按钮变「已完成」，并 show 全局进度已更新
// Lesson 12 完成后文案：「已完成全部课程，进入实践：继续使用本页 Plugin Generator 生成你的第一个插件」
```

- [ ] **Step 4: ConceptFlow（动态执行图）**

复用现有 `loopSteps` + `LoopTimeline` 的播放/暂停/单步/重置能力，但强化：
- 每步对应右侧 explanation panel（现有 LoopTimeline 底部已有 desc + SourceChips，抽出成独立 panel 组件）
- 步骤类型 `gate`（分支决策）渲染菱形分支提示（Tool Call? Yes/No）—— 先用纯 CSS 箭头图（User→Turn→Step→LLM→Tool Call?→[Yes:Tool→Result→Next Step] / [No:Final]），降低对 React Flow 的依赖，视觉更 Linear/Vercel 风
- 支持 `prefers-reduced-motion`：动画关闭时仍可单步
- 播放间隔 600-900ms
- **UX#7：动画只解释运行机制，不做装饰**

实现：新建 `ConceptFlow.tsx`，内部把 `LoopStep[]` 渲染为横向轨道 + 控制条（复用 `loop-controls` 样式），下方 `active` 讲解面板展示 `desc + 对应源码`。

- [ ] **Step 5: RelatedLinks（whyItMatters + 相关内容）**

```tsx
// RelatedLinks.tsx —— 每课底部，全部由 lesson metadata 驱动，非 AI
interface Props { lesson: Lesson }
// ① 为什么值得学（whyItMatters）—— 加粗强调块「这东西以后有什么用？」
// ② 继续学习（relatedLessons）
// ③ 相关概念（relatedConcepts）
// ④ 相关 Package（relatedPackages → /packages?dir=）
// ⑤ 相关 API（relatedApis → ApiPopover/搜索）
```

- [ ] **Step 6: Commit**

```bash
git add web/src/components/lesson/
git commit -m "feat(lesson): unified 6-section lesson components (V0.2 Phase 2)"
```

### Task 6: LessonPage 骨架 + 接入课程页

**Files:**
- Create: `web/src/components/lesson/LessonPage.tsx`
- Modify: 各课程页（Overview/Cordis/Profile/AgentLoop/Session/Tools/Skills/Subagent/Workflow/Permission/WebUI）

- [ ] **Step 1: LessonPage 组合（4 必选 + 2 可选，UX 评审修正）**

UX 修正：不要机械统一 6 段。**4 个必选模块**（渐进式）：① 一句话理解 → ② 你将学会 → ③ 互动区（动态图/试试看）→ ④ Quiz；**2 个可选模块**：⑤ 关键概念（Concept Cards）⑥ 真实源码证据（SourceEvidence）。以及公共的 RelatedLinks + LessonNavigation 首尾。

```tsx
// LessonPage.tsx —— 课程页统一骨架
interface LessonContent {
  lessonId: string
  emoji: string
  title: string
  subtitle: string
  summary: string            // 一句话理解
  objectives: string[]       // 复用 content.learn
  flowSteps?: LoopStep[]     // 动态执行图数据（可选模块，agent-loop 用 loopSteps；其他页可为 null 则跳过）
  tryIt?: ReactNode          // 「试试看」互动（可选，渐进到 Phase 3/后续）
  concepts: Concept[]        // 关键概念（可选模块，可空）
  evidences: Evidence[]      // 真实源码证据（由 content.nodes sources + content.packages 生成；UX#8：默认折叠）
  related?: RelatedLinksData
}
// 渲染顺序（渐进式信息披露 UX#3）：
// 1 LessonHeader(一句话理解)         [必选]
// 2 LearningObjectives(你将学会)     [必选]
// 3 ConceptFlow(动态执行图) / tryIt   [可选，若提供]
// 4 关键概念 ConceptCards            [可选，concepts 非空才显示]
// 5 SourceEvidence(真实源码证据)      [可选，默认折叠，开发者模式展开]
// 6 Checkpoint(quiz)                [必选，若 lesson.quizId 存在]
// 7 RelatedLinks(为什么值得学 + 相关内容)
// 8 LessonNavigation(上一节/完成/下一节)
// 版本提示（VersionStatusBanner）仅在开发者模式显示为小 Badge（UX#9）
```

- [ ] **Step 2: 课程页逐个接入**

对每个课程页，保留原有架构图/时序图等富内容，但外面包 `LessonPage` 骨架，并把现有 `PageHero` 替换为 `LessonHeader + LearningObjectives`。以 AgentLoopPage 为例，改为：

```tsx
<LessonPage content={/* lesson content object */}>
  {/* 保留：LoopTimeline 可作为 ConceptFlow 数据源；Mermaid；KnowledgeGraphPage */}
</LessonPage>
```

> 注意用户要求「不要删除现有页面」「不要为了课程系统大规模重构路由」。因此：LessonPage 提供骨架；各页在骨架内保留原有架构图、时序图、图谱内容。抽象一个 helper `buildLessonContent(page: PageContent, lesson: Lesson)`（在 `web/src/course/lessons.ts`），从现有 PageContent 提取 summary/objectives/concepts/evidences/whyItMatters，避免重复维护。

- [ ] **Step 3: 每页底部 LessonNavigation + 标记完成联动**

- [ ] **Step 4: Commit**

```bash
git add web/src/components/lesson/LessonPage.tsx web/src/pages/ web/src/course/
git commit -m "feat(lesson): wrap course pages in unified lesson skeleton (V0.2 Phase 2)"
```

---

## Phase 3：Checkpoint（Quiz）

**目标：** 每课 2-4 道题；单选/多选/判断；提交后显示对错与解释（含源码证据）；localStorage 记分；损坏时恢复默认。

### Task 7: Quiz 数据

**Files:**
- Create: `web/src/course/quizzes.ts`

- [ ] **Step 1: 定义 Quiz/Question 类型（并入 course/types.ts）并编写题目**

`web/src/course/types.ts` 增加：

```ts
export interface Quiz { id: string; lessonId: string; questions: Question[] }
export interface Question {
  id: string
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: { id: string; text: string }[]
  answer: string[]
  explanation: string
  sourcePaths: string[]
}
```

`web/src/course/quizzes.ts`：每课一个 quiz（除 plugin-generator）。所有题目答案必须能从当前快照源码验证。以 `skills-basic` 为例：

```ts
export const QUIZZES: Quiz[] = [
  {
    id: 'skills-basic', lessonId: 'skills',
    questions: [
      {
        id: 'skills-q1', type: 'single',
        question: 'ctx.skills 的主要角色是什么？',
        options: [
          { id: 'a', text: '直接执行 LLM' },
          { id: 'b', text: 'Skill Registry / Provider 入口' },
          { id: 'c', text: '数据库' },
          { id: 'd', text: 'Web UI Router' },
        ],
        answer: ['b'],
        explanation: 'ctx.skills 是技能注册表/Provider 入口（SkillRegistry 服务），用于注册、按作用域查询、列出技能目录。',
        sourcePaths: ['packages/skill/skill/src/index.ts'],
      },
      // ... 其余题目：single/multiple/boolean 混合
    ],
  },
  // overview/cordis/profile/agent-loop/session/tools/subagent/workflow/permission/webui 各 1 个 quiz
]

export const quizByLesson = (lessonId: string) => QUIZZES.find((q) => q.lessonId === lessonId)
```

> 编写题目时须以现有 `web/src/content/*.ts` 里已核实的源码事实为依据（这些内容已对照快照源码验证过）。

- [ ] **Step 2: Checkpoint 组件**

`web/src/components/lesson/Checkpoint.tsx`：

```tsx
interface Props { quiz: Quiz }
// 每题：题目 + options（radio/checkbox）；提交 → 判分
// single: 单选；boolean: 两个选项 正确/错误；multiple: checkbox 全对才算对
// 提交后：
//   答对 → ✅ 正确 + explanation + sourcePaths（SourceEvidence 按钮）
//   答错（第一次）→ ❌ 还差一点 + explanation（不直接给正确答案）
//   答错（第二次）→ 出现「查看答案 + 源码解释」按钮（UX#11），点击后显示正确答案 + 源码解释
// 顶部显示得分；调用 quiz(quizId, score, total)
// sourcePaths 若在新版本变化 → 显示「⚠ 本题对应源码在新版本中有变化，建议重新验证。」
```

每题内部记录 `attempts`：第一次提交且错误 → 提示「还差一点」；再次提交仍错 → 解锁「查看答案」按钮。

- [ ] **Step 3: 接入 LessonPage 第 7 段**

- [ ] **Step 4: Commit**

```bash
git add web/src/course/types.ts web/src/course/quizzes.ts web/src/components/lesson/Checkpoint.tsx web/src/components/lesson/LessonPage.tsx
git commit -m "feat(checkpoint): add quiz engine with localStorage scoring (V0.2 Phase 3)"
```

---

## Phase 4：搜索系统（Command Palette + Search Index + API Symbol）

**目标：** Ctrl+K Command Palette；构建期生成轻量 search index（概念/文档/包/API/源码）；TS AST 提取 API Symbol；ranking 打分；中文 aliases。

### Task 8: Scanner 扩展：search index + API Symbol

**Files:**
- Modify: `scripts/scan.ts`
- Create: `generated/search/`（产物）

- [ ] **Step 1: API Symbol 扫描（TS AST，三级分级，UX 评审修正）**

在 scan.ts 中新增（使用 TypeScript Compiler API；tsx 已带 typescript 依赖）：

```ts
import ts from 'typescript'

// 符号三级分级（UX#12）：
// 1. official-surface: 官方开发者应使用的 Harness API —— 常见 ctx.xxx / ctx.xxx.register / ctx.xxx.use 模式，人工白名单优先
// 2. exported-symbol: export function/class/interface/type（会出现在搜索结果但权重低于 official-surface）
// 3. internal-symbol: 非 export 的顶层声明 / 私有成员 —— 默认不出现在普通搜索，仅开发模式「源码符号」tab 可查

const OFFICIAL_CTX_APIS = [
  'ctx.tools.register', 'ctx.tools.get', 'ctx.tools.unregister',
  'ctx.skills', 'ctx.slots.register', 'ctx.agents', 'ctx.agentLoop',
  'ctx.subagents.start', 'ctx.workflowEngine.start', 'ctx.llm', 'ctx.session',
  'ctx.systemPrompt', 'ctx.permission', 'ctx.sandbox', 'ctx.bundles', 'ctx.plugins',
]

function extractApiSymbols(): ApiSymbol[] {
  const out: ApiSymbol[] = []
  for (const f of files) {
    if (!/\.(ts|tsx)$/.test(f.source_path)) continue
    const text = readText(f.source_path)
    if (!text) continue
    const sf = ts.createSourceFile(f.source_path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    // export 声明 → exported-symbol
    sf.forEachChild((node) => {
      if (ts.isFunctionDeclaration(node) && node.name && hasModifier(node, 'export')) {
        out.push({ symbol: node.name.text, kind: 'exported-symbol', ... })
      }
      // ... 同处理 class/interface/type
    })
    // ctx.xxx 模式匹配 → official-surface（命中 OFFICIAL_CTX_APIS 或 /ctx\.[a-z]\w*(\.\w+)?/)
  }
  // 把匹配到的 ctx API 统一提升为 official-surface 并去重
  return out
}

interface ApiSymbol {
  symbol: string
  kind: 'official-surface' | 'exported-symbol' | 'internal-symbol' | 'function' | 'class' | 'interface' | 'type'
  package: string | null
  sourcePath: string
  line: number
  signature: string
  lessonIds: string[]   // 用 sourcePath 前缀匹配 LESSONS 的 sourcePaths
}
```

**降噪策略（UX 评审修正）：** 全仓扫描可能产出数千 Symbol。因此：
- 只收录 `packages/**/src/**` 与 `docs/**` 下的符号，跳过 examples/vendor/python/apps 模板
- `internal-symbol` 不进普通搜索结果（只进开发模式「源码符号」tab）
- `exported-symbol` 结果按 package 合并去重，同名符号保留一个代表
- `official-surface`（ctx.xxx）人工白名单保证优先级

lessonIds 匹配：`LESSONS` 的 `sourcePaths` 与 `api.sourcePath` 做前缀匹配，命中则写入该 lesson id（如 `packages/core/tools/**` → tools）。

- [ ] **Step 2: 生成 search 索引文件**

```
generated/search/concepts.json      // 来源：course lessons + 各 content 的 concepts（title/aliases/description/lessonId/route）
generated/search/docs.json          // 来源：docs-index.json（title/path/headings/summary/keywords，summary=前几段）
generated/search/packages.json      // 来源：packages.json（name/dir/description/capabilityFamily）
generated/search/api-symbols.json   // 来自 Step 1
generated/search/source-index.json  // 来源：repo-index.json（source_path/title/source_type 精简）
generated/search/version.json       // { snapshotCommit, fileCommits: { path: hash } }（供 /version diff）
```

concepts.json 中文 aliases（手工维护，并入 lessons.ts 的 lesson.concepts 或独立 `web/src/course/aliases.ts` 供 build 期复用）。concepts 来源在运行时由 course 数据生成，避免两处维护：**方案：search/concepts.json 由 build 期脚本从 `web/src/course/lessons.ts` + `web/src/content/*.ts` 提取**——但 scan.ts 是 node 脚本，读取 tsx 模块不便。**简化**：concepts 索引放在前端运行时由 `LESSONS` + content 构建（见 Task 9），扫描器只负责 docs/packages/api-symbols/source-index/version。

- [ ] **Step 3: 产物落盘**

复用 `writeArtifact`，写入 `search/` 子目录；同时同步到 `web/public/data/search/`。

- [ ] **Step 4: 验证 + Commit**

```bash
pnpm generate
# 确认 generated/search/ 下 5 个文件存在且非空
git add scripts/scan.ts generated/search web/public/data/search
git commit -m "feat(search): add search index and TS AST API symbol scan (V0.2 Phase 4)"
```

### Task 9: Command Palette + ranking + 前端搜索数据

**Files:**
- Create: `web/src/data/searchIndex.ts`
- Create: `web/src/components/search/*`（CommandPalette/SearchInput/SearchTabs/SearchResult/SearchEmpty/useSearch）
- Modify: `web/src/App.tsx`（Ctrl+K 监听 + 顶部 🔍 按钮 + 移动端全屏）

- [ ] **Step 1: searchIndex.ts 数据加载**

```ts
export interface SearchRecord {
  id: string
  type: 'concept' | 'doc' | 'package' | 'api' | 'source'
  title: string
  aliases?: string[]
  description?: string
  route?: string        // 跳转路由
  package?: string
  sourcePath?: string
  line?: number
  signature?: string
  lessonIds?: string[]
}
export async function loadSearchIndex(): Promise<SearchRecord[]> {
  // fetch data/search/*.json，合并概念（前端构建）、docs、packages、api-symbols、source-index
  // 失败降级：仅用页面标题 + package metadata（graceful degradation）
}
```

- [ ] **Step 2: ranking 打分（概念 > 公共 API > Package/Docs > Source，UX#12 修正）**

`web/src/components/search/useSearch.ts`：

```ts
function score(rec: SearchRecord, q: string): number {
  const s = q.trim().toLowerCase()
  const hit = (v?: string) => (v ?? '').toLowerCase()
  const title = hit(rec.title)
  if (title === s) return 100                // Exact title（概念）
  if (rec.type === 'concept' && title.startsWith(s)) return 90   // 概念 prefix 最高
  if (rec.type === 'api' && rec.tier === 'official-surface') {
    if (title === s) return 95               // 公共 API exact
    if (title.startsWith(s)) return 85
  }
  if (rec.aliases?.some((a) => hit(a) === s)) return 90
  if (title.startsWith(s)) return 80
  if (rec.type === 'package' && hit(rec.package).startsWith(s)) return 80
  if (rec.aliases?.some((a) => hit(a).includes(s))) return 75
  if (rec.type === 'api' && rec.tier === 'exported-symbol' && title.includes(s)) return 60
  if (rec.signature && hit(rec.signature).includes(s)) return 70
  if (rec.type === 'doc' && rec.description && hit(rec.description).includes(s)) return 55
  if (rec.description && hit(rec.description).includes(s)) return 50
  if (rec.sourcePath && hit(rec.sourcePath).includes(s)) return 30   // Source 路径最低
  return 0
}
// 结果按 score 降序，>0 才展示；internal-symbol 不进入此打分（普通搜索过滤掉）
// 别名含中文，简单 normalized contains
```

**预期**（搜索 `skill`，UX 评审期望）：`🧠 Skills(概念) > 🔧 ctx.skills(official API) > 📦 dsh-skill(Package) > 📚 Skills subsystem(Docs) > 💻 index.ts(Source)` —— 而不是优先展示 `skill-abc.ts` 这类源码路径。

**概念索引（前端构建）：** concepts 记录来自 `LESSONS` + `lesson.relatedConcepts` + content concepts，type='concept'，含 aliases（Agent Loop/Agent循环/执行循环/智能体循环；Skill/技能/能力包；Workflow/工作流/编排/多Agent编排；等）。前端在 `loadSearchIndex` 时本地组装，不依赖扫描器。

- [ ] **Step 3: CommandPalette 交互**

```tsx
// 打开：Ctrl/Cmd+K（keydown 监听，阻止默认）或点击顶部 🔍
// 全屏 overlay：搜索框 + tabs（全部/概念/文档/Package/API/源码）
// 键盘：↑↓ 选择、Enter 打开、Esc 关闭、Tab 切 tab
// 结果渲染 SearchResult（icon 按 type：🧠 概念 / 📚 文档 / 📦 包 / 🔧 API / 💻 源码）
// 空结果 SearchEmpty
// 移动端全屏（见 Phase 6）
```

- [ ] **Step 4: 源码引用体验（ApiPopover）**

`web/src/components/ApiPopover.tsx`：当文本中命中 `api-symbols` 里存在的 symbol（如 `ctx.tools.register`）时，点击出现 popover：`类型 Harness API / 所属 Tools / Package @deepseek-ai/... / Source packages/...` + `[打开源码][学习 Tools]`。由 SourceViewer 与课程页文本中动态渲染（用 `renderRichText` helper 把 `` `ctx.xxx` `` 包进 `<ApiPopover>`）。

- [ ] **Step 5: Commit**

```bash
git add web/src/data/searchIndex.ts web/src/components/search/ web/src/components/ApiPopover.tsx web/src/App.tsx
git commit -m "feat(search): command palette with ranked cross-type search (V0.2 Phase 4)"
```

---

## Phase 5：Version Awareness（snapshot vs 官方最新）

**目标：** 全站绑定 snapshot commit；新增 /version 差异页；浏览器访问 GitHub API 查官方 master；失败降级；课程页版本提示。

### Task 10: VersionStatusCard + GitHub API 查询

**Files:**
- Create: `web/src/data/version.ts`
- Create: `web/src/components/VersionStatusCard.tsx`

- [ ] **Step 1: version.ts**

```ts
export interface VersionInfo {
  snapshotCommit: string | null
  officialMaster: string | null
  changedFiles: string[] | null   // 相对 snapshot 变化文件
  status: 'unknown' | 'current' | 'outdated'
  checkedAt: string | null
}

const KEY = 'hll.version.cache.v1'
const SNAPSHOT = /* 由 meta.repoCommit 提供 */

export async function checkOfficialMaster(): Promise<VersionInfo> {
  try {
    const res = await fetch('https://api.github.com/repos/deepseek-ai/deepseek-harness/commits/master')
    if (!res.ok) throw new Error(String(res.status))
    const j = await res.json()
    const official = (j.sha ?? '').slice(0, 7)
    // 用 GitHub API 比较两个 commit 的差异（不依赖 token）：
    // https://api.github.com/repos/deepseek-ai/deepseek-harness/compare/{snapshot}...{official}?per_page=100
    const cmp = await fetch(`https://api.github.com/repos/deepseek-ai/deepseek-harness/compare/${snapshot}...${official}`)
    const changed = cmp.ok ? (await cmp.json()).files?.map((f) => f.filename) ?? [] : []
    return { snapshotCommit: snapshot, officialMaster: official, changedFiles: changed, status: snapshot === official ? 'current' : 'outdated', checkedAt: new Date().toISOString() }
  } catch {
    return { snapshotCommit: snapshot, officialMaster: null, changedFiles: null, status: 'unknown', checkedAt: null }
  }
}
// 缓存到 localStorage，TTL 1 小时；失败绝不抛错，返回 status:'unknown'
```

> 注意：GitHub 匿名 API 速率限制 60 次/小时；缓存 + TTL 必须做。失败显示「官方版本检查暂不可用」，不影响网站。

- [ ] **Step 2: VersionStatusCard（轻量、安静，UX#9 修正）**

UX 评审修正：不要给初学者巨大的橙色 Warning。改为**安静的小 Badge 样式**：

```tsx
// 顶部/首页展示为紧凑小条：
// DeepSeek Harness
// 学习快照 47f9438  |  官方 master a8b32c1  |  ⚠ 上游已有更新   ← 小号灰阶文字 + 小 Badge
// 点击 → /version（详情页）
```

状态显示：
- `✓ 当前`：灰阶小绿点
- `⚠ 上游已有更新`：小号橙色 Badge（不是大横幅）
- `官方版本检查暂不可用`：灰阶小字

仅 Plugin Generator 等生成代码可能失效处使用明显警告（见 Phase 7）。

- [ ] **Step 3: Commit**

```bash
git add web/src/data/version.ts web/src/components/VersionStatusCard.tsx
git commit -m "feat(version): snapshot vs official master status card (V0.2 Phase 5)"
```

### Task 11: /version 差异页 + 课程页版本提示

**Files:**
- Create: `web/src/pages/VersionPage.tsx`
- Create: `web/src/components/VersionStatusBanner.tsx`
- Modify: `web/src/App.tsx`（注册 /version 路由）
- Modify: `web/src/components/lesson/LessonPage.tsx`（版本提示条）

- [ ] **Step 1: VersionPage**

```
当前学习快照 47f943859b（扫描时间 2026-08-16）
官方 master xxxxxxx
变化：17 files changed
按学习主题分类（非硬编码）：
  Agent Loop    2 files changed   ← changedFiles ∩ lesson.sourcePaths
  Skills        4 files changed
  Workflow      6 files changed
  Web UI        5 files changed
  ...
[查看影响文件] → 展开 changedFiles 列表（packages/skill/...）
```

匹配逻辑：对每个 lesson，`changedFiles.filter((f) => lesson.sourcePaths.some((p) => p.endsWith('/**') ? f.startsWith(p.slice(0,-3)) : f.startsWith(p) || f === p))`。命中>0 → ⚠ 变化 N 个文件；否则 ✓ 未发现变化。

- [ ] **Step 2: VersionStatusBanner（课程页小 Badge，UX#9 修正）**

UX 评审修正：课程页版本提示不要每次给大橙色 Warning。改为**每课标题旁的小号 Badge + 点击展开**：

```tsx
// 课程页 LessonHeader 旁：
// Skills  ⟳ 4 files changed        ← 小号灰/橙 Badge（一行，不占横幅）
// 点击才展开：
//   当前课程：47f9438
//   官方最新：xxxxxxx
//   关联源码变化：
//     skill/src/index.ts
//     tool-skill/...
//   [查看变化] → /version
```

仅 Plugin Generator 等生成代码可能失效处使用明显警告（见 Phase 7）。初学者模式只显示小 Badge；开发者模式才默认展开更多 Diff 信息（UX#8）。

- [ ] **Step 3: 全站 Snapshot 贯穿**

SourceViewer 顶部加 `Snapshot 47f9438`；Sidebar footer 已加；课程页 SourceEvidence 已含 commit。

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/VersionPage.tsx web/src/components/VersionStatusBanner.tsx web/src/App.tsx web/src/components/lesson/LessonPage.tsx web/src/components/SourceViewer.tsx
git commit -m "feat(version): version diff page and per-lesson version banner (V0.2 Phase 5)"
```

---

## Phase 6：Mobile + Runtime Snapshot 改名 + 性能

**目标：** 900px 断点抽屉、移动端全屏搜索、学习页单列、源码默认 10-30 行预览、React Flow 小屏适配、lazy 路由、reduced-motion。

### Task 12: Runtime Snapshot 改名 + Plugin Studio roadmap

**Files:**
- Create: `web/src/pages/RuntimeSnapshotPage.tsx`
- Create: `web/src/components/RoadmapModal.tsx`
- Delete: `web/src/pages/LivePage.tsx`
- Modify: `web/src/App.tsx`、`web/src/content/pages.ts`

- [ ] **Step 1: RuntimeSnapshotPage**

复用 LivePage 内容，改名「Runtime Snapshot」：`这里展示的是构建 Learning Lab 时保存的 Harness Plugin / Package / Runtime 静态结构。它不是当前机器上的实时 Harness Runtime。` + 展示 Plugin Tree / 配置结构（可复用现有 PluginGenerator 的 cordis.patch.yml 讲解或 Packages 图）+ 页面底部「未来能力：Harness Plugin Studio（实际 Runtime / Plugin 加载 / Hot Reload / Tool 调试 / Session Event / Permission / Runtime Trace）」+ 按钮「了解 Plugin Studio」→ 打开 RoadmapModal（不访问不存在 URL）。

- [ ] **Step 2: 路由/导航替换** `/live` → `/runtime-snapshot`（保留 `/live` 301 重定向亦可，或直接替换）。

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/RuntimeSnapshotPage.tsx web/src/components/RoadmapModal.tsx web/src/App.tsx web/src/content/pages.ts
git rm web/src/pages/LivePage.tsx
git commit -m "feat(runtime): rename Live Harness to Runtime Snapshot with Plugin Studio roadmap (V0.2 Phase 6)"
```

### Task 13: 移动端适配 + 性能 + reduced-motion

**Files:**
- Modify: `web/src/styles/global.css`（@media max-width:900px + 移动端组件样式）
- Modify: `web/src/App.tsx`（移动抽屉 ☰、顶部 🔍、学习页单列）
- Modify: `web/src/components/SourceViewer.tsx`（移动端默认 10-30 行 + 「打开完整源码」懒加载 Monaco）
- Modify: `web/src/components/Graph.tsx`（小屏 fitView / 节点缩放 / horizontal scroll / pan）
- Modify: `web/src/components/lesson/ConceptFlow.tsx`（reduced-motion）
- Modify: `web/src/main.tsx`（lazy routes）
- Modify: `web/src/components/search/CommandPalette.tsx`（移动端全屏）

- [ ] **Step 1: CSS 断点**

`@media (max-width: 900px)`：`.sidebar` 变 drawer（transform translateX，`.sidebar.open` 显示，遮罩 `.drawer-mask` 点击关闭）；`.app-shell` 允许滚动；`.content` 单列（移除 Source + Content 双栏）；`.mode-switch` 收纳；顶部加 `.menu-btn`。

- [ ] **Step 2: SourceViewer 移动端预览**

`useResponsive().isMobile`（matchMedia `(max-width: 900px)`）。移动端：默认不加载 Monaco，用 `<pre>` 渲染前 10-30 行 + 按钮「打开完整源码」→ 点击后才 `dynamic import` Monaco。

- [ ] **Step 3: Graph 小屏**

React Flow：`fitView`、`minZoom`、`nodesDraggable` 小屏 true、节点宽度缩小（`.react-flow__node` media query）。

- [ ] **Step 4: reduced-motion**

`window.matchMedia('(prefers-reduced-motion: reduce)')` → ConceptFlow 禁用自动播放（保留单步）；全局动画时长 0。

- [ ] **Step 5: lazy 路由**

main.tsx/App.tsx 用 `React.lazy(() => import('./pages/...'))` 包裹所有页面；Monaco 已 manualChunk；`/version` 页在进入时才请求 GitHub API。

- [ ] **Step 6: Commit**

```bash
git add web/src/styles/global.css web/src/App.tsx web/src/components/SourceViewer.tsx web/src/components/Graph.tsx web/src/components/lesson/ConceptFlow.tsx web/src/main.tsx web/src/components/search/CommandPalette.tsx web/src/hooks/useResponsive.ts
git commit -m "feat(mobile): responsive drawer, fullscreen search, mobile code preview, reduced-motion (V0.2 Phase 6)"
```

---

## Phase 7：Plugin Generator 联动

**目标：** Generator 与 Learning 联动：前置课程卡、生成后「为什么用 ctx.tools.register」、snapshot 版本警告。

### Task 14: Plugin Generator 联动

**Files:**
- Modify: `web/src/pages/PluginGeneratorPage.tsx`
- Modify: `web/src/content/plugin-templates.ts`（增加 sourcePaths 元数据，用于版本匹配）

- [ ] **Step 1: 前置课程卡**

选中类型（如 Tool Plugin）后，右侧/上方显示「在生成前，你应该了解：✓ Plugin ✓ Tools ○ Permission」+ `[学习 Tools][学习 Plugin]`。数据来自 LESSONS 的 relatedApis/relatedConcepts。

- [ ] **Step 2: 生成后联动**

生成后显示「下一步理解：为什么使用 ctx.tools.register？→ [查看 Tools 课程]」「查看官方源码：packages/core/tools/...」。

- [ ] **Step 3: 版本警告**

若 Generator 模板对应的 sourcePaths 与官方 latest 变化：顶部显示 `⚠ 当前 Generator 模板基于 Harness snapshot 47f9438。官方对应 API 已发生变化，建议查看 Diff。`（复用 version.ts 数据）。

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/PluginGeneratorPage.tsx web/src/content/plugin-templates.ts
git commit -m "feat(plugin-gen): link plugin generator to lessons and version status (V0.2 Phase 7)"
```

---

## Phase 8：测试 + 构建验证 + 最终交付文档

**目标：** 关键路径验证 + 生产构建 + 交付清单输出。

### Task 15: 测试与验收

**Files:**
- Modify: 各实现文件（按测试结果修复）

- [ ] **Step 1: 进度/Quiz/Search/移动端验证清单（人工+脚本）**

```
1. 完成课程 → 刷新 → 状态仍在 → 下一节正确
2. Quiz：正确/错误/multiple/score persist
3. 搜索：skill/workflow/ctx.tools.register/session/permission 排序合理
4. 移动端 375/768/1024：sidebar 抽屉、搜索全屏、学习页单列、源码预览、React Flow、Plugin Generator
5. GitHub Pages：#/skills #/agent-loop #/plugin-generator #/version 刷新不 404
6. reduced-motion：动画关闭仍可单步
```

- [ ] **Step 2: 构建验证**

```bash
pnpm typecheck
pnpm build
pnpm preview   # 手工抽查关键路由
```

- [ ] **Step 3: 最终交付文档输出（回复用户时列出 12 项）**

1. V0.2 新增能力 / 2. 新目录结构 / 3. Course 数据模型 / 4. localStorage schema / 5. Search Index schema / 6. API Scanner 设计 / 7. Version Diff 设计 / 8. 修改文件列表 / 9. 新增组件列表 / 10. Mobile 适配说明 / 11. 测试结果 / 12. pnpm 命令。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: validate V0.2 phases and fix edge cases"
```

---

## Self-Review

**1. Spec coverage（对照用户 27 节）：**
- 一/整体定位 → Phase 1-2（Course + 6 段结构）
- 二/课程系统 → Task 1
- 三/全局进度 → Task 2-4（localStorage `hll.learning.progress.v1`、首页进度、继续学习、标记完成、不自动学完）
- 四/Sidebar 课程导航 → Task 3（✓/●、进度条、开发者工具分组）
- 五/6 段结构 → Phase 2（LessonHeader/Objectives/ConceptFlow/SourceEvidence/Checkpoint/LessonNavigation）
- 六/Quiz 数据模型 → Task 7（含「源码变化提示」）
- 七/快照 vs 官方 → Phase 5（VersionStatusCard、/version、课程页提示、GitHub API 降级）
- 八/Snapshot 贯穿 → Task 11 Step 3（footer/SourceViewer/SourceEvidence）
- 九/Live 改名 → Task 12（Runtime Snapshot + Plugin Studio roadmap）
- 十/Command Palette → Task 9（Ctrl+K、键盘、tabs、全屏）
- 十一/搜索索引 → Task 8（generated/search/*，含 API Symbol AST 扫描、ctx.xxx 识别）
- 十二/ranking → Task 9 Step 2（打分表照抄）
- 十三/中文 aliases → Task 9 Step 2 + lessons.ts（Agent Loop/技能/工作流 aliases）
- 十四/移动端 → Task 13（900px drawer、全屏搜索、单列、源码 10-30 行、React Flow、reduced-motion）
- 十五/首页 → Task 4
- 十六/学习/开发模式 → Task 3（hll.ui.mode）
- 十七/源码引用体验 → Task 9 Step 4（ApiPopover）
- 十八/页面关联知识 → Task 5 RelatedLinks（lesson metadata 驱动，非 AI）
- 十九/Generator 联动 → Phase 7
- 二十/视觉规范 → global.css 状态色（完成绿/当前蓝/注意橙/源码紫）、动画时长
- 二十一/性能 → Task 13 Step 5（lazy、Monaco 懒加载、version 延迟请求）
- 二十二/降级 → 各 Task 内（GitHub API/源码缺失/损坏 storage/搜索失败）
- 二十三/测试 → Task 15
- 二十四/不做 → 已排除
- 二十五/开发顺序 → Phase 1-7 对应
- 二十六/验收闭环 → 首页→开始学习→课程→搜索→Generator 全链路
- 二十七/交付 → Task 15 Step 3

**2. 占位扫描：** 无 TBD/TODO 占位；所有类型/函数在任务内定义。

**3. 类型一致性：** `LearningProgress`、`Lesson`、`Quiz`、`ApiSymbol`、`SearchRecord`、`VersionInfo` 在定义处统一；`lessonById/nextLesson/prevLesson` 命名一致；`complete/record/quiz` 钩子返回与 progress.ts 对应。
