/**
 * Harness Learning Lab —— Repo Scanner
 *
 * 扫描 deepseek-harness 官方源码，生成：
 *   generated/repo-index.json      全量文件索引（每条含 source_path/source_type/package/title/commit_hash）
 *   generated/packages.json        packages 目录下所有 package.json 的解析结果
 *   generated/docs-index.json      文档文件索引（标题大纲 + 外链）
 *   generated/stats.json           汇总统计
 *   generated/sources-index.json   源码路径 → chunk 映射
 *   generated/sources/chunk-*.json 源码内容分块（浏览器端按需加载）
 *
 * 同时把产物同步到 web/public/data/，使前端无需 server 即可静态加载。
 *
 * 用法：pnpm generate    （在仓库根目录执行）
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs'
import { join, relative, dirname, basename, extname, sep } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import { LESSONS, lessonMatchesPath } from '../web/src/course/lessons'

const ROOT = process.cwd()
const SRC = join(ROOT, 'deepseek-harness')
const OUT = join(ROOT, 'generated')
/** Vite public 目录，前端通过 import.meta.env.BASE_URL + 'data/...' 静态读取 */
const PUB = join(ROOT, 'web', 'public', 'data')

// ---------------------------------------------------------------------------
// 产物写入：同时写入 generated/（提交 Git，权威数据）与 web/public/data/（构建产物）
// ---------------------------------------------------------------------------
function writeArtifact(rel: string, obj: unknown) {
  const payload = JSON.stringify(obj)
  mkdirSync(dirname(join(OUT, rel)), { recursive: true })
  writeFileSync(join(OUT, rel), payload)
  mkdirSync(dirname(join(PUB, rel)), { recursive: true })
  writeFileSync(join(PUB, rel), payload)
}

/** 官方源码缺失时（如 CI），把已提交的 generated/ 原样同步到 web/public/data/。 */
function syncGeneratedToPublic() {
  if (!existsSync(OUT)) return
  const copyDir = (from: string, to: string) => {
    for (const ent of readdirSync(from, { withFileTypes: true })) {
      const src = join(from, ent.name)
      const dst = join(to, ent.name)
      if (ent.isDirectory()) {
        mkdirSync(dst, { recursive: true })
        copyDir(src, dst)
      } else {
        mkdirSync(dirname(dst), { recursive: true })
        copyFileSync(src, dst)
      }
    }
  }
  mkdirSync(PUB, { recursive: true })
  copyDir(OUT, PUB)
}

// deepseek-harness 官方源码缺失 → 直接复用已提交的 generated/ 数据（保证静态站可独立构建）
if (!existsSync(SRC)) {
  syncGeneratedToPublic()
  console.log('✔ 未找到 deepseek-harness/，已从已提交的 generated/ 同步静态数据到 web/public/data/')
  process.exit(0)
}

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

// 统计
const byType: Record<string, number> = {}
for (const f of files) byType[f.source_type] = (byType[f.source_type] ?? 0) + 1
const byGroup: Record<string, number> = {}
for (const p of packages) {
  const g = p.dir.startsWith('apps/') ? 'apps' : p.dir.split('/')[1] ?? 'other'
  byGroup[g] = (byGroup[g] ?? 0) + 1
}
let srcLineCount = 0
for (const f of files) {
  if (/\.(ts|tsx|mts|cts|js|jsx|py)$/i.test(f.source_path)) {
    srcLineCount += readText(f.source_path).split('\n').length
  }
}
const stats = { fileCount: files.length, packageCount: packages.length, docCount: docs.length, srcLineCount, byType, byGroup }

// ---------------------------------------------------------------------------
// 6) sources 静态快照（分块，浏览器端源码阅读器按需加载）
// ---------------------------------------------------------------------------

const CHUNK_TARGET = 800_000 // 每块约 800KB
const chunkIndex: Record<string, string> = {}
const chunks: Record<string, Record<string, string>> = {}
let chunkNo = 0
let curName = `chunk-${String(chunkNo).padStart(3, '0')}`
let curChunk: Record<string, string> = {}
let curSize = 0
const flushChunk = () => {
  if (Object.keys(curChunk).length === 0) return
  chunks[curName] = curChunk
  curChunk = {}
  curSize = 0
}
for (const f of files) {
  const text = readText(f.source_path)
  if (curSize > 0 && curSize + text.length > CHUNK_TARGET) {
    flushChunk()
    chunkNo++
    curName = `chunk-${String(chunkNo).padStart(3, '0')}`
  }
  chunkIndex[f.source_path] = curName
  curChunk[f.source_path] = text
  curSize += text.length
}
flushChunk()

// ---------------------------------------------------------------------------
// 5.5) search/api-symbols.json —— TS AST 扫描 API Symbol（三级分级，UX#12）
// 官方 Surface（ctx.xxx 白名单） > Exported Symbol > （Internal Symbol 不进普通搜索）
// 只扫 packages/** 与 vendor/** 的 src/**，跳过 apps/examples/python/模板 以控制噪声。
// ---------------------------------------------------------------------------
type ApiSymbol = {
  symbol: string
  tier: 'official-surface' | 'exported-symbol'
  package: string | null
  sourcePath: string
  line: number
  signature: string
  lessonIds: string[]
}

/** ctx 服务根名白名单（来源：docs/capability-seams 与 content 已核实的 ctx.* 服务） */
const CTX_WHITELIST = [
  'ctx.llm', 'ctx.tools', 'ctx.sessions', 'ctx.session', 'ctx.skills', 'ctx.subagents',
  'ctx.workflowEngine', 'ctx.sandbox', 'ctx.agents', 'ctx.agentLoop', 'ctx.systemPrompt',
  'ctx.scope', 'ctx.slots', 'ctx.plugins', 'ctx.bundles', 'ctx.permission', 'ctx.persistence',
  'ctx.sessionQuery', 'ctx.hooks', 'ctx.inject', 'ctx.service', 'ctx.on', 'ctx.emit',
]
const CTX_RE = /\bctx\.([A-Za-z_$][\w$]*)(\.([A-Za-z_$][\w$]*))?/g

function hasExportModifier(node: ts.Node): boolean {
  const mods = (node as ts.HasModifiers).modifiers
  return !!mods && mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
}

function truncateSig(text: string, max = 110): string {
  const one = text.replace(/\s+/g, ' ').trim()
  return one.length > max ? `${one.slice(0, max)}…` : one
}

function extractApiSymbols(): ApiSymbol[] {
  const out: ApiSymbol[] = []
  const seenExported = new Set<string>()
  const ctxSet = new Set<string>()
  const ctxLessons = new Map<string, Set<string>>()

  const srcFiles = files.filter(
    (f) =>
      /\.(ts|tsx|mts|cts)$/.test(f.source_path) &&
      (f.source_path.startsWith('packages/') || f.source_path.startsWith('vendor/')) &&
      f.source_path.includes('/src/') &&
      !/\.(spec|test)\./.test(f.source_path),
  )

  for (const f of srcFiles) {
    const text = readText(f.source_path)
    if (!text) continue
    const fLessons = LESSONS.filter((l) => lessonMatchesPath(l, f.source_path)).map((l) => l.id)

    // 1) official-surface：收集 ctx.<svc>(.<method>)? 并记录其关联课程
    CTX_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = CTX_RE.exec(text)) !== null) {
      const root = `ctx.${m[1]}`
      const full = m[2] ? `${root}.${m[3]}` : root
      if (!CTX_WHITELIST.includes(root) && !CTX_WHITELIST.includes(full)) continue
      ctxSet.add(full)
      if (!ctxLessons.has(full)) ctxLessons.set(full, new Set())
      for (const id of fLessons) ctxLessons.get(full)!.add(id)
    }

    // 2) exported-symbol：顶层 export function/class/interface/type/enum
    //    只保留与课程关联的符号（降噪，UX#12：Internal/无关符号不进普通搜索）
    if (!fLessons.length) continue
    const sf = ts.createSourceFile(f.source_path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    sf.forEachChild((node) => {
      let name: string | undefined
      let kind: 'function' | 'class' | 'interface' | 'type' | 'enum' | undefined
      if (ts.isFunctionDeclaration(node) && node.name) { name = node.name.text; kind = 'function' }
      else if (ts.isClassDeclaration(node) && node.name) { name = node.name.text; kind = 'class' }
      else if (ts.isInterfaceDeclaration(node) && node.name) { name = node.name.text; kind = 'interface' }
      else if (ts.isTypeAliasDeclaration(node)) { name = node.name.text; kind = 'type' }
      else if (ts.isEnumDeclaration(node)) { name = node.name.text; kind = 'enum' }
      if (!name || !kind || !hasExportModifier(node)) return
      const key = `${name}@${kind}`
      if (seenExported.has(key)) return
      seenExported.add(key)
      out.push({
        symbol: name,
        tier: 'exported-symbol',
        package: f.package,
        sourcePath: f.source_path,
        line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
        signature: truncateSig(node.getText(sf)),
        lessonIds: fLessons,
      })
    })
  }

  // official-surface 统一追加（集合去重后排序，sourcePath 由前端匹配）
  for (const sym of Array.from(ctxSet).sort()) {
    out.push({
      symbol: sym,
      tier: 'official-surface',
      package: null,
      sourcePath: '',
      line: 0,
      signature: `${sym} —— Harness 官方 ctx 服务 API`,
      lessonIds: Array.from(ctxLessons.get(sym) ?? []),
    })
  }
  return out
}

const apiSymbols = extractApiSymbols()
writeArtifact('search/api-symbols.json', { meta, symbols: apiSymbols })
writeArtifact('search/version.json', { meta: { snapshotCommit: repoCommit, repo: meta.repo } })

mkdirSync(OUT, { recursive: true })

writeArtifact('repo-index.json', { meta, files })
writeArtifact('packages.json', { meta, packages })
writeArtifact('docs-index.json', { meta, docs })
writeArtifact('stats.json', stats)
writeArtifact('sources-index.json', chunkIndex)
for (const [name, map] of Object.entries(chunks)) {
  writeArtifact(`sources/${name}.json`, map)
}

// 汇总行
console.log('✔ repo-index.json   files:', files.length)
console.log('✔ packages.json     packages:', packages.length)
console.log('✔ docs-index.json   docs:', docs.length)
console.log('✔ stats.json        srcLineCount:', srcLineCount)
console.log('✔ search/api-symbols.json  official-surface:', apiSymbols.filter((a) => a.tier === 'official-surface').length, 'exported-symbol:', apiSymbols.filter((a) => a.tier === 'exported-symbol').length)
console.log('✔ search/version.json      snapshotCommit:', repoCommit ?? '（非 git 仓库，使用内容哈希）')
console.log('✔ sources 快照      chunks:', Object.keys(chunks).length, 'files:', Object.keys(chunkIndex).length)
console.log('repoCommit:', repoCommit ?? '（非 git 仓库，使用内容哈希）')
console.log('输出目录:', OUT)
console.log('同步目录:', PUB)
