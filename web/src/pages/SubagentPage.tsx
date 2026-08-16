import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { subagent } from '../content/subagent'
import { lessonById } from '../course/lessons'

export default function SubagentPage() {
  return <KnowledgeGraphPage content={subagent} lesson={lessonById('subagent')} />
}
