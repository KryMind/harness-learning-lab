/**
 * Harness Learning Lab —— Repo Scanner
 *
 * 扫描 deepseek-harness 官方源码，生成：
 *   generated/repo-index.json   全量文件索引（每条含 source_path/source_type/package/title/commit_hash）
 *   generated/packages.json     packages 目录下所有 package.json 的解析结果
 *   generated/docs-index.json   文档文件索引（标题大纲 + 外链）
 *
 * 用法：pnpm scan    （在仓库根目录执行）
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs'
import { join, relative, dirname, basename, extname, sep, normalize } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const ROOT = process.cwd()
const SRC = join(ROOT, 'deepseek-harness')
const OUT = join(ROOT, 'generated')

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------

type FileRecord = {
  source_path: string
  source_type: string
  package: string | null
  title: string
  commit_hash: string
}

/** 批量获取每个文件的最后一次提交哈希（单次 git log 解析），失败则退回内容哈希。 */
function buildCommitMap(): (relPath: string, content: string) => string {
  const map = new Map<string, string>()
  let gotGit = false
  try {
    const out = execFileSync(
      'git',
      ['log', '--name-only', '--pretty=format:\x00%H'],
      { cwd: SRC, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 },
    )
    gotGit = true
    let current = ''
    for (const line of out.split('\n')) {
      const l = line.replace(/\r/g, '')
      if (l.startsWith('\x00')) {
        current = l.slice(1).trim()
      } else if (l.trim() && current && !map.has(l.trim())) {
        map.set(l.trim(), current)
      }
    }
  } catch {
    gotGit = false
  }
  return (relPath: string, content: string) => {
    if (gotGit) {
      const h = map.get(relPath)
      if (h) return h
      // 未跟踪文件
      return 'untracked'
    }
    // git 不可用（源码为纯拷贝），用内容哈希代替
    return 'sha256:' + createHash('sha256').update(content).digest('hex').slice(0, 16)
  }
}

function tryRepoCommit(): string | null {
  try {
    const out = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: SRC,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.trim() || null
  } catch {
    return null
  }
}

function sourceTypeOf(path: string): string {
  const e = extname(path).toLowerCase()
  switch (e) {
    case '.md': return 'markdown'
    case '.mdx': return 'markdown'
    case '.ts': return 'typescript'
    case '.tsx': return 'typescript-react'
    case '.mts': return 'typescript'
    case '.cts': return 'typescript'
    case '.json': return 'json'
    case '.yml': return 'yaml'
    case '.yaml': return 'yaml'
    case '.js': return 'javascript'
    case '.mjs': return 'javascript'
    case '.cjs': return 'javascript'
    case '.jsx': return 'javascript-react'
    case '.css': return 'css'
    case '.html': return 'html'
    case '.svg': return 'svg'
    case '.py': return 'python'
    case '.toml': return 'toml'
    case '.sh': return 'shell'
    case '.mjs': return 'javascript'
    default: return 'text'
  }
}

function walk(dir: string, out: string[] = [], prefix = ''): string[] {
  if (!existsSync(dir)) return out
  const entries = readdirSync(dir, { withFileTypes: true })
  entries.sort((a, b) => (a.name < b.name ? -1 : 1))
  for (const ent of entries) {
    const full = join(dir, ent.name)
    const rel = prefix ? `${prefix}/${ent.name}` : ent.name
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === 'lib' || ent.name === '.git') continue
      walk(full, out, rel)
    } else {
      out.push(rel)
    }
  }
  return out
}

function readText(rel: string): string {
  try {
    return readFileSync(join(SRC, rel), 'utf8')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// 1) 收集文件清单
// ---------------------------------------------------------------------------

const allFiles = walk(SRC)
const fileSet = new Set(allFiles)
const commitFor = buildCommitMap()

const isDoc = (p: string) => /\.md$/i.test(p)
const isSource = (p: string) =>
  /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|py|css|html)$/i.test(p)
const isPackageJson = (p: string) => basename(p) === 'package.json'
const isReadme = (p: string) => /^readme\.md$/i.test(basename(p)) || /^ag?ents\.md$/i.test(basename(p))

// 挑选要进 repo-index 的文件：docs、所有 markdown、源码、package.json、关键 yml
const indexedPaths = allFiles.filter((p) => {
  if (isDoc(p)) return true
  if (isPackageJson(p)) return true
  if (isSource(p)) return true
  if (/\.(yml|yaml)$/i.test(p) && (p.startsWith('examples/') || p.startsWith('packages/bundle/'))) return true
  return false
})

// ---------------------------------------------------------------------------
// 2) packages.json —— 解析所有 package.json
// ---------------------------------------------------------------------------

type PkgRecord = {
  dir: string
  group: string
  pkg: string
  name: string
  version: string
  description: string
  private: boolean
  type: string
  hasSrc: boolean
  srcFiles: string[]
  readme: string | null
  dependencies: string[]
  peerDependencies: string[]
  dsh: Record<string, unknown> | null
}

function parseJsonSafe(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}

function nearestPackage(fullRel: string): string | null {
  // 从文件所在目录向上找 package.json，返回 npm 包名（若存在）
  const parts = fullRel.split('/')
  for (let i = parts.length - 1; i >= 1; i--) {
    const dir = parts.slice(0, i).join('/')
    const pj = join(SRC, dir, 'package.json')
    if (existsSync(pj)) {
      const j = parseJsonSafe(readFileSync(pj, 'utf8'))
      if (j && typeof j.name === 'string') return j.name as string
    }
  }
  return null
}

const packageJsonFiles = allFiles.filter(isPackageJson).filter((p) => {
  // 关注 packages/<group>/<pkg>、apps/*、examples、根
  return (
    p.startsWith('packages/') ||
    p.startsWith('apps/') ||
    p.startsWith('examples/') ||
    p.startsWith('vendor/') ||
    p.startsWith('python/') ||
    p === 'package.json'
  )
})

const packages: PkgRecord[] = []
const pkgByDir = new Map<string, PkgRecord>()

for (const p of packageJsonFiles) {
  const text = readText(p)
  const j = parseJsonSafe(text)
  if (!j) continue
  const dir = dirname(p)
  const seg = dir.split('/')
  const group = seg.length >= 3 && seg[0] === 'packages' ? seg[1] : seg[0] === 'packages' ? 'packages' : seg[0] === 'apps' ? 'apps' : seg[0]
  const pkgName = seg[seg.length - 1]

  const srcDir = join(SRC, dir, 'src')
  const hasSrc = existsSync(srcDir)
  let srcFiles: string[] = []
  if (hasSrc) {
    srcFiles = walk(srcDir)
      .filter((f) => /\.(ts|tsx|mts|cts|js|jsx)$/i.test(f))
      .map((f) => `${dir}/src/${f}`)
      .sort()
  }

  const readme = allFiles.find(
    (f) => f === `${dir}/README.md`,
  )

  const rec: PkgRecord = {
    dir,
    group,
    pkg: pkgName,
    name: typeof j.name === 'string' ? (j.name as string) : dir,
    version: typeof j.version === 'string' ? (j.version as string) : '',
    description: typeof j.description === 'string' ? (j.description as string) : '',
    private: j.private === true,
    type: typeof j.type === 'string' ? (j.type as string) : 'commonjs',
    hasSrc,
    srcFiles,
    readme: readme ?? null,
    dependencies: j.dependencies ? Object.keys(j.dependencies as Record<string, unknown>) : [],
    peerDependencies: j.peerDependencies ? Object.keys(j.peerDependencies as Record<string, unknown>) : [],
    dsh: j.dsh ? (j.dsh as Record<string, unknown>) : null,
  }
  packages.push(rec)
  pkgByDir.set(dir, rec)
}

// ---------------------------------------------------------------------------
// 3) repo-index.json —— 全量文件索引
// ---------------------------------------------------------------------------

const files: FileRecord[] = []
for (const p of indexedPaths) {
  const text = readText(p)
  const rec: FileRecord = {
    source_path: p,
    source_type: sourceTypeOf(p),
    package: nearestPackage(p),
    title: basename(p),
    commit_hash: commitFor(p, text),
  }
  files.push(rec)
}

// ---------------------------------------------------------------------------
// 4) docs-index.json —— 文档大纲
// ---------------------------------------------------------------------------

type Heading = { level: number; text: string; slug?: string }
type DocRecord = {
  source_path: string
  source_type: string
  package: string | null
  title: string
  commit_hash: string
  headings: Heading[]
  links: string[]
}

const mdFiles = allFiles.filter(isDoc)
const docs: DocRecord[] = []

for (const p of mdFiles) {
  const text = readText(p)
  const lines = text.split('\n')
  const headings: Heading[] = []
  const links: string[] = []
  let title = basename(p).replace(/\.md$/i, '')

  for (const line of lines) {
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      const level = h[1].length
      const textContent = h[2].replace(/`/g, '').trim()
      headings.push({ level, text: textContent })
      if (level === 1) title = textContent
    }
    const m = /\]\(([^)]+)\)/.exec(line)
    if (m) {
      const target = m[1]
      if (target.startsWith('http') || target.startsWith('#')) continue
      if (target.includes('..')) links.push(target)
    }
  }

  docs.push({
    source_path: p,
    source_type: 'markdown',
    package: nearestPackage(p),
    title,
    commit_hash: commitFor(p, text),
    headings,
    links: Array.from(new Set(links)).slice(0, 40),
  })
}

// ---------------------------------------------------------------------------
// 5) 汇总统计 + 落盘
// ---------------------------------------------------------------------------

const repoCommit = tryRepoCommit()

const meta = {
  generatedAt: new Date().toISOString(),
  repo: 'deepseek-harness',
  repoPath: relative(ROOT, SRC).split(sep).join('/'),
  repoCommit,
  nodeVersion: process.version,
  fileCount: files.length,
  docCount: docs.length,
  packageCount: packages.length,
}

mkdirSync(OUT, { recursive: true })

writeFileSync(join(OUT, 'repo-index.json'), JSON.stringify({ meta, files }, null, 2))
writeFileSync(join(OUT, 'packages.json'), JSON.stringify({ meta, packages }, null, 2))
writeFileSync(join(OUT, 'docs-index.json'), JSON.stringify({ meta, docs }, null, 2))

// 汇总行
console.log('✔ repo-index.json   files:', files.length)
console.log('✔ packages.json     packages:', packages.length)
console.log('✔ docs-index.json   docs:', docs.length)
console.log('repoCommit:', repoCommit ?? '（非 git 仓库，使用内容哈希）')
console.log('输出目录:', OUT)
