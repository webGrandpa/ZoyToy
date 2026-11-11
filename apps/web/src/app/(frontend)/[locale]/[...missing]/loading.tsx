/**
 * Unknown addresses only: an (invisible) loading boundary makes the not-found page stream like every
 * other page, so the layout hydrates normally (200 + `noindex`, Next's documented behaviour) instead of
 * re-rendering the whole document on the client. Real pages have no loading screen at all — a slim
 * progress bar (NavProgress) shows navigation instead.
 */
export default function MissingLoading() {
  return null
}
