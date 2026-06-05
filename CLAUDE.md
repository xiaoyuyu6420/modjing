 
# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview
模镜：中转站评测平台。技术栈：Next.js (App Router) + Tailwind + Prisma + SQLite。

## Commands
- `npm run dev` (port 3020)
- `npm run build` (改完必跑，确认不报错)
- `npx prisma studio`
- `npx prisma db push` (同步 schema)

## Architectural Boundaries (务必遵守)
- **数据库操作**：必须通过 `@/lib/prisma` 单例，严禁在组件或路由中写裸 SQL。
- **数据模型**：读取 `prisma/schema.prisma` 获取最新定义，不要假设字段。
- **前端测速/检测**：必须外包给检测服务，前端/Next.js API 只负责调度和展示，不要在此仓库内写底层探针算法。

## External Detection Services (核心架构)
检测逻辑由本地 Python 服务提供，通过 `@/lib/detect` 调用：
- `llm-verify` (:8000): 通用深度检测 (1-3 min)
- `APIVerifier` (:8001): Claude 快速检测 (< 5s)
如果需要修改检测逻辑，请确认是否应去 Python 仓库修改，而非此 Next.js 仓库。

## Workflow Rules
1. **最小改动原则**：改首页不碰数据库，改样式不重构逻辑。
2. **不擅自发挥**：不确定的设计决策留 TODO 标记并提问，不要自行编造业务逻辑。
3. **不乱加依赖**：如需引入新 npm 包，必须先提出建议。
4. **禁止修改已提交的 Prisma migration**：schema 变更直接用 `prisma db push`。
 