# Tasks：数据管线

> Spec-Kit **tasks**——有序执行清单。需求见 [spec.md](spec.md)，设计见 [plan.md](plan.md)。
> 标注依赖（↳）与验收（✓）。每条完成后 `npm test` + `npm run build` 绿。

---

## 阶段 0：建 lib

- [x] **T1** 安装 `zod`
  ✓ `package.json` 出现 zod；`npm run build` 绿
- [x] **T2** 建 `src/lib/hvoy/contract.ts`（3 端点 zod schema + 导出类型）
  ✓ schema 能 `safeParse` research 快照样本通过
- [x] **T3** 建 `src/lib/hvoy/transform.ts`（7 纯函数，从现有代码搬）
  ✓ 函数签名与 spec §5 一致
- [x] **T4** 建 `src/lib/hvoy/fetch.ts`（fetchJson）+ `index.ts`（导出）
  ✓ `npm test` 绿（原有 4 测试不破）

## 阶段 1：迁移脚本

- [x] **T5** 安装 `tsx`（dev）；`scripts/import-hvoy.mjs`→`.ts`、`sync-hvoy.mjs`→`.ts`
  ↳ 依赖 T2/T3/T4
- [x] **T6** 建 `src/lib/hvoy/sync.ts`（quickSync/fullSync，复用 contract+transform+fetch）
  ↳ 依赖 T4
- [x] **T7** `package.json` 的 `import-hvoy`/`sync-hvoy` 改 `tsx scripts/*.ts`
  ↳ 依赖 T5/T6
  ✓ 手动跑 `tsx scripts/sync-hvoy.ts`（quick）成功；`npm run build` 绿

## 阶段 2：迁移 cron route

- [x] **T8** `src/app/api/cron/sync-hvoy/route.ts` 改调 `sync.ts`，删重复 quickSync
  ↳ 依赖 T6
  ✓ route 行为不变；`npm run build` 绿

## 阶段 3：错误统计 + 测试护栏

- [x] **T9** `quickSync`/`fullSync` 返回结构化 `{updated,skipped,errored,newHistory,updatedAt}`
  ↳ 依赖 T6
- [x] **T10** 写 `src/lib/hvoy/transform.test.ts`（fakeRateToBand 四档边界 / parseDate / domainFromUrl / buildModelName / schema 合法通过 + 类型错拒绝）
  ↳ 依赖 T2/T3
  ✓ 测试绿；**故意改坏一个 fixture 字段类型时，schema 用例红**
- [x] **T11** 写 `src/lib/hvoy/smoke.test.ts`（fixture → zod 校验 → 转换 → 断言符合 prisma 写入结构，不连真实 DB/hvoy）
  ↳ 依赖 T10
  ✓ 复制 research 快照小份到 `__fixtures__/`；测试绿
- [x] **T12** 在 `docs/README.md` 工作约束区确认"管线改动必须绿 test+build"已记录
  ✓ 全部 `npm test` 绿，`npm run build` 绿

---

## 验收总门（全部完成后）

- spec §7 成功标准全部 ✓
- `npm test` 全绿（原 4 + 新 transform/smoke）
- `npm run build` 通过
- `quickSync` 单一来源；转换函数单一来源；hvoy 契约有 `contract.ts` + spec §4 双权威
