import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { webui } from '../content/webui'
import { lessonById } from '../course/lessons'

export default function WebUIPage() {
  return <KnowledgeGraphPage content={webui} lesson={lessonById('web-ui')} />
}
