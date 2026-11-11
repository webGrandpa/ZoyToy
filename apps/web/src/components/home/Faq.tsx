import type { Messages } from '../../i18n'

export function Faq({ m }: { m: Messages }) {
  return (
    <div className="faq">
      {m.faq.items.map((f, i) => (
        <details key={f.q} className="faq-item" open={i === 0}>
          <summary>
            <span>{f.q}</span>
            <b aria-hidden="true">+</b>
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  )
}
