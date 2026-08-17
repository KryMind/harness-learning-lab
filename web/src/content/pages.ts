// ---------------------------------------------------------------------------
// 页面注册表：导航结构 + 学习路线
// V0.2：课程(12) / 开发者参考 分组；/ = HomePage，/overview = Lesson 1
// ---------------------------------------------------------------------------

export interface PageMeta {
  id: string
  route: string
  emoji: string
  title: string
  navTitle: string
  subtitle: string
  /** 若为课程页，指向 course lesson id（用于 ✓/● 状态与进度） */
  lessonId?: string
}

export interface NavSection {
  title: string
  pages: PageMeta[]
}

export const SECTIONS: NavSection[] = [
  {
    title: '课程',
    pages: [
      { id: 'overview', route: '/overview', emoji: '🏠', title: 'Harness 是什么', navTitle: 'Harness 是什么', subtitle: 'Harness 到底是什么', lessonId: 'overview' },
      { id: 'cordis', route: '/cordis', emoji: '🧩', title: 'Everything is a Plugin', navTitle: 'Plugin / Cordis', subtitle: 'Cordis、Plugin、ctx 如何组合', lessonId: 'cordis' },
      { id: 'profile', route: '/profile', emoji: '🧬', title: 'Profile / Bundle', navTitle: 'Profile / Bundle', subtitle: '如何把插件组装成可运行实例', lessonId: 'profile' },
      { id: 'agent-loop', route: '/agent-loop', emoji: '🔄', title: 'Agent Loop', navTitle: 'Agent Loop', subtitle: '一次提问的完整生命周期', lessonId: 'agent-loop' },
      { id: 'session', route: '/session', emoji: '💾', title: 'Session', navTitle: 'Session', subtitle: '事件日志、恢复、审计', lessonId: 'session' },
      { id: 'tools', route: '/tools', emoji: '🛠', title: 'Tools', navTitle: 'Tools', subtitle: '注册、执行、权限控制', lessonId: 'tools' },
      { id: 'skills', route: '/skills', emoji: '🧠', title: 'Skills', navTitle: 'Skills', subtitle: 'Provider → Catalog → Loader', lessonId: 'skills' },
      { id: 'subagent', route: '/subagent', emoji: '🤖', title: 'Subagent', navTitle: 'Subagent', subtitle: '主 Agent 如何创建子 Agent', lessonId: 'subagent' },
      { id: 'workflow', route: '/workflow', emoji: '⚙️', title: 'Workflow', navTitle: 'Workflow', subtitle: '动态编排多个 Subagent', lessonId: 'workflow' },
      { id: 'permission', route: '/permission', emoji: '🔐', title: 'Permission / Sandbox', navTitle: 'Permission', subtitle: 'Approval、权限预设、Sandbox', lessonId: 'permission' },
      { id: 'web-ui', route: '/web-ui', emoji: '🎨', title: 'Web UI / Slots', navTitle: 'Web UI', subtitle: 'React Client 与 UI 插件', lessonId: 'web-ui' },
      { id: 'plugin-generator', route: '/plugin-generator', emoji: '🧩', title: 'Plugin Generator', navTitle: 'Plugin Generator', subtitle: '在线生成插件模板 · 第 12 课', lessonId: 'plugin-generator' },
    ],
  },
  {
    title: '开发者参考',
    pages: [
      { id: 'packages', route: '/packages', emoji: '📦', title: 'Packages 总览', navTitle: 'Packages', subtitle: '每一个 package 干什么' },
      { id: 'source', route: '/source', emoji: '📂', title: '源码浏览器', navTitle: '源码浏览器', subtitle: '直接阅读官方源码' },
      { id: 'runtime-snapshot', route: '/runtime-snapshot', emoji: '📸', title: 'Runtime Snapshot', navTitle: 'Runtime Snapshot', subtitle: '构建时保存的静态 Plugin 结构' },
      { id: 'version', route: '/version', emoji: '🔄', title: '版本差异', navTitle: '版本差异', subtitle: '学习快照 vs 官方 master' },
      { id: 'plugin-code-lab', route: '/plugin-code-lab', emoji: '🧪', title: 'Plugin Code Lab', navTitle: 'Plugin Code Lab', subtitle: '静态代码预检 + Plugin Tree 模拟，不实际执行 Harness' },
    ],
  },
]

export const ALL_PAGES: PageMeta[] = SECTIONS.flatMap((s) => s.pages)

export function pageByRoute(route: string): PageMeta | undefined {
  return ALL_PAGES.find((p) => p.route === route)
}
