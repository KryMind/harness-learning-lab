// ---------------------------------------------------------------------------
// Plugin Generator —— 模板定义（纯浏览器端生成，不调用任何 backend）
// ---------------------------------------------------------------------------
// 每个模板都注明对应的官方 Harness source / docs 来源，方便对照学习。
// 注意：在线生成仅负责创建插件模板；真实安装、加载、Hot Reload 与运行测试
// 将在未来的 Harness Plugin Studio 中完成。
// ---------------------------------------------------------------------------

export interface PluginTemplate {
  id: string
  label: string
  emoji: string
  description: string
  /** 生成文件的扩展名 / 语言 */
  language: string
  /** 对应官方源码路径（可跳转源码浏览器） */
  sources: { path: string; label?: string }[]
  /** 对应官方文档路径（可跳转源码浏览器） */
  docs: { path: string; label?: string }[]
  /** 生成代码 */
  generate: (name: string, desc: string) => string
}

function kebabToCamel(name: string): string {
  return name
    .split('-')
    .map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('')
}

function toConst(name: string): string {
  return name.replace(/-/g, '_').toUpperCase()
}

export const PLUGIN_TEMPLATES: PluginTemplate[] = [
  {
    id: 'tool',
    label: 'Tool 工具',
    emoji: '🛠',
    description: '注册一个可被 Agent 调用的工具（ToolDefinition + ctx.tools.register）。',
    language: 'typescript',
    sources: [{ path: 'packages/core/tools/src/types.ts', label: 'tools/types.ts' }, { path: 'packages/core/tools/src/index.ts', label: 'tools/index.ts' }],
    docs: [{ path: 'docs/cookbook/adding-a-tool.md', label: 'cookbook/adding-a-tool.md' }, { path: 'docs/subsystems/tools.md', label: 'docs/subsystems/tools.md' }],
    generate: (name, desc) =>
      `// ${name}.ts —— ${desc || '一个 Harness 工具插件模板'}
// 对应官方源码：packages/core/tools/src/types.ts（ToolDefinition 结构）
// 对应官方文档：docs/cookbook/adding-a-tool.md
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'

export const ${kebabToCamel(name)}: ToolDefinition = {
  name: '${name}',
  description: '${desc || '描述该工具做什么、何时使用（模型据此决定是否调用）'}',
  isConcurrencySafe: true,
  parameters: {
    type: 'object',
    properties: {
      // TODO: 声明你的入参 schema，例如：
      // query: { type: 'string', description: '要查询的内容' },
    },
  },
  async execute(_args: Record<string, unknown>) {
    // TODO: 实现工具逻辑；返回值会以 text 形式回传给模型
    return {
      content: [{ type: 'text', text: \`Hello from ${name}\` }],
    }
  },
}
`,
  },
  {
    id: 'skill',
    label: 'Skill 技能',
    emoji: '🧠',
    description: '创建一个 Skill 目录（SKILL.md + reference.md），由 skill 插件加载为“能力”。',
    language: 'markdown',
    sources: [{ path: 'packages/core/skills/src', label: 'packages/core/skills' }],
    docs: [{ path: 'docs/subsystems/skills.md', label: 'docs/subsystems/skills.md' }],
    generate: (name, desc) =>
      `# ${name}

${desc || '一句话说明这个技能解决什么问题。'}

## 描述（给模型看）

- 适用场景：…
- 前置条件：…
- 使用步骤：…

## 详细参考

> 在此编写可被模型检索的参考内容（reference）。
> Skill 由 skill 插件按目录加载：SKILL.md 为入口，reference.md 为检索正文。
> 对应官方文档：docs/subsystems/skills.md
`,
  },
  {
    id: 'subagent',
    label: 'Subagent 子代理',
    emoji: '🤖',
    description: '注册一个子代理定义，供主 Agent 通过 subagent/register 创建协作子 Agent。',
    language: 'typescript',
    sources: [{ path: 'packages/core/subagent/src', label: 'packages/core/subagent' }],
    docs: [{ path: 'docs/subsystems/subagent.md', label: 'docs/subsystems/subagent.md' }],
    generate: (name, desc) =>
      `// ${name}.ts —— ${desc || '一个 Harness 子代理定义模板'}
// 对应官方源码：packages/core/subagent（subagent/register）
// 对应官方文档：docs/subsystems/subagent.md
import type { SubagentDefinition } from '@deepseek-ai/dsh-subagent'

export const ${kebabToCamel(name)}: SubagentDefinition = {
  id: '${name}',
  name: '${name}',
  description: '${desc || '描述该子代理擅长什么、主 Agent 何时该创建它'}',
  systemPrompt: [
    '你是一个专用子代理，职责如下：',
    '${desc || 'TODO: 填写职责说明'}',
  ].join('\\n'),
  // 可选：模型、工具、能力限制等
  // model: 'gpt-4o',
  // tools: ['tool_web_search'],
}
`,
  },
  {
    id: 'workflow',
    label: 'Workflow 工作流',
    emoji: '⚙️',
    description: '定义一条由多个子代理/步骤编排的动态工作流（YAML 定义 + Provider 注册）。',
    language: 'yaml',
    sources: [{ path: 'packages/core/workflow/src', label: 'packages/core/workflow' }],
    docs: [{ path: 'docs/subsystems/workflow.md', label: 'docs/subsystems/workflow.md' }],
    generate: (name, desc) =>
      `# ${name} —— ${desc || '一个 Harness 工作流模板'}
# 对应官方源码：packages/core/workflow
# 对应官方文档：docs/subsystems/workflow.md
name: ${name}
description: ${desc || '工作流要完成什么'}

steps:
  - id: step-1
    type: subagent
    agent: research
    prompt: |
      执行第一步：…
  - id: step-2
    type: subagent
    agent: write
    prompt: |
      基于上一步结果，完成…
    dependsOn:
      - step-1
`,
  },
  {
    id: 'webui',
    label: 'Web UI 插件',
    emoji: '🎨',
    description: '通过 UI Slots 往 Web Client 注入侧边栏 / 会话 / 工具展示等界面块。',
    language: 'typescript',
    sources: [{ path: 'packages/client/ui-slots/src', label: 'packages/client/ui-slots' }, { path: 'packages/client/web/src', label: 'packages/client/web' }],
    docs: [{ path: 'docs/subsystems/web.md', label: 'docs/subsystems/web.md' }],
    generate: (name, desc) =>
      `// ${name}.tsx —— ${desc || '一个 Web UI 插件模板'}
// 对应官方源码：packages/client/ui-slots（UI Slots / 侧边栏 Slot）
// 对应官方文档：docs/subsystems/web.md
import type { UiSlotComponent } from '@deepseek-ai/dsh-web'

export const ${kebabToCamel(name)}Slot: UiSlotComponent = {
  id: '${name}',
  label: '${name}',
  description: '${desc || '这个 UI 块展示什么'}',
  render: () => {
    // TODO: 渲染你的界面（挂到 sidebar / conversation / tool 等 Slot）
    return <div className="ui-card">Hello from ${name}</div>
  },
}
`,
  },
  {
    id: 'schedule',
    label: 'Schedule 定时任务',
    emoji: '⏰',
    description: '注册一个定时执行的 Job（cron），由 schedule 插件调度。',
    language: 'typescript',
    sources: [{ path: 'packages/core/schedule/src', label: 'packages/core/schedule' }],
    docs: [{ path: 'docs/subsystems/schedule.md', label: 'docs/subsystems/schedule.md' }],
    generate: (name, desc) =>
      `// ${name}.ts —— ${desc || '一个定时任务插件模板'}
// 对应官方源码：packages/core/schedule
// 对应官方文档：docs/subsystems/schedule.md
import type { ScheduleJob } from '@deepseek-ai/dsh-schedule'

export const ${kebabToCamel(name)}Job: ScheduleJob = {
  id: '${name}',
  cron: '0 9 * * *', // TODO: 每天 09:00（cron 表达式）
  description: '${desc || '这个任务做什么'}',
  async run() {
    // TODO: 定时任务逻辑
    return { ok: true }
  },
}
`,
  },
]

/** 根据插件类型生成挂进 profile 的 patch 片段（cordis.patch.yml 示例）。 */
export function generateProfilePatch(name: string): string {
  const CONST = toConst(name)
  return `# 把你的插件挂进 profile（cordis.patch.yml 增行示例）
# 对应官方源码：apps/cli/src/dump-config.ts（插件树）、packages/bundle/base（dsh-base 骨架）
- insert:
    - id: ${name}
      name: '${CONST.toLowerCase()}'   # 你的插件 npm 包名
      config:
        enabled: true
`
}

/** 导出的默认文件名 */
export function fileFor(typeId: string, name: string): string {
  const ext = typeId === 'skill' ? 'md' : typeId === 'workflow' ? 'yml' : 'ts'
  return `${name}.${ext}`
}
