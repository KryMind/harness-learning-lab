// ---------------------------------------------------------------------------
// MonacoEditor —— 懒加载的 Monaco 编辑器包装（Phase 6 性能）
// 移动端默认不挂载 → monaco chunk 不会加载；桌面端首次使用时才 dynamic import，
// 并同时初始化 worker 环境（monaco.ts）。
// ---------------------------------------------------------------------------
import { lazy, Suspense } from 'react'
import type { EditorProps } from '@monaco-editor/react'

const Editor = lazy(() =>
  Promise.all([import('@monaco-editor/react'), import('../monaco')]).then(([m]) => ({ default: m.default })),
)

export default function MonacoEditor(props: EditorProps) {
  return (
    <Suspense fallback={<div className="code-loading">加载源码编辑器…</div>}>
      <Editor {...props} />
    </Suspense>
  )
}
