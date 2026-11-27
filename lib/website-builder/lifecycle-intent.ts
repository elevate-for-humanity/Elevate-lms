/** Lifecycle changes require a complete command, never a keyword in a question. */
export function websiteLifecycleIntent(instruction: string): 'publish' | 'unpublish' | null {
  const text = instruction.trim().toLowerCase().replace(/[.!]+$/, '').trim();
  const command = text.replace(/^please\s+/, '').replace(/\s+please$/, '');
  if (/^(?:unpublish(?: (?:it|the site|the website))?|take (?:it|the site|the website) offline|make (?:it|the site|the website) private)(?: now)?$/.test(command)) return 'unpublish';
  if (/^(?:publish(?: (?:it|the site|the website|updates))?|go live|make (?:it|the site|the website) live)(?: now)?$/.test(command)) return 'publish';
  return null;
}
