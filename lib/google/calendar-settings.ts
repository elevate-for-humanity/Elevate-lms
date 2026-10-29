export const GOOGLE_CALENDAR_RUNTIME_KEYS = ['GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const;
export function isGoogleCalendarRuntimeKey(key: string) { return (GOOGLE_CALENDAR_RUNTIME_KEYS as readonly string[]).includes(key); }
export function validateGoogleCalendarUpdates(entries: Array<{ key: string; value: string }>) {
  const changes = new Map(entries.filter(entry => isGoogleCalendarRuntimeKey(entry.key)).map(entry => [entry.key, entry.value]));
  for (const prefix of ['GOOGLE_CALENDAR', 'GOOGLE']) {
    const id = changes.get(`${prefix}_CLIENT_ID`);
    const secret = changes.get(`${prefix}_CLIENT_SECRET`);
    if (id !== undefined || secret !== undefined) {
      if (!id || !secret) throw new Error('Save the Google OAuth client ID and client secret together.');
      if (!/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(id) || !secret.trim() || /^[•*]{4,}$/.test(secret.trim()) || /[\r\n]/.test(secret)) throw new Error('Enter a valid Google OAuth web client ID and its unmasked secret.');
    }
  }
}
