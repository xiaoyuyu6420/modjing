# Plan：数据管线（design）

> Spec-Kit **plan**——"怎么做"。需求见 [spec.md](spec.md)，任务见 [tasks.md](tasks.md)。
> 分 4 阶段，**每阶段独立 commit，`npm run build` + `npm test` 必须绿**才进下一阶段。

---

## 架构决策

### 新建 `src/lib/hvoy/`（单一来源）

```
src/lib/hvoy/
├── contract.ts    # zod schema：AllChannels / Providers / SiteDetail
├── transform.ts   # 纯函数：fakeRateToBand / parseDate / domainFromUrl / buildModelName / priceAnomaly / tampered / avgLatencyMs
├── fetch.ts       # fetchJson(path)：统一 hvoy 请求
├── sync.ts        # quickSync() / fullSync()：复用上面三者，被 script 和 route 共用
└── index.ts       # 统一导出
```

### ⚠️ 决策点（需 review 时确认）：脚本如何复用 .ts lib

现状：`scripts/*.mjs` 是纯 ESM，`node` 直接跑，**不能 import `.ts`**。

| 方案 | 代价 | 推荐 |
|------|------|------|
| **A. `scripts/*.mjs` → `.ts`，用 `tsx` 跑** | 加 `tsx` dev 依赖；`package.json` script 改 `tsx scripts/sync-hvoy.ts` | ✅ 推荐——最干净，script/route/test 共用同一份 `.ts` |
| B. lib 编译成 `.js` 再被 `.mjs` import | 加 build step，双语言维护 | ❌ 过重 |
| C. 转换函数在 `.mjs` 里再写一份 | 重复，违背目标 | ❌ |

> 默认走 A。若你不想加 `tsx`，反馈后改方案。

---

## 阶段 0：建 `src/lib/hvoy/` lib + zod schema

- 加依赖 `zod`
- `contract.ts`：三个端点响应 schema（字段见 spec §4）。可选字段用 `.nullable().nullish()` 或 `.nullish()`；**不设脏默认值**
- `transform.ts`：7 个纯函数（spec §5），从 import/sync 代码逐字搬过来，单一来源
- `fetch.ts`：`fetchJson(path)` 封装 `HVOY_BASE` + Accept header + 错误抛出
- `index.ts`：导出

**gate**：lib 能被 vitest import；`npm test` 绿（此时还没有新测试，原有 4 个不破）。

## 阶段 1：迁移 import/sync 脚本到 lib

- `scripts/import-hvoy.mjs` → `.ts`，删内联 `fakeRateToBand`/`parseDate`/`domainFromUrl`，改 import lib
- `scripts/sync-hvoy.mjs` → `.ts`，quickSync/fullSync 改调 `src/lib/hvoy/sync.ts`
- `package.json`：`import-hvoy`/`sync-hvoy` 改用 `tsx`
- 加 `tsx` dev 依赖

**gate**：`tsx scripts/sync-hvoy.ts --full` 仍能对 research 快照/线上跑通（手动验一次）；`npm run build` 绿。

## 阶段 2：迁移 cron route 到 lib

- `src/app/api/cron/sync-hvoy/route.ts` 的 `quickSync` 改调 `src/lib/hvoy/sync.ts`，删与 script 重复的函数
- route 只保留：鉴权（CRON_SECRET）+ 调 `quickSync()` + 返回结果

**gate**：route 行为不变；`npm run build` 绿。

## 阶段 3：错误统计结构化 + 测试护栏

- `quickSync`/`fullSync` 返回 `{ updated, skipped, errored, newHistory, updatedAt }`（errored 显式计数，不再静默 continue）
- 写 `transform.test.ts`（纯函数 + schema 边界）
- 写 `smoke.test.ts`（fixture → zod 校验 → 转换 → 断言 prisma 写入结构）
- fixture：从 `research/hvoy-intel/api-snapshots/` 复制小份到 `src/lib/hvoy/__fixtures__/`

**gate**：`npm test` 全绿（含新测试）；故意改坏 fixture 字段类型 → contract 用例红。

---

## 风险与回滚

- **风险**：迁移过程中破坏现有同步行为。
- **缓解**：每阶段独立 commit；阶段 1 后手动跑一次 `sync-hvoy:full` 对比迁移前后数据行数。
- **回滚**：任一阶段 gate 不过，`git revert` 该 commit，不影响已绿的阶段。
