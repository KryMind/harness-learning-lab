// ---------------------------------------------------------------------------
// Quizzes —— 每课 Checkpoint 小测（除 plugin-generator 外各 1 个 quiz）
// 所有题目的答案均以 web/src/content/*.ts 中已对照快照源码核实的实事为依据，
// 因此「答案可被当前快照源码验证」（Version Awareness 时 sourcePaths 参与比对）。
// 题型：single / multiple / boolean
// ---------------------------------------------------------------------------
import type { Quiz } from './types'

export const QUIZZES: Quiz[] = [
  {
    id: 'overview-basic',
    lessonId: 'overview',
    questions: [
      {
        id: 'overview-q1',
        type: 'single',
        question: 'Harness 的核心设计理念是下面哪一种？',
        options: [
          { id: 'a', text: '把所有功能内建在一个大而全的程序里' },
          { id: 'b', text: 'Everything is a plugin —— 一个 Cordis 宿主 + 一组功能插件' },
          { id: 'c', text: '纯前端框架，不依赖后端运行时' },
          { id: 'd', text: '数据库驱动的微服务架构' },
        ],
        answer: ['b'],
        explanation:
          'Harness 是「一个 Cordis 宿主 + 一组功能插件」：核心执行、工具、会话、沙箱、Web UI 全部以插件形式组合，没有「内建功能」。',
        sourcePaths: ['docs/architecture.md'],
      },
      {
        id: 'overview-q2',
        type: 'multiple',
        question: '能力 Seam（Definition / Provider / Consumer）在 Skills 上的对应是哪些？',
        options: [
          { id: 'a', text: 'skill 服务定义 ctx.skills（Definition）' },
          { id: 'b', text: 'skill-filesystem 提供本地技能（Provider）' },
          { id: 'c', text: 'tool-skill 把技能目录暴露给模型（Consumer）' },
          { id: 'd', text: 'dsh CLI 是唯一的 Provider' },
        ],
        answer: ['a', 'b', 'c'],
        explanation:
          'Skills 是最典型的 Seam 实例：skill 定义接口，skill-filesystem 是实现（Provider），tool-skill 是消费方（Consumer）。CLI 不是 Provider。',
        sourcePaths: ['docs/subsystems/skills.md'],
      },
      {
        id: 'overview-q3',
        type: 'boolean',
        question: 'Session 是单一事实源：模型看到的 LLM 历史是从 Session 事件日志「派生」的投影，而不是单独存储的消息数组。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: '所有 turn/step/tool/assistant 事件都追加进 append-only 日志，LLM 历史由日志派生（deriveMessages）。',
        sourcePaths: ['packages/core/session/src/types.ts'],
      },
    ],
  },

  {
    id: 'cordis-basic',
    lessonId: 'cordis',
    questions: [
      {
        id: 'cordis-q1',
        type: 'single',
        question: '插件之间的协作不直接 import，而是通过什么进行？',
        options: [
          { id: 'a', text: 'ctx（上下文）上注册的服务' },
          { id: 'b', text: 'npm registry 全局共享' },
          { id: 'c', text: '共享数据库连接池' },
          { id: 'd', text: 'WebSocket 广播' },
        ],
        answer: ['a'],
        explanation:
          '每个插件拿到一个 ctx，ctx 上挂满服务（ctx.llm / ctx.tools / ctx.sessions / ctx.skills…），插件通过 ctx 读写能力，保证可替换性。',
        sourcePaths: ['vendor/cordis/src/context.ts', 'docs/cordis-api/context.md'],
      },
      {
        id: 'cordis-q2',
        type: 'multiple',
        question: 'Cordis 事件分发有哪些模式？',
        options: [
          { id: 'a', text: 'waterfall（瀑布式，可拦截可改参数）' },
          { id: 'b', text: 'parallel（并行广播）' },
          { id: 'c', text: 'serial（串行链式）' },
          { id: 'd', text: 'broadcast-only（只广播不可拦截）' },
        ],
        answer: ['a', 'b', 'c'],
        explanation:
          '事件系统是插件协作的枢纽：waterfall 可拦截、parallel 并行广播、serial 串行链式。Agent Loop 的大量扩展点挂在 waterfall 上。',
        sourcePaths: ['vendor/cordis/src/events.ts', 'docs/cordis-api/events.md'],
      },
      {
        id: 'cordis-q3',
        type: 'boolean',
        question: 'Scope（作用域）让多个 Agent 可以共享同一个宿主，但隔离各自的上下文（服务、配置、事件）。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: 'core/scope 提供作用域层，Scoped<T> 包装保证多 Agent 并行时互不串扰，子代理与工作流才能安全并行。',
        sourcePaths: ['docs/subsystems/scope.md', 'packages/core/scope/src/index.ts'],
      },
    ],
  },

  {
    id: 'profile-basic',
    lessonId: 'profile',
    questions: [
      {
        id: 'profile-q1',
        type: 'single',
        question: '一个 Bundle 的「实质」是什么？',
        options: [
          { id: 'a', text: '一段核心运行时代码' },
          { id: 'b', text: 'manifest 中 dsh.bundle.patch 指向的 cordis.patch.yml 清单' },
          { id: 'c', text: '数据库 schema 迁移脚本' },
          { id: 'd', text: '一份测试套件' },
        ],
        answer: ['b'],
        explanation:
          'Bundle 包本身几乎不含运行时代码，实质是 manifest 里 dsh.bundle.patch 字段指向的 cordis.patch.yml，由 profile composer 解析合并。',
        sourcePaths: ['packages/bundle/base/cordis.patch.yml', 'packages/bundle/base/src/index.ts'],
      },
      {
        id: 'profile-q2',
        type: 'single',
        question: '打印当前机器实际启动的完整插件树的命令是？',
        options: [
          { id: 'a', text: 'dsh --profile web --dump-config' },
          { id: 'b', text: 'dsh list --plugins' },
          { id: 'c', text: 'dsh --init --reset' },
          { id: 'd', text: 'dsh --version --verbose' },
        ],
        answer: ['a'],
        explanation:
          '--dump-config 解析出完整插件树（profile → bundle → 每个插件的 id/name/config），是理解「这台机器上 Harness 到底长什么样」的最快路径。',
        sourcePaths: ['apps/cli/src/dump-config.ts'],
      },
      {
        id: 'profile-q3',
        type: 'boolean',
        question: '同一插件行 id 在多层 patch 中出现时采用「后写覆盖」（last-write-wins），即后面的 layer 整个替换该行的 config，而不是逐字段合并。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: '正因为后写覆盖，mode bundle 与用户 profile 才能精确覆盖 dsh-base 的默认值。',
        sourcePaths: ['packages/bundle/base/cordis.patch.yml'],
      },
    ],
  },

  {
    id: 'agent-loop-basic',
    lessonId: 'agent-loop',
    questions: [
      {
        id: 'agent-loop-q1',
        type: 'single',
        question: 'Agent Loop 中，模型回复里带 tool/call 时的执行路径是？',
        options: [
          { id: 'a', text: '直接返回最终答案' },
          { id: 'b', text: '进入工具执行 → Tool Result 写回上下文 → 下一 Step 回到 LLM' },
          { id: 'c', text: '立即结束整个会话' },
          { id: 'd', text: '清空 Session 事件日志' },
        ],
        answer: ['b'],
        explanation:
          'Tool Call? 是循环的分叉点：有工具调用则执行工具，Tool Result 进入下一轮执行上下文，模型再次决定是否继续，直到不再调用工具才给最终答案。',
        sourcePaths: ['packages/core/agent-loop/src/tool-calls.ts', 'packages/core/agent-loop/src/agent.ts'],
      },
      {
        id: 'agent-loop-q2',
        type: 'multiple',
        question: '以下哪些事件属于 durable（进 Session 日志、可回放）？',
        options: [
          { id: 'a', text: 'turn/start、turn/end' },
          { id: 'b', text: 'step/start、step/end' },
          { id: 'c', text: 'tool/call、tool/result' },
          { id: 'd', text: 'agent/pre-step 的决策逻辑' },
        ],
        answer: ['a', 'b', 'c'],
        explanation:
          'durable 事件决定「发生了什么」（turn/*、step/*、tool/* 进日志可回放）；agent/* 等 live 事件决定「下一步怎么做」，是瀑布式扩展点而非日志事实。',
        sourcePaths: ['docs/agent-lifecycle.md', 'packages/core/session/src/known-event-types.ts'],
      },
      {
        id: 'agent-loop-q3',
        type: 'boolean',
        question: '一轮执行由 packages/core/agent-loop/src/agent.ts 的 ReactLoopAgent 驱动，工具并行调度在 tool-calls.ts。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: 'ReactLoopAgent 负责 turn → step → LLM → tool 循环；tool-calls.ts 负责工具的有界滚动池并行调度。',
        sourcePaths: ['packages/core/agent-loop/src/agent.ts'],
      },
    ],
  },

  {
    id: 'session-basic',
    lessonId: 'session',
    questions: [
      {
        id: 'session-q1',
        type: 'single',
        question: 'Session 的核心数据结构是什么？',
        options: [
          { id: 'a', text: '可变聊天记录数组' },
          { id: 'b', text: 'append-only 的 SessionEvent 日志' },
          { id: 'c', text: '内存 Map（重启即失）' },
          { id: 'd', text: '单个大 JSON 文件' },
        ],
        answer: ['b'],
        explanation:
          'Session 是 append-only 的 SessionEvent 日志，所有 turn/step/tool/assistant 事件追加进日志；这是可恢复、可回放、可审计的根基。',
        sourcePaths: ['packages/core/session/src/index.ts'],
      },
      {
        id: 'session-q2',
        type: 'single',
        question: 'dsh-base 默认的 Session 持久化后端是？',
        options: [
          { id: 'a', text: 'SQLite（全文检索）' },
          { id: 'b', text: 'JSONL（体积大时 Zstd 压缩）' },
          { id: 'c', text: 'PostgreSQL' },
          { id: 'd', text: 'Redis Streams' },
        ],
        answer: ['b'],
        explanation:
          'session-persistence-jsonl 是默认后端，追加一行一个 JSON 事件；SQLite 是面向搜索/统计/审计的可选后端，需显式开启内容搜索。',
        sourcePaths: ['packages/session/session-persistence-jsonl'],
      },
      {
        id: 'session-q3',
        type: 'boolean',
        question: 'LLM 请求的历史是每次从日志按规则派生（deriveMessages）的投影，而不是缓存下来的独立数组。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: '历史由日志投影而来（surface.ts / preparation.ts），所以压缩与修剪只影响「派生结果」而保留完整事实。',
        sourcePaths: ['packages/core/session/src/surface.ts'],
      },
    ],
  },

  {
    id: 'tools-basic',
    lessonId: 'tools',
    questions: [
      {
        id: 'tools-q1',
        type: 'single',
        question: '官方推荐的工具声明与注册写法是？',
        options: [
          { id: 'a', text: '手写裸 JSON Schema 再硬编码进核心包' },
          { id: 'b', text: 'defineTool() 构造工具，再 ctx.tools.register() 注册' },
          { id: 'c', text: '直接调用 fetch 封装外部 API' },
          { id: 'd', text: '修改 packages/core/tools 源码加分支' },
        ],
        answer: ['b'],
        explanation:
          'defineTool()（tools/schema.ts）声明名称、描述、入参 schema、规范输出与 execute；随后用 ctx.tools.register() 挂载到运行时。',
        sourcePaths: ['packages/core/tools/src/schema.ts', 'packages/core/tools/src/index.ts'],
      },
      {
        id: 'tools-q2',
        type: 'single',
        question: '权限 / 审批 / 守卫（approval、permission-presets、guard）在哪个阶段汇合裁决？',
        options: [
          { id: 'a', text: 'tools/pre-execute（预执行裁决）' },
          { id: 'b', text: 'tools/execute（执行）' },
          { id: 'c', text: 'tools/post-execute（后处理）' },
          { id: 'd', text: 'tools/result（结果通知）' },
        ],
        answer: ['a'],
        explanation:
          'pre-execute 是 waterfall 扩展点，approval 插件、权限预设、guard 都挂在这里，返回 PreToolDecision（允许/拒绝/询问）。',
        sourcePaths: ['packages/core/tools/src/index.ts', 'docs/subsystems/approval.md'],
      },
      {
        id: 'tools-q3',
        type: 'boolean',
        question: '工具自己声明 isConcurrencySafe；为 true 才能 parallel 并行执行，否则 exclusive 串行，防止数据竞争。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: 'ToolExecutionMode = { kind: parallel } | { kind: exclusive }，isConcurrencySafe 决定是否可并行。',
        sourcePaths: ['packages/core/tools/src/index.ts', 'packages/core/agent-loop/src/tool-calls.ts'],
      },
    ],
  },

  {
    id: 'skills-basic',
    lessonId: 'skills',
    questions: [
      {
        id: 'skills-q1',
        type: 'single',
        question: 'ctx.skills 的主要角色是什么？',
        options: [
          { id: 'a', text: '直接执行 LLM 推理' },
          { id: 'b', text: 'Skill Registry：注册、按作用域查询、列出技能目录' },
          { id: 'c', text: 'Session 事件存储' },
          { id: 'd', text: 'Web UI 路由' },
        ],
        answer: ['b'],
        explanation:
          'packages/skill/skill 定义 SkillRegistry 服务：注册技能、按作用域查询、列出目录，是能力缝的 Definition 角色。',
        sourcePaths: ['packages/skill/skill/src/index.ts'],
      },
      {
        id: 'skills-q2',
        type: 'multiple',
        question: 'Skills 的能力 Seam 三角色分别对应哪些包？',
        options: [
          { id: 'a', text: 'skill 服务定义（Definition）' },
          { id: 'b', text: 'skill-filesystem（Provider，本地技能）' },
          { id: 'c', text: 'tool-skill（Consumer，暴露给模型）' },
          { id: 'd', text: 'skill-badge 是唯一的 Provider' },
        ],
        answer: ['a', 'b', 'c'],
        explanation:
          'skill 定义接口、skill-filesystem 提供本地技能目录、tool-skill 作为 Consumer 把目录暴露给模型。badge 只是另一类 Provider/标记。',
        sourcePaths: ['docs/subsystems/skills.md', 'packages/skill/tool-skill'],
      },
      {
        id: 'skills-q3',
        type: 'boolean',
        question: '模型看到的技能目录是 name + description 白名单，只有被显式放行的技能描述才进入模型视野。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: 'Catalog 是暴露给模型的白名单，避免系统提示词臃肿；真正加载（loader）时才把指令读进上下文。',
        sourcePaths: ['packages/skill/tool-skill'],
      },
    ],
  },

  {
    id: 'subagent-basic',
    lessonId: 'subagent',
    questions: [
      {
        id: 'subagent-q1',
        type: 'single',
        question: 'spawn 与 fork 的区别是？',
        options: [
          { id: 'a', text: 'spawn 是全新子代理（独立上下文），fork 继承父上下文' },
          { id: 'b', text: '两者完全相同' },
          { id: 'c', text: 'fork 只能用于远程后端' },
          { id: 'd', text: 'spawn 不能后台运行' },
        ],
        answer: ['a'],
        explanation:
          'spawn = 从零开始、独立上下文，适合并行拆分任务；fork = 复用父会话历史（Session seed 派生），适合延续父的思维脉络。默认 tool-subagent 用 spawn。',
        sourcePaths: ['packages/subagent/subagent-spawn-in-process', 'packages/subagent/subagent-fork-in-process'],
      },
      {
        id: 'subagent-q2',
        type: 'single',
        question: '主 Agent 与「持续运行的后台子代理」通信用的工具是？',
        options: [
          { id: 'a', text: 'tool-subagent-control（list-agents / send_message）' },
          { id: 'b', text: 'tool-subagent-report（子代理回报）' },
          { id: 'c', text: 'tool-workflow（编排脚本）' },
          { id: 'd', text: 'tool-bash（shell）' },
        ],
        answer: ['a'],
        explanation:
          'spawn 子代理默认可后台续跑（continuable），主 Agent 通过 tool-subagent-control 的 list / send_message 取回或指挥它。',
        sourcePaths: ['packages/subagent/tool-subagent-control'],
      },
      {
        id: 'subagent-q3',
        type: 'boolean',
        question: '子代理的创建（subagent/descriptor）与回报（report）都是 durable 事件，进 Session 日志，因此可审计、可回放。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: '子代理身份与回报都作为 durable 事件写入日志，ui-subagent 据此展示执行轨迹。',
        sourcePaths: ['packages/core/session/src/known-event-types.ts'],
      },
    ],
  },

  {
    id: 'workflow-basic',
    lessonId: 'workflow',
    questions: [
      {
        id: 'workflow-q1',
        type: 'single',
        question: 'Workflow 编排脚本在什么环境下运行？',
        options: [
          { id: 'a', text: '主进程内直接运行' },
          { id: 'b', text: '每次 run 一个隔离的 worker-thread' },
          { id: 'c', text: '浏览器端运行' },
          { id: 'd', text: '独立容器 / VM' },
        ],
        answer: ['b'],
        explanation:
          '引擎是单例、持有共享 context；workflow-worker-thread 每次 run 用 node:worker_threads 跑一个 Worker，隔离、可重入、不阻塞主循环。',
        sourcePaths: ['packages/workflow/workflow-worker-thread'],
      },
      {
        id: 'workflow-q2',
        type: 'multiple',
        question: '编排脚本里可用的原语包括哪些？',
        options: [
          { id: 'a', text: 'agent()（派生子代理）' },
          { id: 'b', text: 'parallel()（并行分支）' },
          { id: 'c', text: 'pipeline()（串行管道）' },
          { id: 'd', text: 'sql()（直接查数据库）' },
        ],
        answer: ['a', 'b', 'c'],
        explanation: '脚本以 script + meta + args 描述，用 agent/parallel/pipeline 等原语动态编排，以 return <json> 结尾。',
        sourcePaths: ['docs/subsystems/workflow.md'],
      },
      {
        id: 'workflow-q3',
        type: 'boolean',
        question: 'tool-ralph 针对「build-time 固定脚本」做多轮迭代（maxRounds: 64），与临时编排的 tool-workflow 互补。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: 'tool-workflow 是模型临时触发一次编排；tool-ralph 对固定脚本反复修正直到达标，两者互补。',
        sourcePaths: ['packages/workflow/tool-ralph', 'packages/workflow/tool-workflow'],
      },
    ],
  },

  {
    id: 'permission-basic',
    lessonId: 'permission',
    questions: [
      {
        id: 'permission-q1',
        type: 'single',
        question: 'dsh-base 默认的 permission mode 是？',
        options: [
          { id: 'a', text: 'read-only（只读）' },
          { id: 'b', text: 'workspace-write（写工作区 + 询问审批）' },
          { id: 'c', text: 'danger-full-access（全开不询问）' },
          { id: 'd', text: 'no-permission（完全无沙箱）' },
        ],
        answer: ['b'],
        explanation:
          'dsh-base 默认 sandbox: workspace-write、approval: ask；只有危险模式 danger-full-access 才 approval: never。',
        sourcePaths: ['packages/bundle/base/cordis.patch.yml'],
      },
      {
        id: 'permission-q2',
        type: 'multiple',
        question: '权限预设（permission-presets）定义的三档包括哪些？',
        options: [
          { id: 'a', text: 'read-only（sandbox: read-only, approval: ask）' },
          { id: 'b', text: 'workspace-write（sandbox: workspace-write, approval: ask）' },
          { id: 'c', text: 'danger-full-access（sandbox: danger-full-access, approval: never）' },
          { id: 'd', text: 'custom-sandbox（完全自定义）' },
        ],
        answer: ['a', 'b', 'c'],
        explanation: '三档预设覆盖绝大多数部署场景，用 DSH_PERMISSION_MODE 选择默认档即可。',
        sourcePaths: ['packages/interaction/permission-presets'],
      },
      {
        id: 'permission-q3',
        type: 'boolean',
        question: 'fail closed 原则：沙箱无法建立时抛 SANDBOX_UNAVAILABLE，流程失败而非悄悄放开权限。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: '官方宁可让任务失败，也不在无沙箱状态下放开文件访问 —— 这是安全底线。',
        sourcePaths: ['docs/subsystems/sandbox.md'],
      },
    ],
  },

  {
    id: 'webui-basic',
    lessonId: 'web-ui',
    questions: [
      {
        id: 'webui-q1',
        type: 'single',
        question: 'UI 插件把自己的组件挂到界面树上的方式是？',
        options: [
          { id: 'a', text: 'ctx.slots.register(key, Component, children?)' },
          { id: 'b', text: '直接改写 index.html 静态文件' },
          { id: 'c', text: '在核心包里硬编码组件' },
          { id: 'd', text: '通过 CSS 覆盖现成页面' },
        ],
        answer: ['a'],
        explanation:
          '和后端服务一样，UI 也走插件化：UI 插件通过 ctx.slots.register 向插槽树注册组件，root slot 挂载整棵树。',
        sourcePaths: ['packages/client/ui-slots'],
      },
      {
        id: 'webui-q2',
        type: 'single',
        question: '负责渲染用户消息、assistant/chunk 打字机与工具调用卡片的 UI 插件是？',
        options: [
          { id: 'a', text: 'ui-conversation（对话流）' },
          { id: 'b', text: 'ui-sidebar（侧边栏）' },
          { id: 'c', text: 'ui-slots（插槽基础设施）' },
          { id: 'd', text: 'ui-workflow-run（工作流运行视图）' },
        ],
        answer: ['a'],
        explanation: 'ui-conversation 渲染会话消息流，消费 session/event 的投影；ui-tool 负责工具调用与审批卡片。',
        sourcePaths: ['packages/client/ui-conversation'],
      },
      {
        id: 'webui-q3',
        type: 'boolean',
        question: 'Slots 是一个 DAG：父 slot 声明子 slot，插件向任意 slot 注册组件，最终由 root slot 挂载成完整界面。',
        options: [
          { id: 'true', text: '正确' },
          { id: 'false', text: '错误' },
        ],
        answer: ['true'],
        explanation: '应用启动时把 root slot 挂到 #app，所有 UI 插件注册的组件最终在这棵 DAG 树上就位。',
        sourcePaths: ['packages/client/ui-slots', 'packages/client/ui-layout'],
      },
    ],
  },
]

export const quizByLesson = (lessonId: string) => QUIZZES.find((q) => q.lessonId === lessonId)
