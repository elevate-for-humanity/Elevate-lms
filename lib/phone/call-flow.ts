/** Pure decisions shared by the signed Telnyx webhook and its regression tests. */
export const PHONE_VOICE = 'Telnyx.KokoroTTS.af';
export const RECOVERY_VOICE = 'AWS.Polly.Joanna';
export const MENU_INPUT = {
  minimum_digits: 1,
  maximum_digits: 1,
  maximum_tries: 1,
  valid_digits: '0123456789*',
  timeout_millis: 10000,
} as const;

type DirectoryEntry = { extension: string; display_name: string; department?: string | null };
export function directoryPages(entries: DirectoryEntry[]): string[] {
  const pages: string[] = [];
  let page = '';
  for (const entry of entries) {
    // Bound each utterance, never the number of people in the directory.
    const name = String(entry.display_name || 'Staff member').slice(0, 120);
    const department = String(entry.department || '').slice(0, 160);
    const number = String(entry.extension).replace(/[^0-9]/g, '');
    const line = `${name}${department ? `, ${department}` : ''}. Extension ${number}.`;
    if (page && page.length + line.length + 1 > 500) {
      pages.push(page);
      page = '';
    }
    page += `${page ? ' ' : ''}${line}`;
  }
  if (page) pages.push(page);
  return pages;
}

type ProgramOption = { destination_id: string | null; spoken_keywords?: string[] | null };
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Match only the identified program, not arbitrary conversation text. Ambiguity stays with staff. */
export function programDestination(program: string, options: ProgramOption[]): string | null {
  const subject = normalize(program);
  if (!subject) return null;
  const matches = new Set<string>();
  for (const option of options) {
    if (!option.destination_id) continue;
    if ((option.spoken_keywords || []).some((word) => {
      const keyword = normalize(word);
      if (!keyword) return false;
      // Avoid interpreting ordinary "it" as a technology request.
      return keyword.length <= 2 ? subject === keyword : ` ${subject} `.includes(` ${keyword} `);
    })) matches.add(option.destination_id);
  }
  return matches.size === 1 ? [...matches][0] : null;
}

export function intakeCompleted(status: string | undefined, result: Record<string, unknown>): boolean {
  return status === 'valid' && result.conversation_complete === true;
}
