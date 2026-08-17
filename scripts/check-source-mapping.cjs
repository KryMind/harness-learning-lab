// 一次性验证脚本：检查所有课程 sourcePaths / Quiz sourcePaths / content sources 是否命中快照文件
// 通配符 ** 命中前缀；普通路径要求存在同路径或为已存在路径的前缀
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const repo = JSON.parse(fs.readFileSync(path.join(ROOT, 'generated', 'repo-index.json'), 'utf8'))
const files = repo.files.map((f) => f.source_path)

function match(pat) {
  // 支持尾部 / **、/、或普通路径
  if (pat.endsWith('/**')) {
    const prefix = pat.slice(0, -3) // 去掉 /**
    return files.some((f) => f.startsWith(prefix))
  }
  // 去掉行号 #L123
  const clean = pat.split('#')[0]
  if (files.includes(clean)) return true
  // 目录路径（无扩展名结尾的斜杠目录）：命中其下任意文件
  if (clean.endsWith('/')) return files.some((f) => f.startsWith(clean))
  // 可能是目录（如 packages/skill/skill/src）：命中其下任意文件
  if (files.some((f) => f.startsWith(clean + '/'))) return true
  // 精确文件
  return files.includes(clean)
}

function walkDir(dir, arr) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walkDir(p, arr)
    else if (/\.(ts|tsx|js|jsx)$/.test(e.name)) arr.push(p)
  }
}

// 1) 课程 sourcePaths
const lessonsSrc = path.join(ROOT, 'web', 'src', 'course', 'lessons.ts')
const lessonsTxt = fs.readFileSync(lessonsSrc, 'utf8')
const lessonSourcePaths = [...lessonsTxt.matchAll(/sourcePaths:\s*\[([\s\S]*?)\]/g)].map((m) =>
  [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]),
)
// 关联课程 id：按 order 取 lesson 块
const lessonIds = [...lessonsTxt.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1])

let fail = 0
console.log('=== 课程 sourcePaths 验证 ===')
lessonSourcePaths.forEach((pats, i) => {
  const id = lessonIds[i] ?? `#${i}`
  const misses = pats.filter((p) => !match(p))
  if (misses.length) {
    fail++
    console.log(`✗ ${id}: ${misses.join(', ')}`)
  } else {
    console.log(`✓ ${id}`)
  }
})

// 2) Quiz sourcePaths
const quizzesTxt = fs.readFileSync(path.join(ROOT, 'web', 'src', 'course', 'quizzes.ts'), 'utf8')
const quizPats = [...quizzesTxt.matchAll(/sourcePaths:\s*\[([\s\S]*?)\]/g)].flatMap((m) =>
  [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]),
)
const uniqueQuiz = [...new Set(quizPats)]
const quizMisses = uniqueQuiz.filter((p) => !match(p))
console.log('\n=== Quiz sourcePaths 验证 ===')
if (quizMisses.length) {
  fail++
  console.log('✗ ' + quizMisses.join(', '))
} else {
  console.log(`✓ 全部命中 (${uniqueQuiz.length} 个唯一路径)`)
}

// 3) content/*.ts 中的 sources path（递归扫描 content 目录）
console.log('\n=== content sources 验证 ===')
const contentFiles = []
walkDir(path.join(ROOT, 'web', 'src', 'content'), contentFiles)
const contentPats = new Set()
for (const f of contentFiles) {
  const txt = fs.readFileSync(f, 'utf8')
  // path: '...' 形式的源码引用
  const m = [...txt.matchAll(/path:\s*'([^']+)'/g)].map((x) => x[1])
  m.forEach((p) => contentPats.add(p))
}
// 过滤非源码路径（如 vendor 前缀正常）
const contentMisses = [...contentPats].filter((p) => !match(p))
const contentMismatch = contentMisses.filter((p) => !/^(vendor|docs)\//.test(p))
if (contentMismatch.length) {
  fail++
  console.log('✗ ' + contentMismatch.join('\n  '))
} else {
  console.log(`✓ content sources 全部命中 (${contentPats.size} 个唯一路径, 忽略 ${contentMisses.length - contentMismatch.length} 个 docs/vendor 前缀)`)
}

// 4) plugin-templates sources / sourcePaths
const ptTxt = fs.readFileSync(path.join(ROOT, 'web', 'src', 'content', 'plugin-templates.ts'), 'utf8')
const ptPats = [
  ...[...ptTxt.matchAll(/sourcePaths:\s*\[([\s\S]*?)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])),
  ...[...ptTxt.matchAll(/sources:\s*\[([\s\S]*?)\]/g)].flatMap((m) => [...m[1].matchAll(/path:\s*'([^']+)'/g)].map((x) => x[1])),
]
const ptUnique = [...new Set(ptPats)]
const ptMisses = ptUnique.filter((p) => !match(p))
console.log('\n=== plugin-templates 验证 ===')
if (ptMisses.length) {
  fail++
  console.log('✗ ' + ptMisses.join(', '))
} else {
  console.log(`✓ 全部命中 (${ptUnique.length} 个唯一路径)`)
}

// 5) AgentLoopPage / ToolLab 等其他组件的 sources
console.log('\n=== 其他组件 sources 验证 ===')
const extraDirs = ['AgentLoopPage.tsx', 'ToolLab.tsx', 'Graph.tsx']
const extraPats = new Set()
for (const f of extraDirs) {
  const candidates = [
    path.join(ROOT, 'web', 'src', 'pages', f),
    path.join(ROOT, 'web', 'src', 'components', 'plugin', f),
    path.join(ROOT, 'web', 'src', 'components', f),
    path.join(ROOT, 'web', 'src', 'components', 'lesson', f),
  ]
  const p = candidates.find((c) => fs.existsSync(c))
  if (!p) {
    console.log(`  (跳过 ${f}：未找到文件)`)
    continue
  }
  const txt = fs.readFileSync(p, 'utf8')
  ;[...txt.matchAll(/path:\s*'([^']+)'/g)].map((x) => x[1]).forEach((x) => extraPats.add(x))
}
const extraMisses = [...extraPats].filter((p) => !match(p))
if (extraMisses.length) {
  fail++
  console.log('✗ ' + extraMisses.join(', '))
} else {
  console.log(`✓ 全部命中 (${extraPats.size} 个唯一路径)`)
}

console.log(`\n${fail === 0 ? '✅ 全部通过' : '❌ ' + fail + ' 组失败'}`)
process.exit(fail === 0 ? 0 : 1)
