'use client'

import { useState } from 'react'

const BUDGET_OPTIONS = ['0 - 1k / 月', '1k - 10k / 月', '10k+ / 月', '暂不确定']
const CONCURRENCY_OPTIONS = ['< 100 QPS', '100 - 1k QPS', '1k+ QPS', '暂不确定']
const COMPLIANCE_TAGS = ['正规发票', '等保 2.0', '等保 3.0', 'ISO 27001', '数据本地化', '签合同']

export default function ConsultPage() {
  const [scenario, setScenario] = useState('')
  const [budget, setBudget] = useState(BUDGET_OPTIONS[0])
  const [concurrency, setConcurrency] = useState(CONCURRENCY_OPTIONS[0])
  const [tech, setTech] = useState('')
  const [compliance, setCompliance] = useState<string[]>([])
  const [contact, setContact] = useState('')

  const toggleCompliance = (tag: string) =>
    setCompliance((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('已收到，请扫码加微信继续沟通')
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-10 space-y-8'>
      <header className='space-y-3'>
        <h1 className='text-3xl font-bold'>企业选型咨询</h1>
        <p className='text-gray-400'>
          填写下面的表单，扫码加微信深入沟通。我们会根据你的业务场景推荐 3 - 5 家适合的中转站。
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className='bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-5'
      >
        <div>
          <label className='block text-sm text-gray-300 mb-2'>业务场景</label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder='例：电商客服机器人，月调用约 500 万次，需要支持流式输出'
            rows={3}
            className='w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div className='grid sm:grid-cols-2 gap-5'>
          <div>
            <label className='block text-sm text-gray-300 mb-2'>预算范围</label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className='w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-sm'
            >
              {BUDGET_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm text-gray-300 mb-2'>并发需求</label>
            <select
              value={concurrency}
              onChange={(e) => setConcurrency(e.target.value)}
              className='w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-sm'
            >
              {CONCURRENCY_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className='block text-sm text-gray-300 mb-2'>技术要求</label>
          <textarea
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            placeholder='例：需要 Claude Opus 4.8 原生通道，function calling 必须可用'
            rows={3}
            className='w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm text-gray-300 mb-2'>合规要求</label>
          <div className='flex flex-wrap gap-2'>
            {COMPLIANCE_TAGS.map((tag) => (
              <label
                key={tag}
                className={`px-3 py-1.5 text-xs rounded border cursor-pointer ${
                  compliance.includes(tag)
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-950 border-gray-700 text-gray-300'
                }`}
              >
                <input
                  type='checkbox'
                  className='hidden'
                  checked={compliance.includes(tag)}
                  onChange={() => toggleCompliance(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className='block text-sm text-gray-300 mb-2'>联系方式</label>
          <input
            type='text'
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder='邮箱 / 微信号 / 手机号'
            className='w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <button
          type='submit'
          className='w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors'
        >
          提交咨询
        </button>
      </form>

      <div className='bg-gray-900 border border-gray-800 rounded-lg p-6 text-center space-y-4'>
        <div className='text-gray-300'>↓ 或扫码直接联系</div>
        <div className='w-48 h-48 bg-gray-800 flex items-center justify-center mx-auto text-gray-500 text-sm rounded'>
          微信二维码 placeholder
        </div>
        <p className='text-xs text-gray-500'>工作时间一般 24 小时内回复</p>
      </div>
    </div>
  )
}
