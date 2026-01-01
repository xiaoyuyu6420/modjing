# 参照模板与数据源

> 收录用户指定的 7 个站点，作为模镜的参照模板与种子数据来源。
> 调研时间：2026-06-16

---

## 一句话定位对照

| 站点 | URL | 定位 | 对模镜的价值 |
|------|-----|------|--------------|
| 禾维 AI · API Key 测试 | https://hvoy.ai/api-key-tester | 浏览器本地 Key 连通性测试工具（Anthropic / OpenAI / Gemini） | `/benchmark` 批量测速页的功能蓝本 |
| ai-proxy（wll8） | https://wll8.github.io/ai-proxy/ | GitHub Pages 上的静态导航板 | 收录 30+ 真实站点 URL，可直接作为种子 |
| 公益站导航（apinev） | https://apinev.888.moe/ | 公益站定向导航 | `/free` 页的样式 + 公益站清单来源 |
| 大黑 API 导航 | https://api.daheiai.com/ | 收录 ≈200 家 AI API 中转/聚合服务 | 最广的中转站名单来源 |
| API Ranking | https://apiranking.com/ | **独立第三方评测排行榜**：64 家中转站、每 6 小时探针、Claude/GPT/Gemini 真假鉴真 | **直接竞品**，定位、字段、表格结构最值得借鉴 |
| ApiNav | https://www.apinav.cc/ | 公开中转站导航，按计费方式/模型/支付方式/标签筛选，匿名评价 | `/sites` 列表筛选维度的参照 |
| OpenTheRank · CapCut Pricing | https://opentherank.com/zh/ai-pricing/capcut/ | 跨地区 App Store 套餐价格对比 | `/plans` Token Plan 对比页的表格模板 |

---

## 关键参照：API Ranking

apiranking.com 是模镜最直接的对标对象，定位口号几乎一致："不接付费排名、不卖中转站，独立第三方评测"。从其页面提炼出的核心字段和模式：

- **真假鉴真**：通过 / 检测存疑 / 未通过 / 未检测（对应模镜的 `tampered` + `detectedModel`）
- **价格档位标签**：`price-grade low / mid / high`、`best` 高亮（模镜的 `priceAnomaly` 可以扩展为这种 grade 形式）
- **充值方式维度**：支付宝 / 微信 / USDT / Stripe / Invoice（**字段缺失**，schema 需加 `paymentMethods`）
- **是否开发票**（**字段缺失**，加 `hasInvoice: boolean`）
- **下线状态展示**："该站点已下线 / 异常，不可访问"（模镜的 `status` 已覆盖）
- **探针频率**：每 6 小时一轮（模镜 `HealthCheck` 已支持，写定时任务时参考）

### 从 apiranking HTML 里捞到的站点 URL（节选，可直接作为种子）

```
https://ai.17nas.com
https://api.aipaibox.com
https://api.apikey.fun
https://api.chatfire.cn
https://api.clawopen.top
https://api.dzzi.ai
https://api.rpg8.cn
https://api.timebackward.com
https://apinebula.com
https://bobdong.cn
https://boxying.com
https://claude.bestswifter.com
https://deepkey.top
https://huanapi.com
https://main-new.codesuc.top
https://nekocode.ai
https://packyapi.com
https://qiuqiutoken.com
https://subrouter.ai
https://uuapi.net
https://www.cctq.ai
https://yunwu.ai
```

---

## 关键参照：wll8/ai-proxy

GitHub Pages 静态页，HTML 中直接列出了 30 家带 `aff` 推广码的站点（带 aff 说明是站长亲测可注册的活站），可直接作为种子：

```
https://agentrouter.org
https://aiapi.hlwy2025.me
https://api.aioec.tech
https://api.codemirror.codes
https://api.freekey.site
https://api.gpt.ge
https://api.kkyyxx.xyz
https://api.sdnegerioelbima.eu.org
https://b4u.qzz.io
https://chat-api.xzbzq.com
https://code.wenwen-ai.com
https://jeniya.top
https://one-api.aiporters.com
https://one-api.ygxz.in
https://privnode.com
https://www.88code.org
https://www.mnapi.com
https://x666.me
```

---

## 关键参照：hvoy.ai

hvoy 不是评测站，是浏览器本地 Key 测试工具。从其 JS bundle 中提取到的"被测试过的"端点（说明这些是真实活跃的中转站）：

```
https://ai.flashapi.top
https://aiberm.com
https://api.aigocode.com
https://api.aipaibox.com
https://api.cubence.com
https://api.duckcoding.ai
https://api.mnapi.com
https://api.timebackward.com
https://apic1.ohmycdn.com
https://cc.codesome.ai
https://chintao.cn
https://claudecn.top
https://code.newcli.com
https://dawclaudecode.com
https://linkapi.ai
https://new.050602.xyz
https://node-hk.sssaicode.com
https://sparkcode.top
https://timicc.com
https://www.openclaudecode.cn
https://www.packyapi.com
https://yunwu.ai
```

hvoy 的功能蓝本对 `/benchmark` 页很有借鉴价值：

- 全部在浏览器本地跑，不上传 Key
- 支持 Anthropic / OpenAI 兼容 / OpenAI Responses / Gemini 四种协议
- 展示：状态码、延迟、Token 消耗、原始返回、可复制的 curl 命令

---

## 数据模型补充建议

调研后发现，模镜当前的 schema 缺以下字段（对照 apiranking 和 apinav）：

| 字段 | 类型 | 来源参照 | 说明 |
|------|------|----------|------|
| `Site.paymentMethods` | string (JSON / 逗号分隔) | apiranking | 支付宝/微信/USDT/Stripe/Invoice |
| `Site.hasInvoice` | boolean | apiranking | 是否能开发票（企业用户在意） |
| `Site.activityIndex` | int | apinav | 活跃指数（综合在线率 + 用户反馈） |
| `SiteModelPrice.priceGrade` | enum | apiranking | low / mid / high / best，比单纯的 `priceAnomaly` 信息密度更高 |
| `SiteModelPrice.contextWindow` | int? | apiranking | 上下文窗口是否被砍（"上下文砍掉"是常见掺水手段） |

**优先级**：先用现有 schema 跑通 P0+P1，等数据真正录入再扩字段。不要为了字段完美而卡住进度。

---

## 种子数据策略

Phase 0 的目标只是**让页面有东西展示**，所以：

1. 从上面三个来源（apiranking / wll8 / hvoy）的并集去重，挑 10 家最常见的（出现在 ≥2 个来源的站点优先）
2. 每家造 3-5 个主流模型的价格（gpt-4o, claude-sonnet-4, gemini-2.5-pro, deepseek-v3）
3. 价格用合理区间随机：高端模型 5-20 元/百万 token，中端 1-5 元，便宜的 0.1-1 元
4. 1-2 家挂 `tampered=true` 演示掺水标记效果
5. 每家造 1-2 条 HealthCheck 假数据

种子脚本写到 `prisma/seed.ts`，跑 `npx prisma db seed`。
