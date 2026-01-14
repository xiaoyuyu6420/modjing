import { test, expect } from '@playwright/test'

const INFO_PAGES = [
  { path: '/consult', name: '选型咨询', keywords: ['咨询', '表单', '场景'] },
  { path: '/contact', name: '联系我们', keywords: ['联系', '邮箱'] },
  { path: '/terms', name: '用户协议', keywords: ['协议', '服务'] },
  { path: '/privacy', name: '隐私政策', keywords: ['隐私', '收集'] },
]

for (const page of INFO_PAGES) {
  test(`${page.name} 页面加载`, async ({ page: p }) => {
    await p.goto(page.path)
    await p.waitForLoadState('networkidle')

    await expect(p.locator('body')).toBeVisible()

    const hasKeyword = await Promise.all(
      page.keywords.map(k => p.locator(`text=${k}`).first().isVisible().catch(() => false))
    )
    expect(hasKeyword.some(Boolean)).toBe(true)
  })
}

test.describe('全局导航', () => {
  test('所有页面都有导航栏和页脚', async ({ page }) => {
    const paths = ['/', '/sites', '/models', '/free', '/enterprise']

    for (const path of paths) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // 检查导航栏存在（Nav 组件）
      const nav = page.locator('nav').first()
      await expect(nav).toBeVisible()

      // 检查页脚存在（Footer 组件）
      const footer = page.locator('footer').first()
      await expect(footer).toBeVisible()
    }
  })

  test('导航链接可点击', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 点击站点列表链接
    const sitesLink = page.locator('a[href="/sites"]').first()
    if (await sitesLink.isVisible()) {
      await sitesLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/sites/)
    }
  })
})
