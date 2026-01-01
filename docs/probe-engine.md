# 探针引擎设计

> 模镜的核心竞争力不是"展示数据"，而是**自动化探测中转站真假的方法**。
> 本文档是探针引擎的设计纲要，基于对 hvoy.ai 的完整逆向（见 [hvoy-reverse-engineering.md](./hvoy-reverse-engineering.md)）+ 模镜自己的差异化思路。

---

## 0. 为什么这件事值得做

中转站的痛点：**用户付钱买的是 gpt-4o，实际拿到的可能是 gpt-3.5、可能是开源 qwen、可能是上下文被砍的精简版**。靠用户自己肉眼检查根本检不出来。

行业现状的探测玩家：

| 玩家 | 方法 | 局限 |
|------|------|------|
| hvoy.ai | 浏览器端用用户的 Key 探测 + 后端探针 | 用户必须主动测；后端探针被中转站识别后会被特殊对待 |
| apiranking.com | 后端探针 + 每 6 小时一轮 | 没公开方法论，不知道指纹怎么做 |
| 个人博客评测 | 人肉对比 | 不持续、样本小 |

**机会**：方法论公开 + 阈值透明 + 可被复现，这是评测平台真正的护城河——不是数据多，而是可信。

---

## 1. 探测的四个维度

一个中转站要被全面评测，必须从四个独立维度交叉验证：

| 维度 | 问题 | 探测信号 |
|------|------|----------|
| **连通性** | 这个站还活着吗？ | HTTP 状态码、响应时间、SSL 证书 |
| **延迟** | 调用快不快？ | first token latency、total latency、TPS |
| **真实性** | 是不是真的 gpt-4o？ | 模型指纹（能力题）+ token 计数比对 + 响应风格 |
| **价格** | 实际计费和标称一致吗？ | usage 字段返回的 token 数 × 标称价 vs 账户余额扣减 |

四个维度都过关，才能给"通过"评级。其中**真实性**是技术含量最高的，下文详细拆。

---

## 2. 真实性探针的工程实现

### 2.1 探针策略：把请求伪装成"真实客户端"

**hvoy 的关键洞察**：中转站会识别探针请求并返回真模型给探针、假模型给普通用户。所以探针必须**让中转站无法区分**。

hvoy 的做法（从 `probe-constants` 直接逆向）：

```js
// 完全伪装成 Claude Code CLI 的请求
{
  'x-claude-code-session-id': '<uuid>',
  'x-stainless-arch': 'arm64',
  'x-stainless-lang': 'js',
  'x-stainless-os': 'MacOS',
  'x-stainless-package-version': '0.81.0',
  'x-stainless-runtime': 'node',
  'x-stainless-runtime-version': 'v24.3.0',
  'x-stainless-timeout': '600',
  'x-anthropic-billing-header': 'cc_version=2.1.165; cc_entrypoint=cli; cch=3f806',
  'anthropic-beta': 'claude-code-20250219,interleaved-thinking-2025-05-14,context-management-2025-06-27,prompt-caching-scope-2026-01-05,effort-2025-11-24',
}
```

并且 system prompt 也使用 Claude Code 真实的 system prompt 文本（hvoy 在 bundle 里直接内嵌了一份），让请求体的"指纹"看起来就是真用户。

**模镜的差异化**：除了 Claude Code 伪装，再加：
- Cursor 客户端伪装
- 普通 OpenAI Python SDK 伪装
- 普通浏览器 fetch 伪装

**轮流使用不同伪装**，让中转站没法用单一指纹识别探针。这是 hvoy 没做的。

---

### 2.2 模型指纹：用"知识时点题"区分模型版本

这是 hvoy 探针的核心机制，**完整方法暴露在 `probe-constants` 里**：

#### 题库设计原则

题目必须满足：
1. **答案唯一且可程序化校验**（正则匹配）
2. **基于训练截止时间后才发生的事件**——这样小模型/旧模型答不出来
3. **覆盖中英文**——避免中转站只针对英文 prompt 优化
4. **题目持续更新**——每月加新题，旧题轮换淘汰

#### hvoy 的真实题目（逆向出来的样本）

```js
// 时事知识题（小模型/旧模型答不出）
{
  id: 'tariff-2025-03-04',
  prompt: '不允许上网查, 2025年3月4日特朗普对中国商品把关税提到多少. 不知道就回答不知道.',
  acceptedAnswerPatterns: [
    /(?:^|[^\d])20\s*(?:[%％]|percent)(?!\d)/i,
    /(?:^|[^\d])25\s*(?:[%％]|percent)(?!\d)/i,
    /百分之\s*20/,
    /百分之\s*25/,
  ],
},
{
  id: 'belize-election-2025-03-12',
  prompt: 'March 12, 2025 Belizean general election, which party wins a second term in a landslide victory. 只需要简单回答 party name, 不知道就回答不知道.',
  acceptedAnswerPatterns: [/人民联合党/i, /people'?s united party/i, /pup/i],
},
{
  id: 'gpt5-release-2025-08-07',
  question: 'What is the name of the OpenAI model released on August 7, 2025?',
  canonicalAnswer: 'GPT-5',
},
// ... 共 15+ 道
```

**判定规则**：
- 答对 → +1 pass
- 答错 → +1 fail
- 答"不知道" → 不算分（因为这是诚实回答，可能模型确实没训练到）
- 拒绝回答（"cannot discuss" / "无法讨论"）→ +1 error

hvoy 写死的"不知道"模式（直接抄）：

```js
const I_DONT_KNOW = [
  /不知道/i, /不清楚/i, /不确定/i, /无法确定/i, /无法回答/i,
  /i\s*don'?t\s*know/i, /not\s*sure/i, /can't\s*tell/i,
]

const REFUSE = [
  /cannot\s+discuss/i, /can'?t\s+discuss/i, /cannot\s+provide/i,
  /cannot\s+help/i, /unable\s+to\s+comply/i,
  /无法讨论/i, /不能讨论/i, /无法提供/i, /拒绝回答/i,
]
```

#### 模镜的扩展

hvoy 主要是时事知识题，**漏掉了能力题**。模镜补：

- **能力题**：让模型解一道只有 frontier 模型能解的数学/推理题（例如 AIME 2025 真题），小模型直接错
- **风格题**：让模型续写一段需要特定风格的文本，用 embedding 比对它和真实 claude-opus 的输出距离
- **多语言题**：低资源语言（Telugu、Tagalog）翻译，小模型质量明显下降

---

### 2.3 token 消耗率：交叉验证的杀手锏

这是 hvoy 字段里的 `tokenUsageRatio`，**最隐蔽但最准的指标**。

**原理**：
1. 发同一个 prompt 给中转站，收到 response
2. 用 OpenAI 官方 tokenizer（`tiktoken`）本地算 prompt + response 应该消耗多少 token
3. 对比中转站返回的 `usage.prompt_tokens` 和 `usage.completion_tokens`
4. **比值 = 中转站报的 / 本地算的**
   - ≈ 1.0：诚实
   - < 0.7：可能掉包到了 tokenizer 不同的小模型（比如 claude → qwen，tokenizer 差异很大）
   - > 1.3：可能虚报 token 多计费（这种掺水比掉包更恶心）

hvoy 的字段 `tokenUsageRatio: 0.949` 就是这个比值。**模镜要把这个比值直接展示给用户**，并且公开计算方法。

---

### 2.4 PDF / 多模态探针（hvoy 也做了）

逆向中发现 hvoy 有一段：

```js
function makePdfProbe() {
  let randomNum = String(Math.floor(Math.random() * 9e5) + 1e5)
  let text = `Hvoy.ai report total ${randomNum}`
  return {
    id: 'opus47-pdf-dynamic',
    base64: encodePdfWithText(text),  // 生成一个真实 PDF，内含随机数
    acceptedPatterns: [new RegExp(randomNum)],
  }
}
```

**机制**：动态生成一个含随机 token 的 PDF，让模型读取并提取这个 token。
- 真 Claude Opus 4.7 能读 PDF → 答对随机数
- 假装是 Opus 但实际是不支持 PDF 的小模型 → 答错或拒绝

这是判定"多模态能力是否真实"的绝招。模镜照抄。

---

## 3. 评分聚合

每个 channel（站点 × 模型）的最终评分按 hvoy 的权重思路（逆向出 `weightedScore` 字段）：

```
weightedScore = passRate × W1
              + onlineRate × W2
              - latencyPenalty × W3
              - priceVolatilityPenalty × W4
              + verificationBonus × W5
```

**模镜的差异化**：**公开权重**（hvoy 没公开 W1-W5），用户可以拖滑块调整自己的权重看排名变化。这就是「裁判讲清楚怎么打分」。

掺水档位（直接抄 hvoy 的分档逻辑）：

```js
function fakeRateBand(failRatePercent) {
  if (failRatePercent < 5) return 'minimal'   // 极少
  if (failRatePercent <= 15) return 'low'     // 低
  if (failRatePercent <= 25) return 'light'   // 轻度
  return 'severe'                              // 严重
}
```

---

## 4. 探针执行架构

```
┌──────────────┐
│  Cron / 定时  │  每 6 小时一轮（对齐 apiranking 的频率）
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  ProbeOrchestrator                    │
│  - 拉所有 active sites × probe models │
│  - 给每个 channel 分配本轮的 prompt 子集（随机抽 5 道）│
│  - 选伪装策略（轮流）                  │
└──────┬───────────────────────────────┘
       │
       ├──► ProbeWorker × N（可并发）
       │      ├─ 构造伪装请求
       │      ├─ 调中转站
       │      ├─ 跑判定：答案匹配 / token ratio / 延迟
       │      └─ 写 ProbeRun 表
       │
       ▼
┌──────────────────────────────────────┐
│  ScoreAggregator（每轮跑完后）         │
│  - 计算 passRate / onlineRate / avgLatency │
│  - 更新 SiteModelPrice.tampered / priceAnomaly │
│  - 写 HealthCheck                     │
└──────────────────────────────────────┘
```

### 数据模型需要新增的表

```prisma
model ProbeQuestion {
  id                  Int      @id @default(autoincrement())
  externalId          String   @unique   // 'tariff-2025-03-04'
  category            String   // knowledge | capability | style | pdf
  prompt              String
  acceptedPatterns    String   // JSON: 正则数组
  introducedAt        DateTime
  retiredAt           DateTime?
  // 不要查得太频繁，每月轮换才不让中转站针对性缓存
}

model ProbeRun {
  id              Int      @id @default(autoincrement())
  siteId          Int
  modelKey        String
  questionId      Int
  disguise        String   // claude-code | cursor | openai-sdk | browser
  result          String   // pass | fail | unknown | refuse | error
  latencyMs       Int
  promptTokens    Int?
  completionTokens Int?
  expectedPromptTokens Int?
  expectedCompletionTokens Int?
  tokenRatio      Float?
  rawResponse     String?  // 截断到 2000 字
  runAt           DateTime @default(now())

  site     Site          @relation(fields: [siteId], references: [id])
  question ProbeQuestion @relation(fields: [questionId], references: [id])
}
```

`SiteModelPrice` 的聚合字段（从 ProbeRun 滚动计算）：

```prisma
model SiteModelPrice {
  // ... existing fields
  passRate          Float?  // 滚动 7 天
  onlineRate        Float?
  avgLatencyMs      Int?
  tokenUsageRatio   Float?
  fakeRateBand      String? // minimal | low | light | severe
  weightedScore     Float?
  lastProbedAt      DateTime?
}
```

---

## 5. 法律与伦理边界

做评测要守住的线（写出来挂在 `/about`）：

1. **不冒充用户身份测付费 Key**——只用模镜自己充值的小额账户测
2. **每个站的探针频率不超过它正常用户的 0.1%**——不打扰服务
3. **不爬中转站的私密接口**——只测公开 API（`/v1/chat/completions` 等）
4. **公开方法和数据**——所有 ProbeRun 历史可查
5. **不接付费排名**——这是 apiranking 的招牌口号，照抄

---

## 6. 实施路径

### Phase 0（本周）
- 写本文档 ✓
- 用 hvoy 的 `/__all-channels` 数据作种子，先把页面跑通

### Phase 1（2-4 周）
- 收集第一批 30 道探针题（手动整理 2025-2026 时事 + AIME 真题）
- 写 ProbeWorker 最小版：只测 OpenAI 兼容协议、只用 claude-code 伪装
- 在 5 家中转站上跑通

### Phase 2（1-2 个月）
- 扩 4 种伪装策略、补 PDF/多模态探针
- 接入定时任务（Vercel Cron 或自建 VPS）
- 公开方法论页 `/methodology`，让用户能复现任何一次评分

### Phase 3
- 题库众包：用户提交 candidate 题目，社区审核
- 权重滑块：用户调整自己的 W1-W5 看个性化排行
- 探针 API：付费用户可以指定测自己想测的站

---

## 关键技术细节备忘

从 hvoy bundle 里捞到的、未来实现时直接抄的细节：

| 项 | 值 |
|------|------|
| 单次 prompt 最大长度 | 10240 字符（hvoy 常量 `F`） |
| 单次 response 最大长度 | 4096 字符（hvoy 常量 `I`） |
| Claude Code session header 格式 | `claude-cli/2.1.165 (external, cli)` |
| anthropic-beta header 内容 | 见上文（5 个特性的逗号串） |
| cache_control 用法 | system prompt 用 `{type: 'ephemeral'}` 触发缓存 |
| 域名特判 | hvoy 对 `sssaicode.com` / `xcode.best` 加了额外的 system prompt（说明这俩站会检查 system prompt 长度） |
