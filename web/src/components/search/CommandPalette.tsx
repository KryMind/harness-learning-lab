// ---------------------------------------------------------------------------
// Command Palette —— Ctrl+K 全局搜索（UX#12：概念 > 公共 API > Package/Docs > Source）
// 全屏遮罩 + 输入框 + 分类 Tab + 键盘导航（↑↓ 选择 / Enter 跳转 / Esc 关闭 / Tab 切分类）
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Code2, FileText, Lightbulb, Package as PackageIcon, Search, SearchX } from 'lucide-react'
import type { SearchRecord } from '../../data/searchIndex'
import { TABS, useSearch, type SearchTab } from './useSearch'

const TYPE_ICON = {
  concept: Lightbulb,
  doc: BookOpen,
  package: PackageIcon,
  api: Code2,
  source: FileText,
} as const

const TYPE_BADGE: Record<SearchRecord['type'], string> = {
  concept: '概念',
  doc: '文档',
  package: 'Package',
  api: 'API',
  source: '源码',
}

function Row({ rec, active, onClick }: { rec: SearchRecord; active: boolean; onClick: () => void }) {
  const Icon = TYPE_ICON[rec.type]
  const meta = rec.type === 'source' || rec.type === 'doc' ? rec.sourcePath : rec.type === 'api' ? rec.package ?? rec.signature : rec.description
  return (
    <button type="button" className={`cp-row${active ? ' active' : ''}`} onClick={onClick}>
      <span className={`cp-ic cp-ic-${rec.type}`}>
        <Icon size={16} />
      </span>
      <span className="cp-main">
        <span className="cp-title">
          {rec.title}
          {rec.type === 'api' && rec.tier === 'official-surface' && <em className="cp-tag">official</em>}
        </span>
        {meta && <span className="cp-meta">{meta}</span>}
      </span>
      <span className="cp-badge">{TYPE_BADGE[rec.type]}</span>
    </button>
  )
}

function Empty({ q }: { q: string }) {
  return (
    <div className="cp-empty">
      <SearchX size={28} />
      <p>
        没有匹配「<b>{q}</b>」的结果
      </p>
      <span>试试英文关键词，或在「源码」分类中搜索文件路径</span>
    </div>
  )
}

export default function CommandPalette({ records, open, onClose }: { records: SearchRecord[]; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<SearchTab>('all')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useSearch(records, q, tab)

  useEffect(() => {
    if (open) {
      setQ('')
      setTab('all')
      setActive(0)
      // 焦点延迟：等面板渲染完成
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const go = useCallback(
    (rec: SearchRecord) => {
      if (rec.route) navigate(rec.route)
      onClose()
    },
    [navigate, onClose],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (results.length ? (a + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) go(results[active])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const idx = TABS.findIndex((t) => t.key === tab)
      setTab(TABS[(idx + 1) % TABS.length].key)
      setActive(0)
    }
  }

  useEffect(() => {
    setActive(0)
  }, [q, tab])

  if (!open) return null

  return (
    <div className="cp-backdrop" onClick={onClose}>
      <div className="cp-panel" role="dialog" aria-modal="true" aria-label="全局搜索" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="cp-input-wrap">
          <Search size={18} className="cp-search-ic" />
          <input
            ref={inputRef}
            className="cp-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索概念、API、Package、文档、源码…（输入「skill」试试）"
            spellCheck={false}
          />
          <kbd className="cp-esc">esc</kbd>
        </div>

        <div className="cp-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`cp-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => {
                setTab(t.key)
                setActive(0)
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="cp-results">
          {q.trim() === '' ? (
            <div className="cp-empty cp-hint">
              <p>输入关键词开始搜索</p>
              <span>试试：skill · agent loop · ctx.skills · defineTool · workflow</span>
            </div>
          ) : results.length === 0 ? (
            <Empty q={q} />
          ) : (
            results.map((rec, i) => (
              <Row key={rec.id} rec={rec} active={i === active} onClick={() => go(rec)} />
            ))
          )}
        </div>

        <div className="cp-footer">
          <span className="cp-k">
            <kbd>↑</kbd> <kbd>↓</kbd> 选择
          </span>
          <span className="cp-k">
            <kbd>↵</kbd> 打开
          </span>
          <span className="cp-k">
            <kbd>tab</kbd> 切换分类
          </span>
          <span className="cp-k">
            <kbd>esc</kbd> 关闭
          </span>
          <span className="cp-count">{results.length} 条结果</span>
        </div>
      </div>
    </div>
  )
}
