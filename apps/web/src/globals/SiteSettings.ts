import type { Field, GlobalConfig } from 'payload'
import { anyone, isAdmin, isTeamField } from '../lib/access'
import { L } from '../lib/labels'
import { GAME_IDS } from '@zoytoy/games/catalog'
import { asLang, DEFAULT_TEMPLATES, PLACEHOLDERS, TEMPLATE_FIELD, TEMPLATE_KEYS, TEMPLATE_LABEL } from '../lib/telegram/templates'

/** One editable customer message per situation, in all three languages; empty = the built-in text. */
const messageFields: Field[] = TEMPLATE_KEYS.map((key) => ({
  name: TEMPLATE_FIELD[key],
  type: 'textarea',
  localized: true,
  label: TEMPLATE_LABEL[key],
  defaultValue: ({ locale }: { locale?: string }) => DEFAULT_TEMPLATES[key][asLang(locale)],
  admin: { rows: 4 },
}))

const chatIdError = { ka: 'მხოლოდ ციფრები (ჯგუფისას წინ „-“)', ru: 'Только цифры (для группы — с «-» впереди)', en: 'Digits only (groups start with “-”)' }

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: L('საიტის პარამეტრები', 'Настройки сайта', 'Site settings'),
  admin: { group: L('სისტემა', 'Система', 'System') },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: L('კონტაქტი', 'Контакты', 'Contacts'),
          fields: [
            { name: 'phone', type: 'text', label: L('ტელეფონი', 'Телефон', 'Phone') },
            { name: 'whatsapp', type: 'text', label: 'WhatsApp', admin: { description: L('ნომერი საერთაშორისო ფორმატში, მაგ. 9955XXXXXXXX', 'Номер в международном формате, напр. 9955XXXXXXXX', 'International format, e.g. 9955XXXXXXXX') } },
            { name: 'telegram', type: 'text', label: 'Telegram', admin: { description: L('მომხმარებლის სახელი @-ის გარეშე', 'Имя пользователя без @', 'Username without @') } },
            { name: 'viber', type: 'text', label: 'Viber', admin: { description: L('ნომერი საერთაშორისო ფორმატში, მაგ. 9955XXXXXXXX', 'Номер в международном формате, напр. 9955XXXXXXXX', 'International format, e.g. 9955XXXXXXXX') } },
            { name: 'email', type: 'email', label: L('ელფოსტა', 'Эл. почта', 'Email') },
            {
              type: 'collapsible',
              label: L('სოციალური ქსელები', 'Соцсети', 'Social networks'),
              admin: { description: L('ჩაწერე ბმული ან სახელი (@-ით ან მის გარეშე). საიტზე ჩანს მხოლოდ შევსებული — ფუტერში და „კონტაქტის“ გვერდზე.', 'Ссылка или имя (с @ или без). На сайте видны только заполненные — в подвале и на странице «Контакты».', 'A link or a handle (with or without @). Only the filled ones show on the site — footer and the Contact page.') },
              fields: [
                { name: 'instagram', type: 'text', defaultValue: 'zoy.toy', label: 'Instagram' },
                { name: 'facebook', type: 'text', label: 'Facebook' },
                { name: 'tiktok', type: 'text', label: 'TikTok' },
                { name: 'youtube', type: 'text', label: 'YouTube' },
              ],
            },
            { name: 'hours', type: 'text', localized: true, label: L('სამუშაო საათები', 'Часы работы', 'Opening hours') },
          ],
        },
        {
          label: L('სეზონი და განწყობა', 'Сезон и настроение', 'Season & mood'),
          fields: [
            {
              name: 'season',
              type: 'select',
              defaultValue: 'auto',
              label: L('ზოის კოსტიუმი', 'Костюм Зои', 'Zoy’s outfit'),
              options: [
                { value: 'auto', label: L('ავტომატურად თარიღით', 'Автоматически по дате', 'Automatic by date') },
                { value: 'none', label: L('ჩვეულებრივი', 'Обычный', 'Regular') },
                { value: 'ny', label: L('ახალი წელი', 'Новый год', 'New Year') },
                { value: 'summer', label: L('ზაფხული ბათუმში', 'Лето в Батуми', 'Batumi summer') },
                { value: 'june1', label: L('1 ივნისი', '1 июня', 'June 1') },
                { value: 'school', label: L('სკოლა', 'Школа', 'School') },
              ],
            },
            { name: 'announcement', type: 'text', localized: true, label: L('განცხადება ჰედერში', 'Объявление в шапке', 'Header announcement') },
            { name: 'savedTotal', type: 'number', min: 0, label: L('„მყიდველებმა დაზოგეს“ ₾', '«Покупатели сэкономили» ₾', '“Customers saved” ₾') },
          ],
        },
        {
          label: L('თამაშები', 'Игры', 'Games'),
          fields: [
            {
              name: 'games',
              type: 'select',
              hasMany: true,
              label: L('საიტზე ნაჩვენები თამაშები', 'Игры на сайте', 'Games shown on the site'),
              defaultValue: [...GAME_IDS],
              options: [
                { value: 'toy-drop', label: L('🧺 სათამაშოების წვიმა — დაიჭირე კალათით', '🧺 Дождь игрушек — лови корзинкой', '🧺 Toy rain — catch with the basket') },
                { value: 'memory', label: L('🃏 ზოის მეხსიერება — იპოვე წყვილები', '🃏 Память Зои — найди пары', '🃏 Zoy’s memory — find the pairs') },
                { value: 'whack', label: L('📦 დამალობანა — დაიჭირე ამომხტარი ზოი', '📦 Прятки — поймай Зои', '📦 Peek-a-Zoy — catch Zoy popping up') },
                { value: 'stack', label: L('🧱 სათამაშოების კოშკი — ააშენე მაღლა', '🧱 Башня из игрушек — строй выше', '🧱 Toy tower — build it high') },
              ],
              admin: {
                description: L(
                  'მონიშნე, რომელი თამაშები ჩანდეს გვერდზე „თამაში“ (თუ არცერთია მონიშნული, ყველა ჩანს). თუ ერთზე მეტია, მომხმარებელი თვითონ აირჩევს. ქულები ყველა თამაშში ერთნაირ მასშტაბზეა, ამიტომ კამპანიის ჯილდოს საფეხურები ყველაზე ერთნაირად მუშაობს.',
                  'Отметьте, какие игры показывать на странице «Игра» (если ничего не отмечено — показываются все). Если игр несколько, посетитель выберет сам. Очки во всех играх в одном масштабе — уровни наград кампании работают одинаково.',
                  'Tick the games shown on the Play page (none ticked = all of them). With more than one, visitors pick. All games score on the same scale, so the campaign reward tiers work the same for each.',
                ),
              },
            },
          ],
        },
        {
          label: 'Telegram',
          description: L(
            'ახალი შეკვეთები ბოტში მოდის ფოტოთი და ღილაკებით (დადასტურება, გადახდა, გაგზავნა, გაუქმება, WhatsApp, დარეკვა). დაყენება: docs/09.',
            'Новые заказы приходят в бот с фото и кнопками (подтвердить, оплачен, отправлен, отменить, WhatsApp, позвонить). Настройка: docs/09.',
            'New orders reach the bot with a photo and buttons (confirm, paid, shipped, cancel, WhatsApp, call). Setup: docs/09.',
          ),
          fields: [
            {
              name: 'telegramChatId',
              type: 'text',
              // the owner's private chat id is nobody else's business — the bot reads it with overrideAccess
              access: { read: isTeamField },
              label: L('ჩატის ნომერი', 'Номер чата', 'Chat ID'),
              validate: (value: unknown, { req }: { req: { i18n?: { language?: string } } }) =>
                !value || /^-?\d{5,20}$/.test(String(value).trim()) || chatIdError[asLang(req.i18n?.language)],
              admin: {
                description: L(
                  'ბოტს Telegram-ში მისწერე /start — ის ამ ნომრით გიპასუხებს. თანამშრომლებთან ერთად: დაამატე ბოტი ჯგუფში და იქ დაწერე /start. მხოლოდ ამ ჩატს შეუძლია შეკვეთების მართვა.',
                  'Напишите боту /start в Telegram — он ответит этим номером. Вместе с сотрудниками: добавьте бота в группу и напишите /start там. Управлять заказами может только этот чат.',
                  'Send /start to the bot in Telegram — it replies with this number. With staff: add the bot to a group and send /start there. Only this chat can manage orders.',
                ),
              },
            },
            { name: 'telegramDigest', type: 'checkbox', defaultValue: true, access: { read: isTeamField }, label: L('დილის შეჯამება ყოველდღე 10:00-ზე', 'Утренняя сводка каждый день в 10:00', 'Morning digest every day at 10:00') },
            { name: 'telegramDigestAt', type: 'date', access: { read: isTeamField }, admin: { hidden: true } },
          ],
        },
        {
          label: L('შეტყობინებები', 'Сообщения', 'Messages'),
          description: L(
            `მზა ტექსტები მყიდველისთვის. Telegram-ის ბოტი და შეკვეთის გვერდი WhatsApp-ს ამ ტექსტით ხსნის, მყიდველის ენაზე (ენა — ზემოთ). ცარიელი ველი = სტანდარტული ტექსტი. ჩასასმელი: ${PLACEHOLDERS.join(' ')}`,
            `Готовые тексты для покупателя. Бот в Telegram и страница заказа открывают WhatsApp с этим текстом на языке покупателя (язык — вверху). Пустое поле = стандартный текст. Подстановки: ${PLACEHOLDERS.join(' ')}`,
            `Ready-made texts for the customer. The Telegram bot and the order page open WhatsApp with this text in the customer's language (language switch above). Empty = the built-in text. Placeholders: ${PLACEHOLDERS.join(' ')}`,
          ),
          fields: messageFields,
        },
      ],
    },
  ],
}
