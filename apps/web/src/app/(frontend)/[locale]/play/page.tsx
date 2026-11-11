import type { Metadata } from 'next'
import { alternates } from '../../../../lib/seo'
import { isLocale, type Locale } from '../../../../i18n/config'
import { getMessages } from '../../../../i18n'
import { getSettings } from '../../../../lib/data'
import { payloadClient } from '../../../../lib/payload'
import { activeCampaign } from '../../../../collections/Games'
import { GAME_IDS, isGameId, type GameId } from '@zoytoy/games/catalog'
import { PlayHub } from '../../../../components/games/PlayHub'
import { Bunting, Sprinkles } from '../../../../components/home/Decor'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const l = isLocale(locale) ? locale : 'ka'
  const m = getMessages(l)
  return { title: m.play.title, description: m.play.lede, alternates: alternates(l, '/play') }
}

const PRACTICE_TIERS = [{ minScore: 150, percent: 10 }, { minScore: 300, percent: 20 }, { minScore: 450, percent: 30 }, { minScore: 600, percent: 50 }]

export default async function PlayPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ g?: string }> }) {
  const { locale: l } = await params
  const { g } = await searchParams
  const locale = (isLocale(l) ? l : 'ka') as Locale
  const m = getMessages(locale)
  const payload = await payloadClient()
  const [campaign, settings] = await Promise.all([activeCampaign(payload, locale), getSettings(locale)])
  const tiers = campaign?.tiers?.length ? campaign.tiers.map((t) => ({ minScore: t.minScore, percent: Math.min(t.percent, campaign.maxPercent ?? 50, 50) })) : PRACTICE_TIERS
  // which games the owner switched on in Site settings → Games (none ticked = all)
  const picked = (settings.games ?? []).filter(isGameId)
  const games: GameId[] = picked.length ? GAME_IDS.filter((id) => picked.includes(id)) : [...GAME_IDS]
  const initial = isGameId(g) && games.includes(g) ? g : games[0]
  return (
    <section className="play-page">
      <Bunting />
      <Sprinkles seed={4} />
      <div className="wrap">
        <div className="sec-head center">
          <p className="eyebrow">{campaign?.title ?? m.play.eyebrow}</p>
          <h1>{m.play.title}</h1>
          <p className="lede">{m.play.lede}</p>
        </div>
        <PlayHub games={games} initial={initial} tiers={tiers} practice={!campaign} contact={{ whatsapp: settings.whatsapp, telegram: settings.telegram, instagram: settings.instagram, phone: settings.phone }} />
      </div>
    </section>
  )
}
