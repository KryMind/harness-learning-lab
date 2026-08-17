// ---------------------------------------------------------------------------
// Plugin Generator —— 模板定义（纯浏览器端生成，不调用任何 backend）
// ---------------------------------------------------------------------------
// 每个模板都注明对应的官方 Harness source / docs 来源，方便对照学习。
// 注意：在线生成仅负责创建插件模板；真实安装、加载、Hot Reload 与运行测试
// 将在未来的 Harness Plugin Studio 中完成。
//
// 模板已按官方当前 API 重写（已对照 deepseek-harness 源码核实）：
//   - Tool     ：defineTool() + ctx.tools.register() + output.schema/render，
//                execute 返回规范（lossless）JSON value —— 不再用旧的 ToolDefinition + content 写法
//   - Workflow ：模型生成的 JavaScript 编排脚本（script + meta + args），
//                由 ctx.workflowEngine.start 执行 —— 不是 YAML steps 节点流程
//   - Schedule ：没有 cron，只有 after_seconds / at / every_seconds（every 最小 300 秒）
//   - Web UI   ：ctx.slots.register({ name, ... }, Component)（.tsx，含 JSX）
//   - Subagent ：动态派生，通过 ctx.subagents.start(provider, request)（没有 SubagentDefinition 对象）
//   - Skill    ：Bundle（<name>/SKILL.md + reference.md）与 Flat（<name>.md）两种形态
// ---------------------------------------------------------------------------

export interface GeneratedFile {
  path: string
  content: string
}

export interface TemplateOption {
  id: string
  label: string
  values: { value: string; label: string }[]
  default: string
}

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
  /** 前置课程（生成前应掌握的 LESSONS id，页面渲染成学习卡片） */
  prerequisites: string[]
  /** 对应官方源码路径（用于版本差异匹配 changedFiles） */
  sourcePaths: string[]
  /** 生成后「下一步理解」：关联课程 + 关键 API */
  nextLearn: { lessonId: string; api: string; note: string }
  /** 模板额外选项（如 Skill 的 Bundle/Flat 形态） */
  options?: TemplateOption[]
  /** 生成主预览内容（opts 为已选选项值） */
  generate: (name: string, desc: string, opts: Record<string, string>) => string
  /** 生成全部下载文件（缺省时按 fileFor 单文件下载） */
  files?: (name: string, desc: string, opts: Record<string, string>) => GeneratedFile[]
}

// ---------------------------------------------------------------------------
// 转义工具：用户输入的 desc / name 会插入生成的代码，必须先做语言级转义，
// 否则像 Bob's tool 这样的输入会把生成代码写坏。
// ---------------------------------------------------------------------------

/** TS 双引号字符串字面量转义（用 JSON.stringify 保证合法的转义序列） */
function tsString(value: string): string {
  return JSON.stringify(value)
}

/** YAML 双引号字符串转义（安全处理引号 / 反斜杠 / 换行 / 制表符） */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`
}

/** 注释安全化：把换行 / 回车替换为空格，避免截断生成代码里的注释 */
function comment(value: string): string {
  return value.replace(/\r?\n/g, ' ')
}

function toConst(name: string): string {
  return name.replace(/-/g, '_').toUpperCase()
}

/** Skill 内容构建：Bundle（<name>/SKILL.md + reference.md）与 Flat（<name>.md）两种形态 */
function buildSkill(name: string, desc: string, opts: Record<string, string>) {
  const bundle = (opts.mode ?? 'bundle') === 'bundle'
  const primary = `---
name: ${name}
description: ${yamlString(desc || 'TODO: 一句话说明这个技能解决什么问题')}
when-to-use: ${yamlString('TODO: 说明何时使用这个技能（可留空）')}
---

# ${name}

${desc || 'TODO: 一句话说明这个技能解决什么问题。'}

## 使用步骤

1. …

## 详细参考

${bundle
  ? '> 检索正文见同目录 reference.md（SKILL.md 为入口，模型按需检索正文）。'
  : '> 检索正文直接写在这里（Flat 单文件形态：入口与正文同文件）。'}
`
  if (!bundle) {
    return { primary, files: [{ path: `${name}.md`, content: primary }] }
  }
  return {
    primary,
    files: [
      { path: `${name}/SKILL.md`, content: primary },
      {
        path: `${name}/reference.md`,
        content: `# ${name} —— 详细参考\n\n${desc || 'TODO: 把可被模型检索的详细正文写在这里。'}\n\n## 规则与示例\n\n1. …\n`,
      },
    ],
  }
}

export const PLUGIN_TEMPLATES: PluginTemplate[] = [
  {
    id: 'tool',
    label: 'Tool 工具',
    emoji: '🛠',
    description: '注册一个可被 Agent 调用的工具：defineTool() + ctx.tools.register()，execute 返回规范 JSON value。',
    language: 'typescript',
    sources: [
      { path: 'packages/core/tools/src/schema.ts', label: 'tools/schema.ts（defineTool）' },
      { path: 'packages/core/tools/src/index.ts', label: 'tools/index.ts（register）' },
    ],
    docs: [
      { path: 'docs/cookbook/adding-a-tool.md', label: 'cookbook/adding-a-tool.md' },
      { path: 'docs/subsystems/tools.md', label: 'docs/subsystems/tools.md' },
    ],
    prerequisites: ['plugin-generator', 'tools'],
    sourcePaths: ['packages/core/tools/**'],
    nextLearn: { lessonId: 'tools', api: 'ctx.tools.register', note: '工具如何被 Agent 发现、调用与校验' },
    generate: (name, desc, _opts) =>
      `// ${name}.ts —— ${comment(desc || '一个 Harness 工具插件模板')}
// 官方写法：defineTool() + ctx.tools.register()；execute 返回规范 JSON value
// 对应官方源码：packages/core/tools/src/schema.ts（defineTool 签名 / output.schema）
//               packages/workflow/tool-workflow/src/index.ts（register 用法示例）
// 对应官方文档：docs/cookbook/adding-a-tool.md
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { Context } from '@deepseek-ai/cordis'

export const name = '${name}'
export const inject = ['tools']

export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: '${name}',
    description: ${tsString(desc || 'TODO: 描述该工具做什么、何时使用（模型据此决定是否调用）')},
    parameters: {
      // 每个入参一条声明；type 支持 string / number / boolean / object / array
      // query: { type: 'string', description: '要查询的内容' },
    },
    output: {
      // 规范输出 schema：execute 的返回值会与之做严格校验（工具契约本身）
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          // text: { type: 'string', required: true },
        },
      },
      // 把规范 value 渲染成模型可见的内容（纯投影，无副作用）
      render: (_args, value): ContentBlock[] => [
        { type: 'text', text: JSON.stringify(value, null, 2) },
      ],
    },
    isConcurrencySafe: () => true,
    async execute(args, _exec) {
      // TODO: 实现工具逻辑；返回值必须是符合 output.schema 的规范 JSON value
      return { ok: true }
    },
  }))
}
`,
  },
  {
    id: 'skill',
    label: 'Skill 技能',
    emoji: '🧠',
    description: '创建一个 Skill：Bundle 形态（<name>/SKILL.md + reference.md）或 Flat 形态（<name>.md 单文件）。',
    language: 'markdown',
    sources: [{ path: 'packages/core/skills/src', label: 'packages/core/skills' }],
    docs: [{ path: 'docs/subsystems/skills.md', label: 'docs/subsystems/skills.md' }],
    prerequisites: ['plugin-generator', 'skills'],
    sourcePaths: ['packages/core/skills/**'],
    nextLearn: { lessonId: 'skills', api: 'ctx.skills', note: 'Skill 的发现与加载机制（Bundle / Flat）' },
    options: [
      {
        id: 'mode',
        label: 'Skill 形态',
        values: [
          { value: 'bundle', label: 'Bundle：<name>/SKILL.md + reference.md' },
          { value: 'flat', label: 'Flat：<name>.md 单文件' },
        ],
        default: 'bundle',
      },
    ],
    generate: (name, desc, opts) => buildSkill(name, desc, opts).primary,
    files: (name, desc, opts) => buildSkill(name, desc, opts).files,
  },
  {
    id: 'subagent',
    label: 'Subagent 子代理',
    emoji: '🤖',
    description: '在工具中通过 ctx.subagents.start(provider, request) 动态派生一个子 Agent（无 SubagentDefinition 对象）。',
    language: 'typescript',
    sources: [
      { path: 'packages/subagent/subagent/src/index.ts', label: 'subagent/subagent（ctx.subagents）' },
      { path: 'packages/subagent/subagent/src/types.ts', label: 'subagent/types.ts（SubagentStartRequest）' },
    ],
    docs: [{ path: 'docs/subsystems/subagent.md', label: 'docs/subsystems/subagent.md' }],
    prerequisites: ['plugin-generator', 'subagent'],
    sourcePaths: ['packages/subagent/**'],
    nextLearn: { lessonId: 'subagent', api: 'ctx.subagents.start', note: '子代理如何派生、由谁执行（spawn / fork / acp）' },
    generate: (name, desc, _opts) =>
      `// ${name}.ts —— ${comment(desc || '一个 Harness 子代理派生模板')}
// 官方不注册 “SubagentDefinition 对象”：子代理由运行时分派（spawn / fork / acp provider）
// 对应官方源码：packages/subagent/subagent/src/index.ts（ctx.subagents.start）
//               packages/subagent/subagent/src/types.ts（SubagentStartRequest / SubagentRun）
// 对应官方文档：docs/subsystems/subagent.md
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { Context } from '@deepseek-ai/cordis'
import type { SubagentStartRequest } from '@deepseek-ai/dsh-subagent'

export const name = '${name}'
export const inject = ['tools', 'subagents']

export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: '${name}',
    description: ${tsString(desc || 'TODO: 描述这个子代理擅长什么、主 Agent 何时派生它')},
    parameters: {
      // query: { type: 'string', description: '交给子代理的任务' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          // output: { type: 'string', required: true },
        },
      },
      render: (_args, value): ContentBlock[] => [
        { type: 'text', text: JSON.stringify(value, null, 2) },
      ],
    },
    async execute(args, exec) {
      if (!exec.agent) return { ok: false, error: 'requires a calling agent (exec.agent)' }

      const request: SubagentStartRequest = {
        label: '${name}',
        prompt: String(args.query ?? '${comment(desc || '执行子代理任务')}'),
        parent: exec.agent,
        signal: exec.signal,
        // 可选能力（需 provider 支持）：outputSchema / maxDepth / persona / toolFilter
        // outputSchema: { type: 'object', additionalProperties: false, properties: { ... } },
      }
      // provider 由运行时分派（spawn / fork / acp），这里用 spawn
      const run = await ctx.subagents.start('spawn', request)
      const result = await run.result
      if (result.stopReason !== 'completed') {
        return { ok: false, error: 'subagent stopped: ' + result.stopReason }
      }
      return { ok: true, output: JSON.stringify(result.output) }
    },
  }))
}
`,
  },
  {
    id: 'workflow',
    label: 'Workflow 工作流',
    emoji: '⚙️',
    description: '模型生成的 JavaScript 编排脚本（script + meta + args），由 Workflow Engine 驱动多个 Subagent。',
    language: 'javascript',
    sources: [
      { path: 'packages/workflow/tool-workflow/src/index.ts', label: 'tool-workflow（workflow 工具）' },
      { path: 'packages/workflow/workflow/src/runtime-types.ts', label: 'workflow（WorkflowStartRequest）' },
    ],
    docs: [{ path: 'docs/subsystems/workflow.md', label: 'docs/subsystems/workflow.md' }],
    prerequisites: ['plugin-generator', 'workflow'],
    sourcePaths: ['packages/workflow/**'],
    nextLearn: { lessonId: 'workflow', api: 'ctx.workflowEngine.start', note: '脚本如何驱动多个 Subagent 编排' },
    generate: (name, desc, _opts) =>
      `// ${name}.js —— Harness JavaScript Workflow（模型生成的编排脚本）
// 对应官方源码：packages/workflow/tool-workflow/src/index.ts（workflow 工具）
//               packages/workflow/workflow/src/runtime-types.ts（WorkflowStartRequest）
// 对应官方文档：docs/subsystems/workflow.md
//
// 官方工作流不是 YAML 节点流程，而是模型编写的纯 JavaScript 编排脚本：
//   script —— 纯 JS body（支持 top-level await，以 return <json> 结尾）
//   meta   —— 身份块（name / description / whenToUse? / phases?，纯 JSON，不是代码）
//   args   —— 可选 JSON 输入，脚本中以全局 args 可见
// 执行入口（在插件里）：
//   ctx.workflowEngine.start({ script, meta, args, parent, signal })
//
// 脚本钩子（无 fs / network / timer / Node 内置 API，Agent 才是干活的人）：
//   agent(prompt, opts?)    跑一个 subagent 到完成；带 opts.schema 时返回校验过的对象，
//                           失败时 resolve null（用 .filter(Boolean) 过滤）
//   pipeline(items, ...stages)  每项依次过多个 stage（stage 间无 barrier，推荐多阶段）
//   parallel(thunks)        并发跑零参函数并等待全部（有 barrier）
//   phase(title) / log(msg) 进度阶段 / 叙述
//   args                    本次调用的输入（原样）

phase('research')
const reports = await parallel([
  () => agent('调研主题 A 并给出结论', { label: 'research-a', phase: 'research' }),
  () => agent('调研主题 B 并给出结论', { label: 'research-b', phase: 'research' }),
])

phase('synthesis')
const summary = await agent(
  '综合以下调研结果，输出结构化结论：' + JSON.stringify(reports),
  {
    label: 'synthesize',
    phase: 'synthesis',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        conclusion: { type: 'string', required: true },
        risks: { type: 'array', items: { type: 'string' }, required: true },
      },
    },
  },
)

log('done')
return { reports, summary }
`,
  },
  {
    id: 'webui',
    label: 'Web UI 插件',
    emoji: '🎨',
    description: '通过 ctx.slots.register 向 Web Client 注入 UI 组件（.tsx）。',
    language: 'typescript',
    sources: [
      { path: 'packages/client/ui-slots/src/index.ts', label: 'ui-slots（SlotCore.register）' },
      { path: 'packages/client/AGENTS.md', label: 'client/AGENTS.md（One API）' },
    ],
    docs: [{ path: 'docs/subsystems/web.md', label: 'docs/subsystems/web.md' }],
    prerequisites: ['plugin-generator', 'web-ui'],
    sourcePaths: ['packages/client/ui-slots/**'],
    nextLearn: { lessonId: 'web-ui', api: 'ctx.slots.register', note: 'UI 插件如何挂进 Web Client 的 SlotMap' },
    generate: (name, desc, _opts) =>
      `// ${name}.tsx —— ${comment(desc || '一个 Web UI 插件模板')}
// 官方唯一 UI API：ctx.slots.register({ name, children?, store?, inject? }, Component)
// 对应官方源码：packages/client/ui-slots/src/index.ts（SlotCore.register）
//               packages/client/AGENTS.md（One API 约定）
// 对应官方文档：docs/subsystems/web.md
import type { Context } from '@deepseek-ai/cordis'

export function apply(ctx: Context): void {
  // name 必须是 Web 客户端 SlotMap 中已声明的 slot key（见 packages/client 各 ui-* 包）。
  // 这里用内置的 'root' 占位；真实插件请声明你自己的 children slot 并指向它。
  ctx.slots.register({ name: 'root' }, () => (
    <div className="ui-card">Hello from ${name}</div>
  ))
}
`,
  },
  {
    id: 'schedule',
    label: 'Schedule 定时任务',
    emoji: '⏰',
    description: '注册 Schedule 工具：after_seconds / at / every_seconds（every 最小 300 秒），无 cron。',
    language: 'typescript',
    sources: [
      { path: 'packages/schedule/schedule/src/tools.ts', label: 'schedule/tools.ts（registerScheduleTools）' },
      { path: 'packages/schedule/schedule/src/domain.ts', label: 'schedule/domain.ts（after/at/every）' },
    ],
    docs: [{ path: 'docs/subsystems/schedule.md', label: 'docs/subsystems/schedule.md' }],
    prerequisites: ['plugin-generator', 'tools'],
    sourcePaths: ['packages/schedule/**'],
    nextLearn: { lessonId: 'tools', api: 'ctx.tools.register', note: 'Schedule 也是工具：无 cron，只有三种选择器' },
    generate: (name, desc, _opts) =>
      `// ${name}.ts —— ${comment(desc || '一个 Harness Schedule 工具插件模板')}
// 官方没有 cron！只有三种选择器：after_seconds / at / every_seconds（every 最小 300 秒）
// 对应官方源码：packages/schedule/schedule/src/tools.ts（registerScheduleTools / schedule_create）
//               packages/schedule/schedule/src/domain.ts（create*ScheduleRecord / MIN_EVERY_INTERVAL_SECONDS）
// 对应官方文档：docs/subsystems/schedule.md
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { Context } from '@deepseek-ai/cordis'

const MIN_EVERY_SECONDS = 300

export const name = '${name}'
export const inject = ['tools']

export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'schedule_create',
    description: ${tsString(desc || '创建一条会话内定时提醒：非空 prompt + 恰好一个选择器 after_seconds / at / every_seconds（最小 ' + String(300) + ' 秒）。')},
    parameters: {
      prompt: { type: 'string', required: true, description: '到期要呈现的提醒内容。' },
      after_seconds: { type: 'number', description: '从现在起的延迟秒数（正整数安全整数）。' },
      at: {
        description: '绝对时间：带偏移的 RFC 3339，或 { date, time, time_zone } 本地时间（IANA 时区）。',
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              date: { type: 'string', required: true },
              time: { type: 'string', required: true },
              time_zone: { type: 'string', required: true },
            },
          },
        ],
      },
      every_seconds: { type: 'number', description: '固定周期秒数，至少 ' + String(MIN_EVERY_SECONDS) + '。' },
    },
    output: {
      // 官方用 oneOf：三种 view + 一组 error schema（见 schedule/tools.ts）
      schema: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'string', required: true },
              prompt: { type: 'string', required: true },
              scheduledAt: { type: 'string', required: true },
              state: { type: 'string', required: true, enum: ['scheduled', 'overdue'] },
              deliveryMode: { type: 'string', required: true, const: 'session-local' },
              kind: { type: 'string', required: true, const: 'after' },
              afterSeconds: { type: 'integer', required: true },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              code: { type: 'string', required: true, const: 'invalid_selector' },
              message: { type: 'string', required: true },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              code: { type: 'string', required: true, const: 'frequency_too_high' },
              message: { type: 'string', required: true },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              code: { type: 'string', required: true, const: 'internal_error' },
              message: { type: 'string', required: true },
            },
          },
        ],
      },
      render: (_args, value): ContentBlock[] => [
        { type: 'text', text: JSON.stringify(value) },
      ],
    },
    async execute(args, exec) {
      if (!exec.agent) {
        return { code: 'internal_error', message: 'requires a calling agent (exec.agent)' }
      }
      // 校验：恰好一个选择器；every_seconds >= 300（官方 validateCreateArgs 的规则）
      const selectors = Number(args.after_seconds !== undefined)
        + Number(args.at !== undefined)
        + Number(args.every_seconds !== undefined)
      if (selectors !== 1) {
        return { code: 'invalid_selector', message: 'exactly one of after_seconds / at / every_seconds' }
      }
      if (args.every_seconds !== undefined && args.every_seconds < MIN_EVERY_SECONDS) {
        return { code: 'frequency_too_high', message: 'every_seconds must be at least ' + MIN_EVERY_SECONDS }
      }
      // TODO: 在 exec.agent.session 上 append 'schedule/change' 记录
      //       （参考官方 createAfterScheduleRecord + runScheduleTransaction，交付为 session-local）
      return {
        id: 'schedule-1',
        prompt: args.prompt,
        scheduledAt: new Date(Date.now() + 60_000).toISOString(),
        state: 'scheduled',
        deliveryMode: 'session-local',
        kind: 'after',
        afterSeconds: 60,
      }
    },
  }))
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

/** 导出的默认文件名（skill / webui / workflow 有专门扩展名，其余为 ts） */
export function fileFor(typeId: string, name: string): string {
  const ext = typeId === 'skill' ? 'md' : typeId === 'workflow' ? 'js' : typeId === 'webui' ? 'tsx' : 'ts'
  return `${name}.${ext}`
}
