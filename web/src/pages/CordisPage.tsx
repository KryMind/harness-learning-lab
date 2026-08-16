import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { cordis } from '../content/cordis'
import { lessonById } from '../course/lessons'

export default function CordisPage() {
  return <KnowledgeGraphPage content={cordis} lesson={lessonById('cordis')} />
}
