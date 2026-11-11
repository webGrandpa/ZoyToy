import Link from 'next/link'
import { ToyArt } from '@zoytoy/ui/ToyArt'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { isLocale, type Locale } from '../../../i18n/config'
import { getMessages } from '../../../i18n'
import { getAgeCounts, getCategories, getNewArrivals, getSettings, getSpotlight, getStats } from '../../../lib/data'
import { currentSeason } from '../../../lib/season'
import { contactLinks } from '../../../lib/contact'
import { Mascot } from '../../../components/Mascot'
import { Stories } from '../../../components/Stories'
import { AgePicker } from '../../../components/AgePicker'
import { ProductCard } from '../../../components/ProductCard'
import { IconCamera, IconCheck, IconGame, IconSparkle } from '../../../components/Icons'
import { Bunting, Cloud, Sprinkles, Sun, Twinkles, Wave } from '../../../components/home/Decor'
import { Parallax } from '../../../components/home/HeroScene'
import { Marquee } from '../../../components/home/Marquee'
import { CategoryBoxes } from '../../../components/home/CategoryBoxes'
import { Spotlight } from '../../../components/home/Spotlight'
import { Vitrina } from '../../../components/home/Vitrina'
import { Journey } from '../../../components/home/Journey'
import { CountUp } from '../../../components/home/Stats'
import { InstaBand } from '../../../components/home/InstaBand'
import { Faq } from '../../../components/home/Faq'
import { GameTeaser } from '../../../components/home/GameTeaser'
import { payloadClient } from '../../../lib/payload'
import { activeCampaign } from '../../../collections/Games'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params
  const locale = (isLocale(l) ? l : 'ka') as Locale
  const m = getMessages(locale)
  const [arrivals, categories, counts, settings, spotlight, stats] = await Promise.all([
    getNewArrivals(locale, 12),
    getCategories(locale),
    getAgeCounts(),
    getSettings(locale),
    getSpotlight(locale),
    getStats(),
  ])
  const campaign = await activeCampaign(await payloadClient(), locale)
  const season = currentSeason(settings.season)
  const links = contactLinks(settings)
  const stepIcons = [IconCheck, IconSparkle, IconCamera]

  return (
    <>
      {/* ---------- HERO: a sunny playroom sky ---------- */}
      <section className={`hero2 season-${season}`} aria-labelledby="hero-title">
        <Parallax className="sky">
          <Bunting />
          <Sun className="hero-sun" />
          <Cloud className="c1" />
          <Cloud className="c2" />
          <Cloud className="c3" />
          {season === 'ny' ? <div className="snow" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDuration: `${5 + (i % 5)}s`, animationDelay: `-${i % 8}s` }} />)}</div> : null}
          <div className="wrap hero2-grid">
            <div className="hero2-copy">
              <p className="hero-pill"><span className="dot" aria-hidden="true" />{m.hero.eyebrow}</p>
              <h1 id="hero-title">
                {m.hero.titleA ? <span className="t-a">{m.hero.titleA}</span> : null}{' '}
                <span className="t-b">{m.hero.titleB}</span>{' '}
                <span className="t-c">{m.hero.titleC}</span>
              </h1>
              <p className="lede">{m.hero.lede}</p>
              <div className="hero-ctas">
                <Link className="zt-btn zt-btn--lg" href={`/${locale}/shop`}>{m.hero.buy}</Link>
                <Link className="zt-btn zt-btn--rent zt-btn--lg" href={`/${locale}/rent`}>{m.nav.rent}</Link>
                <Link className="zt-btn zt-btn--game zt-btn--lg" href={`/${locale}/play`}><IconGame />{m.hero.play}</Link>
              </div>
            </div>
            <div className="hero2-art">
              <div className="rug" aria-hidden="true" />
              <div className="floaters" aria-hidden="true">
                <ToyArt kind="duck" className="fl f1" />
                <ToyArt kind="rocket" className="fl f2" />
                <ToyArt kind="ball" className="fl f3" />
                <ToyArt kind="blocks" className="fl f4" />
              </div>
              <Twinkles />
              <Mascot season={season} label={m.hero.mascotLabel} hint={m.hero.mascotHint} />
            </div>
          </div>
          <div className="hill" aria-hidden="true">
            <Wave color="var(--zt-canvas)" />
          </div>
        </Parallax>
      </section>

      <Marquee items={m.marquee} />

      {/* ---------- stories ---------- */}
      {arrivals.length ? (
        <section className="sec sec-tight" aria-labelledby="st-title">
          <div className="wrap">
            <div className="sec-head center">
              <p className="eyebrow">{m.stories.eyebrow}</p>
              <h2 id="st-title">{m.stories.title}</h2>
            </div>
            <Stories items={arrivals.slice(0, 10)} />
          </div>
        </section>
      ) : null}

      {/* ---------- categories as toy boxes ---------- */}
      <section className="sec" aria-labelledby="cat-title">
        <div className="wrap">
          <div className="sec-head center">
            <p className="eyebrow">{m.categories.eyebrow}</p>
            <h2 id="cat-title">{m.categories.title}</h2>
          </div>
          <CategoryBoxes locale={locale} items={categories} />
        </div>
      </section>

      {/* ---------- find of the week ---------- */}
      {spotlight ? (
        <section className="band band-sun" aria-label={m.spotlight.eyebrow}>
          <Wave color="var(--band)" />
          <Sprinkles seed={2} />
          <div className="wrap band-inner">
            <Spotlight locale={locale} m={m} p={spotlight} />
          </div>
          <Wave color="var(--band)" flip />
        </section>
      ) : null}

      {/* ---------- new arrivals ---------- */}
      {arrivals.length ? (
        <section className="sec" aria-labelledby="new-title">
          <div className="wrap">
            <div className="sec-head row-head">
              <div>
                <p className="eyebrow">{m.arrivals.eyebrow}</p>
                <h2 id="new-title">{m.arrivals.title}</h2>
              </div>
              <Link className="zt-btn zt-btn--secondary zt-btn--sm" href={`/${locale}/shop`}>{m.arrivals.all} →</Link>
            </div>
            <div className="cards">
              {arrivals.slice(0, 8).map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- game teaser ---------- */}
      {campaign?.tiers?.length ? (
        <section className="sec" aria-label={m.play.eyebrow}>
          <div className="wrap">
            <GameTeaser locale={locale} m={m} title={campaign.title} tiers={campaign.tiers.map((t) => ({ minScore: t.minScore, percent: Math.min(t.percent, campaign.maxPercent ?? 50, 50) }))} />
          </div>
        </section>
      ) : null}

      {/* ---------- age ---------- */}
      <section className="band band-sky" aria-labelledby="age-title">
        <Wave color="var(--band)" />
        <Sprinkles seed={5} />
        <div className="wrap band-inner">
          <div className="sec-head center">
            <p className="eyebrow">{m.age.title}</p>
            <h2 id="age-title">{m.age.lede}</h2>
          </div>
          <AgePicker counts={counts} />
        </div>
        <Wave color="var(--band)" flip />
      </section>

      {/* ---------- storefront window ---------- */}
      <section className="sec" aria-labelledby="vit-title">
        <div className="wrap">
          <div className="sec-head center">
            <p className="eyebrow">{m.vitrina.eyebrow}</p>
            <h2 id="vit-title">{m.vitrina.title}</h2>
            <p className="lede">{m.vitrina.lede}</p>
          </div>
          <Vitrina locale={locale} sign={m.vitrina.sign} cats={categories} />
        </div>
      </section>

      {/* ---------- journey ---------- */}
      <section className="band band-mint" aria-labelledby="journey-title">
        <Wave color="var(--band)" />
        <div className="wrap band-inner">
          <div className="sec-head center">
            <p className="eyebrow">{m.journey.eyebrow}</p>
            <h2 id="journey-title">{m.journey.title}</h2>
          </div>
          <Journey m={m} />
        </div>
        <Wave color="var(--band)" flip />
      </section>

      {/* ---------- how we check ---------- */}
      <section className="sec" aria-labelledby="check-title">
        <div className="wrap">
          <div className="sec-head center">
            <p className="eyebrow">{m.check.eyebrow}</p>
            <h2 id="check-title">{m.check.title}</h2>
          </div>
          <ol className="steps">
            {m.check.steps.map((s, i) => {
              const Icon = stepIcons[i]
              return (
                <li key={s.t} className="step">
                  <span className="step-num" aria-hidden="true">{i + 1}</span>
                  <span className="step-icon"><Icon /></span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ---------- honest numbers ---------- */}
      {stats.homes > 0 || stats.onShelf > 0 ? (
        <section className="stats-band" aria-label={m.stats.homes}>
          <div className="wrap stats-grid">
            <div className="stat"><CountUp value={stats.onShelf} /><span>{m.stats.items}</span></div>
            {stats.homes > 0 ? <div className="stat"><CountUp value={stats.homes} /><span>{m.stats.homes}</span></div> : null}
            {stats.saved > 0 ? <div className="stat"><CountUp value={stats.saved} currency /><span>{m.stats.saved}<small>{m.stats.savedNote}</small></span></div> : null}
          </div>
        </section>
      ) : null}

      {/* ---------- instagram ---------- */}
      <section className="sec" aria-label={m.insta.eyebrow}>
        <div className="wrap">
          <InstaBand m={m} href={links.instagram} items={arrivals} />
        </div>
      </section>

      {/* ---------- FAQ + contact ---------- */}
      <section className="sec" id="contact" aria-labelledby="faq-title">
        <div className="wrap faq-contact">
          <div>
            <div className="sec-head">
              <p className="eyebrow">{m.faq.eyebrow}</p>
              <h2 id="faq-title">{m.faq.title}</h2>
            </div>
            <Faq m={m} />
          </div>
          <div className="contact-card">
            <Sprinkles seed={9} count={8} />
            <GiraffeHead className="contact-zoy" />
            <p className="eyebrow">{m.contact.eyebrow}</p>
            <h2>{m.contact.title}</h2>
            <p>{m.contact.lede}</p>
            {settings.hours ? <p className="muted">{m.contact.hours}: {settings.hours}</p> : null}
            <div className="contact-actions">
              <a className="zt-btn zt-btn--wa" href={links.whatsapp} target="_blank" rel="noopener">{m.contact.whatsapp}</a>
              {links.telegram ? <a className="zt-btn zt-btn--tg" href={links.telegram} target="_blank" rel="noopener">{m.contact.telegram}</a> : null}
              <a className="zt-btn zt-btn--ig" href={links.instagram} target="_blank" rel="noopener">{m.contact.instagram}</a>
              {links.phone ? <a className="zt-btn zt-btn--secondary" href={links.phone}>{m.contact.call}</a> : null}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
