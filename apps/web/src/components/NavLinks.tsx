'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export type NavItem = { href: string; label: string; color: string; icon: ReactNode; match?: string }
type Blob = { x: number; w: number; c: string; on: boolean; jump: boolean }

/**
 * Desktop navigation: a toy-coloured jelly pill glides (with a spring) to whichever link is hovered
 * or focused, changes colour per link, and rests on the current page. Icons wiggle, text squishes.
 */
export function NavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const path = usePathname() ?? ''
  const nav = useRef<HTMLElement>(null)
  const links = useRef<(HTMLAnchorElement | null)[]>([])
  const active = items.findIndex((it) => it.match && path.startsWith(it.match))
  const [blob, setBlob] = useState<Blob>({ x: 0, w: 0, c: 'transparent', on: false, jump: true })

  const place = useCallback(
    (i: number) => {
      const el = links.current[i]
      if (!el) return
      // appear in place when the pill was hidden; glide when it was already showing
      setBlob((b) => ({ x: el.offsetLeft, w: el.offsetWidth, c: items[i].color, on: true, jump: !b.on }))
    },
    [items],
  )

  const rest = useCallback(() => {
    if (active >= 0) place(active)
    else setBlob((b) => ({ ...b, on: false, jump: false }))
  }, [active, place])

  useEffect(() => {
    rest()
    // fonts and window size change the link widths — keep the pill measured
    const ro = new ResizeObserver(() => rest())
    if (nav.current) ro.observe(nav.current)
    return () => ro.disconnect()
  }, [rest])

  return (
    <nav
      ref={nav}
      className="nav"
      aria-label={label}
      onPointerLeave={rest}
      onBlur={(e) => {
        if (!nav.current?.contains(e.relatedTarget as Node | null)) rest()
      }}
    >
      <span
        className={`nav-blob${blob.on ? ' on' : ''}${blob.jump ? ' jump' : ''}`}
        style={{ '--x': `${blob.x}px`, '--w': `${blob.w}px`, '--c': blob.c } as CSSProperties}
        aria-hidden="true"
      />
      {items.map((it, i) => (
        <Link
          key={it.href}
          ref={(el) => {
            links.current[i] = el
          }}
          href={it.href}
          aria-current={i === active ? 'page' : undefined}
          className={i === active ? 'is-active' : undefined}
          onPointerEnter={() => place(i)}
          onFocus={() => place(i)}
        >
          <span className="nav-ic" aria-hidden="true">{it.icon}</span>
          <span className="nav-tx">{it.label}</span>
        </Link>
      ))}
    </nav>
  )
}
