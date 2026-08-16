import { useNavigate } from 'react-router-dom'
import { agentloop, loopSteps } from '../content/agentloop'
import PageHero from '../components/PageHero'
import LoopTimeline from '../components/LoopTimeline'
import Mermaid from '../components/Mermaid'
import KnowledgeGraphPage from '../components/KnowledgeGraphPage'

const seq = `sequenceDiagram
  autonumber
  participant U as User
  participant A as ReactLoopAgent
  participant P as ctx.systemPrompt
  participant L as ctx.llm
  participant T as ctx.tools
  participant S as Session
  U->>A: followup(content)
  A->>S: turn/start
  A->>A: agent/pre-step 决策
  A->>S: step/start
  A->>P: system-prompt/assemble
  P-->>A: 拼好的 System Prompt
  A->>L: agent/request + llm/stream
  L-->>A: StreamChunk*
  A->>S: assistant/chunk* / assistant/message
  A->>T: tool/call + executionMode 调度
  T->>T: pre-execute(审批/权限) → execute → post-execute
  T-->>A: tool/result
  A->>S: tool/result
  A->>S: step/end
  A->>A: 还有下一步？(agent/pre-step)
  A->>S: turn/end
  A-->>U: 最终回复`

export default function AgentLoopPage() {
  const navigate = useNavigate()
  const openSource = (path: string) => navigate(`/source?path=${encodeURIComponent(path)}`)

  return (
    <div className="page">
      <PageHero content={agentloop} />

      <div className="section-title">
        <h2>▶️ 一轮执行动画</h2>
        <span className="hint">点击节点可查看详情与源码；播放 / 步进 / 变速</span>
      </div>
      <LoopTimeline steps={loopSteps} onOpenSource={openSource} />

      <div className="section-title">
        <h2>⏱ 时序图</h2>
        <span className="hint">durable 事件进 Session 日志，live 事件是扩展点</span>
      </div>
      <Mermaid chart={seq} caption="Agent Loop 时序（简化）" />

      <div style={{ height: 40 }} />
      <KnowledgeGraphPage content={agentloop} graphTitle="节点均可点击查看源码" />
    </div>
  )
}
