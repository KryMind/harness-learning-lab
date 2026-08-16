import type { PageContent } from '../types'

export const workflow: PageContent = {
  id: 'workflow',
  title: 'Workflow',
  emoji: '⚙️',
  subtitle: '用脚本动态编排多个 Subagent（worker-thread 引擎）',
  hero: [
    'Workflow 是 Harness 的“编排层”：把一次复杂的多步任务写成脚本，在隔离的 worker-thread 里运行，脚本内可以 spawn 子代理、并行跑、串行管道，把结果聚合后返回。',
    '它与 Subagent 的关系：Subagent 是“单次委托”，Workflow 是“多代理编排”。workflow 引擎提供单例 engine/context，每次 run 用一个新的 node worker_thread；tool-workflow 把运行过程以 run-start/run-end 持久记录进 Session 日志。',
  ],
  learn: [
    'ctx.workflowEngine 与单例 context',
    'worker-thread 隔离执行模型',
    '脚本原语：agent / parallel / pipeline',
    'tool-workflow 与 tool-ralph 的差异',
    '运行记录：tool-workflow/run-start/run-end',
  ],
  nodes: [
    {
      id: 'engine', label: 'ctx.workflowEngine', kind: 'ctx',
      brief: 'WorkflowEngine：执行编排脚本',
      detail: 'packages/workflow/workflow 定义引擎：单例 engine 持有共享 context；每次 run 创建一个 worker-thread 执行脚本。',
      sources: [{ path: 'packages/workflow/workflow/src/index.ts', label: 'workflow/workflow' }],
    },
    {
      id: 'worker', label: 'worker-thread', kind: 'backend',
      brief: '每次 run 一个隔离线程',
      detail: 'workflow-worker-thread 是引擎后端：每个 run 用 node:worker_threads 跑一个 Worker，避免脚本阻塞主进程，也便于资源隔离。',
      sources: [{ path: 'packages/workflow/workflow-worker-thread', label: 'workflow-worker-thread' }],
    },
    {
      id: 'script', label: '编排脚本', kind: 'concept',
      brief: '模型编写的 JavaScript 编排脚本（script + meta + args）',
      detail: '脚本内可用 agent()（派生子代理）、parallel()（并行分支）、pipeline()（串行管道）、phase()/log()（阶段与叙述）等原语动态编排；以 return <json> 结尾。',
      docs: [{ path: 'docs/subsystems/workflow.md', label: 'workflow.md' }],
    },
    {
      id: 'agent', label: 'agent()', kind: 'concept',
      brief: '脚本里创建子代理执行子任务',
      detail: '在 workflow 脚本里调用 agent(...) 触发子代理执行，并拿到结构化结果，供后续步骤使用。',
      docs: [{ path: 'docs/subsystems/workflow.md', label: 'workflow.md' }],
    },
    {
      id: 'parallel', label: 'parallel()', kind: 'concept',
      brief: '并行分支',
      detail: '把多个独立子任务并行跑，全部完成后合并结果 —— 这正是“多代理并行研究”的实现方式。',
      docs: [{ path: 'docs/subsystems/workflow.md', label: 'workflow.md' }],
    },
    {
      id: 'pipeline', label: 'pipeline()', kind: 'concept',
      brief: '串行管道',
      detail: '前一步的输出作为后一步的输入，适合有依赖的流水线式编排。',
      docs: [{ path: 'docs/subsystems/workflow.md', label: 'workflow.md' }],
    },
    {
      id: 'tool-wf', label: 'tool-workflow', kind: 'tool',
      brief: '模型可调用的 workflow 工具',
      detail: '模型通过 tool-workflow 触发一次编排运行；运行以 tool-workflow/run-start、tool-workflow/run-end 持久记录进 Session 日志。',
      sources: [{ path: 'packages/workflow/tool-workflow', label: 'tool-workflow' }],
    },
    {
      id: 'run-rec', label: '运行记录', kind: 'event',
      brief: 'run-start / run-end 持久事件',
      detail: 'workflow 工具把运行开始与结束写入 Session 日志（可审计、可回放）；UI 插件 ui-workflow-run 展示运行轨迹。',
      sources: [{ path: 'packages/workflow/tool-workflow', label: 'tool-workflow' }, { path: 'packages/client/ui-workflow-run', label: 'ui-workflow-run' }],
    },
    {
      id: 'ralph', label: 'tool-ralph', kind: 'tool',
      brief: '对固定脚本反复迭代',
      detail: 'tool-ralph 针对“build-time 固定脚本”做多轮 Ralph 迭代（maxRounds: 64），适合需要持续修正的重型流程。',
      sources: [{ path: 'packages/workflow/tool-ralph', label: 'tool-ralph' }],
    },
    {
      id: 'subagent-dep', label: '依赖 Subagent', kind: 'concept',
      brief: 'workflow 脚本复用子代理 Provider',
      detail: 'workflow 里的 agent() 本质上仍走 ctx.subagents，因此 spawn/fork/ACP 等 Provider 都可用于工作流节点。',
      sources: [{ path: 'packages/workflow/workflow', label: 'workflow' }],
    },
  ],
  edges: [
    { id: 'we-engine-worker', from: 'engine', to: 'worker', label: '每次 run 一个' },
    { id: 'we-engine-script', from: 'engine', to: 'script', label: '执行' },
    { id: 'we-script-agent', from: 'script', to: 'agent', label: '原语' },
    { id: 'we-script-parallel', from: 'script', to: 'parallel', label: '原语' },
    { id: 'we-script-pipeline', from: 'script', to: 'pipeline', label: '原语' },
    { id: 'we-agent-subagent', from: 'agent', to: 'subagent-dep', label: '复用' },
    { id: 'we-tool-engine', from: 'tool-wf', to: 'engine', label: '触发' },
    { id: 'we-tool-rec', from: 'tool-wf', to: 'run-rec', label: '写日志' },
    { id: 'we-ralph-engine', from: 'ralph', to: 'engine', label: '多轮迭代' },
  ],
  concepts: [
    {
      title: '单例引擎 + 隔离线程',
      icon: '🧵',
      body: '引擎是单例，持有共享 context；每次 run 用一个 worker-thread，脚本跑在独立线程里 —— 隔离、可重入、不阻塞主循环。',
      sources: [{ path: 'packages/workflow/workflow-worker-thread', label: 'workflow-worker-thread' }],
    },
    {
      title: 'Workflow ⊃ Subagent',
      icon: '🪆',
      body: 'Workflow 是 Subagent 的编排者：脚本里 agent() 只是子代理的一次使用。想“批量并行研究多个文件” → parallel()；想“流水线式提炼” → pipeline()。',
      sources: [{ path: 'docs/subsystems/workflow.md', label: 'workflow.md' }],
    },
    {
      title: '运行可审计',
      icon: '🧾',
      body: 'tool-workflow 把 run-start / run-end 写进 Session 日志，与其它 durable 事件一样可回放、可审计 —— UI 的 ui-workflow-run 就是消费这些记录。',
      sources: [{ path: 'packages/workflow/tool-workflow', label: 'tool-workflow' }],
    },
    {
      title: '固定脚本多轮迭代',
      icon: '🔁',
      body: 'tool-ralph 对同一份固定脚本反复迭代（最多 64 轮），适合“一直修正直到达标”的自动化流程，与临时编排（tool-workflow）互补。',
      sources: [{ path: 'packages/workflow/tool-ralph', label: 'tool-ralph' }],
    },
  ],
  packages: [
    'packages/workflow/workflow',
    'packages/workflow/workflow-worker-thread',
    'packages/workflow/tool-workflow',
    'packages/workflow/tool-ralph',
    'packages/client/ui-workflow-run',
  ],
  docs: [
    { path: 'docs/subsystems/workflow.md', label: 'docs/subsystems/workflow.md' },
    { path: 'docs/subsystems/subagent.md', label: 'docs/subsystems/subagent.md' },
  ],
  relatedPages: ['/subagent', '/session', '/agent-loop'],
}

export default workflow
