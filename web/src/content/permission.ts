import type { PageContent } from '../types'

export const permission: PageContent = {
  id: 'permission',
  title: 'Permission / Sandbox',
  emoji: '🔐',
  subtitle: 'Approval、权限预设、Sandbox —— 多层纵深防御',
  hero: [
    'Harness 用多层机制约束 Agent 的动作：Sandbox 限制子进程的文件效应，Approval 让高风险操作需要人工确认，权限预设（Permission Preset）把常见部署姿势固化成一键配置。',
    '核心原则是 fail closed：当沙箱不可用时报错（SANDBOX_UNAVAILABLE），绝不静默降级。dsh-base 默认 permission mode = workspace-write（写工作区 + 询问审批），危险模式 danger-full-access 才会 approval: never。',
  ],
  learn: [
    'Sandbox 后端：bwrap / Landlock / Seatbelt / Windows ACL',
    'ctx.sandbox.confine 如何约束子进程',
    '权限预设：read-only / workspace-write / danger-full-access',
    'Approval 生命周期：approval/asked → approval/decided',
    'fail closed 原则',
  ],
  nodes: [
    {
      id: 'sandbox-ctx', label: 'ctx.sandbox', kind: 'ctx',
      brief: 'SandboxProvider：文件效应沙箱',
      detail: 'packages/sandbox/sandbox 定义服务接口：confine(argv, policy) 以受限方式启动子进程。',
      sources: [{ path: 'packages/sandbox/sandbox/src/index.ts', label: 'sandbox/sandbox' }],
    },
    {
      id: 'sandbox-local', label: 'sandbox-local', kind: 'provider',
      brief: '本地沙箱 Provider',
      detail: 'dsh-base 挂载 @deepseek-ai/dsh-sandbox-local，是每个 CLI mode 默认的文件效应边界。',
      sources: [{ path: 'packages/sandbox/sandbox-local', label: 'sandbox-local' }, { path: 'packages/bundle/base/cordis.patch.yml', label: 'base/cordis.patch.yml' }],
    },
    {
      id: 'bwrap', label: 'bwrap (Linux)', kind: 'backend',
      brief: 'bubblewrap 用户命名空间',
      detail: 'Linux 下用 bubblewrap 隔离文件系统与挂载点。',
      docs: [{ path: 'docs/subsystems/sandbox.md', label: 'sandbox.md' }],
    },
    {
      id: 'landlock', label: 'Landlock (Linux)', kind: 'backend',
      brief: '内核级 Landlock LSM',
      detail: 'Linux 下的轻量内核沙箱（native/landlock-run），用 Landlock LSM 约束路径访问。',
      sources: [{ path: 'native/landlock-run', label: 'native/landlock-run' }],
    },
    {
      id: 'seatbelt', label: 'Seatbelt (macOS)', kind: 'backend',
      brief: 'macOS 沙箱配置',
      detail: 'macOS 下用 Seatbelt profile 约束进程。',
      docs: [{ path: 'docs/subsystems/sandbox.md', label: 'sandbox.md' }],
    },
    {
      id: 'winacl', label: 'Windows ACL', kind: 'backend',
      brief: 'Windows 文件 ACL 约束',
      detail: 'sandbox-windows-acl 在 Windows 上用 ACL 约束进程对工作区的访问。',
      sources: [{ path: 'packages/sandbox/sandbox-windows-acl', label: 'sandbox-windows-acl' }],
    },
    {
      id: 'policy', label: 'sandbox-policy', kind: 'concept',
      brief: '策略层：模式 + 工作区',
      detail: 'sandbox-policy 决定当前策略：sandbox 模式（read-only / workspace-write / danger-full-access）+ workspaceRoot。默认 workspace-write。',
      sources: [{ path: 'packages/sandbox/sandbox-policy', label: 'sandbox-policy' }, { path: 'packages/bundle/base/cordis.patch.yml', label: 'base/cordis.patch.yml' }],
    },
    {
      id: 'presets', label: '权限预设', kind: 'concept',
      brief: '三档一键配置',
      detail: 'permission-presets 定义 read-only（sandbox: read-only, approval: ask）、workspace-write（sandbox: workspace-write, approval: ask）、danger-full-access（sandbox: danger-full-access, approval: never）。DSH_PERMISSION_MODE 选择默认档。',
      sources: [{ path: 'packages/interaction/permission-presets', label: 'permission-presets' }],
    },
    {
      id: 'approval', label: 'Approval', kind: 'concept',
      brief: '人工审批：approval/asked → approval/decided',
      detail: 'user-approval 插件按 policy（never/ask）在 tools/pre-execute 介入：ask 时发 approval/asked 请求用户，approval/decided 记录决定，均为 durable 事件。',
      sources: [{ path: 'packages/interaction/user-approval', label: 'user-approval' }],
      docs: [{ path: 'docs/subsystems/approval.md', label: 'approval.md' }],
    },
    {
      id: 'failclosed', label: 'fail closed', kind: 'concept',
      brief: '沙箱不可用时报错，绝不静默',
      detail: '官方文档明确：沙箱无法建立时抛 SANDBOX_UNAVAILABLE，流程失败而非悄悄放开权限。这是安全底线。',
      docs: [{ path: 'docs/subsystems/sandbox.md', label: 'sandbox.md' }],
    },
    {
      id: 'bash-sandbox', label: 'bash/pwsh 沙箱', kind: 'concept',
      brief: 'shell 工具的受限执行',
      detail: 'bash-sandbox（Linux 启用、Windows disabled）与 pwsh-sandbox（仅 Windows）在沙箱里执行 shell，并配超时（60s）。',
      sources: [{ path: 'packages/bundle/base/cordis.patch.yml', label: 'base/cordis.patch.yml' }],
    },
  ],
  edges: [
    { id: 'pe-ctx-local', from: 'sandbox-ctx', to: 'sandbox-local', label: 'Provider' },
    { id: 'pe-ctx-confine', from: 'sandbox-ctx', to: 'policy', label: 'confine(argv, policy)' },
    { id: 'pe-local-bwrap', from: 'sandbox-local', to: 'bwrap', label: 'Linux' },
    { id: 'pe-local-landlock', from: 'sandbox-local', to: 'landlock', label: 'Linux' },
    { id: 'pe-local-seatbelt', from: 'sandbox-local', to: 'seatbelt', label: 'macOS' },
    { id: 'pe-local-winacl', from: 'sandbox-local', to: 'winacl', label: 'Windows' },
    { id: 'pe-policy-presets', from: 'policy', to: 'presets', label: '由预设决定' },
    { id: 'pe-presets-approval', from: 'presets', to: 'approval', label: 'approval: ask/never' },
    { id: 'pe-approval-fail', from: 'approval', to: 'failclosed', label: '拒绝而非放行' },
    { id: 'pe-policy-bash', from: 'policy', to: 'bash-sandbox', label: 'shell 受限' },
  ],
  concepts: [
    {
      title: '纵深防御的三层',
      icon: '🏰',
      body: 'Sandbox（进程层文件效应）→ 权限预设（策略层）→ Approval（人治层）。一层被绕过还有下一层兜底。',
      sources: [{ path: 'packages/sandbox/sandbox-policy', label: 'sandbox-policy' }],
    },
    {
      title: 'fail closed 绝不静默降级',
      icon: '🔒',
      body: '沙箱建立失败 = SANDBOX_UNAVAILABLE = 直接报错。官方宁可让任务失败，也不在无沙箱状态下放开文件访问。',
      sources: [{ path: 'docs/subsystems/sandbox.md', label: 'sandbox.md' }],
    },
    {
      title: '三档预设覆盖绝大多数场景',
      icon: '🗂',
      body: 'read-only（只读浏览）/ workspace-write（工作区可写 + 询问）/ danger-full-access（全开 + 不询问）。部署时用 DSH_PERMISSION_MODE 选档即可。',
      sources: [{ path: 'packages/bundle/base/cordis.patch.yml', label: 'base/cordis.patch.yml' }],
    },
    {
      title: '审批也是 durable 事件',
      icon: '🧾',
      body: 'approval/asked 与 approval/decided 进 Session 日志 —— “谁批准了什么”可审计。这正是未来审计 / 监控类页面的数据基础。',
      sources: [{ path: 'packages/interaction/user-approval', label: 'user-approval' }],
    },
  ],
  packages: [
    'packages/sandbox/sandbox',
    'packages/sandbox/sandbox-local',
    'packages/sandbox/sandbox-policy',
    'packages/sandbox/sandbox-windows-acl',
    'packages/interaction/user-approval',
    'packages/interaction/permission-presets',
    'packages/guard/timeout-policy',
  ],
  docs: [
    { path: 'docs/subsystems/sandbox.md', label: 'docs/subsystems/sandbox.md' },
    { path: 'docs/subsystems/approval.md', label: 'docs/subsystems/approval.md' },
    { path: 'docs/subsystems/shell.md', label: 'docs/subsystems/shell.md' },
  ],
  relatedPages: ['/tools', '/agent-loop', '/runtime-snapshot'],
}

export default permission
