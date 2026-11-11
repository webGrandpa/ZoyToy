/** Brand-coloured confetti burst on a throwaway canvas (skipped for reduced motion). */
export function confetti(originY = 0.45) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = document.createElement('canvas')
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '120' })
  document.body.appendChild(cv)
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  cv.width = innerWidth * dpr
  cv.height = innerHeight * dpr
  const cx = cv.getContext('2d')!
  cx.scale(dpr, dpr)
  const cs = getComputedStyle(document.documentElement)
  const cols = ['--zt-grape', '--zt-sun', '--zt-sky', '--zt-bubble', '--zt-mint', '--zt-tangerine'].map((n) => cs.getPropertyValue(n).trim() || '#FFC83D')
  let parts = Array.from({ length: 160 }, (_, i) => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 160, y: innerHeight * originY,
    vx: (Math.random() - 0.5) * 1000, vy: -Math.random() * 950 - 250,
    w: 6 + Math.random() * 8, h: 8 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
    c: cols[i % cols.length], life: 2,
  }))
  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    cx.clearRect(0, 0, innerWidth, innerHeight)
    parts = parts.filter((p) => (p.life -= dt) > 0 && p.y < innerHeight + 40)
    for (const p of parts) {
      p.vy += 1500 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.life * 2)
      cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.3))); cx.restore()
    }
    if (parts.length) requestAnimationFrame(step)
    else cv.remove()
  }
  requestAnimationFrame(step)
}
