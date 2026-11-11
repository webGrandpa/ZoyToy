import { test, expect } from '@playwright/test'

test.describe('Storefront (Georgian browser)', () => {
  test.use({ locale: 'ka-GE' })

  test('redirects to Georgian and shows the hero', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/ka$/)
    await expect(page).toHaveTitle(/Zoy Toy/)
    await expect(page.locator('h1').first()).toContainText('სიცოცხლე')
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

  test('picks the visitor’s language from the browser', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
