/** Product image flies in an arc to the header cart, which then bounces (docs/05 §5 #3). */
export function flyToCart(from: HTMLElement | null, done: () => void) {
  const target = document.querySelector<HTMLElement>('[data-cart-target]')
  const bump = () => {
    target?.classList.remove('bump')
    void target?.offsetWidth
    target?.classList.add('bump')
    done()
  }
  if (!from || !target || !from.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return bump()
  const r1 = from.getBoundingClientRect()
  const r2 = target.getBoundingClientRect()
  const clone = from.cloneNode(true) as HTMLElement
  Object.assign(clone.style, { position: 'fixed', left: `${r1.left}px`, top: `${r1.top}px`, width: `${r1.width}px`, height: `${r1.height}px`, margin: '0', zIndex: '80', pointerEvents: 'none' })
  document.body.appendChild(clone)
  const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2)
  const dy = r2.top + r2.height / 2 - (r1.top + r1.height / 2)
  const a = clone.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 140}px) scale(.55) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.08) rotate(10deg)`, opacity: 0.4 },
    ],
    { duration: 720, easing: 'cubic-bezier(.45,0,.55,1)' },
  )
  a.onfinish = () => {
    clone.remove()
    bump()
  }
}
