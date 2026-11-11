import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { isAdminField, isTeam, publishedOrTeam } from '../lib/access'
import { L } from '../lib/labels'
import { slugField } from '../fields/slug'

export const CONDITIONS = [
  { value: 'new', label: L('ახალი', 'Новое', 'New') },
  { value: 'new_open_box', label: L('ახალი, გახსნილი', 'Новое, вскрытое', 'New, open box') },
  { value: 'like_new', label: L('როგორც ახალი', 'Как новое', 'Like new') },
  { value: 'very_good', label: L('ძალიან კარგი', 'Очень хорошее', 'Very good') },
  { value: 'good', label: L('კარგი', 'Хорошее', 'Good') },
  { value: 'fair', label: L('ნორმალური', 'Нормальное', 'Fair') },
] as const

/** ZT-000123: next number after the highest existing SKU. */
const assignSku: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create' && !data.sku) {
    const last = await req.payload.find({ collection: 'products', sort: '-sku', limit: 1, depth: 0, req, overrideAccess: true })
    const lastNum = Number(String(last.docs[0]?.sku ?? 'ZT-0').replace(/\D/g, '')) || 0
    data.sku = `ZT-${String(lastNum + 1).padStart(6, '0')}`
  }
  return data
}

/** Timestamps for publishing and selling — used for "new arrivals" and hiding sold items after 30 days. */
const stampStatus: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const now = new Date().toISOString()
  if (data.status === 'published' && !data.publishedAt && !originalDoc?.publishedAt) data.publishedAt = now
  if (data.status === 'sold' && originalDoc?.status !== 'sold') data.soldAt = now
  if (data.status !== 'sold' && originalDoc?.status === 'sold') data.soldAt = null
  return data
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: L('ნივთი', 'Товар', 'Item'), plural: L('ნივთები', 'Товары', 'Items') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'condition', 'price', 'status', 'updatedAt'],
    listSearchableFields: ['title', 'sku'],
    group: L('კატალოგი', 'Каталог', 'Catalogue'),
  },
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: ({ req }) => Boolean(req.user?.roles?.includes('admin')) },
  versions: { maxPerDoc: 25 },
  hooks: { beforeChange: [assignSku, stampStatus] },
  fields: [
    // ---------- sidebar ----------
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      label: L('სტატუსი', 'Статус', 'Status'),
      admin: { position: 'sidebar' },
      options: [
        { value: 'draft', label: L('დრაფტი', 'Черновик', 'Draft') },
        { value: 'published', label: L('გამოქვეყნებული', 'Опубликован', 'Published') },
        { value: 'reserved', label: L('დაჯავშნილი', 'Забронирован', 'Reserved') },
        { value: 'sold', label: L('გაყიდული', 'Продан', 'Sold') },
        { value: 'archived', label: L('არქივი', 'Архив', 'Archived') },
      ],
    },
    { name: 'sku', type: 'text', unique: true, index: true, label: 'SKU', admin: { position: 'sidebar', readOnly: true, description: L('ავტომატური, QR ეტიკეტისთვის', 'Автоматически, для QR-этикетки', 'Automatic, for the QR label') } },
    slugField(),
    { name: 'publishedAt', type: 'date', index: true, label: L('გამოქვეყნდა', 'Опубликован', 'Published at'), admin: { position: 'sidebar', readOnly: true } },
    { name: 'soldAt', type: 'date', label: L('გაიყიდა', 'Продан', 'Sold at'), admin: { position: 'sidebar', readOnly: true } },
    {
      type: 'tabs',
      tabs: [
        // ---------- basics ----------
        {
          label: L('ძირითადი', 'Основное', 'Basics'),
          fields: [
            { name: 'title', type: 'text', localized: true, required: true, label: L('სახელი', 'Название', 'Title') },
            { name: 'shortDescription', type: 'textarea', localized: true, label: L('მოკლე აღწერა', 'Краткое описание', 'Short description'), maxLength: 220 },
            { name: 'description', type: 'richText', localized: true, label: L('სრული აღწერა', 'Полное описание', 'Full description') },
            {
              type: 'row',
              fields: [
                { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, required: true, label: L('კატეგორიები', 'Категории', 'Categories') },
                { name: 'franchises', type: 'relationship', relationTo: 'franchises', hasMany: true, label: L('ფრენჩაიზები', 'Франшизы', 'Franchises') },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'brand', type: 'relationship', relationTo: 'brands', label: L('ბრენდი', 'Бренд', 'Brand') },
                { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, label: L('თეგები', 'Теги', 'Tags') },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'ageMinMonths', type: 'number', min: 0, max: 240, label: L('ასაკი — დან (თვე)', 'Возраст от (мес.)', 'Age from (months)'), admin: { description: L('მაგ. 3 წელი = 36', 'Напр. 3 года = 36', 'e.g. 3 years = 36') } },
                { name: 'ageMaxMonths', type: 'number', min: 0, max: 240, label: L('ასაკი — მდე (თვე)', 'Возраст до (мес.)', 'Age to (months)') },
                {
                  name: 'origin',
                  type: 'select',
                  label: L('წარმოშობა', 'Происхождение', 'Origin'),
                  options: [
                    { value: 'usa', label: L('აშშ', 'США', 'USA') },
                    { value: 'europe', label: L('ევროპა', 'Европа', 'Europe') },
                    { value: 'other', label: L('სხვა', 'Другое', 'Other') },
                  ],
                },
              ],
            },
          ],
        },
        // ---------- condition (second-hand) ----------
        {
          label: L('მდგომარეობა', 'Состояние', 'Condition'),
          fields: [
            { name: 'condition', type: 'select', required: true, defaultValue: 'very_good', label: L('მდგომარეობა', 'Состояние', 'Condition'), options: [...CONDITIONS] },
            { name: 'conditionNotes', type: 'textarea', localized: true, label: L('შენიშვნა მდგომარეობაზე', 'Заметка о состоянии', 'Condition notes') },
            {
              name: 'defects',
              type: 'array',
              label: L('ხარვეზები', 'Дефекты', 'Defects'),
              labels: { singular: L('ხარვეზი', 'Дефект', 'Defect'), plural: L('ხარვეზები', 'Дефекты', 'Defects') },
              admin: { description: L('თითოეულს — მოკლე აღწერა და ფოტოზე წერტილი (X/Y პროცენტებში) ლუპისთვის', 'Каждому — описание и точка на фото (X/Y в процентах) для лупы', 'Each with a short note and a spot on the photo (X/Y in %) for the loupe') },
              fields: [
                { name: 'text', type: 'text', localized: true, required: true, label: L('აღწერა', 'Описание', 'Description') },
                { name: 'photo', type: 'upload', relationTo: 'media', label: L('ფოტო', 'Фото', 'Photo') },
                {
                  type: 'row',
                  fields: [
                    { name: 'x', type: 'number', min: 0, max: 100, label: 'X %' },
                    { name: 'y', type: 'number', min: 0, max: 100, label: 'Y %' },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'completeness',
                  type: 'select',
                  defaultValue: 'complete',
                  label: L('სისრულე', 'Комплектность', 'Completeness'),
                  options: [
                    { value: 'complete', label: L('სრული', 'Полная', 'Complete') },
                    { value: 'incomplete', label: L('აკლია ნაწილები', 'Не хватает деталей', 'Missing parts') },
                  ],
                },
                { name: 'hasBox', type: 'checkbox', label: L('ორიგინალი ყუთით', 'В оригинальной коробке', 'Original box') },
                { name: 'hasManual', type: 'checkbox', label: L('ინსტრუქციით', 'С инструкцией', 'Manual included') },
              ],
            },
            { name: 'missingParts', type: 'text', localized: true, label: L('რა აკლია', 'Чего не хватает', 'What is missing'), admin: { condition: (_, s) => s?.completeness === 'incomplete' } },
            {
              type: 'row',
              fields: [
                { name: 'tested', type: 'checkbox', defaultValue: true, label: L('შემოწმებულია, მუშაობს', 'Проверено, работает', 'Tested, works') },
                { name: 'cleanedAt', type: 'date', label: L('დეზინფექციის თარიღი', 'Дата дезинфекции', 'Disinfected on') },
                { name: 'batteries', type: 'text', localized: true, label: L('ელემენტები', 'Батарейки', 'Batteries'), admin: { description: L('მაგ. 3×AA, არ შედის', 'Напр. 3×AA, не входят', 'e.g. 3×AA, not included') } },
              ],
            },
          ],
        },
        // ---------- photos ----------
        {
          label: L('ფოტოები', 'Фото', 'Photos'),
          fields: [
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              maxRows: 8,
              label: L('ფოტოები', 'Фото', 'Photos'),
              labels: { singular: L('ფოტო', 'Фото', 'Photo'), plural: L('ფოტოები', 'Фото', 'Photos') },
              admin: { description: L('პირველი ფოტო მთავარია (კვადრატი, მინ. 1200px). 3–8 ფოტო: კუთხეები, ხარვეზები, ზომა', 'Первое фото — главное (квадрат, от 1200px). 3–8 фото: ракурсы, дефекты, размер', 'First photo is the main one (square, 1200px+). 3–8 photos: angles, defects, scale') },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true, label: L('ფოტო', 'Фото', 'Photo') },
                {
                  name: 'role',
                  type: 'select',
                  defaultValue: 'gallery',
                  label: L('როლი', 'Роль', 'Role'),
                  options: [
                    { value: 'main', label: L('მთავარი', 'Главное', 'Main') },
                    { value: 'gallery', label: L('გალერეა', 'Галерея', 'Gallery') },
                    { value: 'detail', label: L('დეტალი', 'Деталь', 'Detail') },
                    { value: 'defect', label: L('ხარვეზი', 'Дефект', 'Defect') },
                    { value: 'scale', label: L('ზომა', 'Размер', 'Scale') },
                  ],
                },
              ],
            },
          ],
        },
        // ---------- sale ----------
        {
          label: L('ყიდვა', 'Продажа', 'Sale'),
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'price', type: 'number', min: 0, required: true, access: { update: isAdminField }, label: L('ფასი ₾', 'Цена ₾', 'Price ₾'), admin: { step: 0.01 } },
                { name: 'compareAtPrice', type: 'number', min: 0, access: { update: isAdminField }, label: L('ძველი ფასი ₾ (აქცია)', 'Старая цена ₾ (акция)', 'Old price ₾ (sale)'), admin: { step: 0.01 } },
                { name: 'retailPriceNew', type: 'number', min: 0, label: L('ახლის ფასი ₾ (დაახლ.)', 'Цена нового ₾ (прибл.)', 'New retail price ₾ (approx.)'), admin: { step: 1, description: L('მყიდველს დაზოგვას ვაჩვენებთ', 'Показываем покупателю экономию', 'Used to show the saving') } },
              ],
            },
            {
              name: 'stock',
              type: 'array',
              label: L('მარაგი ფილიალებში', 'Остаток по филиалам', 'Stock by branch'),
              labels: { singular: L('ფილიალი', 'Филиал', 'Branch'), plural: L('ფილიალები', 'Филиалы', 'Branches') },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'location', type: 'relationship', relationTo: 'locations', required: true, label: L('ფილიალი', 'Филиал', 'Branch') },
                    { name: 'qty', type: 'number', min: 0, defaultValue: 1, required: true, label: L('რაოდენობა', 'Количество', 'Quantity') },
                  ],
                },
              ],
            },
          ],
        },
        // ---------- rental ----------
        {
          label: L('ქირა', 'Аренда', 'Rental'),
          fields: [
            {
              name: 'rental',
              type: 'group',
              label: false,
              fields: [
                { name: 'enabled', type: 'checkbox', label: L('ქირავდება', 'Сдаётся в аренду', 'Available for rent') },
                {
                  type: 'row',
                  admin: { condition: (_, s) => Boolean(s?.enabled) },
                  fields: [
                    { name: 'dailyRate', type: 'number', min: 0, label: L('დღიური ფასი ₾', 'Цена в день ₾', 'Daily rate ₾'), admin: { step: 0.5 } },
                    { name: 'deposit', type: 'number', min: 0, label: L('დეპოზიტი ₾', 'Залог ₾', 'Deposit ₾'), admin: { step: 1, description: L('ნაგულისხმევად = ნივთის ღირებულება', 'По умолчанию = стоимость вещи', 'Default = item value') } },
                    { name: 'minDays', type: 'number', min: 1, defaultValue: 1, label: L('მინ. დღე', 'Мин. дней', 'Min days') },
                    { name: 'maxDays', type: 'number', min: 1, defaultValue: 30, label: L('მაქს. დღე', 'Макс. дней', 'Max days') },
                  ],
                },
                { name: 'buyoutAllowed', type: 'checkbox', defaultValue: true, label: L('გამოსყიდვა შესაძლებელია', 'Можно выкупить', 'Buyout allowed'), admin: { condition: (_, s) => Boolean(s?.enabled) } },
              ],
            },
          ],
        },
        // ---------- shipping ----------
        {
          label: L('მიწოდება', 'Доставка', 'Shipping'),
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'weightGrams', type: 'number', min: 0, label: L('წონა (გ)', 'Вес (г)', 'Weight (g)') },
                { name: 'lengthCm', type: 'number', min: 0, label: L('სიგრძე (სმ)', 'Длина (см)', 'Length (cm)') },
                { name: 'widthCm', type: 'number', min: 0, label: L('სიგანე (სმ)', 'Ширина (см)', 'Width (cm)') },
                { name: 'heightCm', type: 'number', min: 0, label: L('სიმაღლე (სმ)', 'Высота (см)', 'Height (cm)') },
              ],
            },
            { name: 'fragile', type: 'checkbox', label: L('მყიფე', 'Хрупкое', 'Fragile') },
          ],
        },
        // ---------- SEO ----------
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: false,
              fields: [
                { name: 'title', type: 'text', localized: true, label: L('სათაური', 'Заголовок', 'Title') },
                { name: 'description', type: 'textarea', localized: true, label: L('აღწერა', 'Описание', 'Description'), maxLength: 160 },
              ],
            },
          ],
        },
      ],
    },
  ],
}
