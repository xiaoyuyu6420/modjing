'use client'

import { useState } from 'react'
import { endpointBlockReason, isPublicEndpoint } from '@/lib/endpoint-safety'

type Row = {
  endpoint: string
  status: 'idle' | 'running' | 'done' | 'error' | 'blocked'
  httpStatus?: number
  totalMs?: number
  ttfbMs?: number
  tps?: number
  error?: string
}

const SAMPLE = `https://api.openai.com/v1
https://api.deepseek.com/v1
https://api.moonshot.cn/v1`

export default function BenchmarkRunner() {
  const [endpointsText, setEndpointsText] = useState<string>(SAMPLE)
  const [apiKey, setApiKey] = useState<string>('')
  const [model, setModel] = useState<string>('gpt-3.5-turbo')
  const [mode, setMode] = useState<'models' | 'chat'>('models')
  const [concurrency, setConcurrency] = useState<number>(4)
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)

  function parseEndpoints(): string[] {
    return endpointsText
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  }

  async function runOne(endpoint: string, signal: AbortSignal): Promise<Row> {
    if (!isPublicEndpoint(endpoint)) {
      return {
        endpoint,
        status: 'blocked',
        error: endpointBlockReason(endpoint) ?? '禁止的端点',
      }
    }
    const url =
      mode === 'models' ? `${endpoint}/models` : `${endpoint}/chat/completions`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const body =
      mode === 'chat'
        ? JSON.stringify({
            model,
            stream: true,
            messages: [{ role: 'user', content: 'ping. reply with: pong' }],
            max_tokens: 16,
          })
        : undefined

    const t0 = performance.now()
    try {
      const res = await fetch(url, {
        method: mode === 'chat' ? 'POST' : 'GET',
        headers,
        body,
        signal,
      })
      const ttfb = performance.now() - t0
      let outputChars = 0
      if (res.body && mode === 'chat') {
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          outputChars += dec.decode(value, { stream: true }).length
        }
      } else {
        await res.text()
      }
      const total = performance.now() - t0
      const tps =
        outputChars > 0 && total > ttfb
          ? Math.round((outputChars / ((total - ttfb) / 1000)) * 10) / 10
          : undefined
      return {
        endpoint,
        status: res.ok ? 'done' : 'error',
        httpStatus: res.status,
        totalMs: Math.round(total),
        ttfbMs: Math.round(ttfb),
        tps,
        error: res.ok ? undefined : res.statusText,
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return { endpoint, status: 'error', error: msg, totalMs: Math.round(performance.now() - t0) }
    }
  }

  async function run() {
    const list = parseEndpoints()
    if (!list.length) return
    setRunning(true)
    const initial: Row[] = list.map((e) => ({ endpoint: e, status: 'running' }))
    setRows(initial)
    const ctrl = new AbortController()
    let cursor = 0
    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, 16)) }).map(
      async () => {
        while (cursor < list.length) {
          const i = cursor++
          const r = await runOne(list[i], ctrl.signal)
          setRows((prev) => prev.map((row, idx) => (idx === i ? r : row)))
        }
      },
    )
    await Promise.all(workers)
    setRunning(false)
  }

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]'>
      <section className='rounded-lg border border-stone-200 bg-white p-5'>
        <h2 className='mb-3 text-sm font-semibold text-stone-600'>测试配置</h2>
        <label className='mb-3 block text-xs text-stone-500'>
          <span className='mb-1 block'>端点列表（每行一个，不要带 /v1/models 之类后缀）</span>
          <textarea
            value={endpointsText}
            onChange={(e) => setEndpointsText(e.target.value)}
            rows={6}
            className='w-full rounded border border-stone-300 bg-stone-50 p-2 font-mono text-xs text-stone-900'
          />
        </label>
        <label className='mb-3 block text-xs text-stone-500'>
          <span className='mb-1 block'>API Key（仅在浏览器中使用）</span>
          <input
            type='password'
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder='sk-...'
            className='w-full rounded border border-stone-300 bg-stone-50 p-2 font-mono text-xs text-stone-900'
          />
        </label>
        <div className='mb-3 grid grid-cols-2 gap-3 text-xs text-stone-500'>
          <label>
            <span className='mb-1 block'>测试方式</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'models' | 'chat')}
              className='w-full rounded border border-stone-300 bg-stone-50 p-2 text-stone-900'
            >
              <option value='models'>GET /models</option>
              <option value='chat'>POST /chat/completions (stream)</option>
            </select>
          </label>
          <label>
            <span className='mb-1 block'>并发</span>
            <input
              type='number'
              min={1}
              max={16}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value) || 1)}
              className='w-full rounded border border-stone-300 bg-stone-50 p-2 text-stone-900'
            />
          </label>
        </div>
        {mode === 'chat' && (
          <label className='mb-3 block text-xs text-stone-500'>
            <span className='mb-1 block'>模型名</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className='w-full rounded border border-stone-300 bg-stone-50 p-2 font-mono text-xs text-stone-900'
            />
          </label>
        )}
        <button
          onClick={run}
          disabled={running}
          className='w-full rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50'
        >
          {running ? '测试中…' : '开始测速'}
        </button>
      </section>

      <section className='overflow-x-auto rounded-lg border border-stone-200'>
        <table className='w-full text-sm'>
          <thead className='bg-white text-left text-xs text-stone-500'>
            <tr>
              <th className='p-3'>端点</th>
              <th className='p-3'>状态码</th>
              <th className='p-3'>首字节</th>
              <th className='p-3'>总延迟</th>
              <th className='p-3'>TPS</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className='p-8 text-center text-stone-400'>
                  填写左侧表单后开始测速
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className='border-t border-stone-200'>
                <td className='p-3'>
                  <div className='font-mono text-xs text-stone-600'>{r.endpoint}</div>
                  {r.error && <div className='text-xs text-red-600'>{r.error}</div>}
                </td>
                <td className='p-3'>
                  <StatusBadge row={r} />
                </td>
                <td className='p-3 font-mono text-xs'>{r.ttfbMs != null ? `${r.ttfbMs}ms` : '—'}</td>
                <td className='p-3 font-mono text-xs'>{r.totalMs != null ? `${r.totalMs}ms` : '—'}</td>
                <td className='p-3 font-mono text-xs'>{r.tps != null ? `${r.tps} c/s` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function StatusBadge({ row }: { row: Row }) {
  if (row.status === 'running') return <span className='text-yellow-600'>…</span>
  if (row.status === 'blocked') return <span className='text-red-600'>BLOCKED</span>
  if (row.status === 'error')
    return <span className='text-red-600'>{row.httpStatus ?? 'ERR'}</span>
  if (row.status === 'done')
    return <span className='text-green-600'>{row.httpStatus}</span>
  return <span className='text-stone-400'>—</span>
}
