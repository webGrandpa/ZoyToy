import crypto from 'crypto'
import type { CollectionConfig, Endpoint } from 'payload'
import { isAdmin, isTeam } from '../lib/access'
import { GROUP } from '../lib/groups'
import { L } from '../lib/labels'
import { listFilters } from '../lib/listFilters'
import { inBackground, notifyWish } from '../lib/telegram/bot'

const MAX_PER_IP = 5 // a day — plenty for a person, a wall against spam
const hashIp = (ip: string) => crypto.createHash('sha256').update(`wish:${ip}:${process.env.PAYLOAD_SECRET || ''}`).digest('hex').slice(0, 16)

/**
 * POST /api/wishes/send {text, phone?, name?, locale, source, website} — the storefront's „What toy should
 * we add?“ form (owner, 2026-11). `website` is a hidden field people never fill in; bots do.
 */
const send: Endpoint = {
  path: '/send',
  method: 'post',
  handler: async (req) => {
    const body = ((await req.json?.().catch(() => null)) ?? {}) as Record<string, unknown>
    if (String(body.website ?? '').trim()) return Response.json({ ok: true }) // a bot: pretend it worked
    const text = String(body.text ?? '').trim().replace(/\s+/g, ' ').slice(0, 500)
    if (text.length < 3) return Response.json({ error: 'text' }, { status: 422 })
    const phone = String(body.phone ?? '').replace(/[^\d+]/g, '').slice(0, 16)
    if (phone && phone.replace(/\D/g, '').length < 9) return Response.json({ error: 'phone' }, { status: 422 })
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    const ipHash = hashIp(ip)
    const recent = await req.payload.count({
      collection: 'wishes',
      overrideAccess: true,
      where: { and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: new Date(Date.now() - 24 * 3600e3).toISOString() } }] },
    })
    if (recent.totalDocs >= MAX_PER_IP) return Response.json({ error: 'rate_limited' }, { status: 429 })
    const wish = await req.payload.create({
      collection: 'wishes',
      overrideAccess: true,
      data: {
        text,
        phone: phone || null,
        name: String(body.name ?? '').trim().slice(0, 60) || null,
        locale: (['ka', 'ru', 'en'].includes(String(body.locale)) ? String(body.locale) : 'ka') as 'ka',
        source: (['catalog', 'empty', 'home'].includes(String(body.source)) ? String(body.source) : 'home') as 'home',
        status: 'new',
        ipHash,
      },
    })
    inBackground(
      () => notifyWish(req.payload, wish),
      (e) => req.payload.logger.warn(`Telegram wish notify failed: ${String(e)}`),
    )
    return Response.json({ ok: true })
  },
}

/** What customers would like the shop to bring in — read by the owner, also sent to the Telegram chat. */
export const Wishes: CollectionConfig = {
  slug: 'wishes',
  labels: { singular: L('სურვილი', 'Пожелание', 'Wish'), plural: L('მყიდველების სურვილები', 'Пожелания покупателей', 'Customer wishes') },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'phone', 'status', 'createdAt'],
    group: GROUP.sales,
    components: listFilters('wishes'),
    description: L(
      'საიტის ფორმიდან „როგორი სათამაშო გსურთ, რომ დაგვემატოს?“. თუ ტელეფონი დატოვეს, ნივთის შემოსვლისას შეატყობინე და სტატუსი „დაემატა“ დააყენე.',
      'Из формы на сайте «Какую игрушку вы хотите у нас увидеть?». Если оставили телефон — сообщите, когда вещь появится, и поставьте статус «Добавлено».',
      'From the site form “What toy should we add?”. If they left a phone, tell them when it arrives and set the status to “Added”.',
    ),
  },
  access: { read: isTeam, create: () => false, update: isTeam, delete: isAdmin },
  endpoints: [send],
  defaultSort: '-createdAt',
  fields: [
    { name: 'text', type: 'textarea', required: true, label: L('რა სათამაშო სურს', 'Какую игрушку хочет', 'Wished toy'), admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: L('სახელი', 'Имя', 'Name'), admin: { readOnly: true } },
        { name: 'phone', type: 'text', label: L('ტელეფონი', 'Телефон', 'Phone'), admin: { readOnly: true, description: L('ცარიელია, თუ არ დატოვა', 'Пусто, если не оставили', 'Empty if not left') } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      index: true,
      label: L('სტატუსი', 'Статус', 'Status'),
      options: [
        { value: 'new', label: L('ახალი', 'Новое', 'New') },
        { value: 'seen', label: L('ნანახი', 'Просмотрено', 'Seen') },
        { value: 'added', label: L('დაემატა', 'Добавлено', 'Added') },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'notes', type: 'textarea', label: L('შენიშვნა', 'Заметка', 'Note'), admin: { description: L('შიდა — მყიდველი ვერ ხედავს', 'Внутренняя — покупатель не видит', 'Internal — never shown') } },
    { name: 'locale', type: 'select', defaultValue: 'ka', label: L('ენა', 'Язык', 'Language'), options: ['ka', 'ru', 'en'].map((v) => ({ value: v, label: v })), admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'source',
      type: 'select',
      label: L('სად დაწერა', 'Где оставили', 'Left on'),
      options: [
        { value: 'home', label: L('მთავარი გვერდი', 'Главная', 'Home page') },
        { value: 'catalog', label: L('კატალოგი', 'Каталог', 'Catalogue') },
        { value: 'empty', label: L('ძებნამ ვერ იპოვა', 'Поиск ничего не нашёл', 'Search found nothing') },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true } },
  ],
}
