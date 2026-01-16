import { test, expect } from '@playwright/test'

const STATIC_PAGES = [
  { path: '/free', name: '公益站', keywords: ['公益', '免费'] },
  { path: '/enterprise', name: '企业合规', keywords: ['企业', '合规', '发票'] },
  { path: '/benchmark', name: '批量测速', keywords: ['测速', '端点'] },
  { path: '/codex-radar', name: 'Codex雷达', keywords: ['Codex', '窗口'] },
  { path: '/rp', name: 'RP专区', keywords: ['RP', '角色扮演'] },
  { path: '/notices', name: '站点公告', keywords: ['公告', '聚合'] },
  { path: '/plans', name: '套餐对比', keywords: ['套餐', '对比', 'Plan'] },
  { path: '/methodology', name: '方法论', keywords: ['方法', '探针', '权重'] },
]

for (const page of STATIC_PAGES) {
  test(`${page.name} 页面加载`, async ({ page: p }) => {
    await p.goto(page.path)
    await p.waitForLoadState('networkidle')

    await expect(p.locator('body')).toBeVisible()

    // 至少匹配一个关键词
    const hasKeyword = await Promise.all(
      page.keywords.map(k => p.locator(`text=${k}`).first().isVisible().catch(() => false))
    )
    expect(hasKeyword.some(Boolean)).toBe(true)
  })
}