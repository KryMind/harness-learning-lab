import type { PageContent } from '../types'

export const cordis: PageContent = {
  id: 'cordis',
  title: '插件架构',
  emoji: '🧩',
  subtitle: 'Cordis、Plugin、ctx 如何组合成一个可扩展的 Agent 运行时',
  hero: [
    'Harness 不是「框架 + 内建模块」，而是一个 Cordis 宿主（host）加一堆插件。核心执行、工具、技能、子代理、工作流、会话、沙箱、Web UI……全部是插件，通过「服务注入」互相协作。',
    '理解 Cordis 的三个关键词：ctx（上下文）、plugin（插件）、service（服务）。插件 define() 时声明依赖哪些服务、提供哪些服务；宿主解析依赖图后按序启动。下图展示插件的装配关系与事件分发模型。',
  ],
  learn: [
    'Cordis 宿主与 ctx 是什么',
    'ctx.plugin / ctx.service / ctx.inject 如何工作',
    '服务能力缝（Definition/Provider/Consumer）',
    '事件分发模型：waterfall / parallel / serial',
    'Scope（作用域）如何隔离上下文',
  ],
  nodes: [
    {
      id: 'cordis', label: 'Cordis 宿主', kind: 'package',
      brief: 'vendor/cordis —— 官方 vendored 的轻量 DI + 事件框架',
      detail: 'Harness 把 Cordis 源码 vendored 到 vendor/cordis/src。核心：registry（插件注册表）、service（服务声明）、events（事件分发）、context（作用域上下文）。',
      sources: [
        { path: 'vendor/cordis/src/index.ts', label: 'cordis/index.ts' },
        { path: 'vendor/cordis/src/context.ts', label: 'context.ts' },
        { path: 'vendor/cordis/src/registry.ts', label: 'registry.ts' },
      ],
      docs: [{ path: 'docs/cordis-primer.md', label: 'cordis-primer.md' }],
    },
    {
      id: 'ctx', label: 'ctx', kind: 'ctx',
      brief: '上下文：插件的“宇宙”，一切能力的入口',
      detail: '每个插件都拿到一个 ctx。ctx 上挂满服务：ctx.llm、ctx.tools、ctx.sessions、ctx.skills、ctx.subagents、ctx.workflowEngine、ctx.sandbox、ctx.agents、ctx.agentLoop、ctx.systemPrompt、ctx.scope……插件通过 ctx 读写能力。',
      sources: [
        { path: 'vendor/cordis/src/context.ts', label: 'context.ts' },
        { path: 'docs/cordis-api/context.md', label: 'context.md' },
      ],
    },
    {
      id: 'plugin', label: 'Plugin', kind: 'concept',
      brief: 'ctx.plugin(define(...)) —— 一个插件的声明',
      detail: '插件 = 一个函数式定义：声明 name、依赖（inject 的服务）、启动/停止逻辑。多个插件组合成 bundle，bundle 组合成 profile，profile 决定运行时实例。',
      sources: [
        { path: 'vendor/cordis/src/registry.ts', label: 'registry.ts' },
        { path: 'apps/cli/src/plugin.ts', label: 'cli/plugin.ts' },
      ],
      docs: [{ path: 'docs/cordis-primer.md', label: 'cordis-primer.md' }],
    },
    {
      id: 'service', label: 'Service', kind: 'concept',
      brief: '服务：在 ctx 上注册的可复用能力',
      detail: '服务 = 一个 ctx 键 + 接口。例如 skill 服务定义 ctx.skills 的接口；llm 服务定义 ctx.llm。Provider 插件实现服务，Consumer 插件消费服务。',
      sources: [
        { path: 'vendor/cordis/src/service.ts', label: 'service.ts' },
        { path: 'docs/cordis-api/service.md', label: 'service.md' },
      ],
    },
    {
      id: 'events', label: '事件分发', kind: 'concept',
      brief: 'waterfall / parallel / serial 三种分发',
      detail: 'Cordis 事件系统是插件协作的枢纽。waterfall（瀑布式，可拦截可改参数）、parallel（并行广播）、serial（串行链式）。Agent Loop 的大量扩展点都挂在这里。',
      sources: [
        { path: 'vendor/cordis/src/events.ts', label: 'events.ts' },
        { path: 'docs/cordis-api/events.md', label: 'events.md' },
      ],
    },
    {
      id: 'scope', label: 'Scope', kind: 'concept',
      brief: 'ctx.scope —— 作用域隔离',
      detail: 'core/scope 提供作用域层，让不同 Agent / 子任务共享宿主但隔离上下文（服务、配置、事件）。Scoped<T> 包装保证多 Agent 并行时互不串扰。',
      sources: [{ path: 'packages/core/scope/src/index.ts', label: 'core/scope' }],
      docs: [{ path: 'docs/subsystems/scope.md', label: 'scope.md' }],
    },
    {
      id: 'define', label: 'define()', kind: 'file',
      brief: '插件的“身份证”：name + inject + setup',
      detail: '一个典型插件定义：name 声明身份，inject 声明依赖的服务，函数体里提供新服务或监听事件。示例：@deepseek-ai/dsh-skill 的入口即是一个 define。',
      sources: [
        { path: 'packages/skill/skill/src/index.ts', label: 'skill/skill' },
        { path: 'packages/core/agent/src/index.ts', label: 'core/agent' },
      ],
    },
    {
      id: 'seam', label: '能力 Seam', kind: 'concept',
      brief: 'Definition / Provider / Consumer 三角色',
      detail: '一个能力缝由三部分组成：Service Definition 定义 ctx 键与接口；Provider 提供实现（可多个按名共存，如 spawn/fork/acp 子代理后端）；Consumer 消费它。这是官方架构的核心抽象。',
      docs: [{ path: 'docs/capability-seams.md', label: 'capability-seams.md' }],
    },
    {
      id: 'loader', label: '插件加载器', kind: 'backend',
      brief: 'loader —— 从 npm 包解析插件代码',
      detail: 'vendor/loader 负责把插件名（npm 包名）解析为可执行模块。插件可以来自 workspace、npm registry，甚至 HMR 热替换（client/hmr）。',
      sources: [{ path: 'vendor/loader/src/index.ts', label: 'loader/index.ts' }],
    },
  ],
  edges: [
    { id: 'ce-cordis-ctx', from: 'cordis', to: 'ctx', label: '创建上下文' },
    { id: 'ce-ctx-plugin', from: 'ctx', to: 'plugin', label: '注册' },
    { id: 'ce-plugin-service', from: 'plugin', to: 'service', label: '提供/消费' },
    { id: 'ce-plugin-events', from: 'plugin', to: 'events', label: '监听/分发' },
    { id: 'ce-cordis-events', from: 'cordis', to: 'events', label: '实现' },
    { id: 'ce-ctx-scope', from: 'ctx', to: 'scope', label: '隔离' },
    { id: 'ce-plugin-define', from: 'plugin', to: 'define', label: '写法' },
    { id: 'ce-seam-service', from: 'seam', to: 'service', label: '定义' },
    { id: 'ce-seam-plugin', from: 'seam', to: 'plugin', label: 'Provider/Consumer' },
    { id: 'ce-loader-cordis', from: 'loader', to: 'cordis', label: '装载到宿主' },
  ],
  concepts: [
    {
      title: 'Everything is a plugin',
      icon: '🧩',
      body: '没有“内建功能”。连会话、工具、沙箱都是插件。想加能力 = 加插件；想改行为 = 监听/拦截 ctx 事件。这就是为什么 dsh 能拆成 200+ 个包却仍然自洽。',
      sources: [{ path: 'docs/architecture.md', label: 'architecture.md' }],
    },
    {
      title: 'ctx 是插件的“宇宙”',
      icon: '🌌',
      body: '插件之间不直接 import，而是通过 ctx 上的服务协作。这保证了可替换性：只要实现同一服务接口，Provider 可以任意替换（例如把 skill-filesystem 换成远程 Provider）。',
      sources: [{ path: 'docs/cordis-api/context.md', label: 'context.md' }],
    },
    {
      title: '三种事件分发',
      icon: '🔀',
      body: 'waterfall 允许监听器修改参数与返回值（Agent Loop 的扩展点）；parallel 广播通知；serial 串行链式传递。判断一个事件用哪种分发，就判断了它“能不能拦截”。',
      sources: [{ path: 'docs/cordis-api/events.md', label: 'events.md' }],
    },
    {
      title: 'Scope 让“多 Agent”成为可能',
      icon: '🧬',
      body: '一个宿主进程里可以有多个作用域，每个 Agent 独占一个 scope。服务与事件在 scope 内隔离，子代理、工作流才能并行而不互相污染。',
      sources: [{ path: 'docs/subsystems/scope.md', label: 'scope.md' }],
    },
  ],
  packages: [
    'vendor/cordis',
    'packages/core/agent',
    'packages/core/agent-loop',
    'packages/core/tools',
    'packages/core/session',
    'packages/core/scope',
    'packages/core/system-prompt',
    'packages/skill/skill',
    'packages/bundle/base',
  ],
  docs: [
    { path: 'docs/cordis-primer.md', label: 'docs/cordis-primer.md' },
    { path: 'docs/capability-seams.md', label: 'docs/capability-seams.md' },
    { path: 'docs/cordis-api/context.md', label: 'docs/cordis-api/context.md' },
    { path: 'docs/cordis-api/events.md', label: 'docs/cordis-api/events.md' },
    { path: 'docs/cordis-api/service.md', label: 'docs/cordis-api/service.md' },
    { path: 'docs/architecture.md', label: 'docs/architecture.md' },
  ],
  relatedPages: ['/', '/profile', '/agent-loop'],
}

export default cordis
