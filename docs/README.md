# 模镜文档索引（Spec Harness）

> 文档分四层。治理看 constitution，规格看 specs，参考资料看 reference，逆向调研看 research。

---

## 🏛 Constitution（治理根本）

项目原则、合规约束、不做什么、战略方向。**所有决策服从于此。**

| 文档 | 用途 |
|------|------|
| [**constitution.md**](/.specify/memory/constitution.md) | 项目根本约束：立场、法律底线、禁止项、差异化方向、演进路径 |

## 📋 Specs（规格，Spec-Kit 三件套）

每个功能域一份 spec/plan/tasks。**改代码前先有 spec，review 通过才动。**

| 规格域 | 状态 | 说明 |
|--------|------|------|
| [data-pipeline](../specs/data-pipeline/) | ✅ 已实施 | hvoy 数据管线：schema 校验 + 消除重复 + 测试护栏 |
| [probe-pool](../specs/probe-pool/) | 🚧 待建 | 探针池：版本化服务端私有池 + 公私分离 + 三层探针 + 计费指纹（#14/#15/#16） |

## 📚 Reference（参考资料）

架构、检测、探针、数据源、竞品、资产盘点。

| 文档 | 用途 |
|------|------|
| [**project.md**](project.md) | **项目资产盘点**：技术栈、目录、7 张表、数据管线、页面清单、缺口 |
| [architecture-overview.md](architecture-overview.md) | 完整架构、技术栈、页面路由、数据模型 |
| [detection-architecture.md](detection-architecture.md) | 检测服务外包设计、API 接口、部署 |
| [probe-engine.md](probe-engine.md) | 探针策略、题库设计、评分公式 |
| [data-sources.md](data-sources.md) | 种子数据来源、竞品参照、导入策略 |
| [hvoy-vs-mojing.md](hvoy-vs-mojing.md) | 模镜 vs hvoy 功能对标、差异化 |

## 🔬 Research（逆向调研）

hvoy.ai 逆向分析资料。

| 文档 | 用途 |
|------|------|
| [hvoy-reverse-engineering.md](hvoy-reverse-engineering.md) | hvoy.ai 完整逆向（prompt、伪装头、判定逻辑） |
| [hvoy-reverse-engineering-deep.md](hvoy-reverse-engineering-deep.md) | 深度逆向 |
| [hvoy-reverse-engineering-final.md](hvoy-reverse-engineering-final.md) | 最终版逆向 |

## 🗄 Legacy（历史，非现役）

| 文档 | 状态 |
|------|------|
| [development-plan.md](development-plan.md) | ⚠️ 战略部分已被 constitution 取代；开发任务改走 specs/。保留作历史参考 |

---

## 阅读路径

```
新人入门
    │
    ├─→ constitution.md (立场/约束)
    │
    ├─→ project.md (项目全貌)
    │       ├─→ architecture-overview.md (架构细节)
    │       └─→ data-pipeline spec (数据管线)
    │
    └─→ hvoy-vs-mojing.md (竞品)
            └─→ hvoy-reverse-engineering*.md (技术逆向)
```

## 工作约束

> 数据管线改动必须绿 `npm test` + `npm run build`（详见 [specs/data-pipeline](../specs/data-pipeline/)）。
> Prompt 等源自 llm-verify（MIT）的内容须保留版权声明（constitution §2）。

---

*文档最后更新：2026-06-18（重组为 Spec Harness 结构）*
