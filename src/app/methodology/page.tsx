import Link from 'next/link'
import { publicPoolData } from '@/lib/probe-pool/public-pool'

// 从公开 representative 池按 category 分组（methodology 页数据来源，非 live 探针）
const pool = publicPoolData
const IDENTITY_ENTRIES = pool.entries.filter((e) => e.category === 'identity')
const CAPABILITY_ENTRIES = pool.entries.filter((e) => e.category === 'capability')
const FINGERPRINT_ENTRIES = pool.entries.filter((e) => e.category === 'fingerprint')

const FINGERPRINT_DIMS = [
  {
    name: 'Style 风格',
    desc: '分析响应中的句长分布、段落密度、emoji 使用频率、markdown 用法。不同模型有显著差异：Claude 倾向长段落，GPT 倾向短列表，DeepSeek 倾向 emoji。',
  },
  {
    name: 'Vocabulary 词汇',
    desc: '统计高频词、特征短语（"Certainly!" / "I\'d be happy to" / "当然"）和拒答模板。每个模型有独特的"口头禅"。',
  },
  {
    name: 'Structure 结构',
    desc: '检测响应的组织方式：标题层级、列表 vs 段落、是否带 TL;DR、是否带免责声明。',
  },
  {
    name: 'Metadata 元数据',
    desc: '提取响应中暴露的版本号、训练截止日期、自称组织名等元信息，与已知模型档案比对。',
  },
]

const WEIGHTS = [
  { key: 'W1', name: '通过率 passRate', value: 0.35, desc: '探针成功识别的比例' },
  { key: 'W2', name: '在线率 onlineRate', value: 0.25, desc: '健康检查在线时长占比' },
  { key: 'W3', name: '延迟惩罚 latencyPenalty', value: 0.15, desc: '平均响应时间超过 3s 起罚' },
  { key: 'W4', name: '价格波动 priceVolatilityPenalty', value: 0.1, desc: '近 30 天价格标准差' },
  { key: 'W5', name: '合规加成 complianceBonus', value: 0.15, desc: '等保/数据本地化等加分' },
]

export default function MethodologyPage() {
  return (
    <div className='max-w-4xl mx-auto px-4 py-10 space-y-12'>
      <header className='space-y-4'>
        <h1 className='text-3xl font-bold'>方法论 · 完全公开</h1>
        <p className='text-stone-600 text-lg'>
          模镜的所有评测算法、探针 prompt 范例、评分公式与默认权重全部公开。欢迎{' '}
          <span className='text-brand-600'>复现 / 质疑 / 提 PR</span>。
        </p>
        <div className='bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-700'>
          这是模镜与其他评测平台最大的区别：我们认为评测的可信度来自透明，不是来自权威。
        </div>
      </header>

      <section className='space-y-6'>
        <h2 className='text-2xl font-bold'>一、公开 Representative Prompt（{pool.entries.length} 道）</h2>
        <p className='text-stone-500 text-sm'>
          以下 prompt 为公开范例（representative），用于展示方法论。实际 live 探针 prompt
          在服务端私有池中定期轮换，不公开（spec §6.1）。
        </p>

        <div className='space-y-4'>
          <div>
            <h3 className='text-lg font-bold text-green-600 mb-2'>
              身份探针 Identity ({IDENTITY_ENTRIES.length} 道)
            </h3>
            <p className='text-xs text-stone-400 mb-3'>
              直接 + 间接 + 元推理，绕过 system prompt 伪装。
            </p>
            <ol className='space-y-2 text-sm'>
              {IDENTITY_ENTRIES.map((e, i) => (
                <li key={e.id} className='bg-white border border-stone-200 rounded p-3'>
                  <span className='text-stone-400 mr-2'>{i + 1}.</span>
                  <span className='text-stone-800'>{e.prompt}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className='text-lg font-bold text-yellow-600 mb-2'>
              能力探针 Capability ({CAPABILITY_ENTRIES.length} 道)
            </h3>
            <p className='text-xs text-stone-400 mb-3'>
              代码、数学、翻译、结构化输出 — 不同模型表现差异显著。
            </p>
            <ol className='space-y-2 text-sm'>
              {CAPABILITY_ENTRIES.map((e, i) => (
                <li key={e.id} className='bg-white border border-stone-200 rounded p-3'>
                  <span className='text-stone-400 mr-2'>{i + 1}.</span>
                  <span className='text-stone-800'>{e.prompt}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className='text-lg font-bold text-purple-600 mb-2'>
              指纹探针 Fingerprint ({FINGERPRINT_ENTRIES.length} 道)
            </h3>
            <p className='text-xs text-stone-400 mb-3'>
              统计而非内容判定 — 通过格式、冗长度、风格揭示真实身份。
            </p>
            <ol className='space-y-2 text-sm'>
              {FINGERPRINT_ENTRIES.map((e, i) => (
                <li key={e.id} className='bg-white border border-stone-200 rounded p-3'>
                  <span className='text-stone-400 mr-2'>{i + 1}.</span>
                  <span className='text-stone-800'>{e.prompt}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className='space-y-4'>
        <h2 className='text-2xl font-bold'>二、4 维统计指纹</h2>
        <div className='grid sm:grid-cols-2 gap-4'>
          {FINGERPRINT_DIMS.map((d) => (
            <div key={d.name} className='bg-white border border-stone-200 rounded-lg p-4'>
              <div className='font-bold text-stone-900 mb-2'>{d.name}</div>
              <p className='text-sm text-stone-500'>{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='space-y-4'>
        <h2 className='text-2xl font-bold'>三、综合评分公式</h2>
        <pre className='bg-white border border-stone-200 rounded-lg p-4 text-sm text-stone-800 overflow-x-auto'>
{`score = passRate              × W1   (通过率)
      + onlineRate            × W2   (在线率)
      − latencyPenalty        × W3   (延迟惩罚)
      − priceVolatilityPenalty × W4   (价格波动惩罚)
      + complianceBonus       × W5   (合规加成)

score ∈ [0, 1] 后映射到 0 - 100 展示`}
        </pre>

        <h3 className='text-lg font-bold mt-6'>默认权重</h3>
        <div className='bg-white border border-stone-200 rounded-lg overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-stone-100 text-stone-500'>
              <tr>
                <th className='text-left px-4 py-2'>键</th>
                <th className='text-left px-4 py-2'>维度</th>
                <th className='text-left px-4 py-2'>默认值</th>
                <th className='text-left px-4 py-2'>说明</th>
              </tr>
            </thead>
            <tbody>
              {WEIGHTS.map((w) => (
                <tr key={w.key} className='border-t border-stone-200'>
                  <td className='px-4 py-2 font-mono text-brand-600'>{w.key}</td>
                  <td className='px-4 py-2'>{w.name}</td>
                  <td className='px-4 py-2 text-green-600'>{w.value}</td>
                  <td className='px-4 py-2 text-stone-500'>{w.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800'>
          权重不是绝对的。在{' '}
          <Link href='/enterprise' className='underline text-yellow-800'>
            /enterprise
          </Link>{' '}
          页，企业用户可以拖滑块调整 5 个权重，实时重排所有站点 — 因为合规客户和个人玩家的关注点本就不同。
        </div>
      </section>

      <section className='space-y-4'>
        <h2 className='text-2xl font-bold'>四、池轮换机制</h2>
        <p className='text-stone-600'>
          实际 live 探针 prompt 池在服务端维护，每 ~2 周通过人工 PR 轮换（退役 → 公开 / 新增 → 现役），
          防止运营商针对性规避。本页展示的仅为 representative 范例，非当前现役 prompt。
        </p>
      </section>

      <section className='space-y-4'>
        <h2 className='text-2xl font-bold'>五、开源</h2>
        <p className='text-stone-600'>
          探针引擎、评分算法、本站源代码计划全部开源在 GitHub。
        </p>
        <p className='text-stone-400 text-sm'>
          github.com/modjing — 敬请期待。在此之前，本页面就是 source of truth。
        </p>
      </section>
    </div>
  )
}
