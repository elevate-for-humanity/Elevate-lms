export function fillTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const token = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    out = out.replace(token, value);
  }
  return out;
}
