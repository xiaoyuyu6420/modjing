# Spec：数据管线（data-pipeline）

> Spec-Kit **proposal**——描述"做什么"。设计见 [plan.md](plan.md)，任务见 [tasks.md](tasks.md)。
> **状态：⏳ 待 review。Review 通过后才动代码（任务 3）。**

---

## 1. 背景与问题

数据管线负责把 hvoy 的数据搬进模镜数据库，外加一条自建探针通路。当前三层（见 [docs/project.md](../../docs/project.md) §数据管线）：

- 离线导入 `scripts/import-hvoy.mjs`
- 在线同步 `scripts/sync-hvoy.mjs`（quick + full）+ `src/app/api/cron/sync-hvoy/route.ts`
- 自建探针 `src/lib/probe.ts` + `src/app/api/probe/route.ts`

**5 个脆弱点（本 spec 要解决的）：**

1. **零 schema 校验**——hvoy 字段全是 inline `typeof x === 'number'` 手写检查，散落 3 文件。字段缺失/类型变化 → 静默写 `null`，数据悄无声息坏掉。
2. **契约无单一文档**——hvoy API 字段没有权威来源，只能读代码反推。
3. **逻辑重复**——`fakeRateToBand`/`parseDate`/`domainFromUrl` 在 import 和 sync 各写一份；`quickSync` 在 script 和 route 重复两份。
4. **零管线测试**——import/sync 没有任何测试，回归无感知。
5. **错误静默**——fetch 失败、字段缺失都 `continue` 跳过，无统计、无中断、无告警。

---

## 2. 目标

把 hvoy 数据管线从「散落手写校验」改造为：**集中 schema + 可测 + 契约文档化**。

---

## 3. 范围

**包含：**
- hvoy 三个端点响应的 zod schema（AllChannels / Providers / SiteDetail）
- 转换函数集中到 `src/lib/hvoy/`
- `import-hvoy` / `sync-hvoy` / `cron route` 复用 lib（消除重复）
- 转换函数单元测试 + 快照冒烟测试
- 错误统计结构化（updated/skipped/errored）

**不包含（另立 spec 或不在本期）：**
- 页面 UI 改动
- `probe.ts` 探测逻辑本身（只动它写入 ProbeResult 之外的数据层）
- 外部 detect 服务（llm-verify/APIVerifier）移除（constitution §2，另立 spec）
- relay-notices 端点接入（RelayNotice 表已存在，但当前管线未消费，留作后续）

---

## 4. hvoy API 契约（本 spec 一并文档化 = 单一权威来源）

### `GET /__all-channels`

```ts
{
  updatedAt: string,
  channels: Array<{
    relaySiteId: number
    siteDomain: string
    site: string           // 站点显示名
    channel: string        // 渠道名
    siteUrl: string
    modelKey: string
    lastResult: string     // "pass" | "fail" | ...
    recentOnlineSeq: string // "111000..." 近 N 次在线序列
    passRate: number       // %
    onlineRate: number     // %
    failRate: number
    avgLatencyS: number    // 秒
    latencySuspicious: boolean
    latestInputPriceCny: number
    priceTrend: Array<{ at: string, priceCny: number }>
    tokenUsageRatio: number
    sampleCount: number
    weightedScore: number
    defaultRanking: number
    verificationType: string // "enterprise" | "basic" | "community"
  }>,
  modelDisplayConfigs: unknown[]
}
```

### `GET /__providers`

```ts
{ providers: Array<{ name: string, url: string }> }
```

### `GET /__site-detail/{slug}`

```ts
{
  ok: boolean,
  site: {
    siteDomain: string,
    siteName: string,
    siteDescription: string | null,
    officialSiteEstablishedAt: string | null
  },
  models: Array<{
    modelKey: string,
    channels: Array<{
      providerModelId: string | null
      channelName: string | null
      latestInputPriceCny: number | null
      outputPriceCny: number | null
      cacheInputPriceCny: number | null
      cacheCreatePriceCny: number | null
      passRate: number | null
      onlineRate: number | null
      fakeRate: number | null
      avgLatencyS: number | null
      lastProbedAt: string | null
      priceTrend: Array<{ at: string, priceCny: number }> | null
    }>
  }>
}
```

> 可选字段统一 `| null`。管线对缺失值写 `null`/跳过，**不写脏默认值**。

---

## 5. 转换规则（从现有代码提取，集中到 transform.ts）

| 函数 | 规则 |
|------|------|
| `fakeRateToBand(rate)` | `null→null`；`≥25→severe`；`≥15→light`；`≥5→low`；其余→`minimal` |
| `parseDate(value)` | 空→`null`；`new Date` 合法→`Date`；非法→`null` |
| `domainFromUrl(url)` | 取 hostname 去 `www.`；非法 URL→`''` |
| `buildModelName(base, channel)` | `${base}@${channel ?? 'default'}`；base = `providerModelId ?? modelKey` |
| `priceAnomaly(fakeRate, passRate)` | `fakeRate≥25 \|\| passRate<75` |
| `tampered(fakeRate)` | `fakeRate≥25` |
| `avgLatencyMs(avgLatencyS)` | `Math.round(avgLatencyS * 1000)` |

---

## 6. 不变性（constraints，不可违反）

1. **增量同步不删现有数据**——quickSync/fullSync 只 update/upsert，不 delete。
2. **不覆盖后台手动标注**——`Site` 的合规字段（invoice/compliance/sla 等）由人工维护，管线不碰。
3. **SQLite 单文件**——不引入新数据库。
4. **校验失败抛错**——zod 解析失败 = 抛 `ZodError`（被测试/调用方捕获），**不静默 null**。
5. **增量价格历史**——只插入比已有最新记录更晚的 `priceTrend` 点。

---

## 7. 成功标准（验收）

- [ ] hvoy 改字段类型/缺失时，`transform.test.ts` 的 schema 用例**失败**（而非静默写 null）——这是护栏核心
- [ ] hvoy 契约有单一权威来源：本 spec §4 + `src/lib/hvoy/contract.ts`
- [ ] `fakeRateToBand`/`parseDate`/`domainFromUrl`/`buildModelName` 单一来源（`transform.ts`）
- [ ] `quickSync` 单一来源（script 和 route 共用 lib）
- [ ] `import/sync` 有测试覆盖（`transform.test.ts` + `smoke.test.ts`）
- [ ] `npm test` 全绿，`npm run build` 通过
