import sharp from 'sharp'
import { CUTOUT_MIN_CLEAR } from './backdrop'

const SAMPLE = 64
const MAX_SIDE = 2400 // the Media collection keeps originals within this anyway

/**
 * Looks at an uploaded photo: is its background removed (enough see-through pixels), and if so, the
 * same picture cropped to the toy — empty transparent margins would make the toy look small in the
 * square card. Photos that keep their background come back untouched.
 */
export async function inspectCutout(input: Buffer | string): Promise<{ cutout: false } | { cutout: true; trimmed: Buffer | null }> {
  const meta = await sharp(input, { failOn: 'none' }).metadata()
  if (!meta.hasAlpha) return { cutout: false }
  const alpha = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize(SAMPLE, SAMPLE, { fit: 'fill' })
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer()
  let clear = 0
  for (const a of alpha) if (a < 16) clear++
  if (clear / alpha.length < CUTOUT_MIN_CLEAR) return { cutout: false }
  try {
    const trimmed = await sharp(input, { failOn: 'none' })
      .rotate()
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 6 })
      .toBuffer()
    return { cutout: true, trimmed }
  } catch {
    // nothing to trim (or an odd file): keep the upload as it came
    return { cutout: true, trimmed: null }
  }
}
