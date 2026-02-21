import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize user-generated or DB-sourced HTML for safe rendering.
 * Allows basic formatting tags, strips scripts, event handlers, and dangerous attributes.
 */
export function sanitizeRichHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote',
      'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'code', 'pre', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'hr', 'sub', 'sup',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      span: ['class'],
      div: ['class'],
      code: ['class'],
      pre: ['class'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}
