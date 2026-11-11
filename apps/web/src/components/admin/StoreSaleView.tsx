import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { StoreSale } from './StoreSale'

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined

/** /admin/store-sale — custom views are public in Payload, so the team check happens here. */
export function StoreSaleView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin
  const team = req.user?.roles?.some((r) => r === 'admin' || r === 'staff')
  if (!team) redirect(`${admin}/login?redirect=${encodeURIComponent(`${admin}/store-sale`)}`)
  const id = Number(one(searchParams?.id))
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <StoreSale initialId={Number.isInteger(id) && id > 0 ? id : undefined} initialQuery={one(searchParams?.q)?.slice(0, 120)} />
      </Gutter>
    </DefaultTemplate>
  )
}
