import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test('页面加载并显示品牌信息', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 检查品牌名
    const h1 = page.locator('h1').first()
    await expect(h1).toContainText('模镜')
    await expect(h1).toContainText('Miro')

    // 检查副标题（用 h1 后的第一个 p 标签）
    await expect(page.locator('h1 + p').first()).toContainText('中转站评测平台')
    await expect(page.locator('text=做裁判').first()).toBeVisible()
  })

  test('搜索框存在', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[type="text"]').first()
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeEditable()
  })

  test('快捷导航按钮可点击', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 检查按钮存在（使用精确文本匹配）
    await expect(page.getByText('看排行榜')).toBeVisible()
    await expect(page.getByText('企业合规 →')).toBeVisible()
    await expect(page.getByText('测我的 Key →')).toBeVisible()
  })

  test('统计数据展示', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 检查统计区域存在（用数字区域判断）
    const statsSection = page.locator('.grid-cols-3').first()
    await expect(statsSection).toBeVisible()
  })

  test('功能特性卡片展示', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=中转站尽收眼底')).toBeVisible()
    await expect(page.locator('text=方法论完全公开')).toBeVisible()
    await expect(page.locator('text=企业合规专区独家')).toBeVisible()
  })

  test('为什么相信模镜区域', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=为什么相信模镜')).toBeVisible()
    await expect(page.getByText('透明', { exact: true })).toBeVisible()
    await expect(page.getByText('中立', { exact: true })).toBeVisible()
    await expect(page.getByText('可质疑', { exact: true })).toBeVisible()
  })
})
