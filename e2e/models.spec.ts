import { test, expect } from '@playwright/test'

test.describe('模型页面', () => {
  test('模型列表页加载', async ({ page }) => {
    await page.goto('/models')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('模型详情页加载', async ({ page }) => {
    // 先访问模型列表获取第一个模型ID
    await page.goto('/models')
    await page.waitForLoadState('networkidle')

    const firstModelLink = page.locator('a[href^="/models/"]').first()
    const href = await firstModelLink.getAttribute('href')

    if (href) {
      await page.goto(href)
      await page.waitForLoadState('networkidle')

      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('排行榜', () => {
  test('排行榜页面加载', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('模型择优', () => {
  test('模型择优页面加载', async ({ page }) => {
    await page.goto('/model-select')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('h1')).toContainText('择优')
  })
})
