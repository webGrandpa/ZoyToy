/**
 * Admin labels in all three shop languages.
 * Payload shows the key matching the admin UI language (ka is added via a custom
 * translation pack; until then admins see ru/en).
 */
export const L = (ka: string, ru: string, en: string): Record<string, string> => ({ ka, ru, en })
