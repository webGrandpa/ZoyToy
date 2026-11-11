import type { Language } from '@payloadcms/translations'
import { en } from '@payloadcms/translations/languages/en'
import { part1 } from './part1'
import { part2 } from './part2'
import { part3 } from './part3'

/**
 * Georgian admin UI for Payload (Payload ships no Georgian). Any key missing here falls back
 * to English, so a Payload upgrade that adds new strings never breaks the admin.
 */
const merged: Record<string, Record<string, string>> = {}
for (const [group, strings] of Object.entries(en.translations)) {
  merged[group] = { ...(strings as Record<string, string>), ...(({ ...part1, ...part2, ...part3 } as Record<string, Record<string, string>>)[group] ?? {}) }
}

export const ka: Language = {
  dateFNSKey: 'en-US', // date-fns has no Georgian locale wired into Payload; dates use numeric formats
  translations: merged as unknown as Language['translations'],
}
