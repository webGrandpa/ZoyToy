'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createStack, drop, movingX, ST, ST_TICKS, type StackState } from '@zoytoy/games/stack'
import { fitCanvas, readPalette, rrect, tickAt, type EngineProps, type Palette } from './types'
import { useLatest } from './useLatest'

// the tower spells the Georgian alphabet, one block per letter
const ABC = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ'
const BASE_Y = ST.H - 54
type Piece = { x: number; y: number; w: number; vy: number; vx: number; rot: number; spin: number; color: string; letter: string }
type Flash = { y: number; life: number; perfect: boolean; txt: string }

/** Toy tower — tap to drop the sliding block; overhangs are cut off. Drop ticks are recorded for the server. */
export function StackEngine({ seed, running, onHud, onEnd, blip, label, perfectText = '!' }: EngineProps) {
  const cb = useLatest({ onHud, onEnd, blip, perfectText })
  const canvas = useRef<HTMLCanvasElement>(null)
  const pal = useRef<Palette | null>(null)
  const st = useRef<StackState | null>(null)
  const drops = useRef<number[]>([])
  const start = useRef(0)
  const anim = useRef<{ cam: number; pieces: Piece[]; flashes: Flash[]; t: number; last: number }>({ cam: 0, pieces: [], flashes: [], t: 0, last: 0 })

  const color = (p: Palette, level: number) => [p.bubble, p.sun, p.sky, p.mint, p.tan, p.grape][level % 6]

  const draw = useCallback((tick: number) => {
    const ctx = canvas.current?.getContext('2d')
    const p = pal.current
    const s = st.current
    if (!ctx || !p) return
    const a = anim.current
    const { W, H, BLOCK_H } = ST
    // sky that slowly gets deeper as the tower climbs
    const height = s ? s.tower.length : 1
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, height > 24 ? p.deep : height > 12 ? p.sky : p.canvas)
    sky.addColorStop(1, p.sunk)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)
    // drifting clouds and, higher up, stars
    ctx.save()
    for (let i = 0; i < 5; i++) {
      const cy = ((i * 137 + a.cam * 0.35) % (H + 80)) - 40
      const cx = (i * 91 + a.t * 12 * (i % 2 ? 1 : -1)) % (W + 120)
      const x = cx < -60 ? cx + W + 120 : cx - 60
      ctx.globalAlpha = 0.6
      ctx.fillStyle = height > 24 ? '#FFF6C8' : '#FFFFFF'
      if (height > 24) { ctx.beginPath(); ctx.arc(x + 30, cy, 2.4, 0, Math.PI * 2); ctx.fill() }
      else { ctx.beginPath(); ctx.arc(x, cy, 12, 0, Math.PI * 2); ctx.arc(x + 14, cy - 6, 14, 0, Math.PI * 2); ctx.arc(x + 30, cy, 11, 0, Math.PI * 2); ctx.fill() }
    }
    ctx.restore()
    ctx.save()
    ctx.translate(0, a.cam)
    // ground: a striped rug
    ctx.fillStyle = p.surface
    ctx.strokeStyle = p.edge
    ctx.lineWidth = 3
    rrect(ctx, 14, BASE_Y + BLOCK_H, W - 28, 60, 14)
    ctx.fill(); ctx.stroke()
    for (let i = 0; i < 9; i++) { ctx.fillStyle = [p.bubble, p.sun, p.mint][i % 3]; ctx.fillRect(28 + i * 36, BASE_Y + BLOCK_H + 10, 18, 8) }
    // tower
    const blocks = s ? s.tower : [{ x: (W - ST.BASE_W) / 2, w: ST.BASE_W, level: 0, perfect: false, toy: 0 }]
    for (const b of blocks) block(ctx, p, b.x, BASE_Y - b.level * BLOCK_H, b.w, color(p, b.level), b.level ? ABC[(b.level - 1) % ABC.length] : '', b.perfect)
    // the sliding block
    if (s?.cur && running) {
      const x = movingX(s, Math.max(s.cur.spawn, tick))
      const y = BASE_Y - s.cur.level * BLOCK_H
      if (tick >= s.cur.spawn) block(ctx, p, x, y, s.cur.w, color(p, s.cur.level), ABC[(s.cur.level - 1) % ABC.length], false)
      // guide line from the top block
      const top = s.tower[s.tower.length - 1]
      ctx.setLineDash([4, 6]); ctx.strokeStyle = p.soft; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(top.x, y - 4); ctx.lineTo(top.x, y + BLOCK_H + 4); ctx.moveTo(top.x + top.w, y - 4); ctx.lineTo(top.x + top.w, y + BLOCK_H + 4); ctx.stroke()
      ctx.setLineDash([])
    }
    // falling cut-offs
    for (const pc of a.pieces) {
      ctx.save(); ctx.translate(pc.x + pc.w / 2, pc.y + BLOCK_H / 2); ctx.rotate(pc.rot)
      block(ctx, p, -pc.w / 2, -BLOCK_H / 2, pc.w, pc.color, pc.letter, false)
      ctx.restore()
    }
    // flashes
    for (const f of a.flashes) {
      ctx.save(); ctx.globalAlpha = Math.max(0, f.life)
      if (f.perfect) { ctx.strokeStyle = p.sun; ctx.lineWidth = 5; rrect(ctx, 10, f.y - 6, W - 20, BLOCK_H + 12, 12); ctx.stroke() }
      ctx.font = '900 22px FiraGO, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = p.surface
      ctx.strokeText(f.txt, W / 2, f.y - 14 - (1 - f.life) * 26); ctx.fillStyle = f.perfect ? p.deep : p.fg; ctx.fillText(f.txt, W / 2, f.y - 14 - (1 - f.life) * 26)
      ctx.restore()
    }
    ctx.restore()
  }, [running])

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    pal.current = readPalette()
    fitCanvas(cv, ST.W, ST.H)
    draw(0)
    const mo = new MutationObserver(() => { pal.current = readPalette(); draw(0) })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [draw])

  useEffect(() => {
    if (seed === null) return
    st.current = createStack(seed)
    drops.current = []
    anim.current = { cam: 0, pieces: [], flashes: [], t: 0, last: 0 }
    draw(0)
  }, [seed, draw])

  const doDrop = useCallback(() => {
    const s = st.current
    const p = pal.current
    if (!running || !s || !s.cur || !p) return
    const t = tickAt(start.current)
    const level = s.cur.level
    const r = drop(s, t)
    if (!r) return
    drops.current.push(t)
    const y = BASE_Y - level * ST.BLOCK_H
    const a = anim.current
    if (r.cut > 0) a.pieces.push({ x: r.cutX, y, w: r.cut, vy: -40, vx: r.cutX < r.x ? -50 : 50, rot: 0, spin: r.cutX < r.x ? -2 : 2, color: color(p, level), letter: '' })
    if (r.kind === 'perfect') {
      a.flashes.push({ y, life: 1, perfect: true, txt: `${cb.current.perfectText} +${r.points}` })
      cb.current.blip(990 + Math.min(6, s.perfectRun) * 60, 0.12)
      if (navigator.vibrate) navigator.vibrate(12)
    } else if (r.kind === 'place') {
      a.flashes.push({ y, life: 0.8, perfect: false, txt: `+${r.points}` })
      cb.current.blip(520 + Math.min(20, level) * 14, 0.07)
    } else {
      cb.current.blip(160, 0.3, 'sawtooth')
      if (navigator.vibrate) navigator.vibrate([30, 40, 30])
    }
  }, [running, cb])

  useEffect(() => {
    const s = st.current
    if (!running || !s) return
    canvas.current?.focus({ preventScroll: true })
    start.current = performance.now()
    const a = anim.current
    a.last = performance.now()
    let raf = 0
    let ended = false
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - a.last) / 1000)
      a.last = now
      a.t += dt
      const tick = tickAt(start.current, now)
      // camera keeps the working block in the upper third
      const level = s.cur ? s.cur.level : s.tower.length
      const want = Math.max(0, ST.H * 0.36 - (BASE_Y - level * ST.BLOCK_H))
      a.cam += (want - a.cam) * Math.min(1, dt * 5)
      for (const pc of a.pieces) { pc.vy += 900 * dt; pc.y += pc.vy * dt; pc.x += pc.vx * dt; pc.rot += pc.spin * dt }
      a.pieces = a.pieces.filter((pc) => pc.y + a.cam < ST.H + 80)
      for (const f of a.flashes) f.life -= dt * 1.4
      a.flashes = a.flashes.filter((f) => f.life > 0)
      draw(tick)
      cb.current.onHud({ score: s.score, left: Math.max(0, Math.ceil(ST.LIMIT - tick / ST.FPS)), info: `${s.tower.length - 1}` })
      if ((s.over || tick >= ST_TICKS) && !ended) {
        ended = true
        setTimeout(() => cb.current.onEnd(drops.current, s.score), 700)
      }
      if (!ended || a.pieces.length) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, draw, cb])

  return (
    <canvas
      ref={canvas}
      className="game-canvas"
      tabIndex={0}
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); doDrop() }}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doDrop() } }}
    />
  )
}

function block(c: CanvasRenderingContext2D, p: Palette, x: number, y: number, w: number, fill: string, letter: string, perfect: boolean) {
  const h = ST.BLOCK_H
  c.save()
  c.lineWidth = 3
  c.strokeStyle = p.edge
  c.fillStyle = fill
  rrect(c, x, y, w, h, 7)
  c.fill(); c.stroke()
  c.fillStyle = 'rgba(255,255,255,.45)'
  rrect(c, x + 5, y + 4, Math.max(0, w - 10), 5, 3)
  c.fill()
  if (letter && w > 26) {
    c.fillStyle = '#1F1A3D'; c.font = '900 16px FiraGO, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText(letter, x + w / 2, y + h / 2 + 2)
  }
  if (perfect) { c.fillStyle = '#FFF6C8'; c.beginPath(); c.arc(x + w - 9, y + 9, 3, 0, Math.PI * 2); c.fill() }
  c.restore()
}
