# 模镜 Miro — LLM Relay Review Platform

> An independent review platform for LLM API relay services. We evaluate, don't compete.

<p align="center">
  <a href="https://modjing.com">🌐 Live Demo</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## 🎯 What is Miro?

**Miro (模镜)** is an independent review and comparison platform for LLM API relay services ("中转站" in Chinese). Think of it as a "SimilarWeb for LLM proxies" — we collect, verify, and compare relay services across multiple dimensions so users can make informed decisions.

> **The Problem:** LLM relay services are everywhere, but:
> - Some sell "GPT-4o" but actually serve GPT-3.5 (model tampering)
> - Prices fluctuate wildly with no transparency
> - Services can go offline overnight with no warning
> - No reliable source for cross-platform comparison

**Miro solves this** with automated probing, price tracking, and a community-driven review system.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Price Comparison** | Compare model prices across 100+ relay services in real-time |
| **Model Integrity Check** | Automated probing detects if a service is serving the model it claims (tampering detection) |
| **Health Monitoring** | Track uptime, latency, and stability across all indexed services |
| **Enterprise Explorer** | Filter by compliance (ISO 27001, MLPS), invoice support, SLA, and enterprise features |
| **Admin Dashboard** | Full CRUD for sites, prices, notices, and probe execution |
| **Data Pipeline** | Automated ingestion from external sources with schema validation and deduplication |
| **Probe Pool** | Versioned, tiered probing system (keyless → lightweight → deep) with scoring |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App (Frontend)                   │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │
│  │  Pages  │ │  Admin   │ │  API Routes│ │  Components │  │
│  │ (18+)   │ │ Dashboard│ │ (REST)     │ │ (Reusable)  │  │
│  └─────────┘ └──────────┘ └────────────┘ └──────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    SQLite + Prisma ORM                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Site    │ │  Price   │ │  Health  │ │  Probe     │  │
│  │  (中转站) │ │  (模型价) │ │  (健康)  │ │  (探针)    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└───────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────────────┐
│              External Detection Services                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ llm-verify   │ │ APIVerifier  │ │ Self-hosted  │    │
│  │ (deep check) │ │ (fast check) │ │ probe pool   │    │
│  │    :8000     │ │    :8001     │ │    :3020     │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
└───────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **Next.js 15** (App Router) | Full-stack, SSR, API routes in one codebase |
| Styling | **Tailwind CSS** | Utility-first, AI-friendly, rapid iteration |
| Database | **SQLite** | Zero-config, file-based, easily portable |
| ORM | **Prisma** | Schema-as-code, type-safe queries |
| Testing | **Vitest** + **Playwright** | Unit + E2E coverage |
| Validation | **Zod** | Runtime schema validation for data pipeline |
| Deployment | **Vercel** | Zero-config, edge-ready |

---

## 📊 Data Model

```prisma
model Site {
  id            Int             @id @default(autoincrement())
  name          String
  url           String
  logo          String?
  description   String?
  status        String          // online | unstable | offline
  isFree        Boolean         @default(false)
  modelPrices   SiteModelPrice[]
  healthChecks  HealthCheck[]
  reviews       Review[]
  // ... enterprise fields (compliance, SLA, invoice, etc.)
}

model SiteModelPrice {
  id              Int     @id @default(autoincrement())
  siteId          Int
  modelName       String  // e.g., "gpt-4o", "claude-3.5-sonnet"
  price           Float   // input price per million tokens
  priceOutput     Float?  // output price
  priceCached     Float?  // cached price
  multiplier      Float   @default(1.0)
  afterSales      String  // none | verify_once | days_30 | lifetime
  tampered        Boolean @default(false)
  passRate        Float?  // probe pass rate %
  onlineRate      Float?  // uptime %
  weightedScore   Float?  // composite score
  // ...
}
```

**Key Design Decisions:**
- **Three-price model**: input / output / cached — reflects real-world pricing complexity
- **Tampering detection**: `tampered` + `detectedModel` fields to catch model substitution fraud
- **Probe scoring**: Composite weighted score combining pass rate, uptime, latency, and token usage ratio
- **Enterprise compliance**: Full support for compliance tracking (ISO 27001, MLPS), invoice types, SLAs

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run e2e

# Coverage
npm run test:coverage
```

Test philosophy: **Spec-driven workflow** — every feature domain has a spec (requirements), a plan (design), and tasks (checklist). Green tests + green build = done.

---

## 📁 Project Structure

```
modjing/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (dashboard)/     # Admin route group (login-protected)
│   │   ├── api/             # REST API routes
│   │   ├── benchmark/       # User-facing benchmark tool
│   │   ├── enterprise/      # Enterprise service explorer
│   │   ├── leaderboard/     # Ranking by model
│   │   ├── models/          # Model-centric comparison
│   │   ├── sites/           # Site-centric details
│   │   └── ...
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Core business logic
│   │   ├── prisma.ts        # Database singleton
│   │   ├── probe.ts         # Probe orchestration
│   │   ├── probe-pool/      # Tiered probe pool system
│   │   ├── hvoy/            # Data pipeline (import + sync)
│   │   └── admin-auth.ts    # Admin authentication
│   └── ...
├── prisma/
│   └── schema.prisma        # Single source of truth for data model
├── specs/                   # Spec-driven docs (spec / plan / tasks)
├── docs/                    # Architecture docs
├── scripts/                 # Data import/sync scripts
├── e2e/                     # Playwright tests
└── ...
```

---

## 🚦 Getting Started

```bash
# Clone
git clone https://github.com/munich/modjing.git
cd modjing

# Install dependencies
npm install

# Set up database (SQLite — zero config)
npx prisma db push

# Seed data (optional)
npx prisma studio

# Run dev server
npm run dev
# → http://localhost:3020
```

---

## 🌐 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Brand entry + model search + feature highlights |
| Sites | `/sites` | All relay services with filter & sort |
| Site Detail | `/sites/[id]` | Full info, prices, reviews, health history |
| Models | `/models` | Model catalog with cross-site price comparison |
| Model Detail | `/models/[id]` | Per-model comparison table across all sites |
| Leaderboard | `/leaderboard` | Ranked lists by performance metrics |
| Enterprise | `/enterprise` | Filter services by enterprise compliance features |
| Benchmark | `/benchmark` | User-input key + endpoint for manual testing |
| Plans | `/plans` | Token plan pricing comparison |
| Notices | `/notices` | Aggregated service announcements |
| Admin | `/admin` | Full management dashboard (password-protected) |

---

## 🧠 Key Insights (What I Learned)

1. **Model tampering is real and widespread** — automated probing is essential, not optional.
2. **Price alone is a bad signal** — combine with pass rate, uptime, and token usage ratio for a composite score.
3. **Enterprise buyers need different data** — compliance, SLA, invoice support are decision factors, not just price.
4. **Spec-driven development works** — writing spec → plan → tasks before coding prevents scope creep and keeps the codebase focused.
5. **AI-assisted coding (vibe coding) is a force multiplier** — but only with clear architecture boundaries and test guards.

---

## 📝 License

[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — **非商业用途**。

本作品采用「署名-非商业性使用-相同方式共享 4.0 国际」许可协议。你可以自由地使用、分享和改编，但**不得用于任何商业目的**，且衍生作品须以相同协议发布。详见 [LICENSE](./LICENSE)。

---

## 🙋 About the Author

Built by [Munich](https://github.com/munich) as a portfolio project showcasing full-stack development, data pipeline architecture, and test-driven workflows with AI-assisted development.

> "做裁判，不做运动员。" — We evaluate, don't compete.

---

<p align="center">
  <sub>⭐ If you find this interesting, give it a star!</sub>
</p>
