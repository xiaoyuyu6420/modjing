import { test, expect } from '@playwright/test'

test.describe('管理后台', () => {
  test('后台首页加载', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('h1')).toContainText('管理后台')
    await expect(page.locator('text=站点管理')).toBeVisible()
    await expect(page.locator('text=健康监控')).toBeVisible()
  })

  test('后台概览数据展示', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=今日概览')).toBeVisible()
    await expect(page.locator('text=收录站点')).toBeVisible()
    await expect(page.locator('text=在线')).toBeVisible()
    await expect(page.locator('text=不稳定')).toBeVisible()
    await expect(page.locator('text=已下线')).toBeVisible()
  })

  test('从后台跳转到站点管理', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const sitesLink = page.locator('a[href="/admin/sites"]').first()
    await expect(sitesLink).toBeVisible()

    await sitesLink.click()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/admin/sites')
  })
})

test.describe('站点管理', () => {
  test('站点管理页面加载', async ({ page }) => {
    await page.goto('/admin/sites')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('站点管理')
    await expect(page.locator('text=返回后台')).toBeVisible()

    // 检查表格存在
    const table = page.locator('table').first()
    await expect(table).toBeVisible()
  })

  test('表格包含站点数据', async ({ page }) => {
    await page.goto('/admin/sites')
    await page.waitForLoadState('networkidle')

    // 检查表头
    await expect(page.locator('text=站点名称')).toBeVisible()
    await expect(page.locator('text=URL')).toBeVisible()
    await expect(page.locator('text=状态')).toBeVisible()
    await expect(page.locator('text=操作')).toBeVisible()
  })

  test('从站点管理返回后台', async ({ page }) => {
    await page.goto('/admin/sites')
    await page.waitForLoadState('networkidle')

    const backLink = page.locator('text=返回后台').first()
    await backLink.click()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/admin')
  })
})

test.describe('健康监控', () => {
  test('健康监控页面加载', async ({ page }) => {
    await page.goto('/admin/health')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('健康监控')
    await expect(page.locator('text=返回后台')).toBeVisible()
  })

  test('显示健康检查数据', async ({ page }) => {
    await page.goto('/admin/health')
    await page.waitForLoadState('networkidle')

    // 检查状态标签
    const hasOk = await page.locator('text=ok').count()
    const hasSlow = await page.locator('text=slow').count()
    expect(hasOk + hasSlow).toBeGreaterThan(0)
  })

  test('从健康监控返回后台', async ({ page }) => {
    await page.goto('/admin/health')
    await page.waitForLoadState('networkidle')

    const backLink = page.locator('text=返回后台').first()
    await backLink.click()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/admin')
  })
})

test.describe('后台导航流程', () => {
  test('后台页面间导航流程', async ({ page }) => {
    // 从后台首页开始
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // 到站点管理
    await page.locator('a[href="/admin/sites"]').click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/admin/sites')

    // 返回后台
    await page.locator('text=返回后台').click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/admin')

    // 到健康监控
    await page.locator('a[href="/admin/health"]').click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/admin/health')
  })
})
