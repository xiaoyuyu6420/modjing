# 模镜 (Miro) — 完整架构与功能板块

> 中转站评测平台。做裁判，不做运动员。

---

## 一、整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      模镜 (modjing.com)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   前端页面    │  │  Next.js API  │  │  SQLite 数据  │   │
│  │  (src/app)    │  │  (Server Action)│  │  (Prisma)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                   │                   │          │
│         └───────────────────┴───────────────────┘          │
│                          │                                  │
│              ┌───────────┴───────────┐                      │
│              ▼                       ▼                      │
│  ┌─────────────────┐     ┌─────────────────────┐           │
│  │  检测服务适配层   │     │  数据导入/脚本       │           │
│  │ src/lib/detect  │     │ scripts/import-hvoy │           │
│  └─────────────────┘     └─────────────────────┘           │
│              │                       │                       │
│              ▼                       ▼                       │
│  ┌─────────────────┐     ┌─────────────────────┐           │
│  │  llm-verify     │     │  hvoy.ai 数据快照     │           │
│  │  (:8000)        │     │  (api-snapshots/)     │           │
│  │  FastAPI        │     │  447 站点 / 5289 价格  │           │
│  └─────────────────┘     └─────────────────────┘           │
│  ┌─────────────────┐                                         │
│  │  APIVerifier    │                                         │
│  │  (:8001)        │                                         │
│  │  FastAPI        │                                         │
│  └─────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
  ┌─────────────────────────────────────────────────────────┐
  │              research/hvoy-intel/repos/                  │
  │  ┌────────────┐ ┌────────────┐ ┌────────────┐        │
  │  │llm-verify  │ │APIVerifier │ │CLIProxyAPI │        │
  │  │(Python)    │ │(Python)    │ │(Go)        │        │
  │  └────────────┘ └────────────┘ └────────────┘        │
  │  ┌────────────┐ ┌────────────┐ ┌────────────┐        │
  │  │relayAPI    │ │hvoydocs    │ │awesome-     │        │
  │  │            │ │            │ │coding-plan │        │
  │  └────────────┘ └────────────┘ └────────────┘        │
  └─────────────────────────────────────────────────────────┘
```

---

## 二、技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | Next.js App Router | 15.3.3 |
| 样式 | Tailwind CSS | 4.1.7 |
| 数据库 | SQLite | 内置 |
| ORM | Prisma | 6.9.0 |
| 测试 | Vitest | 4.1.9 |
| 语言 | TypeScript | 5.8.3 |
| 运行时 | Node.js | 22.22.1 |

---

## 三、页面路由（19 个）

| 页面 | 路由 | 类型 | 说明 |
|------|------|------|------|
| **首页** | `/` | Server | 品牌入口 + 统计 + 核心功能 |
| **站点列表** | `/sites` | Server | 全部站点 + 筛选排序 |
| **站点详情** | `/sites/[siteId]` | Server | 单站详细信息 + 评价 |
| **按模型查** | `/models/[modelId]` | Server | 选模型 → 对比所有站点 |
| **模型列表** | `/models` | Server | 模型索引页 |
| **排行榜** | `/leaderboard` | Server | 模型排名 |
| **模型择优** | `/model-select` | Server | 推荐最佳站点 |
| **公益站** | `/free` | Server | 免费/公益站点 |
| **批量测速** | `/benchmark` | Server | 用户输入 Key + 端点 → 测速 |
| **Codex 雷达** | `/codex-radar` | Server | Codex 重置窗口监控 |
| **RP 专区** | `/rp` | Server | 角色扮演站推荐 |
| **企业合规** | `/enterprise` | Server | 发票/等保/SLA 筛选 |
| **站点公告** | `/notices` | Server | 全网公告聚合 |
| **套餐对比** | `/plans` | Server | Token Plan 价格对比 |
| **方法论** | `/methodology` | Server | 探针方法公开 |
| **选型咨询** | `/consult` | Static | 表单 → 微信引导 |
| **联系我们** | `/contact` | Static | 联系表单 |
| **用户协议** | `/terms` | Static | 用户协议 |
| **隐私政策** | `/privacy` | Static | 隐私政策 |

---

## 四、数据模型（5 张表）

```prisma
Site              ── 中转站基础信息
  ├── SiteModelPrice   ── 站点 × 模型 × 价格
  │     ├── PriceHistory  ── 价格历史
  │     └── ...
  ├── HealthCheck      ── 健康检查记录
  ├── Review           ── 用户评价
  └── RelayNotice      ── 站点公告
```

### 核心表：Site（中转站）

| 字段 | 说明 |
|------|------|
| name, url, logo, description | 基础信息 |
| status | online / unstable / offline |
| isFree | 是否公益站 |
| paymentMethods | 支付宝,微信,USDT,Stripe,Invoice |
| hasInvoice | 是否开发票 |
| **企业合规字段** | 发票类型、等保级别、数据位置、SLA、合同模板等 |

### 核心表：SiteModelPrice（价格 + 探针结果）

| 字段 | 说明 |
|------|------|
| modelName | `${baseModel}@${channel}` 如 `gpt-4o@default` |
| price | 每百万 token 价格 |
| priceAnomaly | 价格异常标记 |
| tampered | 是否掺水 |
| detectedModel | 实际检测到的模型 |
| passRate | 探针通过率 % |
| onlineRate | 在线率 % |
| fakeRateBand | minimal / low / light / severe |
| avgLatencyMs | 平均延迟 |
| weightedScore | 综合评分 |

---

## 五、第三方开源项目（research/hvoy-intel/repos/）

| 项目 | 语言 | 用途 | 如何接入模镜 |
|------|------|------|------------|
| **llm-verify-main** | Python/FastAPI | 通用 LLM 欺诈检测 | 外包检测服务，:8000 |
| **APIVerifier-main** | Python/FastAPI | Claude 专用快速检测 | 外包检测服务，:8001 |
| **CLIProxyAPI-main** | Go | CLI 代理服务（Claude Code/Gemini → API） | 研究参考，不直接接入 |
| **relayAPI-main** | - | 中转 API 工具 | 研究参考 |
| **hvoydocs-main** | - | HVOY 文档站 | 研究参考（中转站评测推荐） |
| **awesome-coding-plan** | - | 编程计划资源列表 | 研究参考 |

### 为什么检测服务外包？

1. **军备竞赛** — 欺诈手法持续更新，检测算法必须持续演进
2. **专业性** — 专注项目比我们自己翻译版更准确、更及时
3. **维护成本** — 减少模镜维护负担，专注评测平台核心功能
4. **可替换性** — 未来可以接入更好的检测服务

### 检测服务调用

```typescript
import { detectFraud } from '@/lib/detect'

// 快速检测（Claude 专用，< 5s）
const result = await detectFraud(url, apiKey, model, { quick: true })
// → 调用 APIVerifier (:8001)

// 深度检测（通用，1-3 min）
const result = await detectFraud(url, apiKey, model)
// → 调用 llm-verify (:8000)
```

### 检测方式覆盖

| 检测方式 | llm-verify | APIVerifier | 说明 |
|----------|-----------|-------------|------|
| 知识截止检测 | ✅ | ✅ | 问模型训练数据截止日期 |
| 协议级验证 | ❌ | ✅ | SSE 流形状、thinking block |
| 身份探针 | ✅ | ❌ | 多角度问模型身份 |
| 行为指纹 | ✅ | ❌ | 风格/词汇/结构分析 |
| 能力测试 | ✅ | ❌ | 代码/数学/推理题 |
| 延迟指纹 | 部分 | ✅ | 首 token 延迟 |

---

## 六、数据源

### 种子数据来源（hvoy.ai 快照）

```
research/hvoy-intel/
├── api-snapshots/          ── 站点详情 JSON（447 站点）
├── html-pages/             ── hvoy 页面 HTML 缓存
├── js-chunks/              ── hvoy JS bundle（逆向分析）
├── sitemaps/               ── 站点 URL 列表
├── notes/                  ── 分析笔记
└── repos/                  ── 第三方开源项目
```

### 导入脚本

```bash
# 导入 hvoy 数据到 SQLite
node scripts/import-hvoy.mjs
# → 447 站点 / 5289 价格 / 6918 历史记录
```

### 参照竞品

| 竞品 | 借鉴点 |
|------|--------|
| **hvoy.ai** | 探针策略、伪装请求头、题库设计 |
| **apiranking.com** | 排行榜结构、真假鉴真、充值方式维度 |
| **apinav.cc** | 筛选维度、匿名评价 |
| **wll8/ai-proxy** | 站点导航模板 |
| **opentherank.com** | 套餐对比页 |

---

## 七、代码结构

```
modjing/
├── src/
│   ├── app/                  ── 页面路由（19 个 page.tsx）
│   │   ├── page.tsx              首页
│   │   ├── layout.tsx            根布局
│   │   ├── globals.css           全局样式
│   │   ├── sites/                站点列表/详情
│   │   ├── models/               模型列表/详情
│   │   ├── free/                 公益站
│   │   ├── leaderboard/          排行榜
│   │   ├── model-select/         模型择优
│   │   ├── enterprise/           企业合规
│   │   ├── benchmark/            批量测速
│   │   ├── codex-radar/          Codex 雷达
│   │   ├── rp/                   RP 专区
│   │   ├── notices/              站点公告
│   │   ├── methodology/          方法论
│   │   ├── plans/                套餐对比
│   │   ├── consult/              选型咨询
│   │   ├── contact/              联系我们
│   │   ├── terms/                用户协议
│   │   └── privacy/              隐私政策
│   ├── components/           ── 共享组件
│   │   ├── Nav.tsx               全局导航
│   │   ├── Footer.tsx            页脚
│   │   └── ui/                   UI 组件
│   ├── lib/                  ── 工具库
│   │   ├── prisma.ts             Prisma 单例
│   │   ├── endpoint-safety.ts    端点安全校验
│   │   └── detect/               检测服务适配层
│   │       ├── types.ts              类型定义
│   │       ├── index.ts              主入口
│   │       ├── api-verifier.ts       APIVerifier 调用
│   │       ├── llm-verify.ts         llm-verify 调用
│   │       └── *.test.ts             测试（26 个用例）
│   └── __tests__/            ── 测试工具
├── prisma/
│   └── schema.prisma         ── 数据模型（5 表）
├── scripts/
│   └── import-hvoy.mjs       ── hvoy 数据导入脚本
├── docs/                     ── 项目文档
│   ├── detection-architecture.md   检测服务架构
│   ├── data-sources.md             数据源参照
│   ├── probe-engine.md             探针引擎设计
│   ├── hvoy-vs-mojing.md           对标分析
│   ├── hvoy-reverse-engineering.md 逆向工程
│   ├── development-plan.md           开发计划
│   └── agent-context.md             Agent 临时文档
├── research/
│   └── hvoy-intel/           ── 情报库（第三方项目 + 数据快照）
├── package.json
├── vitest.config.ts          ── 测试配置
└── CLAUDE.md                 ── 项目指南（给 AI 的上下文）
```

---

## 八、文档体系

| 文档 | 用途 | 读者 |
|------|------|------|
| **CLAUDE.md** | 项目指南（技术栈、规范、命令） | AI / 开发者 |
| **README.md** | 项目概述、迭代计划 | 所有开发者 |
| **docs/detection-architecture.md** | 检测服务架构说明 | 开发者 |
| **docs/probe-engine.md** | 探针引擎设计（4 维探测、指纹算法） | 开发者/算法 |
| **docs/hvoy-vs-mojing.md** | 对标 hvoy 的完整功能清单 | 产品经理/开发者 |
| **docs/hvoy-reverse-engineering.md** | hvoy 逆向工程（探针常量、伪装策略） | 算法/安全 |
| **docs/data-sources.md** | 种子数据来源（7 个竞品参照） | 数据/运营 |
| **docs/development-plan.md** | 4 周开发计划 | 开发者 |

---

## 九、测试

| 指标 | 数据 |
|------|------|
| 测试框架 | Vitest 4.1.9 |
| 测试文件 | 3 个 |
| 测试用例 | 26 个 |
| 覆盖率 | 93.93% 语句 / 86% 分支（检测模块） |
| 命令 | `npm test` / `npm run test:coverage` |

---

## 十、启动命令

```bash
# 开发
npm run dev              # 启动 Next.js (:3020)

# 检测服务（另开终端）
cd research/hvoy-intel/repos/llm-verify-main
uvicorn src.main:app --port 8000

cd research/hvoy-intel/repos/APIVerifier-main
pip install -r requirements-api.txt
python api_server.py     # 启动 (:8001)

# 测试
npm test                 # 运行测试
npm run test:coverage    # 覆盖率报告

# 构建
npm run build            # 生产构建
npm run lint             # ESLint 检查

# 数据库
npx prisma studio        # 数据库管理界面
npx prisma db push       # 同步 schema
node scripts/import-hvoy.mjs  # 导入 hvoy 数据
```

---

## 十一、模镜 vs hvoy 对标状态

| hvoy 功能 | 模镜状态 | 说明 |
|-----------|----------|------|
| 首页 | ✅ | 已有 |
| 站点列表 | ✅ | 已有 |
| 站点详情 | ✅ | 已有 |
| 按模型查 | ✅ | 已有 |
| 排行榜 | ✅ | 已有 |
| 模型择优 | ✅ | 已有 |
| 公益站 | ✅ | 已有 |
| 批量测速 | ✅ | 已有 |
| Codex 雷达 | ✅ | 已有 |
| RP 专区 | ✅ | 已有 |
| 企业合规 | ✅ | **差异化**（hvoy 没有） |
| 方法论公开 | ✅ | **差异化**（hvoy 黑箱） |
| 站点公告 | ✅ | 已有 |
| 用户系统 | ❌ | Phase 2 |
| Partner 后台 | ❌ | Phase 2 |
| 抽奖系统 | ❌ | Phase 3 |
| CPM 广告 | ❌ | Phase 3 |
| 探针系统 | 🔄 | 外包给 llm-verify + APIVerifier |

---

*最后更新：2026-06-17*
