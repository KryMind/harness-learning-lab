import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { session } from '../content/session'
import { lessonById } from '../course/lessons'

export default function SessionPage() {
  return <KnowledgeGraphPage content={session} lesson={lessonById('session')} />
}
