import { agentloop } from '../content/agentloop'
import Mermaid from '../components/Mermaid'
import LessonPage from '../components/lesson/LessonPage'
import ConceptFlow, { type FlowStep } from '../components/lesson/ConceptFlow'
import { buildEvidences } from '../components/KnowledgeGraphPage'
import { lessonById } from '../course/lessons'
import { quizByLesson } from '../course/quizzes'
import Graph from '../components/Graph'
import NodeDrawer from '../components/NodeDrawer'
import { useState } from 'react'
import type { KGNode } from '../types'
import { useNavigate } from 'react-router-dom'

// 精简的核心循环（ConceptFlow 用，含分支决策）
const loopFlow: FlowStep[] = [
  { key: 'User', name: 'User', kind: 'start', desc: '一次用户任务（一次 Turn）从这里开始。', sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }] },
  { key: 'Turn Start', name: 'Turn Start', kind: 'action', desc: 'Driver 把 turn/start 追加进 Session 事件日志 —— 一次完整任务开始。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'Step Start', name: 'Step Start', kind: 'action', desc: '一次模型推理周期（Step）开始：组装 System Prompt、注入上下文。', sources: [{ path: 'packages/core/agent-loop/src/agent.ts', label: 'agent.ts' }] },
  { key: 'LLM', name: 'LLM Request', kind: 'action', desc: 'ctx.llm 发送请求给模型，模型决定：直接回答，还是调用工具继续。', sources: [{ path: 'packages/llm/llm/src/index.ts', label: 'llm/llm' }] },
  { key: 'Tool Call?', name: 'Tool Call?', kind: 'gate', desc: '模型回复里是否有 tool/call？这是循环的分叉点。', sources: [{ path: 'packages/core/agent-loop/src/tool-calls.ts', label: 'tool-calls.ts' }] },
  { key: 'Tool Execute', name: 'Tool Execute', kind: 'action', desc: '有工具调用：tools/execute 执行 bash / fs / subagent / workflow…', sources: [{ path: 'packages/core/tools/src/index.ts', label: 'core/tools/src/index.ts' }] },
  { key: 'Tool Result', name: 'Tool Result', kind: 'result', desc: 'Tool Result 会被写入当前 Agent 执行上下文，随后 Agent 开始下一 Step，模型根据最新结果决定是否继续调用工具。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
  { key: 'Next Step', name: 'Next Step', kind: 'action', desc: '进入下一个 Step → 回到 LLM，循环直到模型不再调用工具。', sources: [{ path: 'docs/agent-lifecycle.md', label: 'agent-lifecycle.md' }] },
  { key: 'Final', name: 'Final Answer', kind: 'end', desc: '没有工具调用：turn/end，最终回复返回给用户。', sources: [{ path: 'packages/core/session/src/known-event-types.ts', label: 'known-event-types.ts' }] },
]

const seq = `sequenceDiagram
  autonumber
  participant U as User
  participant A as ReactLoopAgent
  participant L as ctx.llm
  participant T as ctx.tools
  participant S as Session
  U->>A: followup(content)
  A->>S: turn/start
  A->>A: agent/pre-step 决策
  A->>S: step/start
  A->>L: agent/request + llm/stream
  L-->>A: 回复（含 tool/call ?）
  alt 调用工具
    A->>T: tool/call → execute → post-execute
    T-->>A: tool/result
    A->>S: tool/result → step/end → 下一 step
  else 直接回答
    A->>S: step/end
  end
  A->>S: turn/end
  A-->>U: 最终回复`

export default function AgentLoopPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<KGNode | null>(null)
  const lesson = lessonById('agent-loop')!

  return (
    <LessonPage
      lesson={lesson}
      page={agentloop}
      emoji={agentloop.emoji}
      subtitle={agentloop.subtitle}
      summary="模型不断在「继续思考 / 调用工具 / 获取结果 / 是否结束」之间循环，直到任务完成。"
      objectives={lesson.objectives}
      flow={{ steps: loopFlow, title: '一轮执行动态图', hint: '点击节点查看讲解与对应源码', interactive: true }}
      concepts={agentloop.concepts}
      evidences={buildEvidences(agentloop)}
      quiz={quizByLesson('agent-loop')}
    >
      <div className="section-title">
        <h2>⏱ 时序图</h2>
        <span className="hint">durable 事件进 Session 日志，live 事件是扩展点</span>
      </div>
      <Mermaid chart={seq} caption="Agent Loop 时序（简化）" />

      <div className="section-title">
        <h2>🗺 架构图</h2>
        <span className="hint">点击节点查看详情与源码</span>
      </div>
      <Graph
        nodes={agentloop.nodes}
        edges={agentloop.edges}
        onNodeClick={setSelected}
      />
      <NodeDrawer
        node={selected}
        onClose={() => setSelected(null)}
        onOpenSource={(path) => navigate(`/source?path=${encodeURIComponent(path)}`)}
      />
    </LessonPage>
  )
}
