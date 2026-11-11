export type Season = 'none' | 'ny' | 'summer' | 'june1' | 'school'

/** Zoy's outfit: fixed by the admin, or picked from the calendar (Batumi time). */
export function currentSeason(setting: string | null | undefined, now = new Date()): Season {
  if (setting && setting !== 'auto') return setting as Season
  const tbilisi = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tbilisi' }))
  const m = tbilisi.getMonth() + 1
  const d = tbilisi.getDate()
  if ((m === 12 && d >= 15) || (m === 1 && d <= 14)) return 'ny'
  if (m === 6 && d <= 3) return 'june1'
  if (m === 9 && d >= 10 && d <= 20) return 'school'
  if ((m === 6 && d >= 15) || m === 7 || m === 8) return 'summer'
  return 'none'
}
