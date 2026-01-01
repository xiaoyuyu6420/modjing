# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

模镜（modjing.com）是一个中转站评测平台——做裁判，不做运动员。技术栈：Next.js (App Router) + Tailwind CSS + SQLite + Prisma。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (端口 3020)
npm run build    # 生产构建
npm run lint     # ESLint 检查
npx prisma studio   # 打开 Prisma 数据库管理界面
npx prisma db push  # 同步 schema 变更到数据库
```

## 架构要点

- **Next.js App Router**: 使用 `src/app/` 目录结构，页面组件默认为 Server Components
- **路径别名**: `@/*` 映射到 `./src/*`，如 `import { prisma } from '@/lib/prisma'`
- **Prisma 单例模式**: `src/lib/prisma.ts` 使用 globalThis 避免 hot reload 时创建多个连接
- **深色模式优先**: `layout.tsx` 已设置 `dark` 类，使用 Tailwind 的 gray-950/900 作为背景

## 核心原则

1. **快速迭代 > 完美架构。** 这是一个市场变化极快的行业评测网站，不是银行系统。能用 vibecoding 快速改比什么都重要。
2. **一个改动只动该动的地方。** 改首页不要碰数据库 schema，改样式不要重构逻辑。小步快跑。
3. **不要过度工程。** MVP 阶段不需要微服务、消息队列、K8s。一个 Next.js 项目一把梭。
4. **代码即文档。** 函数名、变量名、文件结构自己说清楚自己，少写注释，把精力放在代码本身。
5. **先跑通再优化。** 数据先手动录入，确认能用，再写自动化。

## 代码规范

- TypeScript strict mode
- 两空格缩进，单引号，无分号
- 组件用函数式，不用 class
- 文件命名：kebab-case
- 组件命名：PascalCase
- 数据操作一律走 Prisma，不直接写 SQL

## 工作节奏

- **每次改动尽量控制在一个页面或一个功能内**
- 改完立刻 `npm run build` 确认不报错
- 有问题直接说，不要猜
- 不确定的设计决策，留 TODO 标记，不要擅自发挥



## 数据模型摘要

- **Site**: 中转站基础信息（name, url, status, isFree 等）
- **SiteModelPrice**: 站点 × 模型 × 价格（含 tampered 掺水标记、priceAnomaly 价格异常标记）
- **HealthCheck**: 健康检查记录（延迟、状态）
- **Review**: 用户评价
- **PriceHistory**: 价格历史记录

详见 `prisma/schema.prisma` 和 `README.md`。

## 检测服务架构

模镜不内置欺诈检测算法，而是外包给专业检测服务。

### 检测服务

| 服务 | 端口 | 用途 |
|------|------|------|
| llm-verify | :8000 | 通用 LLM 欺诈检测（深度） |
| APIVerifier | :8001 | Claude 专用快速检测 |

### 为什么外包？

1. 检测算法是军备竞赛，需要持续演进
2. 专业项目比翻译版更准确、更及时
3. 减少模镜维护负担，专注评测平台核心功能

### 调用方式

```typescript
import { detectFraud } from '@/lib/detect'

// 快速检测（Claude 专用，< 5s）
const result = await detectFraud(url, apiKey, model, { quick: true })

// 深度检测（通用，1-3 min）
const result = await detectFraud(url, apiKey, model)
```

### 启动检测服务

```bash
# llm-verify
cd research/hvoy-intel/repos/llm-verify-main
uvicorn src.main:app --port 8000

# APIVerifier
cd research/hvoy-intel/repos/APIVerifier-main
pip install -r requirements-api.txt
python api_server.py
```

详细文档见 `docs/detection-architecture.md`
