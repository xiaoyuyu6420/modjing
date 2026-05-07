import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PLANS = [
  {
    platform: 'GPT Plus（土区）',
    price: '¥80 / 月',
    models: 'GPT-5.5 / GPT-5.4 / gpt-image-2',
    pros: '性价比高，能跑出 $400 token 等值用量',
    cons: '需要土区 Apple ID，订阅链路复杂',
  },
  {
    platform: 'Claude Pro / Max',
    price: '$20 - 200 / 月',
    models: 'Claude Opus / Sonnet / Haiku',
    pros: '代码质量最强，Max 套餐配额慷慨',
    cons: '价格高，国内访问需要中转',
  },
  {
    platform: 'Codex Plus',
    price: '$20 / 月',
    models: 'GPT-5.5 Codex',
    pros: '编程专用，IDE 集成丝滑',
    cons: '仅限编程场景，通用对话受限',
  },
  {
    platform: 'Gemini Advanced',
    price: '$20 / 月',
    models: 'Gemini 3.1 Pro',
    pros: '多模态强，2M context 王者',
    cons: '中国大陆访问难，付款门槛高',
  },
  {
    platform: '智谱 AI Pro',
    price: '¥200 / 月',
    models: 'GLM-5.1',
    pros: '国产合规，发票/合同齐全',
    cons: '推理在国内，国际化场景不适用',
  },
  {
    platform: 'MiniMax Starter',
    price: '¥99 / 月',
    models: 'MiniMax-M2.7',
    pros: '价格亲民，语音合成强',
    cons: '模型综合能力一般',
  },
  {
    platform: '阿里云百炼',
    price: '按量付费',
    models: 'Qwen3.6-max',
    pros: '企业级稳定，配额可申请',
    cons: '没有订阅套餐，重度用户成本高',
  },
]

const RECOMMENDATIONS = [
  { tag: '学生 / 低频用户', plan: 'GPT Plus 土区', reason: '¥80/月跑出 $20 等值，性价比天花板' },
  { tag: '重度编程', plan: 'Claude Pro / Max', reason: '代码质量领先，Cursor / Cline 必配' },
  { tag: '国内企业合规', plan: '智谱 Pro / 百炼', reason: '发票、合同、等保一站式' },
  { tag: '多模态创作', plan: 'Gemini Advanced', reason: '2M context + 视频理解' },
  { tag: '快速试错', plan: '中转站按量付费', reason: '套餐绑死风险高，先看 /sites' },
]

async function getRelayPrices() {
  const rows = await prisma.siteModelPrice.findMany({
    where: {
      modelName: {
        startsWith: 'gpt-5.5',
      },
    },
    select: {
      price: true,
      priceOutput: true,
      multiplier: true,
    },
    take: 100,
  })

  const eff = rows.map((r) => ({
    in: r.price * (r.multiplier || 1),
    out: (r.priceOutput || 0) * (r.multiplier || 1),
  })).filter((r) => r.in > 0)

  if (eff.length === 0) return null

  const avgIn = eff.reduce((s, r) => s + r.in, 0) / eff.length
  const avgOut = eff.reduce((s, r) => s + r.out, 0) / eff.length
  const minIn = Math.min(...eff.map((r) => r.in))
  const minOut = Math.min(...eff.filter((r) => r.out > 0).map((r) => r.out))

  return { avgIn, avgOut, minIn, minOut: minOut > 0 ? minOut : null, count: eff.length }
}

export default async function PlansPage() {
  const relay = await getRelayPrices()

  return (
    <div className='max-w-6xl mx-auto px-4 py-10 space-y-10'>
      <header className='space-y-3'>
        <h1 className='text-3xl font-bold'>Coding Plan 对比</h1>
        <p className='text-stone-500'>
          官方订阅套餐横向对比 — 帮你决定是买 Plus、买 Pro、还是直接走中转站按量付费。
        </p>
        <p className='text-xs text-stone-400'>
          数据更新于 2026/06，参考 awesome-coding-plan，价格以官方为准。
        </p>
      </header>

      <section className='bg-white border border-stone-200 rounded-lg overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='bg-stone-100 text-stone-600'>
            <tr>
              <th className='text-left px-4 py-3'>平台 / 套餐</th>
              <th className='text-left px-4 py-3'>价格</th>
              <th className='text-left px-4 py-3'>提供模型</th>
              <th className='text-left px-4 py-3 text-green-600'>优点</th>
              <th className='text-left px-4 py-3 text-red-600'>缺点</th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((p) => (
              <tr key={p.platform} className='border-t border-stone-200 hover:bg-white'>
                <td className='px-4 py-3 font-medium text-stone-900'>{p.platform}</td>
                <td className='px-4 py-3 text-brand-600 whitespace-nowrap'>{p.price}</td>
                <td className='px-4 py-3 text-stone-600'>{p.models}</td>
                <td className='px-4 py-3 text-stone-500'>{p.pros}</td>
                <td className='px-4 py-3 text-stone-400'>{p.cons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {relay && (
        <section className='bg-stone-50 border border-stone-200 rounded-lg p-5'>
          <h2 className='text-lg font-bold text-stone-900 mb-3'>中转站按量付费参考 — GPT-5.5</h2>
          <p className='text-sm text-stone-500 mb-4'>
            基于模镜收录的 {relay.count} 个中转站渠道的真实价格。注意：输出价通常比输入价高 5-10 倍，实际成本取决于你的输入输出比例。
          </p>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <div className='bg-white border border-stone-200 rounded-lg p-4'>
              <div className='text-xs text-stone-500'>最低输入价</div>
              <div className='text-xl font-bold text-brand-600 mt-1'>¥{relay.minIn.toFixed(2)}</div>
              <div className='text-[10px] text-stone-400'>/ 1M tokens</div>
            </div>
            <div className='bg-white border border-stone-200 rounded-lg p-4'>
              <div className='text-xs text-stone-500'>最低输出价</div>
              <div className='text-xl font-bold text-brand-600 mt-1'>
                {relay.minOut ? `¥${relay.minOut.toFixed(2)}` : '-'}
              </div>
              <div className='text-[10px] text-stone-400'>/ 1M tokens</div>
            </div>
            <div className='bg-white border border-stone-200 rounded-lg p-4'>
              <div className='text-xs text-stone-500'>平均输入价</div>
              <div className='text-xl font-bold text-stone-900 mt-1'>¥{relay.avgIn.toFixed(2)}</div>
              <div className='text-[10px] text-stone-400'>/ 1M tokens</div>
            </div>
            <div className='bg-white border border-stone-200 rounded-lg p-4'>
              <div className='text-xs text-stone-500'>平均输出价</div>
              <div className='text-xl font-bold text-stone-900 mt-1'>¥{relay.avgOut.toFixed(2)}</div>
              <div className='text-[10px] text-stone-400'>/ 1M tokens</div>
            </div>
          </div>
          <div className='mt-4'>
            <Link href='/sites' className='text-sm text-brand-600 hover:text-brand-700 font-medium'>
              查看所有中转站价格 →
            </Link>
          </div>
        </section>
      )}

      <section className='space-y-4'>
        <h2 className='text-2xl font-bold'>适合谁</h2>
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {RECOMMENDATIONS.map((r) => (
            <div
              key={r.tag}
              className='bg-white border border-stone-200 rounded-lg p-4 space-y-2'
            >
              <div className='text-xs text-brand-600 font-medium'>{r.tag}</div>
              <div className='text-lg font-bold text-stone-900'>→ {r.plan}</div>
              <p className='text-sm text-stone-500'>{r.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='bg-brand-50 border border-brand-200 rounded-lg p-5 text-sm text-brand-700'>
        <div className='font-bold mb-2'>什么时候应该走中转站而不是官方订阅？</div>
        <ul className='list-disc list-inside space-y-1 text-brand-700'>
          <li>需要多个模型混用（Claude + GPT + Gemini）— 中转站一个 Key 跑全部</li>
          <li>国内无法支付外币 — 中转站直接微信/支付宝</li>
          <li>需要发票合同 — 套餐订阅通常不开票</li>
          <li>使用量低于 $20/月 — 按量更划算</li>
        </ul>
      </section>
    </div>
  )
}
