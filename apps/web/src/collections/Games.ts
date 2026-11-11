import crypto from 'crypto'
import type { CollectionConfig, Endpoint, Payload } from 'payload'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { shopDayStart } from '../lib/store'
import { tierFor, type Tier } from '@zoytoy/games/toy-drop'
import { GAME_IDS, isGameId, verifyRound, type GameId } from '@zoytoy/games/catalog'
import { anyone, isAdmin, isTeam } from '../lib/access'
import { L } from '../lib/labels'

const GLOBAL_MAX_PERCENT = 50
const sign = (id: number | string, seed: number) => crypto.createHmac('sha256', process.env.PAYLOAD_SECRET || 'dev').update(`${id}:${seed}`).digest('hex').slice(0, 32)
const hashIp = (ip: string) => crypto.createHash('sha256').update(`${ip}:${process.env.PAYLOAD_SECRET || ''}`).digest('hex').slice(0, 16)
const ipOf = (h: Headers) => h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
/** Daily attempts reset at midnight in Batumi, not at the server's UTC midnight. */
const startOfToday = () => shopDayStart().toISOString()

/** Takes the round for checking exactly once: of two /finish calls for one session, only one gets through. */
async function claimRound(payload: Payload, id: number) {
  const db = (payload.db as unknown as PostgresAdapter).drizzle
  const res = await db.execute(sql`UPDATE "game_sessions" SET "finished_at" = now() WHERE "id" = ${id} AND "verdict" = 'playing' AND "finished_at" IS NULL RETURNING "id"`)
  return ((res as { rows?: unknown[] }).rows ?? []).length === 1
}

/** Games the owner switched on in Site settings → Games (empty = all of them). */
export async function enabledGames(payload: Payload): Promise<GameId[]> {
  const s = await payload.findGlobal({ slug: 'site-settings', depth: 0 }).catch(() => null)
  const list = ((s as { games?: string[] | null } | null)?.games ?? []).filter(isGameId)
  return list.length ? GAME_IDS.filter((g) => list.includes(g)) : [...GAME_IDS]
}

/** The campaign that is switched on and inside its dates, if any. */
export async function activeCampaign(payload: Payload, locale: 'ka' | 'ru' | 'en' = 'ka') {
  const now = new Date().toISOString()
  const res = await payload.find({
    collection: 'game-campaigns',
    locale,
    depth: 0,
    limit: 1,
    sort: '-updatedAt',
    overrideAccess: true,
    where: {
      and: [
        { active: { equals: true } },
        { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] },
        { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: now } }] },
      ],
    },
  })
  return res.docs[0] ?? null
}

const tiersOf = (c: { tiers?: { minScore: number; percent: number }[] | null; maxPercent?: number | null }): Tier[] =>
  (c.tiers ?? []).map((t) => ({ minScore: t.minScore, percent: Math.min(t.percent, c.maxPercent ?? GLOBAL_MAX_PERCENT, GLOBAL_MAX_PERCENT) }))

function newCode() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return `ZOY-${Array.from(crypto.randomBytes(5), (b) => abc[b % abc.length]).join('')}`
}

const start: Endpoint = {
  path: '/start',
  method: 'post',
  handler: async (req) => {
    const body = ((await req.json?.().catch(() => null)) ?? {}) as { deviceId?: string; game?: string }
    const deviceId = String(body.deviceId ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 64) || 'anon'
    const enabled = await enabledGames(req.payload)
    const game: GameId = isGameId(body.game) && enabled.includes(body.game) ? body.game : enabled[0]
    const ip = hashIp(ipOf(req.headers))
    const campaign = await activeCampaign(req.payload)
    const limit = campaign?.attemptsPerDay ?? 3
    if (campaign) {
      const today = await req.payload.count({
        collection: 'game-sessions',
        overrideAccess: true,
        where: { and: [{ campaign: { equals: campaign.id } }, { createdAt: { greater_than_equal: startOfToday() } }, { or: [{ deviceId: { equals: deviceId } }, { ipHash: { equals: ip } }] }] },
      })
      if (today.totalDocs >= limit * 2) return Response.json({ error: 'limit', left: 0 }, { status: 429 })
      const byDevice = await req.payload.count({
        collection: 'game-sessions',
        overrideAccess: true,
        where: { and: [{ campaign: { equals: campaign.id } }, { createdAt: { greater_than_equal: startOfToday() } }, { deviceId: { equals: deviceId } }] },
      })
      if (byDevice.totalDocs >= limit) return Response.json({ error: 'limit', left: 0 }, { status: 429 })
    }
    const seed = crypto.randomBytes(4).readUInt32BE(0)
    const session = await req.payload.create({
      collection: 'game-sessions',
      overrideAccess: true,
      data: { campaign: campaign?.id, game, seed, deviceId, ipHash: ip, startedAt: new Date().toISOString(), verdict: 'playing' },
    })
    return Response.json({ id: session.id, seed, game, token: sign(session.id, seed), practice: !campaign })
  },
}

const finish: Endpoint = {
  path: '/finish',
  method: 'post',
  handler: async (req) => {
    const body = ((await req.json?.().catch(() => null)) ?? {}) as { id?: number; token?: string; inputs?: unknown; score?: number; deviceId?: string }
    const id = Number(body.id)
    if (!id || !body.token || !Array.isArray(body.inputs)) return Response.json({ error: 'bad_request' }, { status: 400 })
    const session = await req.payload.findByID({ collection: 'game-sessions', id, overrideAccess: true, depth: 0 }).catch(() => null)
    if (!session || session.verdict !== 'playing') return Response.json({ error: 'used' }, { status: 409 })
    if (sign(id, session.seed) !== body.token) return Response.json({ error: 'token' }, { status: 403 })
    if (!(await claimRound(req.payload, id))) return Response.json({ error: 'used' }, { status: 409 })

    const elapsed = Date.now() - new Date(session.startedAt ?? session.createdAt).getTime()
    // replay the round with the same seed and the recorded moves — every game has its own rules (packages/games)
    const game: GameId = isGameId(session.game) ? session.game : 'toy-drop'
    const { score, reasons } = verifyRound(game, session.seed, body.inputs, Number(body.score), elapsed)
    const result = { score }
    const verdict = reasons.length ? 'rejected' : 'valid'
    await req.payload.update({ collection: 'game-sessions', id, overrideAccess: true, data: { verdict, score: result.score, claimedScore: Number(body.score) || 0, finishedAt: new Date().toISOString(), reasons: reasons.join(', ') } })
    if (verdict !== 'valid' || !session.campaign) return Response.json({ score: result.score, verdict, percent: 0 })

    const campaign = await req.payload.findByID({ collection: 'game-campaigns', id: session.campaign as number, overrideAccess: true, depth: 0 })
    const percent = tierFor(result.score, tiersOf(campaign))
    if (!percent) return Response.json({ score: result.score, verdict, percent: 0 })

    // one living reward per device and campaign: keep the best, upgrade when beaten
    const existing = await req.payload.find({
      collection: 'rewards',
      overrideAccess: true,
      limit: 1,
      sort: '-percent',
      // an expired code is not "kept" — a new good round earns a fresh one
      where: { and: [{ campaign: { equals: campaign.id } }, { deviceId: { equals: session.deviceId } }, { status: { equals: 'issued' } }, { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: new Date().toISOString() } }] }] },
    })
    const best = existing.docs[0]
    if (best && best.percent >= percent) return Response.json({ score: result.score, verdict, percent: best.percent, code: best.code, expiresAt: best.expiresAt, kept: true })
    if (best) await req.payload.update({ collection: 'rewards', id: best.id, overrideAccess: true, data: { status: 'replaced' } })
    const expiresAt = new Date(Date.now() + (campaign.validityHours ?? 48) * 3600 * 1000).toISOString()
    const reward = await req.payload.create({
      collection: 'rewards',
      overrideAccess: true,
      data: { code: newCode(), campaign: campaign.id, session: id, deviceId: session.deviceId, percent, score: result.score, expiresAt, status: 'issued' },
    })
    return Response.json({ score: result.score, verdict, percent, code: reward.code, expiresAt })
  },
}

export const GameCampaigns: CollectionConfig = {
  slug: 'game-campaigns',
  labels: { singular: L('თამაშის კამპანია', 'Игровая кампания', 'Game campaign'), plural: L('თამაშის კამპანიები', 'Игровые кампании', 'Game campaigns') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'maxPercent', 'updatedAt'],
    group: L('თამაშები', 'Игры', 'Games'),
    description: L('ჯილდოები მოქმედებს ყველა თამაშზე, რომელიც ჩართულია „საიტის პარამეტრები → თამაშები“-ში.', 'Награды действуют во всех играх, включённых в «Настройки сайта → Игры».', 'Rewards apply to every game switched on in Site settings → Games.'),
  },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, label: L('სახელი', 'Название', 'Title') },
    { name: 'active', type: 'checkbox', defaultValue: true, label: L('აქტიური', 'Активна', 'Active'), admin: { position: 'sidebar' } },
    // kept for older records; which games are shown is chosen in Site settings → Games
    { name: 'game', type: 'select', defaultValue: 'toy-drop', label: L('თამაში', 'Игра', 'Game'), options: [{ value: 'toy-drop', label: L('ჩამოვარდნილი სათამაშოები', 'Падающие игрушки', 'Toy Drop') }], admin: { hidden: true } },
    {
      name: 'tiers',
      type: 'array',
      minRows: 1,
      label: L('ჯილდოს საფეხურები', 'Уровни наград', 'Reward tiers'),
      admin: { description: L('ქულა → ფასდაკლება %. მაქსიმუმი 50%.', 'Очки → скидка %. Максимум 50%.', 'Score → discount %. Maximum 50%.') },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'minScore', type: 'number', required: true, min: 1, label: L('მინ. ქულა', 'Мин. очки', 'Min score') },
            { name: 'percent', type: 'number', required: true, min: 1, max: GLOBAL_MAX_PERCENT, label: L('ფასდაკლება %', 'Скидка %', 'Discount %') },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'maxPercent', type: 'number', defaultValue: 50, min: 1, max: GLOBAL_MAX_PERCENT, label: L('მაქს. % ამ კამპანიაში', 'Макс. % в кампании', 'Max % in this campaign') },
        { name: 'validityHours', type: 'number', defaultValue: 48, min: 1, label: L('ჯილდოს ვადა (სთ)', 'Срок награды (ч)', 'Reward valid (h)') },
        { name: 'attemptsPerDay', type: 'number', defaultValue: 3, min: 1, max: 20, label: L('ცდა დღეში', 'Попыток в день', 'Attempts per day') },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', label: L('დაწყება', 'Начало', 'Starts') },
        { name: 'endsAt', type: 'date', label: L('დასრულება', 'Конец', 'Ends') },
      ],
    },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, label: L('კატეგორიები (ცარიელი = ყველა)', 'Категории (пусто = все)', 'Categories (empty = all)') },
  ],
}

export const GameSessions: CollectionConfig = {
  slug: 'game-sessions',
  labels: { singular: L('თამაშის სესია', 'Игровая сессия', 'Game session'), plural: L('თამაშის სესიები', 'Игровые сессии', 'Game sessions') },
  admin: { defaultColumns: ['id', 'verdict', 'score', 'reasons', 'createdAt'], group: L('თამაშები', 'Игры', 'Games') },
  access: { read: isTeam, create: () => false, update: isAdmin, delete: isAdmin },
  endpoints: [start, finish],
  fields: [
    { name: 'campaign', type: 'relationship', relationTo: 'game-campaigns', label: L('კამპანია', 'Кампания', 'Campaign') },
    { name: 'game', type: 'text', label: L('თამაში', 'Игра', 'Game') },
    { name: 'seed', type: 'number', required: true, label: 'Seed' },
    {
      name: 'verdict', type: 'select', index: true, label: L('შედეგი', 'Вердикт', 'Verdict'),
      options: [
        { value: 'playing', label: L('მიმდინარე', 'Идёт', 'Playing') },
        { value: 'valid', label: L('სწორი', 'Честная', 'Valid') },
        { value: 'rejected', label: L('უარყოფილი (საეჭვო)', 'Отклонена (подозрительно)', 'Rejected (suspicious)') },
      ],
    },
    { type: 'row', fields: [{ name: 'score', type: 'number', label: L('ქულა (სერვერი)', 'Очки (сервер)', 'Score (server)') }, { name: 'claimedScore', type: 'number', label: L('ქულა (ბრაუზერი)', 'Очки (браузер)', 'Score (browser)') }] },
    { name: 'reasons', type: 'text', label: L('მიზეზები', 'Причины', 'Reasons') },
    { type: 'row', fields: [{ name: 'deviceId', type: 'text', index: true, label: L('მოწყობილობა', 'Устройство', 'Device') }, { name: 'ipHash', type: 'text', index: true, label: 'IP hash' }] },
    { type: 'row', fields: [{ name: 'startedAt', type: 'date', label: L('დაიწყო', 'Начало', 'Started'), admin: { date: { pickerAppearance: 'dayAndTime' } } }, { name: 'finishedAt', type: 'date', label: L('დასრულდა', 'Конец', 'Finished'), admin: { date: { pickerAppearance: 'dayAndTime' } } }] },
  ],
}

export const Rewards: CollectionConfig = {
  slug: 'rewards',
  labels: { singular: L('ჯილდო', 'Награда', 'Reward'), plural: L('ჯილდოები', 'Награды', 'Rewards') },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'percent', 'status', 'phone', 'expiresAt'],
    listSearchableFields: ['code', 'phone'],
    group: L('თამაშები', 'Игры', 'Games'),
    description: L('შეკვეთისას შეამოწმე კოდი: სტატუსი „გაცემული“, ვადა არ გასულა, ერთი ნომერი — ერთი ჯილდო. გამოყენებისას დააყენე „გამოყენებული“ და ჩაწერე ნომერი.', 'При заказе проверьте код: статус «выдан», срок не истёк, один номер — одна награда. После использования поставьте «использован» и впишите номер.', 'At checkout check the code: status “issued”, not expired, one reward per phone. Once used, set “redeemed” and note the phone.'),
  },
  access: { read: isTeam, create: () => false, update: isTeam, delete: isAdmin },
  fields: [
    { name: 'code', type: 'text', unique: true, index: true, required: true, label: L('კოდი', 'Код', 'Code'), admin: { readOnly: true } },
    { type: 'row', fields: [{ name: 'percent', type: 'number', required: true, label: L('ფასდაკლება %', 'Скидка %', 'Discount %') }, { name: 'score', type: 'number', label: L('ქულა', 'Очки', 'Score') }] },
    {
      name: 'status', type: 'select', defaultValue: 'issued', index: true, label: L('სტატუსი', 'Статус', 'Status'),
      options: [
        { value: 'issued', label: L('გაცემული', 'Выдан', 'Issued') },
        { value: 'redeemed', label: L('გამოყენებული', 'Использован', 'Redeemed') },
        { value: 'replaced', label: L('შეცვლილი უკეთესით', 'Заменён лучшим', 'Replaced by a better one') },
        { value: 'revoked', label: L('გაუქმებული', 'Отозван', 'Revoked') },
      ],
    },
    { name: 'expiresAt', type: 'date', label: L('ვადა', 'Действует до', 'Expires'), admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'phone', type: 'text', index: true, label: L('ვინ გამოიყენა (ტელეფონი)', 'Кто использовал (телефон)', 'Redeemed by (phone)') },
    { name: 'order', type: 'relationship', relationTo: 'orders', label: L('შეკვეთა', 'Заказ', 'Order') },
    { type: 'row', fields: [{ name: 'campaign', type: 'relationship', relationTo: 'game-campaigns', label: L('კამპანია', 'Кампания', 'Campaign') }, { name: 'session', type: 'relationship', relationTo: 'game-sessions', label: L('სესია', 'Сессия', 'Session') }] },
    { name: 'deviceId', type: 'text', index: true, label: L('მოწყობილობა', 'Устройство', 'Device') },
  ],
}
