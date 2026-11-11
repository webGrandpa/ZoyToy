import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'

/** Light-theme token values so the illustrations render without CSS. */
const PALETTE: Record<string, string> = {
  edge: '#1F1A3D', sun: '#FFC83D', bubble: '#FF5C93', sky: '#3EC5FF', mint: '#3DDBB0',
  tangerine: '#FF8A3D', grape: '#6B4EFF', 'grape-deep': '#4B32D6', muzzle: '#FFE7AE',
}
const BG: Record<string, string> = { sun: '#FFF1CC', bubble: '#FFE0EB', sky: '#DDF4FF', mint: '#DBF8EF', tangerine: '#FFE6D6', grape: '#E8E2FF' }

/** 1200×1200 PNG-ready SVG of a toy on a soft tinted background — placeholder product photo. */
export function toySvg(kind: ToyKind, tint: keyof typeof BG): string {
  const inner = renderToStaticMarkup(createElement(ToyArt, { kind }))
    .replace(/var\(--zt-([a-z-]+)\)/g, (_, name: string) => PALETTE[name] ?? '#000')
    .replace('<svg ', '<svg x="150" y="150" width="900" height="900" ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="${BG[tint]}"/><circle cx="600" cy="640" r="430" fill="#ffffff" opacity=".55"/>${inner}</svg>`
}
