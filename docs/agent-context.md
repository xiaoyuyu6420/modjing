# Agent 公共 Context

> 所有页面 agent 都必读
> 写完后删除（这是临时文档）

## 项目要点

- 路径：`/Users/munich/Desktop/独立项目/modjing`
- Next.js 15 App Router + TypeScript + Prisma + SQLite + Tailwind v4
- 端口 3020
- 路径别名 `@/*` → `./src/*`
- TypeScript strict、两空格、单引号、无分号、kebab-case 文件名、PascalCase 组件
- 默认深色模式：bg-gray-950 / text-gray-100
- 数据走 Prisma：`import { prisma } from '@/lib/prisma'`
- 页面优先 Server Components（async function Page），表格筛选/排序可用 Client Component

## 数据库现状（重要！）

```
447 个 Site，5289 个 SiteModelPrice，6918 个 PriceHistory
```

`SiteModelPrice.modelName` 格式是 `${baseModelName}@${channelName}`，例如：
- `claude-opus-4-6@default`
- `claude-opus-4-7@max`
- `gpt-5.5@cn`
- `gemini-3.1-pro-preview@白银会员`

**读取时要 split('@')**：第一段是基础模型名（用于按模型聚合/查询），第二段是渠道名（用于展示）。

主流基础模型（按数量降序）：
```
claude-opus-4-6, claude-sonnet-4-6, claude-opus-4-7, claude-opus-4-8,
gpt-5.5, gpt-5.4, gpt-image-2, claude-fable-5,
gemini-3.5-flash, gemini-3.1-pro-preview,
deepseek-v4-pro, deepseek-v4-flash,
glm-5.1, kimi-k2.6, MiniMax-M2.7, qwen3.6-plus, mimo-v2.5-pro, mimo-v2.5
```

## Site 字段（schema.prisma 已扩展）

基础：name, url, logo, description, announcement, isFree, status, createdAt
支付：paymentMethods, hasInvoice
企业合规：invoiceTypes, invoiceProvider, complianceLevel (none|basic|iso27001|mlps2|mlps3),
        complianceProof, dataLocation (CN|US|EU|Mixed), dataRetention,
        hasEnterpriseAccount, hasSubAccounts, slaUptime, slaResponseTime,
        has24x7Support, hasContractTemplate, contractProcess, minContractAmount

## SiteModelPrice 字段

基础：siteId, modelName, price, priceUnit, multiplier, afterSales, priceAnomaly, detectedModel, tampered
探针：passRate, onlineRate, fakeRateBand (minimal|low|light|severe), avgLatencyMs, lastProbedAt, weightedScore

## 现有页面（已存在不要碰）

- `src/app/layout.tsx` — 全局 layout
- `src/app/page.tsx` — 首页
- `src/app/sites/page.tsx` — 站点列表（旧版，B agent 可重写）
- `src/lib/prisma.ts` — Prisma 单例

## 文件边界（严格遵守，避免冲突）

| Agent | 范围目录 | 不能动 |
|-------|----------|--------|
| B 站点页 | `src/app/sites/`, `src/app/free/` | 其他目录 |
| C 模型页 | `src/app/models/`, `src/app/leaderboard/`, `src/app/model-select/` | 其他目录 |
| D 工具/垂类 | `src/app/enterprise/`, `src/app/rp/`, `src/app/benchmark/`, `src/app/codex-radar/`, `src/app/notices/` | 其他目录 |
| E 静态/导航 | `src/app/methodology/`, `src/app/consult/`, `src/app/plans/`, `src/app/contact/`, `src/app/terms/`, `src/app/privacy/`, `src/components/Nav.tsx`, `src/app/layout.tsx`（只加 Nav） | 其他目录 |

**共享组件**：如果需要公共组件（如 PriceCell、StatusBadge、FakeBandTag），放在 `src/components/ui/` 下，但**只允许新建**，不能改其他 agent 已创建的同名组件。建议在文件头加 `// owner: agent-X` 注释。

## 配色/风格

- 主背景 bg-gray-950，卡片 bg-gray-900
- 边框 border-gray-800
- 主文字 text-gray-100，次要 text-gray-400
- 强调蓝 text-blue-500 / bg-blue-600
- 成功 text-green-400，警告 text-yellow-400，错误 text-red-400
- 表格 hover:bg-gray-900/50
- 文字大小：标题 text-3xl font-bold，副标题 text-xl，正文 text-sm

## hvoy 对照参考（情报库）

- 完整功能清单：`docs/hvoy-vs-mojing.md`
- HTML 样本：`research/hvoy-intel/html-pages/`（可参考 hvoy 的页面布局）
- 站点详情 JSON 样本：`research/hvoy-intel/api-snapshots/site-details-20260616T041228Z/*.json`

## 提交前自检

1. `npm run build` 必须过
2. 不要新增 npm 依赖
3. 不要写测试
4. 文件结尾不留多余空行
5. 报告 < 300 字

## 模镜独特优势（要体现）

1. 权重公开 + 可调
2. 企业合规字段
3. 公开方法论
4. RP 垂直深耕
5. 双探针对比（hvoy + 模镜）
