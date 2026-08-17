import type { PageContent } from '../types'

export const profile: PageContent = {
  id: 'profile',
  title: 'Profile / Bundle',
  emoji: '🧬',
  subtitle: '如何把 200+ 个插件组装成一个可运行的 Harness 实例',
  hero: [
    '插件是积木，Profile 是图纸，Bundle 是预组装包。dsh 通过「插件名 → bundle → profile」三层组合决定启动什么，最终由 dsh CLI 加载 Cordis 宿主并监听。',
    '最直观的方式是 `dsh --profile web --dump-config`：它把当前机器上实际要启动的插件树打印出来（详见 Live Harness 页）。dsh-base 是每个 profile 的公共核心；dsh-web-app / dsh-headless 决定这个实例是带 UI 还是纯命令行。',
  ],
  learn: [
    'Profile 与 Bundle 的区别',
    'dsh-base：所有实例的公共核心',
    'dsh-web-app 与 dsh-headless 的分野',
    'cordis.patch.yml：以 patch 方式声明插件行',
    'dsh CLI 的 --profile / --dump-config',
  ],
  nodes: [
    {
      id: 'cli', label: 'dsh CLI', kind: 'file',
      brief: 'apps/cli —— 命令行入口，解析 profile、启动宿主',
      detail: 'CLI 通过 profile-boot.ts 加载 profile 与 bundle，用 dump-config.ts 打印插件树，然后启动 Cordis 宿主。',
      sources: [
        { path: 'apps/cli/src/bin.ts', label: 'cli/bin.ts' },
        { path: 'apps/cli/src/profile-boot.ts', label: 'profile-boot.ts' },
        { path: 'apps/cli/src/dump-config.ts', label: 'dump-config.ts' },
      ],
    },
    {
      id: 'profile', label: 'Profile', kind: 'profile',
      brief: '选择加载哪些 bundle / 插件 + 用户覆盖',
      detail: 'profile 决定“要启动哪些插件”。它通过 cordis.patch.yml 以增删改行的方式组装：dsh-base 打底，mode bundle 叠加，最后用户 patch 覆盖。',
      sources: [{ path: 'apps/cli/src/profile-boot.ts', label: 'profile-boot.ts' }],
      docs: [{ path: 'docs/development.md', label: 'development.md' }],
    },
    {
      id: 'bundle', label: 'Bundle', kind: 'bundle',
      brief: '插件组合包：dsh.bundle.patch 清单',
      detail: 'bundle 包本身几乎不含运行时代码，它的“实质”是 manifest 里的 dsh.bundle.patch 字段指向的 cordis.patch.yml，由 profile composer 解析合并。',
      sources: [
        { path: 'packages/bundle/base/src/index.ts', label: 'base/src/index.ts' },
        { path: 'packages/bundle/base/cordis.patch.yml', label: 'base/cordis.patch.yml' },
      ],
    },
    {
      id: 'base', label: 'dsh-base', kind: 'bundle',
      brief: '公共核心：llm / session / agent / tools / sandbox / skill / subagent / workflow……',
      detail: 'dsh-base 的 cordis.patch.yml 插入了 60+ 行插件：timer、hmr、llm、llm-deepseek、agent、agent-loop、session、session-persistence-jsonl、tools、tool-fs、tool-bash、sandbox、sandbox-policy、approval、permission、skill、skill-filesystem、tool-skill、subagent、subagent-spawn/fork、workflow-worker-thread、tool-workflow 等。',
      sources: [{ path: 'packages/bundle/base/cordis.patch.yml', label: 'base/cordis.patch.yml' }],
    },
    {
      id: 'web-app', label: 'dsh-web-app', kind: 'bundle',
      brief: '叠加 Web UI：client shell + 39 个 UI 插件',
      detail: '在 dsh-base 之上叠加 Web Client 相关插件：client/web、client/web-react、ui-sidebar、ui-conversation、ui-tool、ui-skill、ui-subagent、ui-trajectory、ui-workflow-run……让实例拥有浏览器 UI。',
      sources: [{ path: 'packages/bundle/web-app', label: 'bundle/web-app' }],
    },
    {
      id: 'headless', label: 'dsh-headless', kind: 'bundle',
      brief: '纯命令行模式，无 Web UI',
      detail: '只加载 CLI 交互所需的最小插件集，适合脚本、CI、后台任务场景。',
      sources: [{ path: 'packages/bundle/headless', label: 'bundle/headless' }],
    },
    {
      id: 'patch', label: 'cordis.patch.yml', kind: 'file',
      brief: '以 patch 增删改插件行的声明文件',
      detail: 'patch 文件里是 - insert: 的插件行（id + name + config）。同一行 id 在后面的 layer 再次出现时“后写覆盖”，这就是 mode bundle 与用户 profile 覆盖默认值的方式。',
      sources: [{ path: 'packages/bundle/base/cordis.patch.yml', label: 'cordis.patch.yml' }],
    },
    {
      id: 'composer', label: 'Profile Composer', kind: 'concept',
      brief: '按 dsh.bundle.patch 字段合并多张 patch',
      detail: 'composer 读取每个 bundle 的 dsh.bundle.patch 指向的 cordis.patch.yml，按层序合并成一个最终插件清单，再交给 Cordis 注册表启动。',
      sources: [{ path: 'apps/cli/src/profile-boot.ts', label: 'profile-boot.ts' }],
    },
    {
      id: 'dump', label: '--dump-config', kind: 'tool',
      brief: '打印当前机器实际启动的插件树',
      detail: 'dsh --profile web --dump-config 会解析出完整插件树（profile → bundle → 每个插件的 id/name/config），是理解“这台机器上 Harness 到底长什么样”的最快路径。',
      sources: [{ path: 'apps/cli/src/dump-config.ts', label: 'dump-config.ts' }],
      docs: [{ path: 'docs/development.md', label: 'development.md' }],
    },
  ],
  edges: [
    { id: 'pe-cli-profile', from: 'cli', to: 'profile', label: '--profile' },
    { id: 'pe-cli-dump', from: 'cli', to: 'dump', label: '--dump-config' },
    { id: 'pe-profile-bundle', from: 'profile', to: 'bundle', label: '组装' },
    { id: 'pe-profile-patch', from: 'profile', to: 'patch', label: '覆盖' },
    { id: 'pe-bundle-base', from: 'bundle', to: 'base', label: 'dsh.bundle.patch' },
    { id: 'pe-bundle-web', from: 'bundle', to: 'web-app', label: 'mode bundle' },
    { id: 'pe-bundle-head', from: 'bundle', to: 'headless', label: 'mode bundle' },
    { id: 'pe-composer-patch', from: 'composer', to: 'patch', label: '解析' },
    { id: 'pe-composer-bundle', from: 'composer', to: 'bundle', label: '读取' },
    { id: 'pe-base-patch', from: 'base', to: 'patch', label: '声明' },
    { id: 'pe-web-patch', from: 'web-app', to: 'patch', label: '声明' },
    { id: 'pe-dump-profile', from: 'dump', to: 'profile', label: '输出' },
  ],
  concepts: [
    {
      title: 'Bundle 的实质是 patch 清单',
      icon: '📋',
      body: '@deepseek-ai/dsh-base 的 src/index.ts 是一个空导出 —— 它的实质是 manifest 字段 dsh.bundle.patch 指向的 cordis.patch.yml。插件名不写死在代码里，而是在清单里声明。',
      sources: [{ path: 'packages/bundle/base/cordis.patch.yml', label: 'base/cordis.patch.yml' }],
    },
    {
      title: '后写覆盖（last-write-wins）',
      icon: '🖊',
      body: '同一插件行 id 在多层 patch 里出现时，后面的 layer 整个替换该行的 config，而不是合并。因此 mode bundle 与用户 profile 可以精确覆盖 dsh-base 的默认值。',
      sources: [{ path: 'packages/bundle/base/cordis.patch.yml', label: 'cordis.patch.yml' }],
    },
    {
      title: '一个 profile = 一个可运行实例',
      icon: '🚀',
      body: 'web profile = dsh-base + dsh-web-app + 用户覆盖，启动一个带浏览器 UI 的实例；headless = 纯 CLI。`dsh --profile <name>` 是唯一入口。',
      sources: [{ path: 'apps/cli/src/profile-boot.ts', label: 'profile-boot.ts' }],
    },
    {
      title: '权限等部署取舍由 patch 决定',
      icon: '🔐',
      body: 'dsh-base 里的 sandbox / approval / permission 行只放共享身份与中性默认；真正的 mode 差异（如 read-only / workspace-write / danger-full-access）由各层 patch 覆盖，避免“一行横跨多层”。',
      sources: [{ path: 'packages/bundle/base/cordis.patch.yml', label: 'cordis.patch.yml' }],
    },
  ],
  packages: [
    'packages/bundle/base',
    'packages/bundle/web-app',
    'packages/bundle/headless',
    'apps/cli',
  ],
  docs: [
    { path: 'docs/development.md', label: 'docs/development.md' },
    { path: 'docs/architecture.md', label: 'docs/architecture.md' },
    { path: 'docs/config-catalog.md', label: 'docs/config-catalog.md' },
  ],
  relatedPages: ['/cordis', '/runtime-snapshot', '/agent-loop'],
}

export default profile
