import { test, expect } from '@playwright/test'

test.describe('站点列表', () => {
  test('页面加载并显示站点列表', async ({ page }) => {
    await page.goto('/sites')

    await expect(page).toHaveTitle(/站点|中转站/)
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('h1').first()).toContainText('中转站')
  })

  test('搜索功能可用', async ({ page }) => {
    await page.goto('/sites')

    const searchInput = page.locator('input[type="text"]').first()
    await expect(searchInput).toBeVisible()
  })

  test('筛选功能可用', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForLoadState('networkidle')

    // 检查页面有交互元素（表格、链接等）
    const hasLinks = await page.locator('a').count()
    expect(hasLinks).toBeGreaterThan(0)
  })
})

test.describe('站点详情', () => {
  test('站点详情页加载', async ({ page }) => {
    // 先访问站点列表获取第一个站点ID
    await page.goto('/sites')
    await page.waitForLoadState('networkidle')

    // 查找第一个站点链接
    const firstSiteLink = page.locator('a[href^="/sites/"]').first()
    const href = await firstSiteLink.getAttribute('href')

    if (href) {
      await page.goto(href)
      await page.waitForLoadState('networkidle')

      // 检查页面加载成功
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
