'use client'

import type { ReactNode } from 'react'
import '@fontsource/firago/400.css'
import '@fontsource/firago/700.css'
import '@fontsource/firago/900.css'
import '@zoytoy/ui/tokens.css'
import './admin.css'

/** Wraps the whole admin: Georgian-friendly font and Zoy Toy colours. */
export function AdminTheme({ children }: { children: ReactNode }) {
  return <>{children}</>
}
