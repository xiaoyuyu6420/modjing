# Plan：探针池（design）

> Spec-Kit **plan**——"怎么做"。需求见 [spec.md](spec.md)，任务见 [tasks.md](tasks.md)。
> 分 6 阶段，**每阶段独立 commit，`npm run build` + `npm test` 必须绿**才进下一阶段。

---

## 架构决策

### 新建 `src/lib/probe-pool/`（单一来源）

```
src/lib/probe-pool/
├── contract.ts     # zod: ProbePoolSchema / ProbeOutputSchema / BillingObservationSchema
├── live-pool.ts    # 服务端私有现役池 + version 常量（不进 client bundle）
├── public-pool.ts  # 永远公开 + 退役项（methodology 读）
├── pool.ts         # loadLivePool()/loadPublicPool()/getCurrentVersion()
├── sample.ts       # samplePool()/rotatePool()/pickPublicPool()（纯函数，确定性）
├── billing.ts      # probeBilling()（计费指纹 #15）
├── scoring.ts      # scoreProbe() + category ratio 阈值常量 + tier 汇总
├── transform.ts    # runLightweightProbe/runKeylessProbe 编排 → ProbeOutput
├── index.ts        # 统一导出（含 runProbe 兼容导出）
└── __fixtures__/   # 桩响应（含伪造/禁用 billing 端点用例）
```

> 现有 `src/lib/probe.ts` 的逻辑迁入 `transform.ts`，对外仍导出 `runProbe`（`/api/probe/route.ts` 不破坏）。

### ⚠️ 决策点（已按默认推进，review 时确认或推翻）

| # | 决策 | 默认推荐 | 理由 |
|---|------|---------|------|
| **D1** | 公私分离方案 | ✅ 公开 representative 池 + 服务端私有 live 池（split） | 同时满足 transparency（#16）与反规避 |
| **D2** | 是否引入 tokenizer（js-tiktoken） | ✅ **不引入**；改"每 prompt 离线预算 token、写死进 `entry.expectedTokens`（按模型分组）" | 零新依赖、零运行时成本；CLAUDE.md 要求新依赖先提案 |
| **D3** | live 池载体 | ✅ 版本化 TS module（非 DB） | 集合小、变更需 code review、git 即版本、零查询。未来需运营动态改池再迁 DB（阶段 N+1） |
| **D4** | keyless 是否计主分 | ✅ 不计，仅旁路展示 | 避免无 key 时把所有站打低分 |
| **D5** | 轮换周期 | ✅ 2 周人工 PR 改 `live-pool.ts` + bump `version` | 简单可控；自动化留待后续 |

---

## 阶段 0：建 lib + contract + 池数据

- `contract.ts`：`ProbePoolSchema` / `PoolEntrySchema` / `ProbeOutputSchema` / `BillingObservationSchema`（字段见 spec §4）。可选字段 `.nullish()`，**不设脏默认值**
- `scoring.ts`：从现有 `probe.ts` 的 `scoreProbe`（4 档 verdict）搬来 + category ratio 阈值常量 + tier 汇总
- `live-pool.ts`：`version` 常量（`'2026.06.r1'`）+ 3–5 道新的身份/dilution prompt（`status: 'live'`），**不含** methodology 那 32 道
- `public-pool.ts`：把 methodology 现 32 道（10/10/12）搬来（`status: 'public'`），methodology 后续改读它
- `pool.ts` + `index.ts`：loader + 统一导出

**gate**：lib 能被 vitest import；`npm test` 绿（原有测试不破）；`npm run build` 绿。

## 阶段 1：抽样 + 掺水精化

- `sample.ts`：`samplePool`（确定性，seed=siteModelPriceId+version）/ `pickPublicPool`
- `transform.ts`：`runLightweightProbe`（从 live 池抽样 N 道，逐条发，比对 baseline + expectedTokens）
- 删全局 `EXPECTED_PROMPT_TOKENS`，改用 `entry.expectedTokens`（spec §5.3）
- `runProbe` 改调 `runLightweightProbe`（保留对外签名兼容）
- `sample.test.ts`：确定性抽样（同 seed 同结果）+ 配比正确

**gate**：`npm test` 绿（含新 sample 测试）；现有 probe 行为不破（`probe.test.ts` 仍绿）。

## 阶段 2：keyless 防御层（#14）

- `transform.ts`：`runKeylessProbe`（`OPTIONS`/`GET /v1/models` 可达性 + billing 端点可达性，无 key）
- `tiers.keyless` 上报，**不进主分**
- `billing.test.ts` 骨架（先覆盖可达性判定）

**gate**：`npm test` 绿；`npm run build` 绿。

## 阶段 3：计费指纹（#15）+ schema

- `billing.ts`：`probeBilling` 完整实现（subscription + usage + `max_tokens:1` 比对，spec §5.4）
- `prisma/schema.prisma`：`ProbeResult` += `poolVersion/billingMultiplier/billingFake/tier`；`SiteModelPrice` += `billingMultiplier`。`npx prisma db push`
- `/api/probe/route.ts`：写入新字段
- `scoring.ts`：`fakeOrDisabled` 强制 verdict ≤ SUSPICIOUS；`multiplier>1.5` 主分扣 15
- `billing.test.ts`：含 `fakeOrDisabled` 桩（404 / 伪造结构 / 正常）三种形态

**gate**：计费解析测试绿；`npm run build` 绿。

## 阶段 4：公私分离（#16）

- `methodology/page.tsx`：删硬编码 32 道常量，改 `import { loadPublicPool } from '@/lib/probe-pool'` 渲染
- 确认 live 池不被 client import：live-pool 仅被 `route.ts` / `transform.ts`（server-only）引用
- gate：**`npm run build` 后 grep `.next/static/` 与 `.next/server/`——live prompt 字符串只在 server 产物，client 产物无命中**

**gate**：build 产物 grep live prompt 无 client 命中；methodology 页正常渲染。

## 阶段 5：深度编排接线 + 文档

- `transform.ts`：`runDeepProbe` 调 `src/lib/detect/` 的 `quickDetect`/`deepDetect`（仅编排，不改算法），结果并入 `tiers.deep`
- `docs/README.md`：specs 表更新 probe-pool 状态
- 记录池轮换流程（2 周人工 PR）

**gate**：`npm test` 全绿；`npm run build` 通过。

---

## 风险与回滚

- **风险**：live 池 prompt 意外被 import 进 client bundle。**缓解**：阶段 4 gate 用 build 产物 grep；`live-pool.ts` 仅从 server-only 文件引用。
- **风险**：计费倍率误判（标称价估算偏差）。**缓解**：`multiplier` 阈值宽松（>1.5 才标），且只降级 verdict 不改主分。
- **风险**：billing 端点形态各异。**缓解**：`fakeOrDisabled` 走宽松探测 + fixture 覆盖多种伪造形态。
- **风险**：`runProbe` 签名变更破坏 `/api/probe/route.ts`。**缓解**：保留 `runProbe(input)` 对外签名，内部委托新编排；阶段 1 后手验 route。
- **回滚**：每阶段独立 commit；阶段 3 schema 变更向后兼容（全 nullish / 有默认值），无需下线。任一 gate 不过 `git revert` 该 commit。
