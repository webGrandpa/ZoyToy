/**
 * A toy's video review link (Products → Photos → „ვიდეო განხილვა“): YouTube now, later the owner's own
 * on YouTube, Facebook, Instagram or TikTok. Turns the link she pastes into a player the item page can
 * embed; anything else stays a plain „watch the video“ link.
 */
export type Video = { url: string; embed: string | null; tall: boolean; site: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'other' }

const YT_ID = /^[A-Za-z0-9_-]{11}$/

export function parseVideo(raw: string | null | undefined): Video | null {
  const text = String(raw ?? '').trim()
  if (!text) return null
  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  const url = u.toString()
  const host = u.hostname.replace(/^(www\.|m\.)/, '')
  const parts = u.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    const id = host === 'youtu.be' ? parts[0] : ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1] : u.searchParams.get('v')
    if (id && YT_ID.test(id)) return { url, site: 'youtube', tall: parts[0] === 'shorts', embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0` }
  }
  if (host.endsWith('facebook.com') || host === 'fb.watch') {
    const tall = parts.includes('reel') || parts.includes('reels')
    return { url, site: 'facebook', tall, embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false` }
  }
  if (host.endsWith('instagram.com') && ['reel', 'reels', 'p', 'tv'].includes(parts[0]) && parts[1]) {
    return { url, site: 'instagram', tall: true, embed: `https://www.instagram.com/${parts[0] === 'reels' ? 'reel' : parts[0]}/${parts[1]}/embed` }
  }
  if (host.endsWith('tiktok.com')) {
    const i = parts.indexOf('video')
    const id = i >= 0 ? parts[i + 1] : null
    if (id && /^\d{8,25}$/.test(id)) return { url, site: 'tiktok', tall: true, embed: `https://www.tiktok.com/embed/v2/${id}` }
  }
  return { url, site: 'other', tall: false, embed: null }
}
