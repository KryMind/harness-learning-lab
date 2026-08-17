# Harness Learning Lab

把 DeepSeek Harness 官方源码，变成一座**可点击、可追踪、可学习的源码驱动学习地图**。

> 本项目不复制官方文档，而是把 `deepseek-harness` 源码扫描成结构化索引，
> 以「渐进式课程 + 知识图谱 + 源码映射 + 动画」的方式带你理解 Harness 由什么组成、怎么跑起来。

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)

---

## 这是什么

Harness Learning Lab 是一个**纯静态学习网站**，面向第一次接触 Harness 的初学者：

- **12 门渐进式课程**：每课按「一句话理解 → 学习目标 → 可视化 → 互动 → 源码证据 → 小测」组织，一次只讲透一个概念
- **源码驱动**：每个知识点都映射到官方源码的真实路径，浏览器内直接阅读（Monaco 高亮）
- **Agent Loop**：一次提问的完整生命周期（动画 + 时序图）
- **Command Palette 全局搜索**（Ctrl+K）：概念 > 公共 API > Package/Docs > 源码，按相关性排序
- **版本感知**：课程绑定官方源码快照 commit，`/version` 页动态对比官方 `master` 差异
- **Plugin Generator**：纯浏览器端在线生成插件模板（Tool / Skill / Subagent / Workflow / Web UI / Schedule）
- **Tool 插件练习**：在 Plugin Generator 内编辑 Tool 插件、做基础结构检查与 Plugin Tree 模拟（不实际执行 Harness）
- **学习进度**：localStorage 本地记录，随用随存，无需账号
- **深浅色模式 + 移动端适配**（900px 以下抽屉导航）

### 课程一览

| # | 课程 | 内容 |
| --- | --- | --- |
| 1 | Harness 是什么 | 全局地图：Harness 与 Agent / LLM 的关系 |
| 2 | Plugin / Cordis | 一切皆插件，Cordis 是宿主 |
| 3 | Profile / Bundle | 如何把插件组装成可运行实例 |
| 4 | Agent Loop | 一次提问的完整生命周期 |
| 5 | Session | 事件日志、恢复、审计 |
| 6 | Tools | 注册、执行、权限控制 |
| 7 | Skills | Provider → Catalog → Loader |
| 8 | Subagent | 主 Agent 如何创建子 Agent |
| 9 | Workflow | 动态编排多个 Subagent |
| 10 | Permission / Sandbox | Approval、权限预设、Sandbox |
| 11 | Web UI / Slots | React Client 与 UI 插件 |
| 12 | Plugin Generator | 在线生成插件模板 |

## 架构

```
deepseek-harness/  本地官方源码，仅作为扫描输入（不提交 Git）
      │  pnpm generate（scripts/scan.ts）
      ▼
generated/          静态知识数据（提交 Git，权威数据源）
  ├─ repo-index.json      全量文件索引（含 commit_hash）
  ├─ packages.json        243+ 包解析
  ├─ docs-index.json      文档大纲
  ├─ search/              搜索索引（api-symbols / version 等）
  ├─ stats.json           汇总统计
  ├─ sources-index.json   源码路径 → chunk 映射
  └─ sources/chunk-*.json 源码内容分块（按需加载）
      │  构建时同步到 web/public/data/
      ▼
web/                前端（React + Vite + HashRouter）
      ▼
dist/               GitHub Pages 静态产物
```

浏览器运行时**不依赖任何后端**：所有数据都是构建期生成的静态 JSON。

## 快速开始

前置：Node.js ≥ 18、pnpm ≥ 11。

```bash
pnpm install
pnpm generate   # 首次构建前端静态数据（有 deepseek-harness 则重新扫描，没有则复用已提交数据）
pnpm dev        # http://localhost:5173/
```

> 单独 `pnpm dev` 依赖 `web/public/data/`（由 `pnpm generate` 生成）。
> 从零克隆后请先执行 `pnpm generate`。

## 重新生成数据

```bash
pnpm generate
```

- 若本机存在 `deepseek-harness/`，会重新扫描源码生成全部静态数据；
- 若不存在（例如 CI），会直接复用已提交的 `generated/` 并同步到 `web/public/data/`。

## 构建 / 本地预览

```bash
pnpm build      # 生成 GitHub Pages 可部署的静态站（web/dist）
pnpm preview    # 本地预览生产构建（http://localhost:4173/）
```

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，把本目录推上去（`deepseek-harness/` 与 `node_modules/` 已被 `.gitignore` 排除）。
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**。
3. push 到 `main` 分支，或手动触发 Actions 的 `Deploy to GitHub Pages`。

Workflow 位于 `.github/workflows/deploy-pages.yml`：

- `pnpm install --frozen-lockfile` → `pnpm build` → 官方 Actions 上传并部署
- 部署到子路径 `https://<user>.github.io/<repo>/`
- 前端使用 **HashRouter**，`/#/overview` 这类子路由刷新不会 404
- Vite `base` 由 CI 环境变量 `HLL_BASE_URL=/<repo>/` 动态设置（本地默认 `/`，不硬编码仓库名）

## 与 Harness Plugin Studio 的边界

| 能力 | Learning Lab（本仓库） | Harness Plugin Studio（未来） |
| --- | --- | --- |
| 源码学习 / 架构 / 动画 | ✅ | — |
| 插件模板生成 | ✅（纯浏览器端） | ✅ |
| 真实 Harness 运行（dump-config / Session / Tool / Shell） | ❌（仅静态讲解） | ✅ |
| 插件安装 / 加载 / Hot Reload / 运行测试 | ❌ | ✅ |

## 功能截图

暂无在线截图；本地运行 `pnpm dev` 后可直接查看各页面。
（欢迎贡献 `docs/screenshots/*.png`）

## 许可

[MIT](./LICENSE)

> 注意：本项目不包含 `deepseek-harness` 官方仓库代码（仅作为本地扫描输入），
> 不构成对官方源码的再分发。官方源码遵循其自身 LICENSE。
