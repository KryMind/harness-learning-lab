import { useNavigate } from 'react-router-dom'
import type { PageContent, KGNode } from '../types'
import type { Lesson } from '../course/types'
import PageHero from './PageHero'
import Graph from './Graph'
import ConceptCards from './ConceptCards'
import SourceChips from './SourceChips'
import Mermaid from './Mermaid'
import { useData } from '../data'
import { useState } from 'react'
import NodeDrawer from './NodeDrawer'
import LessonPage, { type LessonContent } from './lesson/LessonPage'
import type { Evidence } from './lesson/SourceEvidence'

interface Props {
  content: PageContent
  graphTitle?: string
  /** 若提供，则整个页面用 LessonPage 课程骨架包裹（Phase 2 课程页统一接入） */
  lesson?: Lesson
}

/** 从 page.nodes 的 sources 收集去重的源码证据（最多 5 个） */
export function buildEvidences(content: PageContent): Evidence[] {
  const seen = new Set<string>()
  const out: Evidence[] = []
  for (const n of content.nodes ?? []) {
    for (const s of n.sources ?? []) {
      if (!s.path || seen.has(s.path)) continue
      seen.add(s.path)
      out.push({ path: s.path, label: s.label })
      if (out.length >= 5) return out
    }
  }
  return out
}

export default function KnowledgeGraphPage({ content, graphTitle, lesson }: Props) {
  const navigate = useNavigate()
  const { packageByDir } = useData()
  const [selected, setSelected] = useState<KGNode | null>(null)

  const openSource = (path: string) => navigate(`/source?path=${encodeURIComponent(path)}`)
  const openPackage = (dir: string) => navigate(`/packages?dir=${encodeURIComponent(dir)}`)

  const relatedPkgs = (content.packages ?? [])
    .map((d) => packageByDir(d))
    .filter((p): p is NonNullable<typeof p> => !!p)

  // 非课程页：原样渲染
  if (!lesson) {
    return (
      <div className="page">
        <PageHero content={content} />

        <div className="section-title">
          <h2>🗺 架构图</h2>
          <span className="hint">{graphTitle ?? '点击节点查看详情与源码'}</span>
        </div>
        <Graph nodes={content.nodes} edges={content.edges} onNodeClick={setSelected} />
        <NodeDrawer node={selected} onClose={() => setSelected(null)} onOpenSource={openSource} />

        {content.mermaid && (
          <>
            <div className="section-title">
              <h2>⏱ 时序 / 生命周期</h2>
              <span className="hint">{content.mermaidCaption}</span>
            </div>
            <Mermaid chart={content.mermaid} caption={content.mermaidCaption} />
          </>
        )}

        {content.concepts.length > 0 && (
          <>
            <div className="section-title">
              <h2>💡 关键概念</h2>
              <span className="hint">点击源码引用可直接跳转</span>
            </div>
            <ConceptCards concepts={content.concepts} onOpenSource={openSource} />
          </>
        )}

        {relatedPkgs.length > 0 && (
          <>
            <div className="section-title">
              <h2>📦 相关包</h2>
            </div>
            <div className="cards">
              {relatedPkgs.map((p) => (
                <div className="card" key={p.dir} style={{ cursor: 'pointer' }} onClick={() => openPackage(p.dir)}>
                  <div className="card-head">
                    <span className="ic">📦</span>
                    <span>{p.name}</span>
                  </div>
                  <p className="card-body">{p.description || p.dir}</p>
                  <div className="src-list">
                    <span className="badge info mono">{p.dir}</span>
                    <span className="badge">{p.srcFiles.length} 个源码文件</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {content.docs && content.docs.length > 0 && (
          <>
            <div className="section-title">
              <h2>📚 官方文档</h2>
            </div>
            <SourceChips sources={content.docs} onOpen={openSource} kind="doc" />
          </>
        )}

        {content.relatedPages && content.relatedPages.length > 0 && (
          <>
            <div className="section-title">
              <h2>🔗 继续学习</h2>
            </div>
            <div className="src-list">
              {content.relatedPages.map((r) => (
                <button key={r} className="src-chip" onClick={() => navigate(r)}>
                  → {r}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // 课程页：包 LessonPage 骨架（4 必选 + 2 可选）
  // children 只保留「架构图 + 时序图」富内容；PageHero/概念卡/相关包/继续学习由 LessonPage 统一呈现，避免重复。
  const lessonContent: LessonContent = {
    lesson,
    page: content,
    emoji: content.emoji,
    subtitle: content.subtitle,
    summary: (content.hero ?? []).join(' ').slice(0, 160) || lesson.description,
    objectives: content.learn,
    concepts: content.concepts,
    evidences: buildEvidences(content),
  }

  return (
    <LessonPage {...lessonContent}>
      <div className="section-title">
        <h2>🗺 架构图</h2>
        <span className="hint">{graphTitle ?? '点击节点查看详情与源码'}</span>
      </div>
      <Graph nodes={content.nodes} edges={content.edges} onNodeClick={setSelected} />
      <NodeDrawer node={selected} onClose={() => setSelected(null)} onOpenSource={openSource} />

      {content.mermaid && (
        <>
          <div className="section-title">
            <h2>⏱ 时序 / 生命周期</h2>
            <span className="hint">{content.mermaidCaption}</span>
          </div>
          <Mermaid chart={content.mermaid} caption={content.mermaidCaption} />
        </>
      )}
    </LessonPage>
  )
}
