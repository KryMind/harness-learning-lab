import { X } from 'lucide-react'
import type { KGNode } from '../types'
import { KIND_LABEL, KIND_EMOJI } from './Graph'
import SourceChips from './SourceChips'
import SourceViewer from './SourceViewer'

interface Props {
  node: KGNode | null
  onClose: () => void
  /** 跳转源码浏览器 */
  onOpenSource?: (path: string) => void
}

export default function NodeDrawer({ node, onClose, onOpenSource }: Props) {
  if (!node) return null
  const sources = node.sources ?? []
  const docs = node.docs ?? []
  const sourcePath = sources[0]?.path

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <button className="icon-btn drawer-close" onClick={onClose}><X size={16} /></button>
        <div className="drawer-head">
          <span className="ic">{node.icon ?? KIND_EMOJI[node.kind]}</span>
          <div>
            <h3>{node.label}</h3>
            <span className="badge info">{KIND_LABEL[node.kind]}</span>
          </div>
        </div>
        <div className="drawer-body">
          {node.detail && (
            <>
              <h4>是什么</h4>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{node.detail}</p>
            </>
          )}

          {sources.length > 0 && (
            <>
              <h4>相关源码</h4>
              <SourceChips sources={sources} onOpen={onOpenSource} />
            </>
          )}

          {docs.length > 0 && (
            <>
              <h4>相关文档</h4>
              <SourceChips sources={docs} onOpen={onOpenSource} kind="doc" />
            </>
          )}

          {sourcePath && (
            <>
              <h4>源码预览</h4>
              <SourceViewer path={sourcePath} height={300} showHeader={false} />
            </>
          )}
        </div>
      </div>
    </>
  )
}
