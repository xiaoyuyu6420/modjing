# 模镜开发规划（基于 hvoy 情报调整）

> 规划时间：2026-06-16
> 数据来源：hvoy.ai 全面逆向（见 `research/hvoy-intel/`）

> ⚠️ **状态：legacy（2026-06-18 起）**。战略定位部分已被 [.specify/memory/constitution.md](/.specify/memory/constitution.md) 取代；后续开发任务改走 `specs/<name>/`（spec/plan/tasks）流程。本文保留作历史参考，**不作为现役开发依据**。

---

## 一、战略定位

**模镜 = 企业级 API 中转站评测平台**

与 hvoy 的差异化：

| 维度 | hvoy | 模镜 |
|------|------|------|
| 目标用户 | 开发者 + RP 玩家 | **企业采购决策者** |
| 核心价值 | 价格/稳定性/掺水检测 | **合规/发票/SLA/合同** |
| 方法论 | 不公开 | **完全公开**，用户可复现 |
| 权重 | 黑箱 | **权重滑块**，用户可调 |
| 数据源 | 自建探针 | Phase 1 先消费 hvoy，Phase 2 自建 |

---

## 二、数据模型扩展

基于 hvoy 的 schema，补充企业用户需要的字段：

```prisma
model Site {
  // ... 现有字段

  // === 企业合规新增 ===
  hasInvoice          Boolean   @default(false)  // 是否支持开发票
  invoiceTypes        String    @default("")     // 增值税普票/专票/电子发票
  invoiceProvider     String?                    // 开票主体名称

  complianceLevel     String?                    // none | basic | iso27001 | mlps2 | mlps3
  complianceProof     String?                    // 认证证书 URL

  dataLocation        String?                    // CN | US | EU | Mixed
  dataRetention       String?                    // 数据留存策略

  hasEnterpriseAccount Boolean @default(false)   // 是否支持企业账户
  hasSubAccounts      Boolean   @default(false)  // 是否支持子账号
  paymentMethods      String    @default("")     // 支付宝,微信,USDT,Stripe,公对公,月结

  // === SLA ===
  slaUptime           Float?                     // 承诺在线率（如 99.9）
  slaResponseTime     Int?                       // 故障响应时间（分钟）
  has24x7Support      Boolean   @default(false)  // 7×24 客服

  // === 采购流程 ===
  hasContractTemplate Boolean   @default(false)  // 是否提供合同模板
  contractProcess     String?                    // 合同签署流程描述
  minContractAmount   Float?                     // 最低合同金额
}

model SiteModelPrice {
  // ... 现有字段

  // === 探针结果（从 hvoy 消费或自建探针填入）===
  passRate          Float?     // 通过率 %
  onlineRate        Float?     // 在线率 %
  fakeRateBand      String?    // minimal | low | light | severe
  avgLatencyMs      Int?       // 平均延迟
  lastProbedAt      DateTime?  // 最近探测时间
  weightedScore     Float?     // 综合评分
}
```

---

## 三、页面规划（调整后）

### P0：核心页面

| 页面 | 路由 | 状态 | 说明 |
|------|------|------|------|
| 首页 | `/` | ✅ 已有 | 品牌入口 + 搜索 |
| 站点列表 | `/sites` | ✅ 已有 | 全部站点 + 企业合规筛选 |
| 按模型查 | `/models/[modelId]` | ❌ 待做 | 选模型看所有站点对比 |
| 站点详情 | `/sites/[siteId]` | ❌ 待做 | 单站详情 + 企业合规信息 |

### P1：企业合规专区

| 页面 | 路由 | 说明 |
|------|------|------|
| **企业合规专区** | `/enterprise` | 核心差异化：发票/等保/SLA 筛选 + 合规评分排行 |
| 批量测速 | `/benchmark` | 企业用户测试自己的 Key |
| 公益站列表 | `/free` | 筛选 isFree=true |

### P2：扩展

| 页面 | 路由 | 说明 |
|------|------|------|
| Token Plan 对比 | `/plans` | Coding Plan 作为独立品类 |
| 选型咨询 | `/consult` | 表单 → 微信引导 |
| 方法论公开 | `/methodology` | 探针 prompt + 权重公式 + 用户可调滑块 |

---

## 四、探针引擎规划

### Phase 1：消费 hvoy 数据（本周）

1. 写 `prisma/seed-from-hvoy.ts`，读取 `research/hvoy-intel/api-snapshots/site-details-*/*.json`
2. 映射字段：
   ```
   hvoy.siteName       → Site.name
   hvoy.siteDomain     → Site.url
   hvoy.passRate       → SiteModelPrice.passRate
   hvoy.onlineRate     → SiteModelPrice.onlineRate
   hvoy.fakeRate       → fakeRateBand
   hvoy.avgLatencyS    → avgLatencyMs
   hvoy.weightedScore  → weightedScore
   ```
3. 企业合规字段先留空（后续手动补）

### Phase 2：翻译 llm-verify 到 TypeScript（2-3 周）

文件结构：

```
src/lib/probe/
├── prompts/
│   ├── identity.ts      # 10 道身份探针
│   ├── capability.ts    # 10 道能力探针
│   └── fingerprint.ts   # 12 道指纹探针
├── adapters/
│   ├── base.ts          # 抽象基类
│   ├── openai.ts        # OpenAI 协议
│   └── anthropic.ts     # Anthropic 协议
├── services/
│   ├── fingerprint.ts   # 4 维统计算法
│   ├── comparator.ts    # baseline vs suspect
│   └── scorer.ts        # 综合评分
└── runner.ts            # 探针执行器
```

翻译要点：

1. **prompts/**：直接抄 llm-verify 的 32 道题（`notes/llm-verify-core/src/prompts/*.py`）
2. **fingerprint.ts**：翻译 4 维统计算法（style/vocabulary/structure/metadata）
3. **comparator.ts**：baseline vs suspect 相似度计算
4. **权重公开**：
   ```typescript
   const DEFAULT_WEIGHTS = {
     passRate: 0.35,
     onlineRate: 0.25,
     latency: 0.15,
     priceStability: 0.15,
     complianceBonus: 0.10,  // 企业合规加分
   }
   ```

---

## 五、开发顺序

### Week 1：数据 + 核心页面

1. [x] ~~情报收集~~
2. [ ] **重写 seed**：从 hvoy site-detail 导入 447 个站点
3. [ ] **扩展 schema**：加企业合规字段
4. [ ] `/models/[modelId]` 按模型查询页
5. [ ] `/sites/[siteId]` 站点详情页
6. [ ] 全局导航条

### Week 2：企业合规专区

1. [ ] `/enterprise` 企业合规专区
   - 发票筛选
   - 等保级别筛选
   - SLA 排行
   - 合同模板下载
2. [ ] 企业合规字段的手动补录（先补 20 家头部站点）
3. [ ] `/benchmark` 批量测速页

### Week 3：探针引擎翻译

1. [ ] 翻译 llm-verify prompts → TypeScript
2. [ ] 翻译 fingerprint 算法
3. [ ] 集成到 `/api/probe` 路由
4. [ ] `/methodology` 方法论公开页

### Week 4：完善 + 部署

1. [ ] `/plans` Token Plan 对比
2. [ ] `/consult` 选型咨询
3. [ ] `/free` 公益站列表
4. [ ] `npm run build` 验收
5. [ ] Vercel 部署

---

## 六、企业合规专区核心功能

### `/enterprise` 页面

```
┌─────────────────────────────────────────────────────────────┐
│  企业级 API 中转站合规排行                                    │
├─────────────────────────────────────────────────────────────┤
│  筛选：[发票类型 ▼] [等保级别 ▼] [SLA承诺 ▼] [数据位置 ▼]    │
├─────────────────────────────────────────────────────────────┤
│  权重调整：                                                  │
│  在线率 ████████████░░ 35%  [拖动调整]                      │
│  合规分 ████████░░░░░░ 25%  [拖动调整]                      │
│  价格   ████████░░░░░░ 20%  [拖动调整]                      │
│  SLA    ████░░░░░░░░░░ 10%  [拖动调整]                      │
│  稳定性 ██████░░░░░░░░ 10%  [拖动调整]                      │
├─────────────────────────────────────────────────────────────┤
│  排名  站点      发票   等保   SLA    在线率  价格   综合分   │
│  1    灵算       ✓专票  等保三 99.9%  97.9%  ¥1.4   92.3    │
│  2    PackyCode  ✓专票  ISO    99.5%  100%   ¥2.5   89.1    │
│  3    ...                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 企业合规评分公式

```typescript
function calcEnterpriseScore(site: Site, weights: Weights): number {
  let score = 0

  // 基础分（从探针数据来）
  score += (site.avgOnlineRate || 0) * weights.onlineRate
  score += (1 - normalizePrice(site.avgPrice)) * weights.price
  score += (site.avgPassRate || 0) * weights.stability

  // 企业合规加分
  score += site.hasInvoice ? 20 : 0
  score += site.complianceLevel === 'mlps3' ? 30 :
           site.complianceLevel === 'mlps2' ? 20 :
           site.complianceLevel === 'iso27001' ? 15 : 0
  score += (site.slaUptime || 0) >= 99.9 ? 15 :
           (site.slaUptime || 0) >= 99.5 ? 10 : 5

  return Math.min(score, 100)
}
```

---

## 七、与 hvoy 的关系

### Phase 1：消费 hvoy 数据

- 定时拉取 `hvoy.ai/__all-channels` 和 `/__site-detail/*`
- 在页面标注「探针数据来自 hvoy.ai」
- 不与 hvoy 竞争，而是**在其基础上叠加企业合规维度**

### Phase 2：自建探针后

- 模镜自建探针 → 结果可以同时展示 hvoy 的和自己的
- 用户可以对比两家的探针结果，增加可信度
- 长期：hvoy 覆盖开发者市场，模镜覆盖企业市场

---

## 八、成功指标

| 阶段 | 指标 |
|------|------|
| Phase 1 上线 | 收录 400+ 站点，企业合规字段覆盖 50 家 |
| Phase 2 探针 | 自建探针跑通 20 家中转站，每日更新 |
| Phase 3 变现 | 企业咨询服务上线，月询盘 10+ |

---

## 九、下一步行动

1. **重写 seed**：从 `research/hvoy-intel/api-snapshots/site-details-*/*.json` 导入
2. **扩展 schema**：加企业合规字段
3. **继续做页面**：`/models/[modelId]` → `/sites/[siteId]` → `/enterprise`
