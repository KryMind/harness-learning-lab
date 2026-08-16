# Harness Learning Lab

把 DeepSeek Harness 官方源码，变成一座**可点击、可追踪、可学习的源码驱动学习地图**。

> 本项目不复制官方文档，而是把 `deepseek-harness` 源码扫描成结构化索引，
> 以「知识图谱 + 源码映射 + 动画」的方式带你理解 Harness 到底由什么组成、怎么跑起来。

当前扫描的官方源码 commit：`47f943859b`（`deepseek-harness` 主仓库）

---

## 这是什么

Harness Learning Lab 是一个**纯静态学习网站**：

- 全景图 / 插件架构（Cordis、Plugin、ctx）
- Profile / Bundle 如何组装可运行实例
- **Agent Loop**：一次提问的完整生命周期（动画 + 时序图）
- Session / Tools / Skills / Subagent / Workflow / Permission & Sandbox / Web UI & Slots
- Packages 总览：每一个官方 package 到底干什么
- **源码浏览器**：直接在浏览器里阅读官方源码（Monaco 高亮）
- **Plugin Generator**：纯浏览器端在线生成插件模板
- 深浅色模式、全局搜索、每个知识点都映射到真实源码

## 架构

```
deepseek-harness/  本地官方源码，仅作为扫描输入（不提交 Git）
      │  pnpm generate（scripts/scan.ts）
      ▼
generated/          静态知识数据（提交 Git，权威数据源）
  ├─ repo-index.json      全量文件索引（含 commit_hash）
  ├─ packages.json        243+ 包解析
  ├─ docs-index.json      文档大纲
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

> 原「Live Harness Runtime」功能（执行 `dsh --profile web --dump-config`、Session Live Stream、
> Tool Live Execution、Shell）已停用，详见下方「与 Harness Plugin Studio 的边界」。

## 本地启动

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
- 前端使用 **HashRouter**，`/#/architecture` 这类子路由刷新不会 404
- Vite `base` 由 CI 环境变量 `HLL_BASE_URL=/<repo>/` 动态设置（本地默认 `/`，不硬编码仓库名）

## Plugin Generator

`/#/plugin-generator` 支持：选择插件类型（Tool / Skill / Subagent / Workflow / Web UI / Schedule）→
填写名称与描述 → 生成代码预览 → 复制 → 导出模板文件。每个模板都标注了对应的官方 source / docs 来源。

> 在线生成**仅负责创建插件模板**。
> 真实安装、加载、Hot Reload 和运行测试将在 **Harness Plugin Studio** 中完成。

## 与 Harness Plugin Studio 的边界

| 能力 | Learning Lab（本仓库） | Harness Plugin Studio（未来） |
| --- | --- | --- |
| 源码学习 / 架构 / 动画 | ✅ | — |
| 插件模板生成 | ✅（纯浏览器端） | ✅ |
| 真实 Harness 运行（dump-config / Session / Tool / Shell） | ❌（已停用，仅静态讲解） | ✅ |
| 插件安装 / 加载 / Hot Reload / 运行测试 | ❌ | ✅ |

## 功能截图

暂无在线截图；本地运行 `pnpm dev` 后可直接查看各页面。
（欢迎贡献 `docs/screenshots/*.png`）

## 许可

[MIT](./LICENSE)

> 注意：本项目不包含 `deepseek-harness` 官方仓库代码（仅作为本地扫描输入），
> 不构成对官方源码的再分发。官方源码遵循其自身 LICENSE。
