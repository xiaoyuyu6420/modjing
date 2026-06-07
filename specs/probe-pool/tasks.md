# Tasks：探针池

> Spec-Kit **tasks**——有序执行清单。需求见 [spec.md](spec.md)，设计见 [plan.md](plan.md)。
> 标注依赖（↳）与验收（✓）。每条完成后 `npm test` + `npm run build` 绿。

---

## 阶段 0：建 lib + contract + 池数据

- [ ] **T1** 建 `src/lib/probe-pool/contract.ts`（zod: ProbePoolSchema / PoolEntrySchema / ProbeOutputSchema / BillingObservationSchema + 导出类型）
  ✓ schema 能 `safeParse` 一份合法 pool 样本通过；非法（如 category 拼错）拒绝
- [ ] **T2** 建 `src/lib/probe-pool/scoring.ts`（从 `src/lib/probe.ts` 搬 4 档 verdict + tier 汇总 + category ratio 阈值常量）
  ↳ 依赖 T1
  ✓ `scoreProbe` 对一组 details 产 0-100 + verdict，签名与 spec §5.5 一致
- [ ] **T3** 建 `src/lib/probe-pool/live-pool.ts`（`version='2026.06.r1'` + 3–5 道新身份/dilution prompt，`status:'live'`）
  ↳ 依赖 T1
  ✓ `loadLivePool()` 通过 `ProbePoolSchema.parse`
- [ ] **T4** 建 `src/lib/probe-pool/public-pool.ts`（methodology 现 32 道搬来，`status:'public'`）+ `pool.ts`（loaders）+ `index.ts`
  ↳ 依赖 T1/T3
  ✓ `npm test` 绿（原有测试不破）；`npm run build` 绿

## 阶段 1：抽样 + 掺水精化

- [ ] **T5** 建 `src/lib/probe-pool/sample.ts`（`samplePool` 确定性 + `pickPublicPool`）
  ↳ 依赖 T1
  ✓ 同 `siteModelPriceId+version` 两次抽样结果相同；配比符合目标
- [ ] **T6** 建 `src/lib/probe-pool/transform.ts` 的 `runLightweightProbe`；删 `EXPECTED_PROMPT_TOKENS`，改 `entry.expectedTokens`
  ↳ 依赖 T2/T5
  ✓ `runProbe(input)` 对外签名不变，内部委托 `runLightweightProbe`；`probe.test.ts` 仍绿
- [ ] **T7** 写 `src/lib/probe-pool/sample.test.ts`（确定性 + 配比 + pickPublicPool 只含 public/retired）
  ↳ 依赖 T5
  ✓ 测试绿

## 阶段 2：keyless 防御层（#14）

- [ ] **T8** `transform.ts` 加 `runKeylessProbe`（`OPTIONS`/`GET /v1/models` + billing 可达性，无 key）；结果进 `tiers.keyless`，不进主分
  ↳ 依赖 T6
  ✓ `npm test` 绿；`npm run build` 绿

## 阶段 3：计费指纹（#15）+ schema

- [ ] **T9** 建 `src/lib/probe-pool/billing.ts`（`probeBilling`，spec §5.4）
  ↳ 依赖 T1
  ✓ 正常/404/伪造结构 三种 fixture 各产预期 `BillingObservation`
- [ ] **T10** `prisma/schema.prisma` 加字段 + `npx prisma db push`：`ProbeResult` += `poolVersion/billingMultiplier/billingFake/tier`；`SiteModelPrice` += `billingMultiplier`
  ↳ 依赖 —
  ✓ `db push` 成功；新字段可写（向后兼容）
- [ ] **T11** `/api/probe/route.ts` 写入新字段（poolVersion/billingMultiplier/billingFake/tier）；`scoring.ts` 加 `fakeOrDisabled` 降级 + `multiplier>1.5` 扣分
  ↳ 依赖 T9/T10
  ✓ `fakeOrDisabled` 站 verdict ≤ SUSPICIOUS
- [ ] **T12** 写 `src/lib/probe-pool/billing.test.ts`（含 `fakeOrDisabled` 桩三种形态）
  ↳ 依赖 T9
  ✓ 测试绿

## 阶段 4：公私分离（#16）

- [ ] **T13** `methodology/page.tsx` 删硬编码 32 道 + 权重常量，改读 `loadPublicPool()` 渲染
  ↳ 依赖 T4
  ✓ 页面渲染正常，展示公开池内容
- [ ] **T14** 验证 live 池不进 client bundle：`npm run build` 后 grep `.next/static/`，live prompt 字符串无命中
  ↳ 依赖 T13
  ✓ client chunk 无 live prompt；server 产物有

## 阶段 5：深度编排接线 + 文档

- [ ] **T15** `transform.ts` 加 `runDeepProbe` 调 `src/lib/detect/`（仅编排），结果并入 `tiers.deep`
  ↳ 依赖 T6
  ✓ deep 层结果正确归入 `tiers.deep`
- [ ] **T16** `docs/README.md` specs 表更新 probe-pool 状态；记录池轮换流程
  ↳ 依赖 —
  ✓ 全部 `npm test` 绿，`npm run build` 绿

---

## 验收总门（全部完成后）

- spec §7 成功标准全部 ✓
- `npm test` 全绿（原 6 文件 + 新 sample/billing/scoring）
- `npm run build` 通过
- live 池物理隔离（build 产物 grep 验证）
- `runProbe` 对外签名不变；`/api/probe/route.ts` 行为兼容
