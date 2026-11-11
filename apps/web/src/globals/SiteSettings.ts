import type { GlobalConfig } from 'payload'
import { anyone, isAdmin } from '../lib/access'
import { L } from '../lib/labels'
import { GAME_IDS } from '@zoytoy/games/catalog'

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
            { name: 'instagram', type: 'text', defaultValue: 'zoy.toy', label: 'Instagram' },
            { name: 'facebook', type: 'text', label: 'Facebook (URL)' },
            { name: 'tiktok', type: 'text', label: 'TikTok' },
            { name: 'email', type: 'email', label: L('ელფოსტა', 'Эл. почта', 'Email') },
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
      ],
    },
  ],
}
