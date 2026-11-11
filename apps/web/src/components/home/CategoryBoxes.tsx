import Link from 'next/link'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import type { Accent } from '../../lib/data'

type Cat = { id: number; title: string; slug: string; color: Accent; icon: ToyKind }

/**
 * Categories as open toy boxes: the lid leans back on its hinge, the toy peeks out over the rim.
 * Hover / focus swings the lid upright and the toy jumps out; every box hops on its own beat.
 */
export function CategoryBoxes({ locale, items }: { locale: string; items: Cat[] }) {
  return (
    <div className="boxes">
      {items.map((c, i) => (
        <Link key={c.id} href={`/${locale}/shop?c=${c.slug}`} className={`tbox tint-${c.color}`} style={{ ['--i' as string]: i }}>
          <span className="tbox-lid" aria-hidden="true" />
          <span className="tbox-in" aria-hidden="true" />
          <span className="tbox-toy" aria-hidden="true"><ToyArt kind={c.icon} /></span>
          <span className="tbox-front">
            <span className="tbox-rim" aria-hidden="true" />
            <span className="tbox-dots" aria-hidden="true" />
            <b>{c.title}</b>
          </span>
        </Link>
      ))}
    </div>
  )
}
