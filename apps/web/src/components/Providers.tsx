'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Locale } from '../i18n/config'
import { fmt, type Messages } from '../i18n'

// ---------- i18n ----------
type I18n = { locale: Locale; m: Messages; f: (s: string, vars?: Record<string, string | number>) => string }
const I18nCtx = createContext<I18n | null>(null)
export const useI18n = () => {
  const v = useContext(I18nCtx)
  if (!v) throw new Error('useI18n outside provider')
  return v
}

// ---------- shop state: cart, toast, sound ----------
export type CartItem = { id: number; slug: string; title: string; price: number; img?: string | null; art: string; color: string }
type Shop = {
  items: CartItem[]
  add: (item: CartItem) => boolean
  remove: (id: number) => void
  toast: (msg: string) => void
  sound: boolean
  setSound: (v: boolean) => void
  blip: (freq?: number, dur?: number, type?: OscillatorType) => void
  clear: () => void
  cartOpen: boolean
  setCartOpen: (v: boolean) => void
}
const ShopCtx = createContext<Shop | null>(null)
export const useShop = () => {
  const v = useContext(ShopCtx)
  if (!v) throw new Error('useShop outside provider')
  return v
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode) — keep working in memory */
  }
}

export function Providers({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  const i18n = useMemo<I18n>(() => ({ locale, m: messages, f: (s, vars) => fmt(locale, s, vars) }), [locale, messages])
  const [items, setItems] = useState<CartItem[]>([])
  const [sound, setSoundState] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    setItems(read<CartItem[]>('zt-cart', []))
    setSoundState(read<boolean>('zt-sound', false))
  }, [])

  const itemsRef = useRef<CartItem[]>([])
  itemsRef.current = items
  const add = useCallback((item: CartItem) => {
    if (itemsRef.current.some((p) => p.id === item.id)) return false // second-hand items are unique: one of each
    const next = [...itemsRef.current, item]
    itemsRef.current = next
    setItems(next)
    write('zt-cart', next)
    return true
  }, [])
  const remove = useCallback((id: number) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id)
      write('zt-cart', next)
      return next
    })
  }, [])
  const clear = useCallback(() => {
    itemsRef.current = []
    setItems([])
    write('zt-cart', [])
  }, [])
  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 2400)
  }, [])
  const setSound = useCallback((v: boolean) => {
    setSoundState(v)
    write('zt-sound', v)
    if (v && !audio.current) {
      try {
        audio.current = new AudioContext()
      } catch {
        /* no audio support */
      }
    }
  }, [])
  const blip = useCallback(
    (freq = 660, dur = 0.08, type: OscillatorType = 'triangle') => {
      const ctx = audio.current
      if (!sound || !ctx) return
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + dur)
      g.gain.setValueAtTime(0.05, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
      o.connect(g).connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + dur + 0.02)
    },
    [sound],
  )

  const shop = useMemo<Shop>(() => ({ items, add, remove, toast, sound, setSound, blip, clear, cartOpen, setCartOpen }), [items, add, remove, toast, sound, setSound, blip, clear, cartOpen])

  return (
    <I18nCtx.Provider value={i18n}>
      <ShopCtx.Provider value={shop}>
        {children}
        <div className={`toast${toastMsg ? ' show' : ''}`} role="status" aria-live="polite">
          {toastMsg}
        </div>
      </ShopCtx.Provider>
    </I18nCtx.Provider>
  )
}
