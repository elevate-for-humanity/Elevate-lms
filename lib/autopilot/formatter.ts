export function formatMarkdown(md: string): string {
  return md
    .replace(/\t/g, '  ') // Replace tabs with spaces
    .replace(/\r/g, '') // Remove carriage returns
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();
}

export function formatHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .trim();
}

export function formatJSON(data: any): string {
  return JSON.stringify(json, null, 2);
}

export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatCourseTitle(title: string): string {
  return title
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
