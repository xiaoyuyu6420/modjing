# 模镜文档索引

> 文档总览，快速定位需要的信息。

---

## 必读文档

| 文档 | 用途 | 谁需要看 |
|------|------|----------|
| [**架构总览**](architecture-overview.md) | 项目完整架构、技术栈、页面路由、数据模型、第三方项目 | 所有开发者 |
| [**检测服务架构**](detection-architecture.md) | 检测服务外包设计、API 接口、部署方式 | 后端/运维 |
| [**开发计划**](development-plan.md) | 4 周迭代计划、P0-P3 优先级 | 开发者/产品经理 |

---

## 参考资料

| 文档 | 用途 | 谁需要看 |
|------|------|----------|
| [**hvoy 对标**](hvoy-vs-mojing.md) | 模镜 vs hvoy 功能对标、差异化优势 | 产品经理 |
| [**数据源**](data-sources.md) | 种子数据来源、竞品参照、数据导入策略 | 数据/运营 |
| [**探针引擎设计**](probe-engine.md) | 探针策略、题库设计、评分公式、伪装请求 | 算法/安全 |
| [**逆向工程**](hvoy-reverse-engineering.md) | hvoy.ai 完整逆向分析（prompt、伪装头、判定逻辑） | 算法/安全 |

---

## 文档关系图

```
新开发者入门
    │
    ├─→ architecture-overview.md (项目全貌)
    │       ├─→ detection-architecture.md (检测服务)
    │       └─→ development-plan.md (迭代计划)
    │
    ├─→ hvoy-vs-mojing.md (竞品对标)
    │       └─→ hvoy-reverse-engineering.md (技术细节)
    │
    └─→ probe-engine.md (探针设计)
            └─→ data-sources.md (数据来源)
```

---

## 文档状态

| 文档 | 状态 | 说明 |
|------|------|------|
| architecture-overview.md | ✅ 最新 | 2026-06-17 创建 |
| detection-architecture.md | ✅ 最新 | 已包含检测服务外包方案 |
| development-plan.md | ✅ 最新 | Phase 0 已完成 |
| hvoy-vs-mojing.md | ✅ 参考 | 对标 hvoy 功能清单 |
| hvoy-reverse-engineering.md | ✅ 参考 | hvoy 技术逆向 |
| probe-engine.md | ✅ 参考 | 探针引擎设计纲要 |
| data-sources.md | ✅ 参考 | 数据源调研 |

---

*文档最后更新：2026-06-17*
