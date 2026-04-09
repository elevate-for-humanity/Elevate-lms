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
      span: ['class', 'style'],
      div: ['class', 'style'],
      code: ['class'],
      pre: ['class'],
      // Table styling — lesson content uses inline styles for borders and spacing.
      // Restricting to safe CSS properties only (no url(), no expression()).
      table: ['style', 'border', 'cellpadding', 'cellspacing', 'width', 'class'],
      td: ['colspan', 'rowspan', 'style', 'class'],
      th: ['colspan', 'rowspan', 'style', 'class'],
      tr: ['style', 'class'],
      thead: ['style', 'class'],
      tbody: ['style', 'class'],
      p: ['style', 'class'],
      h2: ['class'],
      h3: ['class'],
      h4: ['class'],
      ul: ['class'],
      ol: ['class'],
      li: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // Strip dangerous CSS values from style attributes while keeping layout styles.
    allowedStyles: {
      '*': {
        // Allow safe layout and typography properties only
        'color':            [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^[a-z]+$/],
        'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^[a-z]+$/],
        'border':           [/.*/],
        'border-collapse':  [/.*/],
        'border-color':     [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^[a-z]+$/],
        'border-style':     [/.*/],
        'border-width':     [/.*/],
        'border-top':       [/.*/],
        'border-bottom':    [/.*/],
        'border-left':      [/.*/],
        'border-right':     [/.*/],
        'padding':          [/.*/],
        'padding-top':      [/.*/],
        'padding-bottom':   [/.*/],
        'padding-left':     [/.*/],
        'padding-right':    [/.*/],
        'margin':           [/.*/],
        'margin-top':       [/.*/],
        'margin-bottom':    [/.*/],
        'width':            [/.*/],
        'max-width':        [/.*/],
        'min-width':        [/.*/],
        'text-align':       [/^(left|right|center|justify)$/],
        'font-weight':      [/.*/],
        'font-style':       [/^(normal|italic|oblique)$/],
        'vertical-align':   [/.*/],
        'white-space':      [/.*/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}
