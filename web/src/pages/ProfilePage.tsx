import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { profile } from '../content/profile'
import { lessonById } from '../course/lessons'

export default function ProfilePage() {
  return <KnowledgeGraphPage content={profile} lesson={lessonById('profile')} />
}
