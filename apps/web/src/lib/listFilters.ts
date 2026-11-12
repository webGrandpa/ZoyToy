/** Quick filter chips above a collection list (components/admin/ListFilters.tsx). */
export const listFilters = (collection: string) => ({
  beforeListTable: [{ path: '/components/admin/ListFilters#ListFilters', clientProps: { collection } }],
})
