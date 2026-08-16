import type { PageContent } from '../types'
import type { LoopStep } from '../components/LoopTimeline'

// ---------------------------------------------------------------------------
// Agent Loop 动画时间线数据（与 docs/agent-lifecycle.md 的真实事件一一对应）
// ---------------------------------------------------------------------------
export const loopSteps: LoopStep[] = [
  { key: 'agent/inbox/inserted', name: '收到用户消息', kind: 'live', desc: 'followup(content) 进入收件箱，dispatch 广播 agent/inbox/inserted { message }，UI 可即时渲染。', sources: [{ path: 'packages/core/agent-loop/src/agent.ts', label: 'agent.ts' }] },
  { key: 'agent/status', name: '状态置为 running', kind: 'live', desc: '队列里的工作唤醒 driver，发出 agent/status = running，UI 顶部状态切换。', sources: [{ path: 'packages/core/agent-loop/src/agent.ts', label: 'agent.ts' }] },
  { key: 'turn/start', name: '回合开始', kind: 'durable', desc: 'Driver 把 turn/start 追加进 Session 事件日志 —— 一回合从这里开始。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'agent/inbox/claimed', name: '认领消息', kind: 'live', desc: 'Driver 认领下一个 step 的输入 + 一条排队消息，每条约 agent/inbox/claimed { message, turn }。', sources: [{ path: 'packages/core/agent-loop/src/agent.ts', label: 'agent.ts' }] },
  { key: 'agent/pre-step', name: '预步决策', kind: 'gate', desc: 'agent/pre-step waterfall：steering、注入上下文、compaction 都在这。返回 enter(messages) 则进入该 step，reject 则该 turn 不消耗 step。', sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }] },
  { key: 'step/start', name: '步开始', kind: 'durable', desc: 'step/start 入日志。一个 turn 可能包含多个 step（多次模型请求）。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'user/message', name: '用户消息入日志', kind: 'durable', desc: '每条进入的 user 消息以 user/message 追加进日志。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'system-prompt/assemble', name: '组装 System Prompt', kind: 'live', desc: 'ctx.systemPrompt 的 system-prompt/assemble waterfall 汇总各插件的 prompt 段落（persona、plan-mode、子代理指令……）。', sources: [{ path: 'packages/core/system-prompt/src/index.ts', label: 'core/system-prompt' }] },
  { key: 'agent/request', name: '构造请求', kind: 'live', desc: 'agent/request waterfall：可拦截修改发给 LLM 的 messages + tool schema。', sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }] },
  { key: 'llm/stream', name: 'LLM 流式输出', kind: 'live', desc: 'ctx.llm 流式请求；llm/stream waterfall 可改写流（如 retry、token-meter）。', sources: [{ path: 'packages/llm/llm/src/index.ts', label: 'llm/llm' }] },
  { key: 'assistant/chunk', name: '流式 chunk 入日志', kind: 'durable', desc: '每个流式片段以 assistant/chunk 追加进日志，UI 据此实时打字机渲染。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'assistant/message', name: '完整回复入日志', kind: 'durable', desc: 'assistant/message 记录整次模型回复（含 usage 与 sourceEventSeqs 指向哪些 chunk）。空内容不进派生历史，但 durable 事件保留。', sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }] },
  { key: 'tool/call', name: '工具调用入日志', kind: 'durable', desc: '模型请求调用工具时，tool/call 追加进日志。若回复里没有工具调用，则直接跳到 step/end。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'tools/pre-execute', name: '预执行决策', kind: 'tool', desc: 'tools/pre-execute waterfall：approval、权限预设、guard 都在这里裁决 —— 允许 / 拒绝 / 询问。返回 PreToolDecision。', sources: [{ path: 'packages/core/tools/src/index.ts', label: 'core/tools/src/index.ts' }] },
  { key: 'executionMode', name: '并行 / 排他调度', kind: 'gate', desc: '按工具 isConcurrencySafe 分类：parallel 可并发，exclusive 串行；tool-calls.ts 维护有界滚动池并处理 barrier。', sources: [{ path: 'packages/core/agent-loop/src/tool-calls.ts', label: 'tool-calls.ts' }, { path: 'packages/core/tools/src/index.ts', label: 'index.ts#L344' }] },
  { key: 'tools/execute', name: '执行工具', kind: 'tool', desc: 'tools/execute waterfall 真正执行工具（bash/fs/subagent/workflow……），返回 ToolExecutionResult。', sources: [{ path: 'packages/core/tools/src/index.ts', label: 'core/tools/src/index.ts' }] },
  { key: 'tools/post-execute', name: '后处理', kind: 'tool', desc: 'tools/post-execute waterfall 加工结果（截断、摘要、物化文件引用），返回 PostToolDecision。', sources: [{ path: 'packages/core/tools/src/index.ts', label: 'core/tools/src/index.ts' }] },
  { key: 'tool/result', name: '结果入日志', kind: 'durable', desc: 'tool/result 追加进日志，同时 tools/result emit 通知监听者（UI、审计）。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'step/end', name: '步结束', kind: 'durable', desc: '本轮 step 收尾入日志。若模型还要继续（next-step 输入或继续工具），则进入下一 step。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'agent/turn-stopping', name: '回合停止检查', kind: 'live', desc: '自然停止且收件箱空时，agent/turn-stopping serial 作为终止前检查点（可扩展收尾逻辑）。', sources: [{ path: 'packages/core/agent-loop/src/agent.ts', label: 'agent.ts' }] },
  { key: 'turn/end', name: '回合结束', kind: 'durable', desc: 'turn/end 追加进日志，本回合完整落幕。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'agent/status', name: '状态置为 idle', kind: 'live', desc: 'driver 发 agent/status = idle，UI 恢复就绪状态，等待下一条消息。', sources: [{ path: 'packages/core/agent-loop/src/agent.ts', label: 'agent.ts' }] },
]

export const agentloop: PageContent = {
  id: 'agentloop',
  title: 'Agent Loop',
  emoji: '🔄',
  subtitle: '一次提问从 User 到最终回复的完整生命周期',
  hero: [
    'Agent Loop 是 Harness 的心脏。一轮执行由 packages/core/agent-loop/src/agent.ts 的 ReactLoopAgent 驱动：它把一次交互拆成 turn → step → 组装 Prompt → 请求 LLM → 调度工具 → 写入结果 → 判断是否继续。',
    '关键心法：durable 事件（turn/*、step/*、tool/*、assistant/*）决定“发生了什么”，写进 Session 日志可回放；live 事件（agent/*、tools/*、system-prompt/*）决定“下一步怎么做”，是可拦截的瀑布扩展点。',
  ],
  learn: [
    'ReactLoopAgent 如何驱动一轮执行',
    'turn / step / tool 三层结构',
    'durable 事件 vs live 扩展点',
    '工具并行与排他调度（executionMode）',
    'agent/pre-step 预步决策与继续/停止',
  ],
  nodes: [
    {
      id: 'reactloop', label: 'ReactLoopAgent', kind: 'file',
      brief: 'agent-loop 的核心类，驱动整个循环',
      detail: '它在 packages/core/agent-loop/src/agent.ts。负责收件箱、turn/step 推进、请求构造、工具调度与停止决策。ctx.agents 注册代理，ctx.agentLoop 提供循环引擎。',
      sources: [{ path: 'packages/core/agent-loop/src/agent.ts', label: 'agent.ts' }, { path: 'packages/core/agent-loop/src/index.ts', label: 'index.ts' }],
    },
    {
      id: 'turn', label: 'Turn', kind: 'concept',
      brief: '一次交互回合：turn/start → … → turn/end',
      detail: '一个 turn 对应一次“用户提问 → 最终回复”。它可能包含多个 step（多次模型往返）。turn/start 与 turn/end 都是 durable 事件。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
    {
      id: 'step', label: 'Step', kind: 'concept',
      brief: '一次模型请求：step/start → … → step/end',
      detail: 'step = 一次“组装 prompt → LLM → 工具调度”的完整往返。agent/pre-step 决定是否进入；step/start、user/message、assistant/*、tool/*、step/end 都是 durable。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
    {
      id: 'durable', label: 'durable 事件', kind: 'event',
      brief: '决定“发生了什么”：写入 Session 日志',
      detail: 'turn/start、step/start、user/message、assistant/chunk、assistant/message、tool/call、tool/result、step/end、turn/end。可回放、可审计、可恢复。',
      sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }],
    },
    {
      id: 'live', label: 'live 事件', kind: 'event',
      brief: '决定“怎么做”：可拦截的扩展点',
      detail: 'agent/pre-step、system-prompt/assemble、agent/request、llm/stream、agent/turn-stopping 是 waterfall/serial 扩展点；tools/pre-execute/execute/post-execute 控制工具管线；agent/status 通知 UI。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
    {
      id: 'prestep', label: 'agent/pre-step', kind: 'gate',
      brief: '预步瀑布：steering / 注入 / compaction',
      detail: '这是“下一 step 到底做什么”的裁决点。compaction-basic 在这里做压力判断；steering 和上下文注入也走这里。返回 enter 或 reject。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }, { path: 'packages/compaction/basic', label: 'compaction/basic' }],
    },
    {
      id: 'prompt', label: 'system-prompt/assemble', kind: 'gate',
      brief: '汇总各插件的 Prompt 段落',
      detail: 'ctx.systemPrompt 提供 water-fall 式组装：persona、plan-mode 指令、子代理说明、工具说明等段落全部拼装进 System Prompt。',
      sources: [{ path: 'packages/core/system-prompt/src/index.ts', label: 'core/system-prompt' }],
    },
    {
      id: 'request', label: 'agent/request', kind: 'gate',
      brief: '构造发给 LLM 的请求',
      detail: 'agent/request waterfall 可拦截修改 messages 与 tool schema。之后进入 ctx.llm 的 llm/stream 流式请求。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
    {
      id: 'schedule', label: 'tool-calls 调度器', kind: 'file',
      brief: '并行 / 排他 + 有界滚动池',
      detail: 'tool-calls.ts 读取每个工具 executionMode：isConcurrencySafe 才可 parallel，否则 exclusive。barrier 与滚动池限制同时执行的工具数量，且在 start 前重分类。',
      sources: [{ path: 'packages/core/agent-loop/src/tool-calls.ts', label: 'tool-calls.ts' }],
    },
    {
      id: 'pipeline', label: '工具管线', kind: 'concept',
      brief: 'pre-execute → execute → post-execute',
      detail: 'tools/pre-execute 裁决（approval/权限/guard）；tools/execute 执行；tools/post-execute 后处理；tools/result 通知。每个阶段都是 waterfall 可拦截。',
      sources: [{ path: 'packages/core/tools/src/index.ts', label: 'core/tools/src/index.ts' }],
    },
    {
      id: 'stop', label: '停止决策', kind: 'gate',
      brief: '继续下一 step 还是收尾？',
      detail: '若还有 next-step 输入或继续工具调用则进入下一 step；自然停止且收件箱空 → agent/turn-stopping 检查 → turn/end。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
  ],
  edges: [
    { id: 'le-reactloop-turn', from: 'reactloop', to: 'turn', label: '驱动' },
    { id: 'le-turn-step', from: 'turn', to: 'step', label: '包含 1..n' },
    { id: 'le-step-durable', from: 'step', to: 'durable', label: '写日志' },
    { id: 'le-turn-durable', from: 'turn', to: 'durable', label: '写日志' },
    { id: 'le-live-durable', from: 'live', to: 'durable', label: '控制 vs 事实' },
    { id: 'le-reactloop-prestep', from: 'reactloop', to: 'prestep', label: '调用' },
    { id: 'le-prestep-prompt', from: 'prestep', to: 'prompt', label: '进入' },
    { id: 'le-prompt-request', from: 'prompt', to: 'request', label: '拼装' },
    { id: 'le-request-live', from: 'request', to: 'live', label: '扩展点' },
    { id: 'le-reactloop-schedule', from: 'reactloop', to: 'schedule', label: '调度' },
    { id: 'le-schedule-pipeline', from: 'schedule', to: 'pipeline', label: '执行' },
    { id: 'le-pipeline-durable', from: 'pipeline', to: 'durable', label: 'tool/result' },
    { id: 'le-reactloop-stop', from: 'reactloop', to: 'stop', label: '决策' },
  ],
  concepts: [
    {
      title: 'Turn → Step → Tool 三层嵌套',
      icon: '🌀',
      body: '一次提问 = 1 个 turn；一个 turn = 1..n 个 step（每次模型往返）；一个 step = 0..n 次工具调用。看日志时用这个三层结构定位问题。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
    {
      title: 'durable 与 live 的分工',
      icon: '⚡',
      body: 'durable 事件进 Session 日志，是“单一事实源”，可回放可审计；live 事件是运行时协调 API，决定下一步怎么做。UI 想拿到可回放的完整记录，应消费 session/event。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
    {
      title: 'agent/pre-step 是权威裁决',
      icon: '🚦',
      body: '预步决策是权威的：reject 则整批认领消息退回、turn 不消耗 step；enter 则进入。compaction（上下文压缩）就是在这里触发并在请求派生前清理历史。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
    {
      title: '并行还是排他，由工具自己声明',
      icon: '🧮',
      body: 'ToolExecutionMode = parallel | exclusive。isConcurrencySafe 为 true 才可并发，否则排他串行。tool-calls.ts 在 start 前重分类，避免边界竞争。',
      sources: [{ path: 'packages/core/tools/src/index.ts', label: 'index.ts#L344' }],
    },
    {
      title: 'assistant/message 是完整事实',
      icon: '📝',
      body: '即便内容为空或 max-tokens 截断，assistant/message 也会记录 usage 和 sourceEventSeqs（指向哪些 assistant/chunk）。空内容不进派生历史，但 durable 事件保留 —— 这对审计很关键。',
      sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }],
    },
  ],
  packages: [
    'packages/core/agent-loop',
    'packages/core/agent',
    'packages/core/system-prompt',
    'packages/core/tools',
    'packages/core/session',
    'packages/llm/llm',
    'packages/compaction/basic',
  ],
  docs: [
    { path: 'docs/agent-lifecycle.md', label: 'docs/agent-lifecycle.md' },
    { path: 'docs/architecture.md', label: 'docs/architecture.md' },
    { path: 'docs/subsystems/core.md', label: 'docs/subsystems/core.md' },
    { path: 'docs/tool-catalog.md', label: 'docs/tool-catalog.md' },
  ],
  relatedPages: ['/session', '/tools', '/cordis'],
}

export default agentloop
