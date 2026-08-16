import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { workflow } from '../content/workflow'
import { lessonById } from '../course/lessons'

export default function WorkflowPage() {
  return <KnowledgeGraphPage content={workflow} lesson={lessonById('workflow')} />
}
