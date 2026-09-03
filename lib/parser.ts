import { marked } from 'marked';

export function parseMarkdown(md: string): string {
  // marked.parse already returns sanitized HTML by default
  return marked.parse(md) as string;
}

export function parseHTML(html: string): string {
  // For server-side, return as-is (trusted source)
  // For client-side sanitization, use DOMPurify in the component
  return html;
}

export function parseJSON<T = any>(json: string): T | null {
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export function stringifyJSON(obj: any, pretty = true): string {
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
}

export function extractFrontmatter(content: string): { frontmatter: any; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = match[1];
  const body = match[2];

  // Parse YAML-like frontmatter
  const frontmatter: any = {};
  frontmatterText.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { frontmatter, body };
}
