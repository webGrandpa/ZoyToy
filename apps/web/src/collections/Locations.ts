import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../lib/access'
import { L } from '../lib/labels'

/** Shop branches. One today (Batumi); stock is already tracked per branch (docs/04). */
export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: { singular: L('ფილიალი', 'Филиал', 'Branch'), plural: L('ფილიალები', 'Филиалы', 'Branches') },
  admin: { useAsTitle: 'title', group: L('სისტემა', 'Система', 'System') },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, label: L('სახელი', 'Название', 'Title') },
    { name: 'city', type: 'text', localized: true, required: true, label: L('ქალაქი', 'Город', 'City') },
    { name: 'address', type: 'text', localized: true, label: L('მისამართი', 'Адрес', 'Address') },
    { name: 'hours', type: 'text', localized: true, label: L('სამუშაო საათები', 'Часы работы', 'Opening hours') },
    { name: 'phone', type: 'text', label: L('ტელეფონი', 'Телефон', 'Phone') },
    { name: 'mapUrl', type: 'text', label: L('რუკის ბმული', 'Ссылка на карту', 'Map link') },
    { name: 'isPickupPoint', type: 'checkbox', defaultValue: true, label: L('გატანის წერტილი', 'Пункт самовывоза', 'Pickup point') },
    { name: 'active', type: 'checkbox', defaultValue: true, label: L('აქტიური', 'Активен', 'Active') },
  ],
}
