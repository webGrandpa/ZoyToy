import Link from 'next/link'
import type { ToyKind } from '@zoytoy/ui/ToyArt'
import type { Accent } from '../../lib/data'
import { BOUQUETS, HERO, themeFor } from './Bouquet'

type Cat = { id: number; title: string; slug: string; color: Accent; icon: ToyKind; theme?: string | null }

/**
 * Where the six land: angle from upright, distance from the box opening, stacking order. Five make a
 * dome — lowest at the sides, tallest in the middle — and the sixth stands in front at the rim, the way
 * a bouquet is held.
 */
const FAN = [
  { a: -46, r: 78, z: 1 },
  { a: -22, r: 104, z: 2 },
  { a: 0, r: 124, z: 1 },
  { a: 22, r: 104, z: 2 },
  { a: 46, r: 78, z: 1 },
  { a: 0, r: 64, z: 3 },
]

/**
 * Categories as open toy boxes: the lid leans back on its hinge, the toy peeks out over the rim.
 * Hover / focus swings the lid upright and the box blooms: six toys of that very shelf (soft toys,
 * bricks, vehicles…) fan out of it like a bouquet. Every box hops on its own beat while idle.
 */
export function CategoryBoxes({ locale, items }: { locale: string; items: Cat[] }) {
  return (
    <div className="boxes">
      {items.map((c, i) => {
        const theme = themeFor(c.slug, c.icon, c.theme)
        const Hero = HERO[theme]
        return (
          <Link
            key={c.id}
            href={`/${locale}/shop?c=${c.slug}`}
            className={`tbox tint-${c.color}`}
            style={{ ['--i' as string]: i }}
          >
            <span className="tbox-lid" aria-hidden="true" />
            <span className="tbox-in" aria-hidden="true" />
            <span className="tbox-bouquet" aria-hidden="true">
              {BOUQUETS[theme].map((Art, j) => (
                <span
                  key={j}
                  className="tbox-b"
                  style={{
                    ['--a' as string]: `${FAN[j].a}deg`,
                    ['--r' as string]: `${FAN[j].r}px`,
                    ['--j' as string]: j,
                    zIndex: FAN[j].z,
                  }}
                >
                  <Art />
                </span>
              ))}
            </span>
            <span className="tbox-toy" aria-hidden="true">
              <Hero />
            </span>
            <span className="tbox-front">
              <span className="tbox-rim" aria-hidden="true" />
              <span className="tbox-dots" aria-hidden="true" />
              <b>{c.title}</b>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
