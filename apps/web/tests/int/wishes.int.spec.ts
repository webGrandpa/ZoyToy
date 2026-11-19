// @vitest-environment node
import { createLocalReq, getPayload, type Endpoint, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { parseVideo } from '@/lib/video'

describe('video review links', () => {
  it('turns the links people paste into players', () => {
    expect(parseVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toMatchObject({ site: 'youtube', tall: false, embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0' })
    expect(parseVideo('youtu.be/dQw4w9WgXcQ')).toMatchObject({ site: 'youtube', embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0' })
    expect(parseVideo('https://youtube.com/shorts/dQw4w9WgXcQ')).toMatchObject({ site: 'youtube', tall: true })
    expect(parseVideo('https://www.facebook.com/zoytoy/videos/1234567890')).toMatchObject({ site: 'facebook', tall: false })
    expect(parseVideo('https://www.facebook.com/reel/1234567890')?.embed).toContain('facebook.com/plugins/video.php?href=')
    expect(parseVideo('https://www.instagram.com/reel/C0dEaBc/')).toMatchObject({ site: 'instagram', embed: 'https://www.instagram.com/reel/C0dEaBc/embed' })
    expect(parseVideo('https://www.tiktok.com/@zoy.toy/video/7301234567890123456')).toMatchObject({ site: 'tiktok', embed: 'https://www.tiktok.com/embed/v2/7301234567890123456' })
  })

  it('keeps other links as a plain link and ignores nonsense', () => {
    expect(parseVideo('https://example.com/my-video.mp4')).toMatchObject({ site: 'other', embed: null })
    expect(parseVideo('javascript:alert(1)')).toBeNull()
    expect(parseVideo('')).toBeNull()
    expect(parseVideo(null)).toBeNull()
  })
})

describe('customer wishes („What toy should we add?“)', () => {
  let payload: Payload
  let handler: Endpoint['handler']
  const run = Date.now().toString(36)
  const ip = `10.77.${run.length}.${Math.floor(Math.random() * 250)}`
  const savedToken = process.env.TELEGRAM_BOT_TOKEN

  const post = async (body: Record<string, unknown>) => {
    const req = await createLocalReq({ req: { headers: new Headers({ 'x-real-ip': ip }) } }, payload)
    req.json = async () => body
    const res = (await handler(req)) as Response
    return { status: res.status, data: await res.json() }
  }

  beforeAll(async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    payload = await getPayload({ config: await config })
    handler = (payload.collections.wishes.config.endpoints as Endpoint[]).find((e) => e.path === '/send')!.handler
  })

  afterAll(async () => {
    const mine = await payload.find({ collection: 'wishes', where: { text: { contains: run } }, limit: 50, depth: 0, overrideAccess: true })
    for (const w of mine.docs) await payload.db.deleteOne({ collection: 'wishes', where: { id: { equals: w.id } } })
    if (savedToken) process.env.TELEGRAM_BOT_TOKEN = savedToken
  })

  it('saves a wish with an optional phone, tidied up', async () => {
    expect(await post({ text: `  ხის   სამზარეულო ${run} `, phone: '555 12-34-56', locale: 'ru', source: 'catalog' })).toEqual({ status: 200, data: { ok: true } })
    const saved = (await payload.find({ collection: 'wishes', where: { text: { contains: run } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
    expect(saved).toMatchObject({ text: `ხის სამზარეულო ${run}`, phone: '555123456', locale: 'ru', source: 'catalog', status: 'new' })
  })

  it('refuses empty text and a too-short phone, and quietly drops bots', async () => {
    expect((await post({ text: 'a' })).status).toBe(422)
    expect((await post({ text: `დინო ${run}`, phone: '123' })).status).toBe(422)
    const before = await payload.count({ collection: 'wishes', where: { text: { contains: run } }, overrideAccess: true })
    expect(await post({ text: `spam ${run}`, website: 'http://spam.example' })).toEqual({ status: 200, data: { ok: true } })
    expect((await payload.count({ collection: 'wishes', where: { text: { contains: run } }, overrideAccess: true })).totalDocs).toBe(before.totalDocs)
  })

  it('stops one visitor after five wishes a day', async () => {
    for (let i = 0; i < 4; i++) expect((await post({ text: `wish ${i} ${run}` })).status).toBe(200)
    expect((await post({ text: `one more ${run}` })).status).toBe(429)
  })

  it('is not open to the public API', async () => {
    const res = await payload.find({ collection: 'wishes', overrideAccess: false, limit: 1 }).catch((e: Error) => e)
    expect(res).toBeInstanceOf(Error)
  })
})
