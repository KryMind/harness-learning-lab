import { useMemo } from 'react'
import { X, FolderOpen } from 'lucide-react'
import type { KGNode } from '../types'
import { KIND_LABEL, KIND_EMOJI } from './Graph'
import SourceChips from './SourceChips'
import SourceViewer from './SourceViewer'
import { useData } from '../data'

interface Props {
  node: KGNode | null
  onClose: () => void
  /** 跳转源码浏览器 */
  onOpenSource?: (path: string) => void
}

// 目录 → 代表源码文件解析：先按优先级匹配 src/index.ts → src/index.tsx → README.md → package.json，
// 再回退到目录内第一个非 test/spec 的 ts/tsx；全部失败则返回 null（由 UI 提供「打开源码目录」入口）
const DIR_CANDIDATES = ['src/index.ts', 'src/index.tsx', 'README.md', 'package.json']
const CODE_EXTS = ['ts', 'tsx']

function cleanRef(p: string): string {
  // 去掉锚点（#section）与 glob 尾缀（**）
  return p.split('#')[0].replace(/\*\*\/?$/, '')
}

function resolveSourcePath(
  path: string,
  fileSet: Set<string>,
  filePaths: string[],
): { resolved: string | null; browse: string } {
  const base = cleanRef(path)
  if (fileSet.has(base)) return { resolved: base, browse: base }
  for (const c of DIR_CANDIDATES) {
    const hit = base + '/' + c
    if (fileSet.has(hit)) return { resolved: hit, browse: base }
  }
  const firstCode = filePaths
    .filter((f) => f.startsWith(base + '/'))
    .sort()
    .find((f) => {
      const name = f.slice(base.length + 1)
      const ext = name.split('.').pop() ?? ''
      return CODE_EXTS.includes(ext) && !/\.(test|spec)\./.test(name)
    })
  if (firstCode) return { resolved: firstCode, browse: base }
  return { resolved: null, browse: base }
}

export default function NodeDrawer({ node, onClose, onOpenSource }: Props) {
  const { files } = useData()
  const fileSet = useMemo(() => new Set(files.map((f) => f.source_path)), [files])
  const filePaths = useMemo(() => files.map((f) => f.source_path), [files])
  const source = useMemo(() => {
    const first = node?.sources?.[0]?.path
    if (!first) return null
    return resolveSourcePath(first, fileSet, filePaths)
  }, [node, fileSet, filePaths])

  if (!node) return null
  const sources = node.sources ?? []
  const docs = node.docs ?? []

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

          {source && (
            <>
              <h4>源码预览</h4>
              {source.resolved ? (
                <SourceViewer path={source.resolved} height={300} showHeader={false} />
              ) : (
                <div className="empty" style={{ padding: 30 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 12.5, lineHeight: 1.6 }}>
                    该引用是源码目录，静态快照未收录其代表文件，可前往源码浏览器查看目录结构。
                  </p>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => onOpenSource?.(source.browse)}
                  >
                    <FolderOpen size={13} /> 打开源码目录
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
