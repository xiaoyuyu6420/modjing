# Spec：探针池（probe-pool）

> Spec-Kit **proposal**——描述"做什么"。设计见 [plan.md](plan.md)，任务见 [tasks.md](tasks.md)。
> **状态：⏳ 待 review。Review 通过后才动代码（任务阶段 0 起）。**

---

## 1. 背景与问题

探针层负责"用中转站自己的 key、打它自己的 API、判断真伪与掺水"。当前实现（见 [docs/project.md](../../docs/project.md) §探针）有 **5 个脆弱点**：

1. **探针池是假的**——`src/lib/probe.ts` 全仓只跑 1 条硬编码 prompt（`PROBE_PROMPT`，第 46 行），魔法常数 `EXPECTED_PROMPT_TOKENS = 22`。4 项检查（连通/知识截止/token 掺水/延迟）取平均分。探针可被运营商一眼看穿、针对性伪装。
2. **公开池是死的、且泄露**——`src/app/methodology/page.tsx` 列了 32 道 prompt（10 身份/10 能力/12 指纹）+ W1–W5 权重表，但**没有任何探针真正使用它**（探针只跑第 1 条）。且整页公开 → 运营商 F12 / 直接看页即知我们测什么。
3. **掺水检测脆弱**——`EXPECTED_PROMPT_TOKENS = 22` 只对那一条英文 prompt 成立，换 prompt/模型即失效；`ratio < 0.3` 阈值拍脑袋，单一来源散在 `checkTokenUsage`。
4. **无成本分级**——所有探针都假设有 key、都打一次 `/v1/chat/completions`。没有 key-less 防御探针（协议合规、`max_tokens:1` 计费指纹），深度指纹也未明确留给 Python 服务。
5. **无计费指纹**——idea #15（`/v1/dashboard/billing/*` 计费倍率）完全没实现。`SiteModelPrice.multiplier` 靠人工/抓取，无人校验。

---

## 2. 目标

把探针层从「一条硬编码 prompt」改造为：**版本化、服务端私有、分级、可轮换、可测**的探针池，并补齐 key-less 防御探针 + 计费指纹 + 掺水检测精化。

---

## 3. 范围

**包含：**
- `src/lib/probe-pool/` 新 lib（contract / pool / sample / billing / scoring / transform）
- 服务端私有 **live 池**（TS module，不进 client bundle）+ 公开 **representative 池**（methodology 用）—— 公私物理分离
- 三层探针编排：key-less 防御 / 轻量 key 掺水 / 深度（仍走 `src/lib/detect/`）
- `poolVersion` 标记到 `ProbeResult`；计费倍率字段
- 掺水精化：每 prompt 自带 `expectedTokens`（替代全局魔法常数）
- 确定性抽样 + 计费解析的 vitest 护栏

**不包含（另立 spec 或不在本期）：**
- 深度指纹算法本身（仍在 llm-verify :8000 / APIVerifier :8001，constitution §2.3 不引用 APIVerifier 源码）
- methodology 页面 UI 重做（只改**数据来源**：硬编码常量 → 读 `public-pool.ts`）
- 用户自建掺水探针的 **前端 UI**（constitution §4 差异化项，另立 spec；本期架构为其留口子）
- 引入 tokenizer（`js-tiktoken` 等，见决策点 D2，本期不引入）
- `weightedScore` 综合评分迁入 repo（绑排行榜，另立 spec）

---

## 4. 数据结构 · 契约（本 spec 一并文档化 = 单一权威来源）

> 实现：`src/lib/probe-pool/contract.ts`（zod）。可选字段统一 `.nullish()`；解析失败抛 `ZodError`（不静默，对齐 data-pipeline §6.4）。

### 4.1 探针池条目（pool entry）

```ts
type ProbeCategory = 'identity' | 'capability' | 'fingerprint' | 'dilution' | 'protocol' | 'billing'
type ProbeTier = 'keyless' | 'lightweight' | 'deep'

interface BaselineAnswer {
  // key = 模型 base 名（如 'claude-opus-4-8'）
  models: Record<string, {
    cutoffYear?: number | null
    expectedTokens: number        // 该 prompt 对该模型的预期 prompt_tokens（替代全局魔法常数）
    matchers?: string[]           // 子串命中即过（轻量比对；深度比对交给 Python）
  }>
}

interface PoolEntry {
  id: string                       // 稳定 id，如 'identity-cutoff'
  category: ProbeCategory
  tier: ProbeTier
  prompt: string
  maxTokens: number                // 该探针请求的 max_tokens
  expectedTokens: number           // 默认预期 prompt_tokens（被 baseline.models[x].expectedTokens 覆盖）
  baseline?: BaselineAnswer        // 身份/能力类有；指纹/协议类无
  weight: number                   // 0-1，池内抽样权重
  status: 'live' | 'retired' | 'public'  // live=私有现役 | retired=退役可公开 | public=永远公开范例
  source?: 'modjing' | 'llm-verify-mit'  // constitution §2.2：llm-verify 来源须保留版权
}

interface ProbePool {
  version: string                  // 语义版本，如 '2026.06.r1'
  generatedAt: string
  entries: PoolEntry[]
}
```

### 4.2 探针运行结果（ProbeOutput）

```ts
interface ProbeDetail {
  check: string                    // 'identity-cutoff' | 'dilution' | 'billing-multiplier' ...
  tier: ProbeTier
  category: ProbeCategory
  poolEntryId?: string | null
  passed: boolean
  message: string
  observed?: Record<string, unknown> | null  // ratio / multiplier / latencyMs 等原始观测
}

interface ProbeOutput {
  poolVersion: string
  score: number                    // 0-100，越高越正常
  verdict: 'LEGITIMATE' | 'SUSPICIOUS' | 'FRAUD_DETECTED' | 'INCONCLUSIVE'
  tokenUsageRatio?: number | null
  billingMultiplier?: number | null
  latencyMs?: number | null
  details: ProbeDetail[]
  tiers: {                         // 按层汇总，便于分层展示
    keyless: { run: number; passed: number }
    lightweight: { run: number; passed: number }
    deep: { run: number; passed: number }
  }
}
```

### 4.3 计费探针观测（BillingObservation，#15）

```ts
interface BillingObservation {
  endpointAvailable: boolean       // /v1/dashboard/billing/subscription 是否可达
  subscription?: { hardLimitUsd?: number | null } | null
  usageTotalUsd?: number | null    // /usage 实际花费
  chargedEstimateUsd?: number | null  // 按 prompt×max_tokens×标称价估算应收
  multiplier?: number | null       // usageTotalUsd / chargedEstimateUsd，>1.x 疑似虚高计费
  fakeOrDisabled: boolean          // 端点 404/返回伪造结构 → true（本身就是掺水信号）
}
```

---

## 5. 业务逻辑（集中到 `src/lib/probe-pool/`）

### 5.1 三层探针定义

| 层 | 触发 | 跑什么 | 不需要 | 计费 |
|----|------|--------|--------|------|
| (a) **keyless 防御** | 任何渠道、无 key 也能跑 | `OPTIONS`/`GET /v1/models` 协议头与可达性；`/v1/dashboard/billing/subscription` 可达性（不计费） | api key | 零 |
| (b) **轻量 key 掺水** | 有 key | live 池按 category 配比抽 N 道（如 identity:capability:fingerprint = 2:2:1），逐条发 `chat/completions`，比对 `baseline` + `usage.prompt_tokens vs entry.expectedTokens`；含 `max_tokens:1` 计费指纹 | 深度模型档案 | 可忽略（max_tokens 限到几十~1） |
| (c) **深度** | 管理员手动 / 定期 | 调 `src/lib/detect/` → llm-verify/APIVerifier | — | Python 服务决定，**不在此 repo 改** |

> keyless 层**不进主分**（避免无 key 时把所有站打成低分），单独上报 `tiers.keyless`，作"协议健康"旁路指标。

### 5.2 抽样与轮换（`sample.ts`，纯函数）

| 函数 | 规则 |
|------|------|
| `samplePool(pool, opts)` | 按 `opts.tier` + category 目标配比做加权不放回抽样；`opts.seed = siteModelPriceId + poolVersion` 保证**同一渠道同一版本确定性**，跨渠道分散 |
| `rotatePool(pool, asOf)` | 按版本周期标记部分 `live → retired`；retired 项移入公开池 |
| `pickPublicPool(pool)` | 返回 `status ∈ {public, retired}` 子集，供 methodology 页面 |

### 5.3 掺水精化（替代魔法常数）

`checkTokenUsage(entry, usage, model)`：用 `entry.baseline?.models[model]?.expectedTokens ?? entry.expectedTokens`（每 prompt 每模型一个）代替全局 `EXPECTED_PROMPT_TOKENS`。`ratio = usage.prompt_tokens / expectedTokens`，阈值按 category 设（身份类更严 `0.5`，能力/指纹类 `0.3`），全部进 `scoring.ts` 配置常量，单一来源。

### 5.4 计费指纹（`billing.ts`）

`probeBilling(input)`：
1. `GET {base}/v1/dashboard/billing/subscription`（带 key）→ 解析 `hard_limit_usd`。404/非 JSON/结构异常 → `fakeOrDisabled = true`。
2. `GET {base}/v1/dashboard/billing/usage` → `usageTotalUsd`。
3. 发一条 `chat/completions`，`max_tokens:1`，已知 prompt；`chargedEstimateUsd = (promptTokens + 1) × 标称价`（标称价取 `SiteModelPrice.price`）。
4. `multiplier = usageTotalUsd / chargedEstimateUsd`。`fakeOrDisabled` 时 `multiplier = null`，`billing` check 标 `passed=false, message='billing 端点伪造或禁用'`。

### 5.5 计分（`scoring.ts`）

`scoreProbe(details, opts)`：主分 = **lightweight 层通过率**（沿用现有 0-100 + 4 档 verdict：≥80 LEGITIMATE / ≥50 SUSPICIOUS / >0 FRAUD_DETECTED / 0 INCONCLUSIVE）。修饰项：`billing.multiplier > 1.5` → 主分扣 15；`fakeOrDisabled` → 强制 verdict 不高于 `SUSPICIOUS`。keyless 层不计入主分。

---

## 6. 不变性（constraints，不可违反）

1. **live 池永不进 client bundle**——live prompt 数据只存在于服务端 TS module（`live-pool.ts`），不被任何 `'use client'` 页面或 `methodology` import；methodology 只读 `public-pool.ts`。
2. **`db push`，不写 migration**——schema 变更用 `npx prisma db push`（CLAUDE.md）。
3. **不引用 APIVerifier 源码**——深度层只调 HTTP，不 copy 其算法（constitution §2.3）。
4. **保留 llm-verify MIT 声明**——`source='llm-verify-mit'` 的 prompt 在 methodology 页与代码注释保留版权（constitution §2.2）。
5. **确定性抽样**——同 `siteModelPriceId + poolVersion` 必须产同一 prompt 集（测试断言）。
6. **不静默写脏值**——pool entry 解析失败抛 `ZodError`（对齐 data-pipeline §6.4）。

---

## 7. 成功标准（验收）

- [ ] live 池 prompt 字符串不出现在 `npm run build` 的 client chunk（grep `.next/` 无命中）—— #16 硬验收
- [ ] `runProbe` 不再含全局 `EXPECTED_PROMPT_TOKENS` 常数；每条 prompt 带 `expectedTokens`
- [ ] keyless 层无 key 可跑；lightweight 层有 key 跑；deep 层仍走 `src/lib/detect/`
- [ ] `poolVersion` 写进 `ProbeResult`；`tier` / `billingMultiplier` / `billingFake` 写入
- [ ] `fakeOrDisabled` 站点 verdict 不高于 `SUSPICIOUS`
- [ ] methodology 页数据来自 `public-pool.ts`（公开/退役），与 live 池物理隔离
- [ ] `npm test` 全绿（含 `sample.test.ts`/`billing.test.ts`/`scoring.test.ts`），`npm run build` 通过
