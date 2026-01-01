# 模镜 Miro

> 中转站评测平台——做裁判，不做运动员。
> 域名：modjing.com

---

## 核心开发原则

**快速迭代 > 完美架构。**

- 中转站市场变化快，站点今天活着明天暴毙，价格天天变
- 网站必须能用 vibecoding（自然语言对话式编程）低成本修改
- 宁可架构简单能快速改，不要架构完美但改不动
- 每个页面、每个组件都应该是独立可替换的——改一个页面不影响其他
- 数据字段可扩展：随时加新维度不影响现有数据

---

## 技术框架

| 层 | 选型 | 理由 |
|----|------|------|
| 前端 | **Next.js（App Router）** | 生态成熟、AI 生成代码命中率高、静态+动态混合 |
| 样式 | **Tailwind CSS** | vibecoding 友好，AI 改样式最熟悉的方案 |
| 后端 | **Next.js API Routes** | 不拆独立后端，减少部署复杂度 |
| 数据库 | **SQLite** | 单文件、零配置、够用。量大了再迁移 |
| ORM | **Prisma** | schema 即文档，AI 读写数据模型最方便 |
| 部署 | **Vercel / 自建** | 先 Vercel 快速上线，后续可迁自建 |

---

## 页面规划

| 页面 | 路由 | 优先级 | 说明 |
|------|------|--------|------|
| 首页 | `/` | P0 | 品牌入口 + 核心钩子 + 搜索框 |
| 站点收录（按模型查） | `/models/[modelId]` | P0 | 核心功能：选模型 → 看所有中转站的对比表 |
| 中转站列表 | `/sites` | P0 | 全部站点 + 筛选 + 排序 |
| 站点详情 | `/sites/[siteId]` | P1 | 单个站点的详细信息 + 评价 |
| 批量测速 | `/benchmark` | P1 | 用户输入 Key+端点 → 批量测速 → 排行榜 |
| Token Plan | `/plans` | P2 | 全网套餐价格对比 |
| 选型咨询 | `/consult` | P2 | 表单 → 微信引导 |
| 公益站列表 | `/free` | P2 | 同站点列表结构，区分标记 |
| 论坛 | `/forum` | P3 | 后期 |

### 页面风格

- 简洁工具型，参考 SimilarWeb / hvoy.ai 的风格
- 深色模式优先（技术用户群体）
- 数据密集型表格为主，不要花哨动画
- 每个数据维度可点击排序，可组合筛选
- 移动端适配（表格可横向滚动）

---

## 数据模型

### Site（中转站）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 站点名称 |
| url | string | 站点地址 |
| logo | string? | Logo URL |
| description | text? | 站点介绍 |
| announcement | text? | 站点公告 |
| isFree | boolean | 是否公益站 |
| status | enum | online / unstable / offline |
| createdAt | datetime | 收录时间 |

### SiteModelPrice（站点 × 模型 × 价格）

| 字段 | 类型 | 说明 |
|------|------|------|
| siteId | ref → Site | |
| modelName | string | 如 `gpt-4o`, `claude-3.5-sonnet` |
| price | float | 每百万 token 价格 |
| priceUnit | string | 计费单位 |
| multiplier | float | 倍率 |
| afterSales | enum | `none` / `verify_once` / `days_30` / `lifetime` |
| priceAnomaly | boolean | 价格异常标记（系统自动计算） |
| detectedModel | string? | 实际检测到的模型（掺水检测） |
| tampered | boolean? | 是否掺水（标称 ≠ 实际） |

### PriceHistory（价格趋势）

| 字段 | 类型 | 说明 |
|------|------|------|
| siteModelPriceId | ref | |
| price | float | |
| recordedAt | datetime | |

### HealthCheck（在线率/延迟）

| 字段 | 类型 | 说明 |
|------|------|------|
| siteId | ref → Site | |
| latency | int | ms |
| status | enum | ok / slow / timeout / error |
| checkedAt | datetime | |

### Review（用户评价）

| 字段 | 类型 | 说明 |
|------|------|------|
| siteId | ref → Site | |
| author | string | 用户名 |
| content | text | 评价内容 |
| rating | int | 1-5 |
| createdAt | datetime | |

---

## 行业特性 → 设计约束

> 中转站行业的关键特性，直接决定了数据模型设计。

| 行业事实 | 设计响应 |
|----------|----------|
| 模型掉包（标称 gpt-4o 实际返回 3.5）普遍存在 | `tampered` + `detectedModel` 字段 + 掺水检测模块 |
| 稳定性是用户第一痛点 | `HealthCheck` 表 + 定时健康检查任务 |
| 价格异常低大概率在掺水 | `priceAnomaly` 自动标记（偏离均价超过阈值） |
| 靠非正常渠道的站点随时暴毙 | `PriceHistory` 追踪趋势，价格突变 = 风险信号 |
| 售后承诺分层（验一次/包X天/终身包）影响决策 | `afterSales` 枚举字段，列表页可筛选 |

---

## 迭代计划

### Phase 0：跑通数据（手动）

- 人工收录 10 家中转站
- 手动填入：价格、模型列表、售后承诺
- 确认数据模型字段是否够用

### Phase 1：MVP 上线

- 首页 + 站点列表 + 按模型查询
- Vercel 部署，域名解析到 modjing.com
- 目标：能打开、能查、能看

### Phase 2：自动化

- 价格爬取脚本（定时跑）
- 健康检查任务（定时 ping）
- 掺水检测模块

### Phase 3：社区 + 变现

- 用户评价系统
- 咨询窗口（表单 → 微信引导）
- Token Plan 对比页

---

## 选型咨询服务

| 项 | 内容 |
|----|------|
| 入口 | `/consult` 页面 |
| 表单字段 | 业务场景、预算范围、并发需求、技术要求 |
| 流程 | 填表单 → 展示微信二维码 → 私域沟通 |
| 定价 | 轻咨询按次 / 深度咨询按项目，私域内报价 |
| 技术实现 | 纯静态表单 + 微信二维码图片，无需后端逻辑 |
