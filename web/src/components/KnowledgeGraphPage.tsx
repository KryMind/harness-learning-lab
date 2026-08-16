import { useNavigate } from 'react-router-dom'
import type { PageContent } from '../types'
import PageHero from './PageHero'
import Graph from './Graph'
import ConceptCards from './ConceptCards'
import SourceChips from './SourceChips'
import Mermaid from './Mermaid'
import { useData } from '../data'
import { useState } from 'react'
import NodeDrawer from './NodeDrawer'
import type { KGNode } from '../types'

interface Props {
  content: PageContent
  graphTitle?: string
}

export default function KnowledgeGraphPage({ content, graphTitle }: Props) {
  const navigate = useNavigate()
  const { packageByDir } = useData()
  const [selected, setSelected] = useState<KGNode | null>(null)

  const openSource = (path: string) => navigate(`/source?path=${encodeURIComponent(path)}`)
  const openPackage = (dir: string) => navigate(`/packages?dir=${encodeURIComponent(dir)}`)

  const relatedPkgs = (content.packages ?? [])
    .map((d) => packageByDir(d))
    .filter((p): p is NonNullable<typeof p> => !!p)

  return (
    <div className="page">
      <PageHero content={content} />

      <div className="section-title">
        <h2>🗺 架构图</h2>
        <span className="hint">{graphTitle ?? '点击节点查看详情与源码'}</span>
      </div>
      <Graph
        nodes={content.nodes}
        edges={content.edges}
        onNodeClick={setSelected}
      />
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
