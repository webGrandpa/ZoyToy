import type { CollectionConfig } from 'payload'
import { isAdmin } from '../lib/access'
import { L } from '../lib/labels'
import { GROUP } from '../lib/groups'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: L('თანამშრომელი', 'Сотрудник', 'Team member'), plural: L('თანამშრომლები', 'Сотрудники', 'Team') },
  admin: { useAsTitle: 'email', group: GROUP.system },
  auth: true,
  access: {
    create: isAdmin,
    delete: isAdmin,
    // everyone on the team can see and edit their own profile; admins see all
    read: ({ req }) => (!req.user ? false : req.user.roles?.includes('admin') ? true : { id: { equals: req.user.id } }),
    update: ({ req }) => (!req.user ? false : req.user.roles?.includes('admin') ? true : { id: { equals: req.user.id } }),
  },
  fields: [
    { name: 'name', type: 'text', label: L('სახელი', 'Имя', 'Name') },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['staff'],
      required: true,
      saveToJWT: true,
      label: L('როლი', 'Роль', 'Role'),
      access: { update: ({ req }) => Boolean(req.user?.roles?.includes('admin')) },
      options: [
        { value: 'admin', label: L('მეპატრონე (ყველა უფლება)', 'Владелец (все права)', 'Owner (full access)') },
        { value: 'staff', label: L('თანამშრომელი', 'Сотрудник', 'Staff') },
      ],
    },
  ],
}
