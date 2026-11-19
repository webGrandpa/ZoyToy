// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/** Side-by-side languages (lib/i18nFields.ts): the hidden `i18n` field carries the other two languages of a save. */
describe('every language in one save', () => {
  let payload: Payload
  const run = Date.now().toString(36)
  const made: { collection: 'categories' | 'products'; id: number }[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    for (const m of made.reverse()) await payload.delete({ collection: m.collection, id: m.id, overrideAccess: true }).catch(() => null)
  })

  it('creates a category with its Russian and English names from one Georgian save', async () => {
    const c = await payload.create({
      collection: 'categories',
      locale: 'ka',
      overrideAccess: true,
      data: { title: `სატესტო ${run}`, color: 'sun', slug: `test-${run}`, i18n: { ru: { title: `Тест ${run}`, description: 'Описание' }, en: { title: `Test ${run}` } } } as never,
    })
    made.push({ collection: 'categories', id: c.id })
    const ru = await payload.findByID({ collection: 'categories', id: c.id, locale: 'ru', fallbackLocale: false, overrideAccess: true })
    const en = await payload.findByID({ collection: 'categories', id: c.id, locale: 'en', fallbackLocale: false, overrideAccess: true })
    const ka = await payload.findByID({ collection: 'categories', id: c.id, locale: 'ka', fallbackLocale: false, overrideAccess: true })
    expect([ka.title, ru.title, ru.description, en.title]).toEqual([`სატესტო ${run}`, `Тест ${run}`, 'Описание', `Test ${run}`])
  })

  it('writes translated rows of an item by row id and keeps the rest of the item', async () => {
    const cat = made[0].id
    const p = await payload.create({
      collection: 'products',
      locale: 'ka',
      overrideAccess: true,
      data: { status: 'draft', title: `ნივთი ${run}`, price: 10, condition: 'good', categories: [cat], seo: { title: 'SEO ka' }, defects: [{ text: 'ნაკაწრი' }, { text: 'ლაქა' }] },
    })
    made.unshift({ collection: 'products', id: p.id })
    const rows = p.defects ?? []
    // English only: the title stays empty there — a translation must not need every language filled in
    await payload.update({
      collection: 'products',
      id: p.id,
      locale: 'ka',
      overrideAccess: true,
      data: { shortDescription: 'მოკლედ', i18n: { en: { shortDescription: 'In short', 'seo.title': 'SEO en', [`defects.@${rows[1].id}.text`]: 'A stain' } } } as never,
    })
    const en = await payload.findByID({ collection: 'products', id: p.id, locale: 'en', fallbackLocale: false, depth: 0, overrideAccess: true })
    expect(en.shortDescription).toBe('In short')
    expect(en.seo?.title).toBe('SEO en')
    expect(en.defects?.map((d) => d.text ?? null)).toEqual([null, 'A stain'])
    const ka = await payload.findByID({ collection: 'products', id: p.id, locale: 'ka', fallbackLocale: false, depth: 0, overrideAccess: true })
    expect([ka.title, ka.shortDescription, ka.seo?.title, ka.defects?.map((d) => d.text)]).toEqual([`ნივთი ${run}`, 'მოკლედ', 'SEO ka', ['ნაკაწრი', 'ლაქა']])
    expect(ka.price).toBe(10)
  })

  it('does the same for Site settings', async () => {
    const before = await payload.findGlobal({ slug: 'site-settings', locale: 'ru', fallbackLocale: false, depth: 0, overrideAccess: true })
    try {
      await payload.updateGlobal({ slug: 'site-settings', locale: 'ka', overrideAccess: true, data: { i18n: { ru: { hours: `каждый день ${run}` } } } as never })
      const ru = await payload.findGlobal({ slug: 'site-settings', locale: 'ru', fallbackLocale: false, depth: 0, overrideAccess: true })
      expect(ru.hours).toBe(`каждый день ${run}`)
      // nothing else in Russian may pick up Georgian text on the way (defaults follow the language written)
      const georgian = Object.entries(ru).filter(([, v]) => typeof v === 'string' && /[\u10A0-\u10FF]/.test(v)).map(([k]) => k)
      expect(georgian).toEqual([])
    } finally {
      // a plain Russian save must not copy Georgian into the empty Russian fields either (guard in lib/i18nFields.ts)
      await payload.updateGlobal({ slug: 'site-settings', locale: 'ru', overrideAccess: true, data: { hours: before.hours ?? null } })
      const after = await payload.findGlobal({ slug: 'site-settings', locale: 'ru', fallbackLocale: false, depth: 0, overrideAccess: true })
      expect(Object.entries(after).filter(([, v]) => typeof v === 'string' && /[\u10A0-\u10FF]/.test(v)).map(([k]) => k)).toEqual([])
    }
  })
})
