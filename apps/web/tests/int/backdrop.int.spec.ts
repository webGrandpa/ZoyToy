// @vitest-environment node
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { cutOf, soften, stage, tintOf } from '@/lib/backdrop'
import { inspectCutout } from '@/lib/cutout'

const svg = (body: string, w = 1000, h = 800) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)

describe('cut-out photos', () => {
  it('spots a removed background and crops the empty edges around the toy', async () => {
    const ball = await sharp(svg('<circle cx="600" cy="420" r="150" fill="#e33"/>')).png().toBuffer()
    const r = await inspectCutout(ball)
    expect(r.cutout).toBe(true)
    const meta = await sharp((r as { trimmed: Buffer }).trimmed).metadata()
    expect(meta.width).toBeGreaterThanOrEqual(298)
    expect(meta.width).toBeLessThanOrEqual(304)
    expect(meta.height).toBeLessThanOrEqual(304)
    expect(meta.hasAlpha).toBe(true)
  })

  it('leaves ordinary photos alone, even PNGs with a few clear corners', async () => {
    const photo = await sharp(svg('<circle cx="600" cy="420" r="150" fill="#e33"/>')).flatten({ background: '#ffffff' }).jpeg().toBuffer()
    expect(await inspectCutout(photo)).toEqual({ cutout: false })
    const card = await sharp(svg('<rect width="400" height="400" rx="20" fill="#3a6"/>', 400, 400)).png().toBuffer()
    expect(await inspectCutout(card)).toEqual({ cutout: false })
    const opaquePng = await sharp(svg('<rect width="400" height="400" fill="#3a6"/>', 400, 400)).png().toBuffer()
    expect(await inspectCutout(opaquePng)).toEqual({ cutout: false })
  })

  it('picks the box classes from the backdrop, falling back to the category colour', () => {
    expect(stage(null, 'mint')).toBe('tint-mint')
    expect(stage({ bd: 'auto', sc: 'halo' }, 'mint')).toBe('tint-mint is-cut sc-halo')
    expect(stage({ bd: 'grape', sc: 'stars' }, 'mint')).toBe('tint-grape is-cut sc-stars')
    expect(stage({ bd: 'sky', sc: 'stars' }, 'mint', false)).toBe('tint-sky is-cut')
    expect(tintOf({ bd: 'auto', sc: 'plain' }, 'nonsense')).toBe('sun')
  })

  it('reads stored photo fields safely', () => {
    expect(cutOf({ cutout: false, backdrop: 'sky' })).toBeNull()
    expect(cutOf({ cutout: true })).toEqual({ bd: 'auto', sc: 'halo' })
    expect(cutOf({ cutout: true, backdrop: 'bubble', scene: 'plain' })).toEqual({ bd: 'bubble', sc: 'plain' })
    expect(cutOf({ cutout: true, backdrop: 'neon', scene: 'disco' })).toEqual({ bd: 'auto', sc: 'halo' })
  })

  it('softens brand colours the way the site mixes them', () => {
    expect(soften('#FFC83D', 0)).toBe('#ffffff')
    expect(soften('#FFC83D', 1)).toBe('#ffc83d')
    expect(soften('#6B4EFF', 0.3)).toBe('#d3caff') // 255 − (255 − 0x6B)·0.3 = 211 …
  })
})
