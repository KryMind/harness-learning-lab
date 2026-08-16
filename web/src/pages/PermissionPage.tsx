import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { permission } from '../content/permission'
import { lessonById } from '../course/lessons'

export default function PermissionPage() {
  return <KnowledgeGraphPage content={permission} lesson={lessonById('permission')} />
}
