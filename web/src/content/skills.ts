import type { PageContent } from '../types'

export const skills: PageContent = {
  id: 'skills',
  title: 'Skills',
  emoji: '🧠',
  subtitle: 'Skill Provider → Catalog → Loader 的能力注入管线',
  hero: [
    'Skills 是 Harness 给模型“注入专长”的机制：把一组指令 / 工具约定打包成技能，按作用域分层注册，最后通过 tool-skill 暴露给模型。整个体系符合“能力 Seam”三角色：skill 定义 ctx.skills，skill-filesystem 是 Provider，tool-skill 是 Consumer。',
    'ctx.skills 可以聚合 local、embedded、remote 等不同 Provider 的技能目录；模型侧只看到 name + description 的白名单，由 tool-skill 提供 catalog 与 loader。',
  ],
  learn: [
    '能力 Seam：skill 定义 / Provider / Consumer',
    'ctx.skills 分层注册表（host + per-scope）',
    '本地技能发现与优先级 rank',
    'tool-skill：模型侧的白名单视图',
    'skill-badge / skill-filesystem 的角色',
  ],
  nodes: [
    {
      id: 'skill-def', label: 'skill 服务定义', kind: 'package',
      brief: 'packages/skill/skill —— 定义 ctx.skills 接口',
      detail: '核心包定义 SkillRegistry 服务：注册技能、按作用域查询、列出目录。是能力缝的 Definition 角色。',
      sources: [{ path: 'packages/skill/skill/src/index.ts', label: 'skill/skill' }],
    },
    {
      id: 'registry', label: 'ctx.skills', kind: 'ctx',
      brief: '分层注册表：host 全局 + 每个 scope 一份',
      detail: '技能注册表按 host（全局）与 per-scope（每个 Agent 作用域）分层。同一技能可在不同 scope 呈现不同目录，天然支持“子代理带不同技能”。',
      sources: [{ path: 'packages/skill/skill/src/index.ts', label: 'skill/skill' }],
    },
    {
      id: 'provider', label: 'Skill Provider', kind: 'concept',
      brief: '提供技能目录的实现方，可多个共存',
      detail: 'Provider 决定“技能从哪来”。本地文件系统（skill-filesystem）、内嵌（embedded）、远程（remote）……多个 Provider 的目录聚合进 ctx.skills。',
      docs: [{ path: 'docs/subsystems/skills.md', label: 'skills.md' }],
    },
    {
      id: 'fs', label: 'skill-filesystem', kind: 'provider',
      brief: '本地技能 Provider',
      detail: '扫描本地技能目录（项目 .dsh/skills、用户、内置等），按优先级 rank 归并，把每个技能变成可加载的目录项。',
      sources: [{ path: 'packages/skill/skill-filesystem', label: 'skill-filesystem' }],
    },
    {
      id: 'catalog', label: 'Catalog', kind: 'concept',
      brief: '模型可见的技能清单',
      detail: '目录（catalog）是暴露给模型的技能列表：name + description 白名单。只有显式放行的技能描述会进入模型视野，避免系统提示词臃肿。',
      sources: [{ path: 'packages/skill/tool-skill', label: 'tool-skill' }],
    },
    {
      id: 'loader', label: 'Loader', kind: 'concept',
      brief: '把选中技能“加载”成可执行上下文',
      detail: '当模型选了一个技能，loader 负责把技能的指令 / 文件读入并注入系统提示词或工具描述。catalog → loader 是技能的完整消费链路。',
      docs: [{ path: 'docs/subsystems/skills.md', label: 'skills.md' }],
    },
    {
      id: 'tool-skill', label: 'tool-skill', kind: 'consumer',
      brief: 'Consumer：把技能目录暴露给模型',
      detail: 'tool-skill 插件以“skill 工具”的形式让模型浏览、选择、加载技能。它是能力缝的 Consumer 角色。',
      sources: [{ path: 'packages/skill/tool-skill', label: 'tool-skill' }],
    },
    {
      id: 'badge', label: 'skill-badge', kind: 'provider',
      brief: '技能徽章 / 声明标记',
      detail: 'skill-badge 提供技能声明与徽章能力，默认 disabled（dsh-base 中 disabled: true），可按需开启用于技能签名验证。',
      sources: [{ path: 'packages/skill/skill-badge', label: 'skill-badge' }],
    },
    {
      id: 'rank', label: '优先级 rank', kind: 'concept',
      brief: '本地发现的分级覆盖',
      detail: '多个技能源以固定优先级归并：项目级（.dsh/skills）最高，逐级到用户级、内置级。同名技能高优先级覆盖低优先级。',
      docs: [{ path: 'docs/subsystems/skills.md', label: 'skills.md' }],
    },
    {
      id: 'consumer', label: '其它 Consumer', kind: 'concept',
      brief: 'UI（ui-skill）、命令、审计等消费技能元数据',
      detail: '除了模型侧 tool-skill，UI 插件 ui-skill 展示技能列表与开关；命令与审计也可读取 ctx.skills 目录。',
      sources: [{ path: 'packages/client/ui-skill', label: 'ui-skill' }],
    },
  ],
  edges: [
    { id: 'se-def-registry', from: 'skill-def', to: 'registry', label: '定义 ctx.skills' },
    { id: 'se-registry-provider', from: 'registry', to: 'provider', label: '聚合' },
    { id: 'se-provider-fs', from: 'provider', to: 'fs', label: '实现' },
    { id: 'se-provider-badge', from: 'provider', to: 'badge', label: '实现' },
    { id: 'se-fs-rank', from: 'fs', to: 'rank', label: '按优先级归并' },
    { id: 'se-registry-catalog', from: 'registry', to: 'catalog', label: '生成清单' },
    { id: 'se-catalog-loader', from: 'catalog', to: 'loader', label: '选择后加载' },
    { id: 'se-tool-catalog', from: 'tool-skill', to: 'catalog', label: '读取' },
    { id: 'se-tool-loader', from: 'tool-skill', to: 'loader', label: '调用' },
    { id: 'se-tool-consumer', from: 'tool-skill', to: 'consumer', label: '并存的其它消费者' },
    { id: 'se-consumer-ui', from: 'consumer', to: 'badge', label: 'ui-skill 等' },
  ],
  concepts: [
    {
      title: '能力 Seam 的具体实例',
      icon: '🔌',
      body: 'Skills 是官方文档里最典型的 Seam：skill 定义（接口）→ skill-filesystem（Provider）→ tool-skill（Consumer）。看懂它就看懂了 Harness 的“能力注入”范式。',
      sources: [{ path: 'docs/subsystems/skills.md', label: 'skills.md' }],
    },
    {
      title: 'host + per-scope 双层注册',
      icon: '🌐',
      body: '技能按作用域分层：全局技能所有 Agent 可见，scope 级技能只属于当前 Agent / 子代理。这让“不同子代理带不同工具箱”成为可能。',
      sources: [{ path: 'packages/skill/skill/src/index.ts', label: 'skill/skill' }],
    },
    {
      title: '白名单暴露，避免提示词臃肿',
      icon: '📋',
      body: '模型看到的只有 name + description 白名单，而不是全部技能内容。真正加载（loader）才把指令读进上下文 —— 按需、可控。',
      sources: [{ path: 'packages/skill/tool-skill', label: 'tool-skill' }],
    },
    {
      title: 'Provider 可替换',
      icon: '🔁',
      body: '技能来源不锁死本地文件系统：remote / embedded Provider 只要实现同一服务接口就能挂进来。这为 Longsys AI 接入企业知识库技能预留了接口。',
      sources: [{ path: 'packages/skill/skill/src/index.ts', label: 'skill/skill' }],
    },
  ],
  packages: [
    'packages/skill/skill',
    'packages/skill/skill-filesystem',
    'packages/skill/skill-badge',
    'packages/skill/tool-skill',
    'packages/client/ui-skill',
  ],
  docs: [
    { path: 'docs/subsystems/skills.md', label: 'docs/subsystems/skills.md' },
    { path: 'docs/capability-seams.md', label: 'docs/capability-seams.md' },
    { path: 'docs/subsystems/commands.md', label: 'docs/subsystems/commands.md' },
  ],
  relatedPages: ['/cordis', '/agent-loop', '/web-ui'],
}

export default skills
