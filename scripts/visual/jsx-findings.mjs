import ts from 'typescript';

/** Parse individual JSX elements: never compare classes across sibling elements,
 * confuse hover/placeholder variants with foregrounds, or stop at a JSX `=>`. */
export function jsxFindings(source, file, service) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits = [];
  const add = (node, id, severity, message, classification) => hits.push({
    file, service, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
    match: node.getText(tree).slice(0, 100), id, severity, message, classification,
  });
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attrs = new Map(node.attributes.properties.filter(ts.isJsxAttribute).map(a => [a.name.getText(tree), a]));
      const name = node.tagName.getText(tree);
      if (name === 'Image' && attrs.has('fill') && !attrs.has('sizes')) {
        add(node, 'fill-no-sizes', 'medium', 'next/image fill without sizes may over-fetch', 'image-performance');
      }
      const preload = attrs.get('preloadFull');
      if (preload && (!preload.initializer || preload.initializer.getText(tree) !== '{false}')) {
        add(node, 'preload-full-hero', 'high', 'Full video preloading requested', 'image-performance');
      }
      const init = attrs.get('className')?.initializer;
      if (init && ts.isStringLiteral(init)) {
        const tokens = new Set(init.text.split(/\s+/));
        const light = [...tokens].some(t => /^(bg-white|bg-(slate|gray|zinc|neutral)-(50|100))$/.test(t));
        if (light && tokens.has('text-white')) add(node, 'invisible-white-on-white', 'high', 'White text on an opaque white/light surface', 'potential-accessibility');
        if (light && [...tokens].some(t => /^text-(slate|gray|zinc|neutral)-(200|300|400)$/.test(t))) add(node, 'low-contrast-neutral-on-light', 'high', 'Low-contrast neutral text on an opaque light surface', 'potential-accessibility');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return hits;
}
