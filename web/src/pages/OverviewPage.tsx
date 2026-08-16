import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { overview } from '../content/overview'
import { lessonById } from '../course/lessons'

export default function OverviewPage() {
  return <KnowledgeGraphPage content={overview} lesson={lessonById('overview')} />
}
