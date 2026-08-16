import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Check, Copy, FileCode2 } from 'lucide-react'
import { loadSourceContent } from '../sources'
import { useTheme } from '../theme'
import { useData } from '../data'
import { KIND_COLOR } from './Graph'

export const EXT_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  md: 'markdown',
  css: 'css',
  html: 'html',
  yml: 'yaml',
  yaml: 'yaml',
  py: 'python',
  toml: 'toml',
  sh: 'shell',
}

interface SourceViewerProps {
  path: string
  height?: number | string
  showHeader?: boolean
}

export default function SourceViewer({ path, height = 420, showHeader = true }: SourceViewerProps) {
  const { theme } = useTheme()
  const { fileByPath, packageByDir, meta } = useData()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setContent(null)
    setError(null)
    let alive = true
    loadSourceContent(path)
      .then((c) => {
        if (!alive) return
        if (c === null) setError('静态快照中不包含该文件内容')
        else setContent(c)
      })
      .catch((e) => alive && setError(String(e?.message ?? e)))
    return () => {
      alive = false
    }
  }, [path])

  const file = fileByPath(path)
  // package 是 npm 名，从 source_path 推断最近的包目录
  const pkgDir = useMemo(() => {
    if (!file?.package) return null
    const segs = path.split('/')
    for (let i = segs.length - 1; i >= 1; i--) {
      const dir = segs.slice(0, i).join('/')
      const hit = packageByDir(dir)
      if (hit) return hit
    }
    return null
  }, [path, file, packageByDir])

  const lang = useMemo(() => {
    const ext = path.includes('.') ? path.split('.').pop()!.toLowerCase() : ''
    return EXT_LANG[ext] ?? 'plaintext'
  }, [path])

  const copy = async () => {
    if (content == null) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  if (error) {
    return (
      <div className="codeview">
        {showHeader && <div className="cv-head"><FileCode2 size={13} /> {path}</div>}
        <div className="empty" style={{ padding: 30 }}>无法读取该文件：{error}</div>
      </div>
    )
  }

  return (
    <div className="codeview">
      {showHeader && (
        <div className="cv-head">
          <FileCode2 size={13} style={{ color: KIND_COLOR.file }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</span>
          {pkgDir && (
            <span className="badge info" style={{ fontFamily: 'var(--mono)', fontSize: 10.5 }}>
              {pkgDir.name}
            </span>
          )}
          {meta?.repoCommit && (
            <span
              className="badge"
              title="课程绑定的 Harness 快照 commit"
              style={{ fontFamily: 'var(--mono)', fontSize: 10.5 }}
            >
              Snapshot {meta.repoCommit.slice(0, 7)}
            </span>
          )}
          {file?.commit_hash && file.commit_hash.startsWith('sha256') ? null : file?.commit_hash && (
            <span className="badge" style={{ fontFamily: 'var(--mono)', fontSize: 10.5 }}>@{file.commit_hash.slice(0, 7)}</span>
          )}
          {content != null && (
            <button className="icon-btn" onClick={copy} title="复制" style={{ width: 26, height: 26 }}>
              {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
            </button>
          )}
        </div>
      )}
      {content == null ? (
        <div className="empty" style={{ padding: 40 }}>加载中…</div>
      ) : (
        <Editor
          height={height}
          language={lang}
          value={content}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12.5,
            fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            wordWrap: 'off',
            padding: { top: 10 },
            renderLineHighlight: 'none',
          }}
        />
      )}
    </div>
  )
}
