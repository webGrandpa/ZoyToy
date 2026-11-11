import { test, expect, type Page } from '@playwright/test'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

const BASE = 'http://localhost:3000'
const SHOTS = process.env.E2E_SHOTS // optional folder for screenshots
// its own account: other e2e files run in parallel and recreate the shared test user
const user = { ...testUser, email: 'e2e-store@zoytoy.test', roles: ['admin'] as ('admin' | 'staff')[] }

type Item = { id: number; sku: string; slug: string; status: string }

/** Counter sale and QR labels (docs/04 „მაღაზიაში გაყიდვა“): scan/search → sell → undo, labels sheet, label link. */
test.describe('In-store sale and QR labels', () => {
  let page: Page
  let item: Item

  test.beforeAll(async ({ browser }) => {
    await seedTestUser(user)
    const context = await browser.newContext({ locale: 'ka-GE', viewport: { width: 390, height: 844 } })
    page = await context.newPage()
    await page.goto(`${BASE}/admin/login`)
    await page.fill('#field-email', user.email)
    await page.fill('#field-password', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE}/admin`)
    const res = await page.request.get(`${BASE}/api/products?where[status][equals]=published&limit=1&depth=0`)
    item = (await res.json()).docs[0]
    expect(item?.sku).toBeTruthy()
  })

  test.afterAll(async () => {
    // put the item back however a failed step left it
    await page.request.patch(`${BASE}/api/products/${item.id}`, { data: { status: 'published' } }).catch(() => null)
    await cleanupTestUser(user)
  })

  test('home tiles and side menu lead to the new screens', async () => {
    await page.goto(`${BASE}/admin`)
    await expect(page.locator('.zt-tile--sale')).toBeVisible()
    await expect(page.locator('.zt-tile--labels')).toBeVisible()
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/home.png`, fullPage: true })
  })

  test('sells an item at the counter and undoes it', async () => {
    await page.goto(`${BASE}/admin/store-sale`)
    await page.fill('.zt-sale__search input', item.sku.toLowerCase())
    await page.click('.zt-sale__search button[type="submit"]')
    const card = page.locator('.zt-sale__item')
    await expect(card).toBeVisible()
    await expect(card).toContainText(item.sku)
    await expect(card).toHaveClass(/zt-sale__item--free/)
    await page.click('.zt-sale__pay button:nth-child(2)') // card
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/sale-item.png`, fullPage: true })
    await page.click('.zt-sale__sell')
    await expect(page.locator('.zt-sale__done')).toBeVisible()
    await expect(page.locator('.zt-sale__today li').first()).toContainText(item.sku)
    const sold = await (await page.request.get(`${BASE}/api/products/${item.id}?depth=0`)).json()
    expect(sold.status).toBe('sold')
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/sale-done.png`, fullPage: true })

    // the same item again is refused as already sold
    await page.click('.zt-sale__btn--go')
    await page.fill('.zt-sale__search input', item.sku)
    await page.click('.zt-sale__search button[type="submit"]')
    await expect(page.locator('.zt-sale__item')).toHaveClass(/zt-sale__item--sold/)
    await expect(page.locator('.zt-sale__sell')).toHaveCount(0)

    await page.locator('.zt-sale__today li').first().locator('.zt-sale__undo').click()
    await expect(page.locator('.zt-sale__msg[role="status"]')).toBeVisible()
    const back = await (await page.request.get(`${BASE}/api/products/${item.id}?depth=0`)).json()
    expect(back.status).toBe('published')
  })

  test('opens the sale screen with ?id= from the product sidebar', async () => {
    await page.goto(`${BASE}/admin/collections/products/${item.id}`)
    const sell = page.locator('.zt-ptools a[href*="/admin/store-sale?id="]')
    await expect(sell).toBeVisible()
    await page.goto(`${BASE}/admin/store-sale?id=${item.id}`)
    await expect(page.locator('.zt-sale__item')).toContainText(item.sku)
  })

  test('prints a sheet of QR labels', async () => {
    await page.goto(`${BASE}/admin/labels`)
    await page.locator('.zt-labels-pick input[type="checkbox"]').first().check()
    await page.click('.zt-labels-pick button[type="submit"]')
    await expect(page.locator('.zt-label').first()).toBeVisible()
    await expect(page.locator('.zt-label__qr svg').first()).toBeVisible()
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/labels-a4.png`, fullPage: true })
    await page.goto(`${BASE}/admin/labels?ids=${item.id}&size=roll`)
    await expect(page.locator('.zt-sheet--roll .zt-label')).toHaveCount(1)
    await expect(page.locator('.zt-sheet--roll')).toContainText(item.sku)
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/labels-roll.png`, fullPage: true })
  })

  test('the label link sends the team to the counter and customers to the item page', async ({ browser }) => {
    await page.goto(`${BASE}/q/${item.sku}`)
    await page.waitForURL(/\/admin\/store-sale\?id=/)
    const visitor = await browser.newContext({ locale: 'ru-RU' })
    const v = await visitor.newPage()
    await v.goto(`${BASE}/q/${item.sku}`)
    await v.waitForURL(new RegExp(`/ru/p/${item.slug}$`))
    const missing = await v.goto(`${BASE}/ka/q/ZT-999999`)
    expect(missing?.status()).toBe(404)
    await visitor.close()
  })

  test('the counter and label screens are closed to visitors', async ({ browser }) => {
    const visitor = await browser.newContext()
    const v = await visitor.newPage()
    await v.goto(`${BASE}/admin/store-sale`)
    await v.waitForURL(/\/admin\/login/)
    const api = await v.request.get(`${BASE}/api/store-sales/lookup?q=${item.sku}`)
    expect(api.status()).toBe(403)
    await visitor.close()
  })
})
