/**
 * Harness Learning Lab —— 后端 API
 *
 * 提供：
 *   GET /api/meta            生成元信息
 *   GET /api/index           全量文件索引（repo-index.json）
 *   GET /api/packages        packages.json
 *   GET /api/docs            docs-index.json
 *   GET /api/source?path=    读取 deepseek-harness 下的任意源码/文档（带路径安全校验）
 *   GET /api/search?q=       全量检索（文件 / 包 / 文档）
 *   GET /api/dump-config     尝试运行 `dsh --profile web --dump-config` 并解析插件树
 *   GET /api/stats           概览统计（供 ECharts 使用）
 *   生产模式静态托管 web/dist
 */
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { join, resolve, sep, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'

// 以本文件位置（server/src）向上定位项目根，避免 pnpm --filter 改变 cwd 后失效
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const REPO = join(ROOT, 'deepseek-harness')
const GENERATED = join(ROOT, 'generated')
const WEB_DIST = join(ROOT, 'web', 'dist')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

function readJson(name: string): unknown {
  const p = join(GENERATED, name)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

/** 路径安全：确保解析后的路径仍在 REPO 内。 */
function safeRepoPath(relPath: string): string | null {
  const resolved = resolve(REPO, relPath)
  const repoResolved = resolve(REPO)
  if (resolved !== repoResolved && !resolved.startsWith(repoResolved + sep)) return null
  if (!existsSync(resolved)) return null
  return resolved
}

app.get('/api/meta', (_req, res) => {
  const data = readJson('repo-index.json') as { meta?: unknown } | null
  res.json({ meta: data?.meta ?? null })
})

app.get('/api/index', (_req, res) => {
  const data = readJson('repo-index.json')
  if (!data) return res.status(404).json({ error: 'generated/repo-index.json 不存在，请先运行 pnpm scan' })
  res.json(data)
})

app.get('/api/packages', (_req, res) => {
  const data = readJson('packages.json')
  if (!data) return res.status(404).json({ error: 'generated/packages.json 不存在，请先运行 pnpm scan' })
  res.json(data)
})

app.get('/api/docs', (_req, res) => {
  const data = readJson('docs-index.json')
  if (!data) return res.status(404).json({ error: 'generated/docs-index.json 不存在，请先运行 pnpm scan' })
  res.json(data)
})

app.get('/api/source', (req: Request, res: Response) => {
  const p = String(req.query.path ?? '')
  if (!p) return res.status(400).json({ error: '缺少 path 参数' })
  const abs = safeRepoPath(p)
  if (!abs) return res.status(404).json({ error: '路径不存在或越界', path: p })
  const stat = statSync(abs)
  if (stat.isDirectory()) {
    // 返回目录列表
    const items = readdirSync(abs, { withFileTypes: true }).map((e) => ({
      name: e.name,
      type: e.isDirectory() ? 'dir' : 'file',
    }))
    return res.json({ path: p, type: 'dir', items })
  }
  const content = readFileSync(abs, 'utf8')
  const ext = p.includes('.') ? p.split('.').pop()!.toLowerCase() : 'txt'
  res.json({ path: p, content, size: stat.size, ext })
})

app.get('/api/search', (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim().toLowerCase()
  if (!q) return res.json({ files: [], packages: [], docs: [] })
  const indexData = readJson('repo-index.json') as { files?: Array<{ source_path: string; source_type: string; package: string | null; title: string }> } | null
  const pkgData = readJson('packages.json') as { packages?: Array<{ dir: string; name: string; description: string; group: string }> } | null
  const docData = readJson('docs-index.json') as { docs?: Array<{ source_path: string; title: string }> } | null

  const files = (indexData?.files ?? [])
    .filter((f) => f.source_path.toLowerCase().includes(q) || (f.title ?? '').toLowerCase().includes(q) || (f.package ?? '').toLowerCase().includes(q))
    .slice(0, 60)
  const packages = (pkgData?.packages ?? [])
    .filter((p) => p.name.toLowerCase().includes(q) || p.dir.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
    .slice(0, 40)
  const docs = (docData?.docs ?? [])
    .filter((d) => d.source_path.toLowerCase().includes(q) || d.title.toLowerCase().includes(q))
    .slice(0, 40)
  res.json({ files, packages, docs })
})

// ---------------------------------------------------------------------------
// /api/dump-config —— 运行 dsh 打印当前机器实际启动的 Plugin Tree
// ---------------------------------------------------------------------------
app.get('/api/dump-config', (_req, res) => {
  const candidates = [
    join(REPO, 'node_modules', '.bin', process.platform === 'win32' ? 'dsh.cmd' : 'dsh'),
    join(REPO, 'apps', 'cli', 'node_modules', '.bin', process.platform === 'win32' ? 'dsh.cmd' : 'dsh'),
  ]
  const bin = candidates.find((c) => existsSync(c))

  const finish = (payload: unknown) => res.json(payload)

  if (!bin) {
    return finish({
      ok: false,
      available: false,
      error: '未找到 dsh 可执行文件。请在 deepseek-harness 中执行 `pnpm install && pnpm run build` 后重试。',
      hint: '官方命令：cd deepseek-harness && pnpm install && pnpm run build && pnpm dsh --profile web --dump-config',
    })
  }

  execFile(
    bin,
    ['--profile', 'web', '--dump-config'],
    { cwd: REPO, timeout: 30000, maxBuffer: 16 * 1024 * 1024 },
    (err, stdout, stderr) => {
      if (err) {
        return finish({
          ok: false,
          available: true,
          error: String(err.message || err),
          stderr: String(stderr || '').slice(0, 4000),
        })
      }
      const raw = String(stdout)
      // 粗略解析插件树：提取行，按缩进构建层级
      const lines = raw
        .split('\n')
        .map((l) => l.replace(/\r/g, ''))
        .filter((l) => l.trim().length > 0)
      const tree = lines.map((line) => {
        const indent = (line.match(/^\s*/)?.[0].length ?? 0)
        const text = line.trim()
        return { indent, text }
      })
      finish({ ok: true, available: true, raw: raw.slice(0, 50000), tree })
    },
  )
})

app.get('/api/stats', (_req, res) => {
  const indexData = readJson('repo-index.json') as { files?: Array<{ source_type: string }>; meta?: Record<string, unknown> } | null
  const pkgData = readJson('packages.json') as { packages?: Array<{ group: string; hasSrc: boolean; srcFiles: string[] }> } | null
  const docData = readJson('docs-index.json') as { docs?: Array<{ source_path: string }> } | null

  const files = indexData?.files ?? []
  const pkgs = pkgData?.packages ?? []
  const docs = docData?.docs ?? []

  const byType = files.reduce<Record<string, number>>((acc, f) => {
    acc[f.source_type] = (acc[f.source_type] ?? 0) + 1
    return acc
  }, {})
  const byGroup = pkgs.reduce<Record<string, number>>((acc, p) => {
    acc[p.group] = (acc[p.group] ?? 0) + 1
    return acc
  }, {})
  const srcLines = pkgs.reduce((acc, p) => acc + p.srcFiles.length, 0)

  res.json({
    fileCount: files.length,
    packageCount: pkgs.length,
    docCount: docs.length,
    srcLineCount: srcLines,
    byType,
    byGroup,
  })
})

// 生产模式：静态托管前端构建产物
if (existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(WEB_DIST, 'index.html'))
  })
}

const PORT = Number(process.env.PORT ?? 4310)
app.listen(PORT, () => {
  console.log(`[hll-server] http://localhost:${PORT}`)
  console.log(`[hll-server] repo=${REPO}`)
  console.log(`[hll-server] generated=${GENERATED}`)
})
