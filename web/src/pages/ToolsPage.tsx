import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { tools } from '../content/tools'
import { lessonById } from '../course/lessons'

export default function ToolsPage() {
  return <KnowledgeGraphPage content={tools} lesson={lessonById('tools')} />
}
