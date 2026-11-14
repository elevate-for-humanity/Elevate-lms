/**
 * HTML sanitization utilities.
 *
 * Server: uses sanitize-html (htmlparser2-based, no jsdom dependency).
 * Client: uses dompurify (browser-native DOM, no jsdom needed).
 *
 * isomorphic-dompurify was removed because it hard-depends on jsdom,
 * which is a devDependency and should not be imported in production routes.
 */

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'img', 'video', 'audio', 'source',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code', 'span', 'div',
  'figure', 'figcaption', 'hr', 'sub', 'sup',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
  'width', 'height', 'style', 'colspan', 'rowspan',
  'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'type',
];

const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];

function serverSanitize(dirty: string, opts?: { allowedTags?: string[]; allowedAttr?: string[] }): string {
  // Dynamic require keeps this out of the client bundle.
  const sanitizeHtmlLib = require('sanitize-html') as typeof import('sanitize-html');
  const tags = opts?.allowedTags ?? ALLOWED_TAGS;
  const attrs = opts?.allowedAttr ?? ALLOWED_ATTR;
  return sanitizeHtmlLib(dirty, {
    allowedTags: tags,
    allowedAttributes: Object.fromEntries(tags.map((t) => [t, attrs])),
    disallowedTagsMode: 'discard',
  });
}

function clientSanitize(dirty: string, opts?: { allowedTags?: string[]; allowedAttr?: string[] }): string {
  const DOMPurify = require('dompurify') as {
    sanitize: (input: string, config: Record<string, unknown>) => string;
  };
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: opts?.allowedTags ?? ALLOWED_TAGS,
    ALLOWED_ATTR: opts?.allowedAttr ?? ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

function sanitize(dirty: string, opts?: { allowedTags?: string[]; allowedAttr?: string[] }): string {
  if (!dirty) return '';
  if (typeof window === 'undefined') return serverSanitize(dirty, opts);
  return clientSanitize(dirty, opts);
}

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty);
}

export function sanitizeUserContent(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'code'],
    allowedAttr: ['href', 'target', 'rel'],
  });
}

export function sanitizeToText(dirty: string): string {
  if (!dirty) return '';
  return dirty.replace(/<[^>]*>/g, '').trim();
}
