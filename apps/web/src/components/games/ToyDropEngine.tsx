'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createState, step, clampX, TD, TICKS, type Item, type State } from '@zoytoy/games/toy-drop'
import { fitCanvas, readPalette, rrect, type EngineProps, type Palette } from './types'
import { useLatest } from './useLatest'

type Pop = { x: number; y: number; txt: string; life: number; neg: boolean }
const LETTERS = ['ა', 'ბ', 'გ', 'დ', 'ზ', 'ო', 'ი']

/** Toy rain — catch falling toys in a basket. Canvas, fixed 60 fps simulation shared with the server. */
export function ToyDropEngine({ seed, running, onHud, onEnd, blip, label }: EngineProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pal = useRef<Palette | null>(null)
  const g = useRef<{ s: State; inputs: number[]; tx: number; keys: { l: boolean; r: boolean }; pops: Pop[]; raf: number; last: number; acc: number } | null>(null)
  const cb = useLatest({ onHud, onEnd, blip })

  const draw = useCallback((s: State | null, pops: Pop[] = []) => {
    const cv = canvas.current
    const ctx = cv?.getContext('2d')
    const p = pal.current
    if (!ctx || !p) return
    const { W, H } = TD
    ctx.fillStyle = p.sunk
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = p.line
    for (let y = 20; y < H; y += 26) for (let x = ((y / 26) % 2) * 13 + 10; x < W; x += 26) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill() }
    ctx.fillStyle = p.surface
    ctx.strokeStyle = p.edge
    ctx.lineWidth = 3
    ctx.fillRect(0, H - 18, W, 18)
    ctx.beginPath(); ctx.moveTo(0, H - 18); ctx.lineTo(W, H - 18); ctx.stroke()
    for (const it of s ? s.items : demoItems) drawItem(ctx, it, p)
    drawBasket(ctx, s ? s.bx : W / 2, p)
    for (const pop of pops) {
      ctx.save(); ctx.globalAlpha = Math.max(0, pop.life / 0.8); ctx.font = '900 20px FiraGO, sans-serif'; ctx.textAlign = 'center'
      ctx.lineWidth = 4; ctx.strokeStyle = p.surface; ctx.strokeText(pop.txt, pop.x, pop.y); ctx.fillStyle = pop.neg ? p.danger : p.fg; ctx.fillText(pop.txt, pop.x, pop.y); ctx.restore()
    }
  }, [])

  // canvas size + theme colours
  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    pal.current = readPalette()
    fitCanvas(cv, TD.W, TD.H)
    draw(g.current?.s ?? null)
    const mo = new MutationObserver(() => { pal.current = readPalette(); draw(g.current?.s ?? null, g.current?.pops) })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [draw])

  // a new round: fresh state, drawn still during the countdown
  useEffect(() => {
    if (seed === null) return
    g.current = { s: createState(seed), inputs: [], tx: TD.W / 2, keys: { l: false, r: false }, pops: [], raf: 0, last: 0, acc: 0 }
    draw(g.current.s)
  }, [seed, draw])

  useEffect(() => {
    const st = g.current
    if (!running || !st) return
    canvas.current?.focus({ preventScroll: true })
    st.last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - st.last) / 1000)
      st.last = now
      st.acc += dt
      while (st.acc >= 1 / TD.FPS && st.s.tick < TICKS) {
        st.acc -= 1 / TD.FPS
        if (st.keys.l) st.tx -= 360 / TD.FPS
        if (st.keys.r) st.tx += 360 / TD.FPS
        st.tx = clampX(st.tx)
        const target = Math.round(st.tx)
        st.inputs.push(target)
        for (const hit of step(st.s, target)) {
          st.pops.push({ x: hit.x, y: TD.BASKET_Y - 24, txt: `${hit.points > 0 ? '+' : ''}${hit.points}`, life: 0.8, neg: hit.points < 0 })
          cb.current.blip(hit.points > 0 ? (hit.kind === 'gold' ? 1180 : 760) : 220, hit.points > 0 ? 0.08 : 0.16, hit.points > 0 ? 'triangle' : 'sawtooth')
          if (hit.kind === 'gold' && navigator.vibrate) navigator.vibrate(15)
        }
      }
      st.pops.forEach((p) => { p.life -= dt; p.y -= 40 * dt })
      st.pops = st.pops.filter((p) => p.life > 0)
      draw(st.s, st.pops)
      cb.current.onHud({ score: st.s.score, left: Math.max(0, Math.ceil(TD.DUR - st.s.tick / TD.FPS)) })
      if (st.s.tick >= TICKS) return cb.current.onEnd(st.inputs, st.s.score)
      st.raf = requestAnimationFrame(loop)
    }
    st.raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(st.raf)
  }, [running, draw, cb])

  const pointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = g.current
    if (!st || !running) return
    const r = e.currentTarget.getBoundingClientRect()
    st.tx = clampX(((e.clientX - r.left) / r.width) * TD.W)
  }
  const key = (down: boolean) => (e: React.KeyboardEvent) => {
    const st = g.current
    if (!st) return
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) { st.keys.l = down; e.preventDefault() }
    if (['ArrowRight', 'd', 'D'].includes(e.key)) { st.keys.r = down; e.preventDefault() }
  }

  return (
    <canvas
      ref={canvas}
      className="game-canvas"
      tabIndex={0}
      aria-label={label}
      onPointerMove={pointer}
      onPointerDown={(e) => { pointer(e); e.currentTarget.setPointerCapture(e.pointerId) }}
      onKeyDown={key(true)}
      onKeyUp={key(false)}
      onBlur={() => { if (g.current) g.current.keys = { l: false, r: false } }}
    />
  )
}

// ---------- drawing ----------
const demoItems: Item[] = [
  { id: 1, kind: 'toy', toy: 0, v: 0, x: 70, y: 120, r: 16, rot: 0.3, vy: 0, spin: 0, glow: 0, done: false },
  { id: 2, kind: 'toy', toy: 1, v: 0, x: 180, y: 70, r: 16, rot: -0.2, vy: 0, spin: 0, glow: 0, done: false },
  { id: 3, kind: 'gold', toy: 0, v: 0, x: 280, y: 160, r: 20, rot: 0, vy: 0, spin: 0, glow: 0.3, done: false },
  { id: 4, kind: 'toy', toy: 3, v: 0, x: 120, y: 260, r: 16, rot: 0, vy: 0, spin: 0, glow: 0, done: false },
  { id: 5, kind: 'cloud', toy: 0, v: 0, x: 250, y: 300, r: 20, rot: 0, vy: 0, spin: 0, glow: 0, done: false },
  { id: 6, kind: 'toy', toy: 2, v: 0, x: 60, y: 350, r: 16, rot: 0.5, vy: 0, spin: 0, glow: 0, done: false },
]

function star(c: CanvasRenderingContext2D, x: number, y: number, R: number, r: number) {
  c.beginPath()
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rad = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad) }
  c.closePath()
}

function drawItem(c: CanvasRenderingContext2D, it: Item, p: Palette) {
  c.save(); c.translate(it.x, it.y); c.rotate(it.rot || 0)
  c.lineWidth = 3; c.strokeStyle = p.edge; c.lineJoin = 'round'
  const r = it.r
  if (it.kind === 'gold') {
    c.rotate(-(it.rot || 0) * 0.7)
    c.fillStyle = p.sun; c.globalAlpha = 0.45 + 0.25 * Math.sin((it.glow || 0) * 6); c.beginPath(); c.arc(0, 0, r + 9, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1
    c.fillStyle = p.tan; c.beginPath(); c.moveTo(-6, r * 0.7); c.quadraticCurveTo(0, r * 1.5, 6, r * 0.7); c.fill(); c.stroke()
    c.fillStyle = p.bubble; c.beginPath(); c.moveTo(-9, r * 0.25); c.lineTo(-17, r * 0.85); c.lineTo(-7, r * 0.75); c.fill(); c.stroke()
    c.beginPath(); c.moveTo(9, r * 0.25); c.lineTo(17, r * 0.85); c.lineTo(7, r * 0.75); c.fill(); c.stroke()
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(0, -r); c.bezierCurveTo(13, -r * 0.5, 14, r * 0.3, 10, r * 0.75); c.lineTo(-10, r * 0.75); c.bezierCurveTo(-14, r * 0.3, -13, -r * 0.5, 0, -r); c.fill(); c.stroke()
    c.fillStyle = p.sky; c.beginPath(); c.arc(0, -r * 0.1, 5.5, 0, Math.PI * 2); c.fill(); c.stroke()
  } else if (it.kind === 'cloud') {
    c.rotate(-(it.rot || 0))
    c.fillStyle = p.soft; c.globalAlpha = 0.9
    c.beginPath(); c.arc(-10, 2, 11, 0, Math.PI * 2); c.arc(4, -6, 14, 0, Math.PI * 2); c.arc(15, 4, 10, 0, Math.PI * 2); c.rect(-10, 2, 25, 11); c.fill(); c.globalAlpha = 1
    c.strokeStyle = p.sky; c.lineWidth = 3; c.lineCap = 'round'
    ;[-8, 2, 12].forEach((dx, i) => { c.beginPath(); c.moveTo(dx, 18 + (i % 2) * 3); c.lineTo(dx - 3, 26 + (i % 2) * 3); c.stroke() })
  } else if (it.toy === 0) {
    c.fillStyle = p.bubble; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill(); c.stroke()
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, r - 6, -2.6, -1.2); c.stroke()
    c.strokeStyle = p.edge; c.lineWidth = 3; c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, 10, r, 0); c.stroke()
  } else if (it.toy === 1) {
    c.fillStyle = [p.mint, p.sky, p.sun][it.v % 3]; rrect(c, -r, -r, r * 2, r * 2, 6); c.fill(); c.stroke()
    c.fillStyle = '#1F1A3D'; c.font = '900 20px FiraGO, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(LETTERS[it.v % LETTERS.length], 0, 1)
  } else if (it.toy === 2) {
    c.fillStyle = p.tan; star(c, 0, 0, r + 2, r * 0.5); c.fill(); c.stroke()
  } else {
    c.fillStyle = p.sun; c.beginPath(); c.ellipse(2, 5, r, r * 0.7, 0, 0, Math.PI * 2); c.fill(); c.stroke()
    c.beginPath(); c.arc(-6, -8, r * 0.55, 0, Math.PI * 2); c.fill(); c.stroke()
    c.fillStyle = p.tan; c.beginPath(); c.moveTo(-15, -9); c.lineTo(-24, -6); c.lineTo(-15, -3); c.closePath(); c.fill(); c.stroke()
    c.fillStyle = '#1F1A3D'; c.beginPath(); c.arc(-8, -10, 2.4, 0, Math.PI * 2); c.fill()
  }
  c.restore()
}

function drawBasket(c: CanvasRenderingContext2D, x: number, p: Palette) {
  const w = TD.BASKET_W
  const y = TD.BASKET_Y
  c.save(); c.lineWidth = 3.5; c.strokeStyle = p.edge; c.lineJoin = 'round'
  c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(x, y + 30, w * 0.5, 6, 0, 0, Math.PI * 2); c.fill()
  c.fillStyle = p.grape; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.lineTo(x + w / 2 - 10, y + 26); c.lineTo(x - w / 2 + 10, y + 26); c.closePath(); c.fill(); c.stroke()
  c.strokeStyle = p.deep; c.lineWidth = 2.5
  for (let i = 1; i < 5; i++) { const fx = x - w / 2 + (i * w) / 5; c.beginPath(); c.moveTo(fx, y + 3); c.lineTo(fx - (fx - x) * 0.2, y + 23); c.stroke() }
  c.strokeStyle = p.edge; c.lineWidth = 3.5; c.fillStyle = p.deep; rrect(c, x - w / 2 - 5, y - 7, w + 10, 10, 5); c.fill(); c.stroke()
  c.restore()
}
