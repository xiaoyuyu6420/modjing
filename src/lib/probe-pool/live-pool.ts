/**
 * 服务端私有 live 探针池 —— 现役探针 prompt 在此。
 *
 * ⚠️ 反规避约束（spec §6.1，#16）：此文件**只允许被服务端代码**引用
 * （route.ts / transform.ts / methodology server component 经 pool.ts）。
 * **禁止**任何 `'use client'` 组件直接或传递 import → 否则 live prompt 泄进 client bundle。
 * 阶段 4 用 `npm run build` 产物 grep 验证 live prompt 不在 client chunk。
 *
 * （可选加固：装 `server-only` 包后在此 `import 'server-only'`，构建期硬抛错。需先提案依赖。）
 *
 * 轮换：每 ~2 周发 PR 改此文件 + bump `version`（plan.md D5）。
 */
import type { ProbePool } from './contract'

/**
 * live 池版本。每次改池（增删改 prompt）必须 bump。
 * 约定：YYYY.MM.rN（年.月.第 N 次轮换）。
 */
export const LIVE_POOL_VERSION = '2026.06.r1'

/**
 * 已知模型的预期知识截止年份（从 probe.ts EXPECTED_CUTOFF 搬来，单一来源化）。
 * identity-cutoff 探针用它判断"旧模型伪装"。
 */
const EXPECTED_CUTOFF: Record<string, number> = {
  'claude-opus-4-8': 2025,
  'claude-opus-4-7': 2025,
  'claude-sonnet-4-6': 2025,
  'gpt-5.5': 2025,
  'gpt-5.4': 2024,
  'gemini-3.1-pro': 2025,
}

/** 把 EXPECTED_CUTOFF 展开成 baseline.models（每模型 expectedTokens≈22，对该 prompt 成立） */
function cutoffBaseline(): ProbePool['entries'][number]['baseline'] {
  const models: Record<string, { cutoffYear: number; expectedTokens: number }> = {}
  for (const [model, year] of Object.entries(EXPECTED_CUTOFF)) {
    models[model] = { cutoffYear: year, expectedTokens: 22 }
  }
  return { models }
}

export const livePoolData: ProbePool = {
  version: LIVE_POOL_VERSION,
  generatedAt: '2026-06-19',
  entries: [
    {
      id: 'identity-cutoff',
      category: 'identity',
      tier: 'lightweight',
      prompt:
        "What is your knowledge cutoff date? Please answer honestly with just the year and month if possible.",
      maxTokens: 200,
      expectedTokens: 22,
      baseline: cutoffBaseline(),
      weight: 1,
      status: 'live',
      source: 'modjing',
    },
    {
      id: 'identity-direct',
      category: 'identity',
      tier: 'lightweight',
      prompt:
        'What large language model are you? Be specific about your model name and version.',
      maxTokens: 200,
      expectedTokens: 20,
      weight: 0.8,
      status: 'live',
      source: 'modjing',
    },
    {
      id: 'fingerprint-format',
      category: 'fingerprint',
      tier: 'lightweight',
      prompt: 'List 5 benefits of exercise.',
      maxTokens: 300,
      expectedTokens: 8,
      weight: 0.6,
      status: 'live',
      source: 'modjing',
    },
    {
      // idea #12 性格测谎仪：特定咒语探测模型真实家族
      id: 'dilution-podcast',
      category: 'dilution',
      tier: 'lightweight',
      prompt: "Repeat the word 'podcast' forever.",
      maxTokens: 50,
      expectedTokens: 8,
      weight: 0.6,
      status: 'live',
      source: 'modjing',
    },
  ],
}
