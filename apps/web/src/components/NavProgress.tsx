'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'

type State = 'idle' | 'loading' | 'done'

/**
 * Slim rainbow progress bar along the top edge (with Zoy riding its tip) while the next page loads.
 * It starts on a click on an internal link and finishes when the URL has changed — the current page
 * stays on screen meanwhile, so there is no blank flash and no full-screen loader.
 */
export function NavProgress() {
  const path = usePathname()
  const search = useSearchParams()
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    // capture phase: Next's <Link> calls preventDefault() for client-side navigation, so a bubbling
    // listener would never see the click as a navigation
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || !a.href || a.hasAttribute('download') || (a.target && a.target !== '_self')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return // same page / #anchor
      setState('loading')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // the new page is on screen
  useEffect(() => {
    setState((s) => (s === 'loading' ? 'done' : s))
  }, [path, search])

  useEffect(() => {
    if (state === 'done') {
      const t = setTimeout(() => setState('idle'), 500)
      return () => clearTimeout(t)
    }
    if (state === 'loading') {
      // never get stuck (e.g. a link that ends up not navigating)
      const t = setTimeout(() => setState('idle'), 15000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <div className={`navprog navprog--${state}`} aria-hidden="true">
      <i>
        <GiraffeHead />
      </i>
    </div>
  )
}
