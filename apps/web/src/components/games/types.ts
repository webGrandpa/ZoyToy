/** Contract between the game shell (session, countdown, results) and each game engine. */
export type Hud = { score: number; left: number; info?: string }

export type EngineProps = {
  /** server seed for this round; null = nothing started yet (show an attract/demo picture) */
  seed: number | null
  /** true from the end of the countdown until the round is over */
  running: boolean
  onHud: (h: Hud) => void
  /** the round is over: the recorded moves go to the server, which replays them */
  onEnd: (input: unknown[], score: number) => void
  blip: (freq?: number, dur?: number, type?: OscillatorType) => void
  label: string
  perfectText?: string
}

export type Palette = Record<'sunk' | 'surface' | 'edge' | 'grape' | 'deep' | 'sun' | 'sky' | 'bubble' | 'mint' | 'tan' | 'fg' | 'soft' | 'line' | 'danger' | 'canvas', string>

/** Theme colours for canvas drawing (re-read when the theme changes). */
export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement)
  const g = (n: string) => cs.getPropertyValue(n).trim()
  return { sunk: g('--zt-surface-sunk'), surface: g('--zt-surface'), edge: g('--zt-edge'), grape: g('--zt-grape'), deep: g('--zt-grape-deep'), sun: g('--zt-sun'), sky: g('--zt-sky'), bubble: g('--zt-bubble'), mint: g('--zt-mint'), tan: g('--zt-tangerine'), fg: g('--zt-ink'), soft: g('--zt-ink-soft'), line: g('--zt-line'), danger: g('--zt-danger'), canvas: g('--zt-canvas') }
}

export function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  c.beginPath()
  c.moveTo(x + rr, y)
  c.arcTo(x + w, y, x + w, y + h, rr)
  c.arcTo(x + w, y + h, x, y + h, rr)
  c.arcTo(x, y + h, x, y, rr)
  c.arcTo(x, y, x + w, y, rr)
  c.closePath()
}

/** Size a canvas for crisp drawing on retina screens; returns the 2D context. */
export function fitCanvas(cv: HTMLCanvasElement, W: number, H: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  cv.width = W * dpr
  cv.height = H * dpr
  const ctx = cv.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

/** Fixed-step clock: ticks at 60 per second since `start` (performance.now()). */
export const tickAt = (start: number, now = performance.now(), fps = 60) => Math.floor(((now - start) * fps) / 1000)
