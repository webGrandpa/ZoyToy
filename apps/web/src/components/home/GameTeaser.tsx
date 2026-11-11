import Link from 'next/link'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import { fmt, type Messages } from '../../i18n'
import type { Locale } from '../../i18n/config'

/*
 * Attract-mode loop of the Toy Drop game: four toys fall in turn and the basket really catches each one.
 * Timing contract with home.css (.arc-*): 6 s cycle, drop i starts at i × 1.5 s and lands 1.2 s later,
 * i.e. at 20 / 45 / 70 / 95 % — exactly when the basket parks under its lane (--x).
 */
const DROPS: { kind: ToyKind; x: number; pts: number; gold?: boolean }[] = [
  { kind: 'teddy', x: 22, pts: 10 },
  { kind: 'ball', x: 70, pts: 10 },
  { kind: 'duck', x: 40, pts: 10 },
  { kind: 'rocket', x: 78, pts: 50, gold: true },
]

/** Home band inviting visitors to the mini-game, showing the real reward tiers. */
export function GameTeaser({ locale, m, title, tiers }: { locale: Locale; m: Messages; title: string; tiers: { minScore: number; percent: number }[] }) {
  const max = Math.max(...tiers.map((t) => t.percent), 0)
  return (
    <div className="teaser">
      <div className="teaser-art" aria-hidden="true">
        <div className="arcade">
          <div className="arc-top">
            <span className="arc-bulbs" />
            <b>TOY DROP</b>
            <span className="arc-bulbs" />
          </div>
          <div className="arc-screen">
            <span className="arc-score">★ <i /></span>
            {DROPS.map((d, i) => (
              <span key={i} className={`arc-drop${d.gold ? ' gold' : ''}`} style={{ ['--x' as string]: `${d.x}%`, ['--d' as string]: `${i * 1.5}s` }}>
                <ToyArt kind={d.kind} className="arc-toy" />
                <b className="arc-plus">+{d.pts}</b>
              </span>
            ))}
            <span className="arc-basket" />
          </div>
          <div className="arc-panel">
            <span className="arc-stick" />
            <span className="arc-btn b1" />
            <span className="arc-btn b2" />
          </div>
        </div>
      </div>
      <div className="teaser-copy">
        <p className="eyebrow">🎮 {title}</p>
        <h2>{m.play.title}</h2>
        {max ? <p className="teaser-max">{fmt(locale, m.teaser.upTo, { p: max })}</p> : null}
        <div className="teaser-tiers">
          {[...tiers].sort((a, b) => a.minScore - b.minScore).map((t, i) => (
            <span key={t.minScore} className={`tt m${i}`}><b>−{t.percent}%</b>{t.minScore}+</span>
          ))}
        </div>
        <Link className="zt-btn zt-btn--game zt-btn--lg" href={`/${locale}/play`}>{m.teaser.cta}</Link>
        <p className="muted small">{m.teaser.note}</p>
      </div>
    </div>
  )
}
