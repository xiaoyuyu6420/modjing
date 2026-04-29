export default function TermsPage() {
  return (
    <div className='max-w-3xl mx-auto px-4 py-10 space-y-8'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-bold'>用户协议</h1>
        <p className='text-sm text-stone-400'>最后更新：2026 年 06 月 16 日</p>
      </header>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>1. 服务范围</h2>
        <p className='text-stone-600'>
          模镜（modjing.com）是一个面向大模型 API 中转站的第三方评测平台。我们只做裁判，不做运动员
          — 不直接销售 API 服务，也不为任何站点担保。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>2. 用户责任</h2>
        <p className='text-stone-600'>
          使用模镜的评测信息进行选型决策时，请结合自己的实测验证。任何因依赖本站信息造成的损失由用户自行承担。
          请勿利用本站发起任何对第三方站点的恶意行为。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>3. 评分免责</h2>
        <p className='text-stone-600'>
          所有评分、排名、价格、健康度数据均基于公开探针采集，存在采样时间差、网络波动、模型更新等不确定性。
          评分仅供参考，不构成任何商业建议。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>4. 数据来源</h2>
        <p className='text-stone-600'>
          模镜的数据由两部分构成：（a）自有探针采集；（b）通过 hvoy.ai 公开 API 获取的对照数据。
          我们对 hvoy.ai 表示感谢，但本站立场与 hvoy.ai 无关。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>5. 知识产权</h2>
        <p className='text-stone-600'>
          本站原创内容（评测方法论、评分算法、文案）采用 CC BY 4.0 协议。引用请注明出处。
          各中转站的 logo、品牌名归各自所有者。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>6. 责任限制</h2>
        <p className='text-stone-600'>
          在适用法律允许的最大范围内，模镜对用户的累计责任以
          <span className='text-yellow-600 mx-1'>人民币 100 元</span>
          为限。本站不对任何间接、偶然、惩罚性损失负责。
        </p>
      </section>

      <section className='space-y-3'>
        <h2 className='text-xl font-bold'>7. 协议更新</h2>
        <p className='text-stone-600'>
          本协议可能随服务演进更新。重大变更会在首页公告 7 天。继续使用即视为接受新协议。
        </p>
      </section>
    </div>
  )
}
