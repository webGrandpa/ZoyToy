import type { Access, FieldAccess } from 'payload'

type Role = 'admin' | 'staff'
const roleOf = (user: unknown): Role | undefined =>
  (user as { roles?: Role[] } | null)?.roles?.includes('admin') ? 'admin' : (user as { roles?: Role[] } | null)?.roles?.includes('staff') ? 'staff' : undefined

export const isAdmin: Access = ({ req }) => roleOf(req.user) === 'admin'
export const isTeam: Access = ({ req }) => Boolean(roleOf(req.user))
export const isAdminField: FieldAccess = ({ req }) => roleOf(req.user) === 'admin'
export const isTeamField: FieldAccess = ({ req }) => Boolean(roleOf(req.user))

/** Public visitors see published, reserved and sold items (sold pages stay up for 30 days); the team sees everything. */
export const publishedOrTeam: Access = ({ req }) => {
  if (roleOf(req.user)) return true
  return { status: { in: ['published', 'reserved', 'sold'] } }
}

export const anyone: Access = () => true
