import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Play page', () => {
  test.use({ locale: 'ka-GE' })

  test('lets the visitor pick any game the owner switched on', async ({ page }) => {
    await page.goto(`${BASE}/ka/play`)
    const cards = page.locator('.gpick-card')
    await expect(cards).toHaveCount(4)
    await cards.nth(1).click()
    await expect(page).toHaveURL(/[?&]g=memory/)
    await expect(page.locator('.td-over h2')).toContainText('მეხსიერება')
    await expect(page.locator('.mem-card')).toHaveCount(16)
  })

  test('opens a game straight from a link', async ({ page }) => {
    await page.goto(`${BASE}/ka/play?g=whack`)
    await expect(page.locator('.gpick-card[aria-checked="true"]')).toContainText('დამალობანა')
    await expect(page.locator('.wh-hole')).toHaveCount(9)
  })
})
