import KnowledgeGraphPage from '../components/KnowledgeGraphPage'
import { skills } from '../content/skills'
import { lessonById } from '../course/lessons'

export default function SkillsPage() {
  return <KnowledgeGraphPage content={skills} lesson={lessonById('skills')} />
}
