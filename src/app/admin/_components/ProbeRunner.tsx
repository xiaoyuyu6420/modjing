'use client'

import { useState } from 'react'

type ProbeDetail = {
  check: string
  passed: boolean
  message: string
}

type ProbeResult = {
  ok: boolean
  score: number
  verdict: string
  tokenUsageRatio: number | null
  latencyMs: number | null
  details: ProbeDetail[]
  error?: string
}

const verdictStyle: Record<string, string> = {
  LEGITIMATE: 'border-brand-200 bg-brand-50 text-brand-700',
  SUSPICIOUS: 'border-amber-200 bg-amber-50 text-amber-700',
  FRAUD_DETECTED: 'border-red-200 bg-red-50 text-red-600',
  INCONCLUSIVE: 'border-stone-200 bg-stone-50 text-stone-600',
}

const verdictLabel: Record<string, string> = {
  LEGITIMATE: '正常',
  SUSPICIOUS: '可疑',
  FRAUD_DETECTED: '掺水',
  INCONCLUSIVE: ' inconclusive',
}

export default function ProbeRunner({
  siteModelPriceId,
  defaultModel,
}: {
  siteModelPriceId: number
  defaultModel: string
}) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProbeResult | null>(null)

  async function runProbe() {
    if (!apiKey.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteModelPriceId, apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({
        ok: false,
        score: 0,
        verdict: 'INCONCLUSIVE',
        tokenUsageRatio: null,
        latencyMs: null,
        details: [],
        error: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mj-card p-5 space-y-3'>
      <div>
        <h3 className='text-sm font-semibold text-stone-900'>模镜探针检测</h3>
        <p className='text-xs text-stone-500 mt-1'>
          输入该渠道的 API Key，模镜会发一条探针请求检测是否掺水。Key 仅用于本次检测，不存储。
        </p>
      </div>

      <div className='flex gap-2'>
        <input
          type='password'
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder='sk-...'
          className='mj-input flex-1 font-mono text-xs'
        />
        <button
          onClick={runProbe}
          disabled={loading || !apiKey.trim()}
          className='mj-btn-primary whitespace-nowrap'
        >
          {loading ? '检测中...' : '运行探针'}
        </button>
      </div>

      {result && (
        <div className='border-t border-stone-100 pt-3 space-y-2'>
          {result.error ? (
            <p className='text-sm text-red-600'>错误：{result.error}</p>
          ) : (
            <>
              <div className='flex items-center gap-3 flex-wrap'>
                <span className={`mj-badge ${verdictStyle[result.verdict] ?? ''}`}>
                  {verdictLabel[result.verdict] ?? result.verdict}
                </span>
                <span className='text-sm mj-mono text-stone-700'>评分 {result.score}/100</span>
                {result.latencyMs != null && (
                  <span className='text-xs text-stone-400 mj-mono'>延迟 {result.latencyMs}ms</span>
                )}
                {result.tokenUsageRatio != null && (
                  <span className='text-xs text-stone-400 mj-mono'>
                    token ratio {result.tokenUsageRatio.toFixed(2)}
                  </span>
                )}
              </div>

              <div className='space-y-1.5'>
                {result.details.map((d, i) => (
                  <div key={i} className='flex items-start gap-2 text-xs'>
                    <span className={d.passed ? 'text-brand-600' : 'text-red-500'}>
                      {d.passed ? '✓' : '✗'}
                    </span>
                    <div>
                      <span className='font-medium text-stone-700'>{d.check}</span>
                      <span className='text-stone-500 ml-1'>{d.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <p className='text-[10px] text-stone-400'>
        检测目标模型：<code className='mj-mono'>{defaultModel}</code>
      </p>
    </div>
  )
}
