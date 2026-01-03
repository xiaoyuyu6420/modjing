import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sites = [
  {
    name: 'YunWu API',
    url: 'https://yunwu.ai',
    description: '老牌中转站，覆盖 OpenAI / Claude / Gemini，价格中等偏上但稳定性口碑较好',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信,USDT',
    hasInvoice: true,
  },
  {
    name: 'PackyAPI',
    url: 'https://packyapi.com',
    description: '主打 Claude 中转，开发者群体使用较多',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信',
    hasInvoice: false,
  },
  {
    name: 'AiPaiBox',
    url: 'https://api.aipaibox.com',
    description: 'OpenAI / Claude 双线，按 token 计费',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信,USDT',
    hasInvoice: false,
  },
  {
    name: 'TimeBackward',
    url: 'https://api.timebackward.com',
    description: '小众站，支持多协议透传',
    isFree: false,
    status: 'unstable',
    paymentMethods: '支付宝,USDT',
    hasInvoice: false,
  },
  {
    name: 'MnAPI',
    url: 'https://www.mnapi.com',
    description: '主流多模型聚合中转',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信,Stripe',
    hasInvoice: true,
  },
  {
    name: 'GPT.GE',
    url: 'https://api.gpt.ge',
    description: '老牌中转，覆盖模型广',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信',
    hasInvoice: false,
  },
  {
    name: 'AIOEC',
    url: 'https://api.aioec.tech',
    description: '支持 OpenAI 兼容协议',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信,USDT',
    hasInvoice: false,
  },
  {
    name: 'FreeKey 公益站',
    url: 'https://api.freekey.site',
    description: '免费 Key 公益站，限速使用',
    isFree: true,
    status: 'unstable',
    paymentMethods: '',
    hasInvoice: false,
  },
  {
    name: '88Code',
    url: 'https://www.88code.org',
    description: '主打 Claude Code 路线的中转',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信',
    hasInvoice: false,
  },
  {
    name: 'X666',
    url: 'https://x666.me',
    description: '小众低价站，价格异常需注意掺水风险',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,USDT',
    hasInvoice: false,
  },
  {
    name: 'ChatFire',
    url: 'https://api.chatfire.cn',
    description: '国内合规备案站',
    isFree: false,
    status: 'online',
    paymentMethods: '支付宝,微信',
    hasInvoice: true,
  },
  {
    name: 'B4U 公益',
    url: 'https://b4u.qzz.io',
    description: '社区维护的公益接力站',
    isFree: true,
    status: 'unstable',
    paymentMethods: '',
    hasInvoice: false,
  },
]

const models = [
  { name: 'gpt-4o', basePrice: 18, range: [10, 28] },
  { name: 'gpt-4o-mini', basePrice: 1.2, range: [0.6, 2.0] },
  { name: 'claude-sonnet-4', basePrice: 22, range: [12, 35] },
  { name: 'claude-haiku-4-5', basePrice: 6, range: [3, 10] },
  { name: 'gemini-2.5-pro', basePrice: 14, range: [8, 22] },
  { name: 'deepseek-v3', basePrice: 1.5, range: [0.8, 3] },
]

const afterSalesOptions = ['none', 'verify_once', 'days_30', 'lifetime']

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPrice(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

async function main() {
  console.log('清空旧数据...')
  await prisma.priceHistory.deleteMany()
  await prisma.healthCheck.deleteMany()
  await prisma.review.deleteMany()
  await prisma.siteModelPrice.deleteMany()
  await prisma.site.deleteMany()

  console.log(`录入 ${sites.length} 个站点...`)
  for (const s of sites) {
    const site = await prisma.site.create({ data: s })

    const modelSubset = models.filter(() => Math.random() > 0.2)
    for (const m of modelSubset) {
      const [low, high] = m.range
      const price = site.isFree ? 0 : randomPrice(low, high)
      const isAnomaly = !site.isFree && price < m.basePrice * 0.5
      const isTampered = site.name === 'X666' && m.name === 'gpt-4o'

      const smp = await prisma.siteModelPrice.create({
        data: {
          siteId: site.id,
          modelName: m.name,
          price,
          multiplier: Number((price / m.basePrice).toFixed(2)),
          afterSales: site.isFree ? 'none' : pickRandom(afterSalesOptions),
          priceAnomaly: isAnomaly,
          tampered: isTampered,
          detectedModel: isTampered ? 'gpt-3.5-turbo' : null,
        },
      })

      const history = Array.from({ length: 5 }, (_, i) => ({
        siteModelPriceId: smp.id,
        price: Number((price * (1 + (Math.random() - 0.5) * 0.2)).toFixed(2)),
        recordedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
      }))
      await prisma.priceHistory.createMany({ data: history })
    }

    const checks = Array.from({ length: 8 }, (_, i) => {
      const latency = site.status === 'online'
        ? Math.floor(Math.random() * 400 + 100)
        : Math.floor(Math.random() * 2000 + 500)
      const status = latency < 500 ? 'ok' : latency < 1500 ? 'slow' : 'timeout'
      return {
        siteId: site.id,
        latency,
        status,
        checkedAt: new Date(Date.now() - (8 - i) * 3 * 60 * 60 * 1000),
      }
    })
    await prisma.healthCheck.createMany({ data: checks })

    if (Math.random() > 0.4) {
      await prisma.review.create({
        data: {
          siteId: site.id,
          author: pickRandom(['老王', '匿名用户', '阿凯', '小赵', '李工']),
          content: pickRandom([
            '价格合适，三个月没掉过链子',
            '前阵子掉过包，沟通后退款了',
            '速度挺快的，Claude 系列尤其稳',
            '便宜是便宜，但偶尔慢',
            '客服响应及时',
          ]),
          rating: Math.floor(Math.random() * 3) + 3,
        },
      })
    }
  }

  const siteCount = await prisma.site.count()
  const priceCount = await prisma.siteModelPrice.count()
  console.log(`完成：${siteCount} 个站点，${priceCount} 条价格记录`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
