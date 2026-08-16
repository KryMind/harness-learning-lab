// ---------------------------------------------------------------------------
// 页面注册表：导航结构 + 学习路线
// ---------------------------------------------------------------------------

export interface PageMeta {
  id: string
  route: string
  emoji: string
  title: string
  navTitle: string
  subtitle: string
}

export interface NavSection {
  title: string
  pages: PageMeta[]
}

export const SECTIONS: NavSection[] = [
  {
    title: '入门',
    pages: [
      { id: 'overview', route: '/', emoji: '🏠', title: 'Harness 全景', navTitle: '全景', subtitle: 'Harness 到底由什么组成' },
      { id: 'cordis', route: '/cordis', emoji: '🧩', title: '插件架构', navTitle: '插件架构', subtitle: 'Cordis、Plugin、ctx 如何组合' },
      { id: 'profile', route: '/profile', emoji: '🧬', title: 'Profile / Bundle', navTitle: 'Profile/Bundle', subtitle: '如何把插件组装成可运行实例' },
    ],
  },
  {
    title: '核心执行',
    pages: [
      { id: 'agentloop', route: '/agent-loop', emoji: '🔄', title: 'Agent Loop', navTitle: 'Agent Loop', subtitle: '一次提问的完整生命周期' },
      { id: 'session', route: '/session', emoji: '💾', title: 'Session', navTitle: 'Session', subtitle: '事件日志、恢复、审计' },
      { id: 'tools', route: '/tools', emoji: '🛠', title: 'Tools', navTitle: 'Tools', subtitle: '注册、执行、权限控制' },
      { id: 'skills', route: '/skills', emoji: '🧠', title: 'Skills', navTitle: 'Skills', subtitle: 'Provider → Catalog → Loader' },
      { id: 'subagent', route: '/subagent', emoji: '🤖', title: 'Subagent', navTitle: 'Subagent', subtitle: '主 Agent 如何创建子 Agent' },
      { id: 'workflow', route: '/workflow', emoji: '⚙️', title: 'Workflow', navTitle: 'Workflow', subtitle: '动态编排多个 Subagent' },
      { id: 'permission', route: '/permission', emoji: '🔐', title: 'Permission / Sandbox', navTitle: '权限与沙箱', subtitle: 'Approval、权限预设、Sandbox' },
    ],
  },
  {
    title: '前端',
    pages: [
      { id: 'webui', route: '/web-ui', emoji: '🎨', title: 'Web UI / Slots', navTitle: 'Web UI / Slots', subtitle: 'React Client 与 UI 插件' },
    ],
  },
  {
    title: '数据与运行时',
    pages: [
      { id: 'packages', route: '/packages', emoji: '📦', title: 'Packages 总览', navTitle: 'Packages', subtitle: '每一个 package 干什么' },
      { id: 'source', route: '/source', emoji: '📂', title: '源码浏览器', navTitle: '源码浏览器', subtitle: '直接阅读官方源码' },
      { id: 'live', route: '/live', emoji: '🟢', title: 'Live Harness', navTitle: 'Live Harness', subtitle: '当前机器的实际 Plugin Tree' },
    ],
  },
  {
    title: '动手',
    pages: [
      { id: 'playground', route: '/playground', emoji: '🧪', title: 'Playground', navTitle: 'Playground', subtitle: '自己写一个 Harness Plugin' },
    ],
  },
]

export const ALL_PAGES: PageMeta[] = SECTIONS.flatMap((s) => s.pages)

export function pageByRoute(route: string): PageMeta | undefined {
  return ALL_PAGES.find((p) => p.route === route)
}

/** 推荐学习顺序（数字标注） */
export const LEARN_ORDER: { no: string; pageId: string; tip: string }[] = [
  { no: '①', pageId: 'overview', tip: '先建立整体心智' },
  { no: '②', pageId: 'cordis', tip: '一切皆插件' },
  { no: '③', pageId: 'profile', tip: '如何组装实例' },
  { no: '④', pageId: 'agentloop', tip: '优先理解执行链路' },
  { no: '⑤', pageId: 'session', tip: '事件日志 = 单一事实源' },
  { no: '⑥', pageId: 'tools', tip: '工具执行管线' },
  { no: '⑦', pageId: 'skills', tip: '能力注入' },
  { no: '⑧', pageId: 'subagent', tip: '子代理协作' },
  { no: '⑨', pageId: 'workflow', tip: '多代理编排' },
  { no: '⑩', pageId: 'permission', tip: '安全与审批' },
  { no: '⑪', pageId: 'webui', tip: 'UI 插件与 Slots' },
  { no: '⑫', pageId: 'playground', tip: '动手写插件' },
]
