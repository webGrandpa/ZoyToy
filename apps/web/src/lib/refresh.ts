import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig, GlobalAfterChangeHook, GlobalConfig } from 'payload'

/**
 * Storefront pages are cached (ISR: `revalidate = 120` in [locale]/layout.tsx). Any edit to content the
 * shop shows marks every storefront page stale, so the next visitor sees it at once instead of within
 * two minutes; the admin is untouched. Outside a Next.js request (seed, migrations, scripts) there is
 * no page cache and Next throws — nothing to refresh then.
 */
export function refreshStorefront() {
  try {
    revalidatePath('/(frontend)/[locale]', 'layout')
  } catch {
    /* no Next.js request context */
  }
}

const afterChange: CollectionAfterChangeHook = ({ doc }) => {
  refreshStorefront()
  return doc
}

const afterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  refreshStorefront()
  return doc
}

const afterGlobalChange: GlobalAfterChangeHook = ({ doc }) => {
  refreshStorefront()
  return doc
}

/** The collection with storefront refresh hooks added after its own. */
export function withRefresh(collection: CollectionConfig): CollectionConfig {
  const hooks = collection.hooks ?? {}
  return {
    ...collection,
    hooks: { ...hooks, afterChange: [...(hooks.afterChange ?? []), afterChange], afterDelete: [...(hooks.afterDelete ?? []), afterDelete] },
  }
}

/** The global with a storefront refresh hook added after its own. */
export function withGlobalRefresh(global: GlobalConfig): GlobalConfig {
  const hooks = global.hooks ?? {}
  return { ...global, hooks: { ...hooks, afterChange: [...(hooks.afterChange ?? []), afterGlobalChange] } }
}
