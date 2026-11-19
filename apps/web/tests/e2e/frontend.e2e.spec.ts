import { test, expect } from '@playwright/test'

test.describe('Storefront (Georgian browser)', () => {
  test.use({ locale: 'ka-GE' })

  test('redirects to Georgian and shows the hero', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/ka$/)
    await expect(page).toHaveTitle(/Zoy Toy/)
    await expect(page.locator('h1').first()).toContainText('იქირავე')
  })

  test('switches language to Russian', async ({ page }) => {
    await page.goto('http://localhost:3000/ka')
    await page.getByRole('link', { name: 'Рус' }).click()
    await expect(page).toHaveURL(/\/ru$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  })
})

test.describe('Storefront (English browser)', () => {
  test.use({ locale: 'en-US' })

  test('opens in Georgian whatever the browser says, then remembers the language picked', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/ka$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ka')
    await page.getByRole('link', { name: 'Eng' }).click()
    await expect(page).toHaveURL(/\/en$/)
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/en$/)
  })
})
