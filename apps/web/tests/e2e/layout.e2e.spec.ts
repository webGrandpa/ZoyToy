import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

/**
 * Elements that stick out of the viewport sideways without an ancestor that clips them.
 * `html`/`body` are skipped on purpose: they carry `overflow-x: clip` only as a safety net,
 * and this check must catch the real culprits behind it.
 */
async function sideOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const out: string[] = []
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height || (r.right <= vw + 1 && r.left >= -1)) return
      if (getComputedStyle(el).position === 'fixed') return
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p)
        if (cs.position === 'fixed') return
        if (/(hidden|clip|auto|scroll)/.test(cs.overflowX)) {
          const pr = p.getBoundingClientRect()
          if (pr.right <= vw + 1 && pr.left >= -1) return
        }
      }
      const cls = el.getAttribute('class') || el.tagName.toLowerCase()
      out.push(`${cls} [${Math.round(r.left)}…${Math.round(r.right)}]`)
    })
    return out.slice(0, 10)
  })
}

test.describe('Layout never scrolls sideways', () => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`no element sticks out at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/ka', '/ru', '/en', '/ka/shop', '/ka/rent', '/ka/play', '/ka/this-page-does-not-exist']) {
        await page.goto(`${BASE}${path}`)
        await page.waitForLoadState('networkidle')
        expect(await sideOverflow(page), `${path} @ ${width}px`).toEqual([])
      }
    })
  }
})

test.describe('Friendly 404', () => {
  test('unknown address inside a language shows Zoy’s own page, not the framework one', async ({ page }) => {
    await page.goto(`${BASE}/ka/this-page-does-not-exist`)
    await expect(page.locator('h1')).toContainText('ზოიმ')
    await expect(page.locator('header.top')).toBeVisible()
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
  })
})
