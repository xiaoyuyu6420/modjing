# 模镜项目盘点

> 性质：项目资产盘点——"手里有什么"。不写"要做什么"（那在 [constitution](/.specify/memory/constitution.md) 和 `specs/`）。
> 维护：技术栈/模型/管线变动时同步更新。

---

## 技术栈

| 层 | 选型 | 版本 |
|----|------|------|
| 框架 | Next.js (App Router) | 15.3 |
| 样式 | Tailwind CSS | 4.1 |
| ORM | Prisma | 6.9 |
| 数据库 | SQLite | `dev.db` 单文件 |
| 单元测试 | Vitest | 4.1 |
| E2E 测试 | Playwright | 1.61 |
| 语言 | TypeScript (strict) | 5.8 |
| 运行时 | Node.js | ≥22 |

路径别名 `@/*` → `./src/*`。dev 端口 3020。深色优先（layout 已设）。

---

## 目录结构

```
src/
  app/           # App Router：页面直接平铺在 app/ 下（无 route group 包裹公开页）
    admin/       # 后台，用 (dashboard) route group + login
    api/         # API routes：cron/sync-hvoy、probe
  lib/           # 业务逻辑：probe、detect、prisma（hvoy/ 待建）
  components/    # 组件（Chrome 布局壳 + 各页组件）
scripts/         # 数据脚本：import-hvoy.mjs、sync-hvoy.mjs
prisma/          # schema.prisma + dev.db
research/        # hvoy 情报 + API 快照（非运行时依赖）
docs/            # 文档：reference / research 层
.specify/        # Spec-Kit harness：memory/constitution.md
specs/           # 规格三件套：data-pipeline/...
```

---

## 数据模型（7 张表）

| 表 | 职责 | 关键字段 |
|----|------|---------|
| Site | 中转站基础信息 | name, url, status, isFree + 企业合规扩展（invoice/compliance/sla） |
| SiteModelPrice | 站点 × 模型 × 渠道价格 | 三价（price 输入 / priceOutput / priceCached）, passRate, onlineRate, fakeRateBand, weightedScore, tampered |
| PriceHistory | 价格历史趋势 | price, recordedAt |
| ProbeResult | 自建探针结果 | score, verdict, tokenUsageRatio, latencyMs, source |
| HealthCheck | 健康检查 | latency, status |
| Review | 用户评价 | author, content, rating |
| RelayNotice | 站点公告 | noticeText, sourceType, publishedAt |

`@@unique([siteId, modelName])` 保证渠道唯一。详见 `prisma/schema.prisma`。

---

## 数据管线（三层 + 一个探测入口）

| 层 | 文件 | 数据流 | 触发 |
|----|------|--------|------|
| 离线导入 | `scripts/import-hvoy.mjs` | `research/` 快照 → 全量重建（清表 → Site/SMP/PriceHistory → 合并 all-channels） | 一次性 |
| 在线同步·快 | `scripts/sync-hvoy.mjs`(quickSync) + `src/app/api/cron/sync-hvoy/route.ts` | hvoy `/__all-channels` → 更新探针数据 + 价格趋势 | cron 高频 |
| 在线同步·全 | `scripts/sync-hvoy.mjs`(fullSync) | hvoy `/__providers` + `/__site-detail/{slug}` → upsert 站点 + 价格 | cron 每天 |
| 自建探针 | `src/lib/probe.ts` + `src/app/api/probe/route.ts` | 直测中转站 OpenAI 兼容 API → ProbeResult | 管理员触发 |

**hvoy API 契约**（AllChannels / Providers / SiteDetail 字段）：见 `specs/data-pipeline/`（待建）或从上述代码提取。

---

## 页面清单

### 公开页（19 个）

**接 prisma 真实数据（11）**：首页 `/`、`/sites`、`/sites/[siteId]`、`/models`、`/models/[modelId]`、`/leaderboard`、`/free`、`/plans`、`/enterprise`、`/rp`、`/model-select`

**静态 / 工具页（8）**：`/benchmark`（客户端测速）、`/methodology`（探针公开）、`/consult`、`/contact`、`/notices`、`/privacy`、`/terms`、`/codex-radar`

> ⚠️ 首页实时雷达 Ticker 为**硬编码演示数据**，非真实流。

### admin 后台 `/admin`（12 个，`(dashboard)` route group）

总览、`sites`(列表/详情/新建)、`prices`(列表/详情)、`reviews`、`health`、`notices`(列表/详情/新建)、`login`

---

## 测试现状

- ✅ Vitest 已配（`npm test` = `vitest run`）
- ✅ 4 个测试：`src/lib/probe.test.ts`、`src/lib/detect/{api-verifier,index,llm-verify}.test.ts`
- ❌ **import/sync 数据管线：零测试**
- ❌ 无 schema 校验（zod 未引入）
- ✅ Playwright 已配（`npm run e2e`）

---

## 依赖

- **生产（4）**：`next`、`react`、`react-dom`、`@prisma/client`
- **开发**：`prisma`、`tailwindcss`、`vitest` + `@vitest/coverage-v8`、`@playwright/test`、`eslint` + `eslint-config-next`、`typescript`

---

## 已知缺口

1. **无 schema 校验**——hvoy 字段缺失/类型变化静默写 null（数据管线 spec 要解决）
2. **数据管线逻辑重复**——`fakeRateToBand`/`parseDate`/`domainFromUrl` 在 import 和 sync 各一份；`quickSync` 在 script 和 route 两份
3. **外部检测服务依赖**——`src/lib/detect/` 调用 llm-verify/APIVerifier Python 服务，待移除/内置化（constitution §2 约束）
4. **methodology 页 prompt 溯源**——源自 llm-verify（MIT），需补版权声明（constitution §2 约束）
5. **无 `.env.example`**
6. **首页 Ticker 等多处演示数据**未接真实流

---

## 命令速查

| 命令 | 作用 |
|------|------|
| `npm run dev` | 开发服务器 (:3020) |
| `npm run build` | 生产构建 |
| `npm test` | Vitest 单元测试 |
| `npm run e2e` | Playwright E2E |
| `npm run import-hvoy` | 从 `research/` 快照全量导入 |
| `npm run sync-hvoy` | 增量同步（quick，all-channels） |
| `npm run sync-hvoy:full` | 全量同步（providers + site-detail） |
| `npx prisma studio` | 数据库管理 UI |
| `npx prisma db push` | 同步 schema 变更到 dev.db |
