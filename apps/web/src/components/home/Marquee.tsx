const ICONS = ['✓', '✦', '★', '♥', '✿', '☀', '◆']

/**
 * Tilted ribbon of brand promises scrolling forever.
 * The outer `.mq-clip` clips the tilted ribbon sideways only, so it never causes horizontal scroll.
 */
export function Marquee({ items }: { items: readonly string[] }) {
  const row = items.map((t, i) => (
    <span key={i} className="mq-item">
      <b aria-hidden="true">{ICONS[i % ICONS.length]}</b>
      {t}
    </span>
  ))
  return (
    <div className="mq-clip">
      <div className="marquee" role="note" aria-label={items.join(' · ')}>
        <div className="mq-track" aria-hidden="true">
          {row}
          {row}
        </div>
      </div>
    </div>
  )
}
